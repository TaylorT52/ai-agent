import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DISCORD_BOT_SERVER = 'http://localhost:3001';

// Serve static files
app.use(express.static(__dirname));
app.use(express.json());

// Proxy API requests to Discord bot server
app.post('/api/dm', async (req, res) => {
    try {
        const response = await fetch(`${DISCORD_BOT_SERVER}/api/dm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect to Discord bot server'
        });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Sample site running at http://localhost:${PORT}`);
    console.log(`Make sure Discord bot server is running at ${DISCORD_BOT_SERVER}`);
}); 