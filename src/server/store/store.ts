export class KeyValueStore {
  private data: Map<string, string> = new Map();

  execute(command: { type: string; key?: string; value?: string }): string {
    switch (command.type) {
      case 'ping':
        return 'PONG';
      case 'get':
        return this.get(command.key!);
      case 'set':
        this.set(command.key!, command.value!);
        return 'OK';
      case 'strln':
        return this.strlen(command.key!);
      case 'del':
        return this.del(command.key!);
      case 'append':
        this.append(command.key!, command.value!);
        return 'OK';
      default:
        throw new Error(`Unknown command: ${command.type}`);
    }
    // TODO: request_log
  }

  private get(key: string): string {
    return this.data.get(key) || '';
  }

  private set(key: string, value: string): void {
    this.data.set(key, value);
  }

  private strlen(key: string): string {
    const value = this.data.get(key) || '';
    return value.length.toString();
  }

  private del(key: string): string {
    const value = this.data.get(key) || '';
    this.data.delete(key);
    return value;
  }

  private append(key: string, value: string): void {
    const current = this.data.get(key) || '';
    this.data.set(key, current + value);
  }
}