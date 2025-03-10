const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Discord bot setup
client.once('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
    // Log available channels for debugging
    console.log('Available channels:');
    client.channels.cache.forEach(channel => {
        console.log(`- ${channel.name} (${channel.id})`);
    });
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// API Routes
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get the first text channel from the first available guild
        const channel = client.channels.cache.find(channel => channel.type === 0); // 0 is GUILD_TEXT
        
        if (!channel) {
            return res.status(500).json({ 
                error: 'No Discord channel available',
                details: 'Bot needs to be added to a server with a text channel'
            });
        }

        console.log(`Sending message to channel: ${channel.name} (${channel.id})`);

        // Send message to Discord
        const sentMessage = await channel.send(message);
        console.log('Message sent successfully');

        // Wait for bot response
        const botResponse = await new Promise((resolve) => {
            const filter = m => m.author.bot && m.reference?.messageId === sentMessage.id;
            channel.awaitMessages({ filter, max: 1, time: 30000 })
                .then(collected => {
                    const response = collected.first()?.content;
                    console.log('Bot response received:', response);
                    resolve(response || 'No response received');
                })
                .catch((error) => {
                    console.error('Error waiting for bot response:', error);
                    resolve('No response received');
                });
        });

        res.json({ response: botResponse });
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    const status = {
        status: 'ok',
        botConnected: client.isReady(),
        channels: []
    };

    // Add channel information if bot is connected
    if (client.isReady()) {
        client.channels.cache.forEach(channel => {
            if (channel.type === 0) { // Only include text channels
                status.channels.push({
                    name: channel.name,
                    id: channel.id,
                    type: 'text'
                });
            }
        });
    }

    res.json(status);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 