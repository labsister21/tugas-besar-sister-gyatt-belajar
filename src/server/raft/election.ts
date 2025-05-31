import { RaftNode } from './node';

export class ElectionManager {
  private electionTimeoutId: NodeJS.Timeout;
  private readonly minElectionTimeout: number = 1500;
  private readonly maxElectionTimeout: number = 3000;

  constructor(private node: RaftNode) {}

  startElectionTimer() {
    const timeout = this.getRandomElectionTimeout();
    this.electionTimeoutId = setTimeout(() => {
      if (this.node.state !== 'leader') {
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
      Math.random() * (this.maxElectionTimeout - this.minElectionTimeout) + 
      this.minElectionTimeout
    );
  }
}