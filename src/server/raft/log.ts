import { KeyValueStore } from "../store/store";
import fs from "fs";
import path from "path";

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
  private commitIndex = -1;
  private lastApplied = -1;
  private stateMachine: KeyValueStore;
  private logFilePath: string;

  constructor(nodeId: string) {
    this.stateMachine = new KeyValueStore();
    this.logFilePath = path.resolve(__dirname, `../../data/${nodeId}_log.json`);
    this.loadLogsFromDisk();
  }

  private loadLogsFromDisk() {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const data = fs.readFileSync(this.logFilePath, "utf-8");
        const parsed = JSON.parse(data);
        this.logs = parsed.logs || [];
        this.commitIndex = parsed.commitIndex ?? -1;
        this.lastApplied = parsed.lastApplied ?? -1;
        this.applyLogs();
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    }
  }

  private saveLogsToDisk() {
    try {
      const json = JSON.stringify(
        {
          logs: this.logs,
          commitIndex: this.commitIndex,
          lastApplied: this.lastApplied,
        },
        null,
        2
      );
      fs.writeFileSync(this.logFilePath, json, "utf-8");
    } catch (err) {
      console.error("Failed to save logs:", err);
    }
  }

  public getCommitIndex(): number {
    return this.commitIndex;
  }

  public setCommitIndex(index: number) {
    if (index > this.commitIndex) {
      this.commitIndex = index;
      this.applyLogs();
      this.saveLogsToDisk();
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
    if (
      prevLogIndex >= 0 &&
      (prevLogIndex >= this.logs.length ||
        this.logs[prevLogIndex].term !== prevLogTerm)
    ) {
      return false;
    }

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

    for (; i < entries.length; i++) {
      this.logs.push(entries[i]);
    }

    this.saveLogsToDisk();
    return true;
  }

  commit(index: number) {
    if (index > this.commitIndex) {
      this.commitIndex = index;
      this.applyLogs();
      this.saveLogsToDisk();
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

  public getAllLogs(): LogEntry[] {
    return this.logs;
  }
}
