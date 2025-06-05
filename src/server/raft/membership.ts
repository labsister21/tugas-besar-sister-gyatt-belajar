import { LogEntryMessage } from "./log";
import { RaftNode } from "./node";
import axios from "axios";
export class MembershipManager {
  private clusterNodes: RaftNode[] = [];

  constructor(private node: RaftNode) {}

  addNode(node: RaftNode) {
    if (!this.clusterNodes.includes(node)) {
      // Sync Log History to the new node
      this.educateNewJedagJedugMember(node);

      // Add new node to the configNew
      this.clusterNodes.push(node);
      
      // Broadcast configuration change to every existing member
      this.broadcastJedagJedugMemberUpdate().catch(err => {
        console.error("Failed to broadcast membership update:", err);
      });
    }
  }

  removeNode(nodeId: string) {
    if (this.clusterNodes.some(node => node.id === nodeId)) {

      // Remove this node on configNew
      this.clusterNodes = this.clusterNodes.filter(node => node.id !== nodeId);
      
      // Broadcast configuration change to every existing member
      this.broadcastJedagJedugMemberUpdate().catch(err => {
        console.error("Failed to broadcast membership update:", err);
      });
    }
  }

  private educateNewJedagJedugMember(node: RaftNode) {
    const nodeId = node.id;

    // Initialize replication state
    this.node["nextIndex"][nodeId] = this.node["logManager"].getLastLogIndex() + 1;
    this.node["matchIndex"][nodeId] = 0;

    console.log(`Initialized log sync for learner ${nodeId}`);
  }

  private async broadcastJedagJedugMemberUpdate() {
    const configNew : LogEntryMessage = {config: this.clusterNodes};
    try {
      const result = await this.node.replicateCommand(configNew);
      res.json({ result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private apply(config: RaftNode[]) {
    this.clusterNodes = config;
  }

  async applyNewConfig(newConfig: RaftNode[]) {
    const configMessage: LogEntryMessage = { config: newConfig };

    const requests = newConfig
      .filter(n => n.id !== this.node.id)
      .map(async (target) => {
        try {
          const res = await axios.post(`http://${target.id}:3000/raft/apply-config`, {
            config: configMessage.config,
          });
          return res.data.success;
        } catch (error) {
          console.error(`Failed to update config on ${target.id}:`, error.message);
          return false;
        }
      });

    const results = await Promise.all(requests);
    const successful = results.filter(Boolean).length;

    if (successful + 1 >= this.getMajorityCount()) {
      this.apply(configMessage.config); // Apply locally only if majority agreed
      console.log("New membership config applied.");
    } else {
      throw new Error("Failed to replicate new config to majority");
    }
  }

  getMajorityCount(): number {
    return Math.floor(this.clusterNodes.length / 2) + 1;
  }

  isLearner(nodeId: string): boolean {
    const node = this.clusterNodes.find(n => n.id === nodeId);
    return (node as any)?.state === "JedagJedugLearner";
  }
}