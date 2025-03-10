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

// Constants
const WEBFORM_BOT_CHANNEL_ID = '1348533943770550284';

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

    // Verify access to webform-bot channel
    const webformChannel = client.channels.cache.get(WEBFORM_BOT_CHANNEL_ID);
    if (webformChannel) {
        console.log(`Successfully connected to webform-bot channel (${WEBFORM_BOT_CHANNEL_ID})`);
    } else {
        console.error('Could not find webform-bot channel! Please check the channel ID and bot permissions.');
    }
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

        // Get the webform-bot channel specifically
        const channel = client.channels.cache.get(WEBFORM_BOT_CHANNEL_ID);
        
        if (!channel) {
            return res.status(500).json({ 
                error: 'Webform bot channel not available',
                details: 'Bot needs access to the webform-bot channel'
            });
        }

        console.log(`Sending message to webform-bot channel (${channel.id})`);

        // Send message to Discord
        const sentMessage = await channel.send(message);
        console.log('Message sent successfully');

        // First, wait for bot's response
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

        // Then, wait for user's response
        const userResponse = await new Promise((resolve) => {
            const filter = m => !m.author.bot; // Accept any non-bot message
            channel.awaitMessages({ filter, max: 1, time: 30000 })
                .then(collected => {
                    const response = collected.first()?.content;
                    console.log('User response received:', response);
                    resolve(response || 'No user response received');
                })
                .catch((error) => {
                    console.error('Error waiting for user response:', error);
                    resolve('No user response received');
                });
        });

        res.json({ 
            botResponse,
            userResponse,
            conversation: [
                { role: 'user', content: message },
                { role: 'assistant', content: botResponse },
                { role: 'user', content: userResponse }
            ]
        });
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
        webformChannelConnected: false,
        channels: []
    };

    // Add channel information if bot is connected
    if (client.isReady()) {
        const webformChannel = client.channels.cache.get(WEBFORM_BOT_CHANNEL_ID);
        status.webformChannelConnected = !!webformChannel;
        
        if (webformChannel) {
            status.channels.push({
                name: webformChannel.name,
                id: webformChannel.id,
                type: 'text'
            });
        }
    }

    res.json(status);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 