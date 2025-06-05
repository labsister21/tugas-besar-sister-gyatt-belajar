import { RaftNode } from './node';

export const HEARTBEAT_INTERVAL: number = 3000;

export class HeartbeatManager {
  private intervalId: NodeJS.Timeout;

  constructor(private node: RaftNode) {}

  start() {
    this.intervalId = setInterval(() => {
      if (this.node.state === 'leader') {
        this.node.sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL);
  }

  stop() {
    clearInterval(this.intervalId);
  }
}