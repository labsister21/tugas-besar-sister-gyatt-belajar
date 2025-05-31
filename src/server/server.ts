import express from 'express';
import bodyParser from 'body-parser';
import { RaftNode } from './raft/node';

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const NODE_ID = process.env.NODE_ID || 'node1';
const CLUSTER_NODES = process.env.CLUSTER_NODES?.split(',') || [
  'node1', 'node2', 'node3', 'node4'
];

const raftNode = new RaftNode(NODE_ID, CLUSTER_NODES);

// Health check
app.get('/health', (_, res) => {
  res.json({
    id: raftNode.id,
    state: raftNode.state,
    term: raftNode.currentTerm,
    leader: raftNode.getLeader()
  });
});

// Execute command
app.post('/execute', async (req, res) => {
  if (raftNode.state !== 'leader') {
    const leader = `http://${raftNode.getLeader()}:${process.env.PORT}`;
    return res.status(302).json({ 
      error: 'Not leader', 
      leader: leader 
    });
  }

  try {
    const result = await raftNode.replicateCommand(req.body.command);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/raft/append-entries', (req, res) => {
  const { term, leaderId, prevLogIndex, prevLogTerm, entries, leaderCommit } = req.body;
  
  // Update leader that known by this node
  if (raftNode.state !== 'leader') {
    raftNode.knownLeader = leaderId;
  }

  const response = raftNode.handleAppendEntries(
    term,
    leaderId,
    prevLogIndex,
    prevLogTerm,
    entries,
    leaderCommit
  );
  
  res.json(response);
});

app.post('/raft/request-vote', (req, res) => {
  const { term, candidateId, lastLogIndex, lastLogTerm } = req.body;
  
  const response = raftNode.handleRequestVote(
    term,
    candidateId,
    lastLogIndex,
    lastLogTerm
  );
  
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`Raft Node ${NODE_ID} listening on port ${PORT}`);
});