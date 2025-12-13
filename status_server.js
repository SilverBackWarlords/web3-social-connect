const express = require('express');

const statusApp = express();
const statusPort = 8081;

// Define the content for the status page
const statusHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus Protocol Status</title>
    <style>
      body { font-family: sans-serif; background-color: #f0f4f8; color: #1e293b; text-align: center; padding: 50px; }
      .container { background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 0 auto; }
      h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
      .status-ok { color: #10b981; font-weight: bold; font-size: 1.25em; }
      .status-label { margin-top: 20px; font-size: 0.9em; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Nexus Protocol Bot Status</h1>
      <p class="status-ok">STATUS: RUNNING & LISTENING</p>
      <p>The bot is currently running and accepting Web Hook traffic via ngrok tunnel on Port 3000.</p>
      <p class="status-label">Port 8081 is for status check only.</p>
    </div>
  </body>
  </html>
`;

statusApp.get('/', (req, res) => {
  res.send(statusHtml);
});

statusApp.listen(statusPort, () => {
  console.log(`✅ Status Web Server running on port ${statusPort}. View via ngrok tunnel.`);
});
