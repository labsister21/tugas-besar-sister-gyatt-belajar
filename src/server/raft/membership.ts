import { RaftNode } from "./node";
export class MembershipManager {
  private clusterNodes: RaftNode[] = [];

  addNode(node: RaftNode) {
    if (!this.clusterNodes.includes(node)) {
      this.clusterNodes.push(node);
      
      // Broadcast configuration change
      this.broadcastConfigUpdate();
    }
  }

  removeNode(nodeId: string) {
    this.clusterNodes = this.clusterNodes.filter(node => node.id !== nodeId);
    this.broadcastConfigUpdate();
  }

  private broadcastConfigUpdate() {
    // TODO: send notif to other machines
  }

  getMajorityCount(): number {
    return Math.floor(this.clusterNodes.length / 2) + 1;
  }
}