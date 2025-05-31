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
  'http://node4:3000'
];

let currentLeader = NODE_ADDRESSES[0];

async function sendCommand(command: string) {
  const parts = command.split(' ');
  const cmdType = parts[0];
  const key = parts[1];
  const value = parts.slice(2).join(' ');

  const commandObj = { type: cmdType, key, value };

  try {
    const response = await axios.post(`${currentLeader}/execute`, {
      command: commandObj
    });
    console.log(response.data.result);
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

    await sendCommand(input);
    startCLI();
  });
}

startCLI();