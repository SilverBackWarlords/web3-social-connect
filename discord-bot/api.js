require('dotenv').config();
const express = require('express');
const { mintAndPost } = require('./controllers/app-controller.js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('API server is running.');
});

// The main application logic endpoint
app.post('/api/mintAndPost', mintAndPost);

app.listen(PORT, () => {
  console.log(`API Server listening on port ${PORT}`);
  console.log('To trigger the process, send a POST request to http://localhost:${PORT}/api/mintAndPost');
});
