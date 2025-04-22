const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve everything in src/ as static files
app.use(express.static(path.join(__dirname, 'src')));

// Fallback for client‑side routing
app.get('*', (_, res) =>
    res.sendFile(path.join(__dirname, 'src', 'index.html'))
);

app.listen(PORT, () =>
    console.log(`🚀 Listening on port ${PORT}`)
);