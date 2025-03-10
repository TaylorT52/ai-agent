const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

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
    if (message.channelId !== webformBotChannel?.id) return;
    
    // Ignore messages from our bot
    if (message.author.id === client.user.id) return;
    
    // Print the message details
    console.log('\nNew message in webform-bot channel:');
    console.log('Author:', message.author.tag);
    console.log('Content:', message.content);
    console.log('Timestamp:', message.createdAt);
    
    // If it's a bot message, mark it as a response
    if (message.author.bot) {
        console.log('Type: Bot Response');
    } else {
        console.log('Type: User Message');
    }
    console.log('-------------------');
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