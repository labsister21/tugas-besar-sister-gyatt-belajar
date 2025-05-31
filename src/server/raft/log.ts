import { KeyValueStore } from "../store/store";

export interface LogEntry {
  term: number;
  index: number;
  command: {
    type: string;
    key?: string;
    value?: string;
  };
}

export class LogManager {
  private logs: LogEntry[] = [];
  private commitIndex: number = -1;
  private lastApplied: number = -1;
  private stateMachine: KeyValueStore;

  constructor() {
    this.stateMachine = new KeyValueStore();
  }

  public getCommitIndex(): number {
    return this.commitIndex;
  }

  public setCommitIndex(index: number) {
    if (index > this.commitIndex) {
      this.commitIndex = index;
      this.applyLogs();
    }
  }

  public getStateMachine(): KeyValueStore {
    return this.stateMachine;
  }

  appendEntries(
    entries: LogEntry[],
    prevLogIndex: number,
    prevLogTerm: number
  ): boolean {
    // Validate previous log entry
    if (
      prevLogIndex >= 0 &&
      (prevLogIndex >= this.logs.length ||
        this.logs[prevLogIndex].term !== prevLogTerm)
    ) {
      return false;
    }

    // Delete entries that conflict and append the new ones
    let i = 0;
    for (; i < entries.length; i++) {
      const newIndex = prevLogIndex + 1 + i;
      if (
        newIndex < this.logs.length &&
        this.logs[newIndex].term !== entries[i].term
      ) {
        this.logs.splice(newIndex);
        break;
      }
    }

    // Append rest
    for (; i < entries.length; i++) {
      this.logs.push(entries[i]);
    }

    return true;
  }

  getLastLogTerm(): number {
    return this.logs.length > 0 ? this.logs[this.logs.length - 1].term : 0;
  }

  getLastLogIndex(): number {
    return this.logs.length - 1;
  }

  validateLog(prevLogIndex: number, prevLogTerm: number): boolean {
    if (prevLogIndex >= this.logs.length) {
      return false;
    }
    if (prevLogIndex >= 0 && this.logs[prevLogIndex].term !== prevLogTerm) {
      return false;
    }
    return true;
  }

  commit(index: number) {
    if (index > this.commitIndex) {
      this.commitIndex = index;
      this.applyLogs();
    }
  }

  private applyLogs() {
    while (this.lastApplied < this.commitIndex) {
      this.lastApplied++;
      const entry = this.logs[this.lastApplied];
      if (entry) {
        this.stateMachine.execute(entry.command);
      }
    }
  }

  getEntry(index: number): LogEntry | null {
    return this.logs[index] || null;
  }
}
