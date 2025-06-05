import axios from 'axios';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const NODE_ADDRESSES = [
  'http://node1:3000',
  'http://node2:3000',
  'http://node3:3000',
  'http://node4:3000',
  'http://node5:3000'
];

let currentLeader = NODE_ADDRESSES[0];

async function pingNode(address: string) {
  try {
    const res = await axios.get(`${address}/health`);
    console.log(`PONG from ${address}`);
    console.log(`State: ${res.data.state}, Leader: ${res.data.leader}`);
  } catch (err) {
    console.error(`Ping failed to ${address}: ${err.message}`);
  }
}

function parseNodeFromCommand(parts: string[]): { targetNode: string | null, cleanedParts: string[] } {
  // Check if the last part looks like a node specification (nodeX)
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.match(/^node[1-5]$/)) {
    const nodeNumber = parseInt(lastPart.replace('node', ''));
    const targetNode = NODE_ADDRESSES[nodeNumber - 1]; // node1 = index 0
    const cleanedParts = parts.slice(0, -1); // Remove the node specification
    return { targetNode, cleanedParts };
  }
  return { targetNode: null, cleanedParts: parts };
}

async function sendCommand(command: string) {
  const parts = command.split(' ');
  const { targetNode, cleanedParts } = parseNodeFromCommand(parts);
  
  const cmdType = cleanedParts[0];
  const key = cleanedParts[1];
  const value = cleanedParts.slice(2).join(' ');
  const commandObj = { type: cmdType, key, value };

  async function trySend(address: string): Promise<boolean> {
    try {
      if (cmdType === "request_log") {
        const response = await axios.get(`${address}/request_log`);
        console.log(response.data);
      } else {
        const response = await axios.post(`${address}/execute`, {
          command: commandObj
        });
        console.log(response.data.result);
      }
      currentLeader = address;
      return true;
    } catch (error) {
      if (error.response?.status === 302 && error.response.data.leader) {
        currentLeader = error.response.data.leader;
        console.log(`Redirected to leader: ${currentLeader}`);
        return await trySend(currentLeader);
      } else {
        console.error(`[${address}] Error: ${error.message}`);
        return false;
      }
    }
  }

  // If a specific node was targeted, try that node first
  if (targetNode) {
    console.log(`Targeting specific node: ${targetNode}`);
    if (await trySend(targetNode)) return;
  }

  // If no specific node was targeted, or if the targeted node failed,
  // fall back to the original behavior: try current leader first
  if (!targetNode || targetNode !== currentLeader) {
    if (await trySend(currentLeader)) return;
  }

  // Try all other nodes as fallback
  for (const node of NODE_ADDRESSES) {
    if (node === currentLeader || node === targetNode) continue;
    if (await trySend(node)) return;
  }
  
  console.error('Failed to send command to any node.');
}

function printHelp() {
  console.log(`Available commands:
  - set key value [nodeX] : Write command (optionally target specific node)
  - get key [nodeX] : Read command (optionally target specific node)
  - append key value [nodeX] : Append value to existing key, add if not exists (optionally target specific node)
  - del key [nodeX] : Delete command (optionally target specific node)
  - request_log [nodeX] : Get logs of a node (optionally target specific node)
  - status [N|nodeX] : Ping status of node[N] (0-4) or nodeX (node1-node5)
  - exit : Exit CLI
  
  Examples:
  - get mykey node2 : Get mykey from node2 specifically
  - set mykey myvalue node3 : Set mykey on node3 (will redirect to leader if needed)
  - status node1 : Check status of node1 specifically
  - status 0 : Check status of first node (legacy format)`);
}

function startCLI() {
  rl.question('> ', async (input) => {
    if (input === 'exit') {
      rl.close();
      return;
    }

    if (input.startsWith('status')) {
      const parts = input.split(' ');
      
      if (parts.length > 1) {
        const target = parts[1];
        
        // Handle both "status nodeX" and "status N" formats
        if (target.match(/^node[1-5]$/)) {
          const nodeNumber = parseInt(target.replace('node', ''));
          const targetAddress = NODE_ADDRESSES[nodeNumber - 1];
          await pingNode(targetAddress);
        } else {
          // Legacy format: "status N" where N is 0-4
          const nodeIdx = parseInt(target);
          if (NODE_ADDRESSES[nodeIdx]) {
            await pingNode(NODE_ADDRESSES[nodeIdx]);
          } else {
            console.log('Invalid node index. Use 0-4 or node1-node5');
          }
        }
      } else {
        // No target specified, ping current leader
        await pingNode(currentLeader);
      }
    } else if (input === 'help') {
      printHelp();
    } else {
      await sendCommand(input);
    }
    
    startCLI();
  });
}

console.log('RAFT Client CLI started. Type "help" for available commands.');
startCLI();