import { ElectionManager } from "./election";
import { HeartbeatManager } from "./heartbeat";
import { LogEntry, LogManager } from "./log";
import { MembershipManager } from "./membership";
import axios from "axios";

type NodeState = "follower" | "candidate" | "leader";

interface ClusterNode {
  id: string;
  address: string;
}

export class RaftNode {
  public id: string;
  public state: NodeState = "follower";
  public currentTerm: number = 0;
  public votedFor: string | null = null;
  public knownLeader: string | null = null;

  private electionManager: ElectionManager;
  private heartbeatManager: HeartbeatManager;
  private logManager: LogManager;
  private membershipManager: MembershipManager;
  private clusterNodes: ClusterNode[] = [];

  constructor(id: string, initialNodes: string[]) {
    this.id = id;
    this.electionManager = new ElectionManager(this);
    this.heartbeatManager = new HeartbeatManager(this);
    this.logManager = new LogManager();
    this.membershipManager = new MembershipManager();

    // Init
    initialNodes.forEach((nodeId) => {
      this.clusterNodes.push({
        id: nodeId,
        address: `http://${nodeId}:3000`,
      });
    });

    this.electionManager.startElectionTimer();
  }

  async startElection() {
    this.state = "candidate";
    this.currentTerm++;
    this.votedFor = this.id;

    const votes = await this.requestVotes();
    if (votes >= this.membershipManager.getMajorityCount()) {
      this.becomeLeader();
    } else {
      this.state = "follower";
    }
  }

  private async requestVotes(): Promise<number> {
    const requests = this.clusterNodes
      .filter((node) => node.id !== this.id)
      .map(async (node) => {
        try {
          const response = await axios.post(
            `${node.address}/raft/request-vote`,
            {
              term: this.currentTerm,
              candidateId: this.id,
              lastLogIndex: this.logManager.getLastLogIndex(),
              lastLogTerm: this.logManager.getLastLogTerm(),
            }
          );
          return response.data.voteGranted ? 1 : 0;
        } catch (error) {
          console.error("Error:", error);
          return 0;
        }
      });

    const results = await Promise.all(requests);
    return results.reduce((sum, vote) => sum + vote, 1); // + self vote
  }

  private becomeLeader() {
    this.state = "leader";
    this.knownLeader = this.id;
    this.heartbeatManager.start();
    console.log(`Node ${this.id} became leader for term ${this.currentTerm}`);
  }

  public async replicateCommand(command: {
    type: string;
    key?: string;
    value?: string;
  }): Promise<string> {
    if (this.state !== "leader") {
      throw new Error("Not leader");
    }

    const logEntry: LogEntry = {
      term: this.currentTerm,
      index: this.logManager.getLastLogIndex() + 1,
      command,
    };

    const replicas = this.clusterNodes
      .filter((n) => n.id !== this.id)
      .map(async (node) => {
        try {
          const response = await axios.post(
            `${node.address}/raft/append-entries`,
            {
              term: this.currentTerm,
              leaderId: this.id,
              prevLogIndex: this.logManager.getLastLogIndex(),
              prevLogTerm: this.logManager.getLastLogTerm(),
              entries: [logEntry],
              leaderCommit: this.logManager.getCommitIndex(),
            }
          );

          return response.data.success;
        } catch (error) {
          console.error(`Failed to replicate to ${node.id}:`, error.message);
          return false;
        }
      });

    const results = await Promise.all(replicas);
    const successCount = results.filter(Boolean).length + 1;

    if (successCount >= this.membershipManager.getMajorityCount()) {
      this.logManager.appendEntries(
        [logEntry],
        this.logManager.getLastLogIndex(),
        this.logManager.getLastLogTerm()
      );
      this.logManager.commit(logEntry.index);
      return this.logManager.getStateMachine().execute(command);
    } else {
      throw new Error("Failed to replicate command to majority");
    }
  }

  public getLeader(): string | null {
    if (this.state === "leader") {
      return this.id;
    }
    return this.knownLeader;
  }

  public handleRequestVote(
    term: number,
    candidateId: string,
    lastLogIndex: number,
    lastLogTerm: number
  ): { term: number; voteGranted: boolean } {
    // Reject if term is lower
    if (term < this.currentTerm) {
      return { term: this.currentTerm, voteGranted: false };
    }

    // if there's already higher term, become follower
    if (term > this.currentTerm) {
      this.currentTerm = term;
      this.state = "follower";
      this.votedFor = null;
    }

    // Check voting
    const logOk =
      lastLogTerm > this.logManager.getLastLogTerm() ||
      (lastLogTerm === this.logManager.getLastLogTerm() &&
        lastLogIndex >= this.logManager.getLastLogIndex());

    const canVote = this.votedFor === null || this.votedFor === candidateId;

    if (logOk && canVote) {
      this.votedFor = candidateId;
      this.electionManager.resetElectionTimer();
      return { term: this.currentTerm, voteGranted: true };
    }

    return { term: this.currentTerm, voteGranted: false };
  }

  public async sendHeartbeat() {
    for (const node of this.clusterNodes) {
      try {
        await axios.post(`${node.address}/raft/append-entries`, {
          term: this.currentTerm,
          leaderId: this.id,
          prevLogIndex: this.logManager.getLastLogIndex(),
          prevLogTerm: this.logManager.getLastLogTerm(),
          entries: [], // Empty if heartbeat
          leaderCommit: this.logManager.getCommitIndex(),
        });
        console.log(`Jedak to ${node.id}`)
      } catch (error) {
        console.error(`Failed to send heartbeat to ${node.id}:`, error.message);
      }
    }
  }

  public handleAppendEntries(
    term: number,
    leaderId: string,
    prevLogIndex: number,
    prevLogTerm: number,
    entries: LogEntry[],
    leaderCommit: number
  ): { term: number; success: boolean } {
    // If term < currentTerm, false
    if (term < this.currentTerm) {
      return { term: this.currentTerm, success: false };
    }

    // Reset election timeout if we get valid leader communication
    this.electionManager.resetElectionTimer();

    // If request contains higher term, update current term
    if (term > this.currentTerm) {
      this.currentTerm = term;
      this.state = "follower";
      this.votedFor = null;
    }

    // Check log consistency
    if (!this.logManager.validateLog(prevLogIndex, prevLogTerm)) {
      return { term: this.currentTerm, success: false };
    }

    // Append new entries
    if (entries && entries.length > 0) {
      this.logManager.appendEntries(entries, prevLogIndex, prevLogTerm);
    }

    if (entries.length === 0) {
      console.log(`Jeduk from ${leaderId}`)
    }

    // Update commit index
    if (leaderCommit > this.logManager.getCommitIndex()) {
      this.logManager.setCommitIndex(
        Math.min(leaderCommit, this.logManager.getLastLogIndex())
      );
    }

    return { term: this.currentTerm, success: true };
  }
}
