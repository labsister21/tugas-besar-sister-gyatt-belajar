import { RaftNode } from './node';
import { HEARTBEAT_INTERVAL } from './heartbeat';

export class ElectionManager {
  private electionTimeoutId: NodeJS.Timeout;
  private readonly minElectionTimeout: number = HEARTBEAT_INTERVAL;
  private readonly maxElectionTimeout: number = HEARTBEAT_INTERVAL * 2;

  constructor(private node: RaftNode) {}

  startElectionTimer() {
    const timeout = this.getRandomElectionTimeout();
    this.electionTimeoutId = setTimeout(() => {
      if (this.node.state !== 'leader') {
        console.log(`[${this.node.id}] Election timeout - starting new election.`);
        this.node.startElection();
      }
    }, timeout);
  }

  resetElectionTimer() {
    clearTimeout(this.electionTimeoutId);
    this.startElectionTimer();
  }

  private getRandomElectionTimeout(): number {
    return Math.floor(
      Math.random() * (this.maxElectionTimeout - this.minElectionTimeout) + this.minElectionTimeout
    );
  }

  stopElectionTimer() {
    clearTimeout(this.electionTimeoutId);
  }

}