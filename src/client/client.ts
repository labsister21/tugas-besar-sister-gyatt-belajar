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


async function sendCommand(command: string) {
  const parts = command.split(' ');
  const cmdType = parts[0];
  const key = parts[1];
  const value = parts.slice(2).join(' ');

  const commandObj = { type: cmdType, key, value };

  try {
    if (command === "request_log") {
      const response = await axios.get(`${currentLeader}/request_log`);
      console.log(response.data);
    } else {
      const response = await axios.post(`${currentLeader}/execute`, {
        command: commandObj
      });
      console.log(response.data.result);
    }
  } catch (error) {
    if (error.response?.status === 302) {
      currentLeader = error.response.data.leader;
      console.log(`Redirected to leader: ${currentLeader}`);
      await sendCommand(command); // Retry with new leader
    } else {
      console.error('Error:', error.message);
    }
  }
}

function startCLI() {
  rl.question('> ', async (input) => {
    if (input === 'exit') {
      rl.close();
      return;
    }

    // For check status of the node, specify by 'status x', where x is the node address
    if (input.startsWith('status')) {
      const parts = input.split(' ');
      const nodeIdx = parseInt(parts[1] || '0');
      if (NODE_ADDRESSES[nodeIdx]) {
        await pingNode(NODE_ADDRESSES[nodeIdx]);
      } else {
        console.log('Invalid node index');
      }
    } else {
      await sendCommand(input);
    }

    startCLI();
  });
}


startCLI();