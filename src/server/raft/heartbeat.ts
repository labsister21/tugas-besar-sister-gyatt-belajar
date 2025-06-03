import { RaftNode } from './node';

export class HeartbeatManager {
  private intervalId: NodeJS.Timeout;
  // For now 1s
  private readonly heartbeatInterval: number = 1000;

  constructor(private node: RaftNode) {}

  start() {
    this.intervalId = setInterval(() => {
      if (this.node.state === 'leader') {
        this.node.sendHeartbeat();
      }
    }, this.heartbeatInterval);
  }

  stop() {
    clearInterval(this.intervalId);
  }
}