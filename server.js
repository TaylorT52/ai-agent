import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        details: 'Please try again later'
    }
});

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST']
}));
app.use(bodyParser.json());
app.use(limiter);

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Discord bot setup with detailed logging
client.once('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
    console.log('Bot ID:', client.user.id);
    console.log('Bot is ready and connected to Discord!');
    
    // Log available channels for debugging
    console.log('\nAvailable channels:');
    client.channels.cache.forEach(channel => {
        console.log(`- ${channel.name} (${channel.id})`);
    });
});

// Enhanced error handling for Discord client
client.on('error', error => {
    console.error('Discord client error:', error);
    console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
    });
});

client.on('disconnect', () => {
    console.log('Discord client disconnected. Attempting to reconnect...');
});

client.on('reconnecting', () => {
    console.log('Discord client is reconnecting...');
});

// Login to Discord with error handling
console.log('Attempting to connect to Discord...');
client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log('Login successful!');
    })
    .catch(error => {
        console.error('Failed to connect to Discord:', error);
        console.error('Please check your bot token and make sure:');
        console.error('1. The token is correct');
        console.error('2. The bot is invited to your server');
        console.error('3. The bot has the necessary permissions');
    });

// API Routes
app.post('/api/chat', async (req, res) => {
    try {
        const { message, username } = req.body;

        if (!message || !username) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: 'Message and username are required'
            });
        }

        // Basic input validation
        if (message.length > 2000) {
            return res.status(400).json({
                error: 'Message too long',
                details: 'Message must be less than 2000 characters'
            });
        }

        if (username.length > 32) {
            return res.status(400).json({
                error: 'Username too long',
                details: 'Username must be less than 32 characters'
            });
        }

        // Check if bot is connected
        if (!client.isReady()) {
            return res.status(503).json({
                error: 'Service unavailable',
                details: 'Discord bot is not connected. Please check the server logs for details.'
            });
        }

        // Find the webform-bot channel
        const channel = client.channels.cache.find(ch => ch.name === 'webform-bot');
        
        if (!channel) {
            console.log('Available channels:', client.channels.cache.map(ch => ch.name));
            return res.status(404).json({ 
                error: 'Channel not found',
                details: 'The webform-bot channel does not exist. Please create a channel named "webform-bot".'
            });
        }

        console.log(`Sending message from ${username} to webform-bot channel`);

        // Send message to Discord with username prefix
        const formattedMessage = `[${username}]: ${message}`;
        await channel.send(formattedMessage);
        console.log('Message sent successfully');

        // Wait for next bot response in channel
        const botResponse = await new Promise((resolve) => {
            const filter = m => {
                return m.author.bot && 
                       m.author.id !== client.user.id; // Ignore our own messages
            };
            
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
app.get('/health', async (req, res) => {
    const status = {
        status: 'ok',
        botConnected: client.isReady(),
        uptime: process.uptime(),
        botTag: client.user?.tag,
        botId: client.user?.id,
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred'
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
}); 