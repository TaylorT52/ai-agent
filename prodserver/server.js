import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize environment variables
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

// Store the webform-bot channel reference
let webformBotChannel = null;

// Message response handlers
const messageHandlers = new Map();

// Discord bot setup with detailed logging
client.once('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
    console.log('Bot ID:', client.user.id);
    console.log('Bot is ready and connected to Discord!');
    
    // Find and store the webform-bot channel
    webformBotChannel = client.channels.cache.find(ch => ch.name === 'webform-bot');
    
    if (webformBotChannel) {
        console.log('Found webform-bot channel:', webformBotChannel.id);
        console.log('Message listener is active for channel:', webformBotChannel.name);
    } else {
        console.log('Warning: webform-bot channel not found!');
    }
    
    // Log available channels for debugging
    console.log('\nAvailable channels:');
    client.channels.cache.forEach(channel => {
        console.log(`- ${channel.name} (${channel.id})`);
    });
});

// Message handler for webform-bot channel
client.on('messageCreate', async (message) => {
    // Only process messages from the webform-bot channel
    if (message.channelId !== webformBotChannel?.id) {
        console.log('Ignoring message from different channel:', message.channel.name);
        return;
    }
    
    // Print ALL message details regardless of source
    console.log('\n=== New Message Details ===');
    console.log('Channel:', message.channel.name);
    console.log('Author:', message.author.tag);
    console.log('Author ID:', message.author.id);
    console.log('Bot?:', message.author.bot);
    console.log('Content:', message.content);
    console.log('Message ID:', message.id);
    console.log('Reference:', message.reference);
    console.log('Timestamp:', message.createdAt);
    console.log('========================');

    // Ignore messages from our bot
    if (message.author.id === client.user.id) {
        console.log('This is our own message - ignoring');
        return;
    }
    
    // Handle both user messages and bot responses
    if (message.author.bot) {
        console.log('Processing bot response');
        console.log('Active handlers:', messageHandlers.size);
        // Notify all handlers of the new bot message
        messageHandlers.forEach((handler, key) => {
            console.log('Processing handler:', key);
            handler(message);
        });
    } else {
        console.log('Processing user message:', message.content);
        // Here we could add logic to handle user messages directly
        // For now, we'll just log them
        messageHandlers.forEach((handler, key) => {
            console.log('Notifying handler of user message:', key);
            handler(message);
        });
    }
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

        // Check if we have the channel reference
        if (!webformBotChannel) {
            return res.status(404).json({ 
                error: 'Channel not found',
                details: 'The webform-bot channel does not exist. Please create a channel named "webform-bot".'
            });
        }

        console.log(`\nSending message from ${username} to webform-bot channel`);

        // Send message to Discord with username prefix
        const formattedMessage = `[${username}]: ${message}`;
        const sentMessage = await webformBotChannel.send(formattedMessage);
        console.log('Message sent successfully, ID:', sentMessage.id);

        // Create a unique handler ID for this request
        const handlerId = Date.now().toString();
        console.log('Created handler:', handlerId);

        // Wait for next response in channel (bot or user)
        const botResponse = await new Promise((resolve) => {
            let timeoutId;

            // Set up message handler for both bot and user messages
            const handler = (message) => {
                console.log('Handler received message from:', message.author.tag);
                console.log('Message content:', message.content);
                clearTimeout(timeoutId);
                messageHandlers.delete(handlerId);
                resolve({
                    content: message.content,
                    author: message.author.tag,
                    isBot: message.author.bot
                });
            };

            // Add handler to the map
            messageHandlers.set(handlerId, handler);
            console.log('Added handler to map. Active handlers:', messageHandlers.size);

            // Set timeout to remove handler
            timeoutId = setTimeout(() => {
                console.log('Handler timed out:', handlerId);
                messageHandlers.delete(handlerId);
                resolve({
                    content: 'No response received within 30 seconds',
                    author: null,
                    isBot: null
                });
            }, 30000);
        });

        console.log('Received response:', botResponse);
        res.json({ 
            response: botResponse.content,
            author: botResponse.author,
            isBot: botResponse.isBot
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
app.get('/health', async (req, res) => {
    const status = {
        status: 'ok',
        botConnected: client.isReady(),
        uptime: process.uptime(),
        botTag: client.user?.tag,
        botId: client.user?.id,
        webformBotChannel: webformBotChannel ? {
            id: webformBotChannel.id,
            name: webformBotChannel.name
        } : null,
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