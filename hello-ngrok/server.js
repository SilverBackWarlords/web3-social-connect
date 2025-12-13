const express = require('express');
const path = require('path');
const app = express();
// const hostname = '127.0.0.1'; // OLD
const hostname = '0.0.0.0'; // NEW: Listen on all interfaces
const port = 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Define a route for the root URL to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, hostname, () => { // Pass hostname to listen
    console.log(`Server running at http://${hostname}:${port}/`);
});
