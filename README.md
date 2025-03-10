# Discord Bot API

A simple API that allows you to send messages to a Discord channel and receive bot responses through a web interface.

## Prerequisites

- Node.js installed on your system
- A Discord bot token
- A Discord server with a channel named `webform-bot`
- PM2 (for production deployment)

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```
   DISCORD_TOKEN=your_bot_token_here
   PORT=3001  # Optional, defaults to 3001
   ALLOWED_ORIGINS=http://yourdomain.com,http://localhost:8000  # Comma-separated list of allowed origins, or * for all
   NODE_ENV=production  # For production deployment
   ```

## Development

1. Start the development server (with auto-reload):
   ```bash
   npm run dev
   ```

## Production Deployment

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the production server:
   ```bash
   npm run prod
   ```

3. Other PM2 commands:
   ```bash
   npm run stop     # Stop the server
   npm run restart  # Restart the server
   npm run logs     # View logs
   ```

4. To make PM2 start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

## Rate Limiting

The API includes rate limiting to prevent abuse:
- 100 requests per IP address per 15 minutes
- Message length limited to 2000 characters
- Username length limited to 32 characters

## API Endpoints

### POST /api/chat
Send a message to the Discord channel and receive a bot response.

**Request Body:**
```json
{
    "message": "Your message here",
    "username": "Your name"
}
```

**Response:**
```json
{
    "response": "Bot's response message"
}
```

**Error Response:**
```json
{
    "error": "Error message",
    "details": "Additional error details"
}
```

### GET /health
Check the status of the API and bot connection.

**Response:**
```json
{
    "status": "ok",
    "botConnected": true,
    "uptime": 123456,
    "channels": [
        {
            "name": "channel-name",
            "id": "channel-id",
            "type": "text"
        }
    ]
}
```

## Security Considerations

1. CORS is enabled and can be configured via the `ALLOWED_ORIGINS` environment variable
2. Rate limiting is enabled to prevent abuse
3. Input validation is implemented for message and username lengths
4. Error handling is implemented to prevent server crashes
5. The server automatically attempts to reconnect if the Discord connection is lost

## Troubleshooting

1. If you see "Bot is not connected":
   - Check that your Discord bot token is correct
   - Ensure the bot is online in Discord
   - Check the logs with `npm run logs`

2. If you see "webform-bot channel is not found":
   - Create a text channel named exactly `webform-bot` in your Discord server
   - Make sure the bot has access to the channel

3. If you get rate limit errors:
   - Wait for the rate limit window to reset (15 minutes)
   - Consider increasing the rate limit in production if needed

4. For production issues:
   - Check the PM2 logs: `npm run logs`
   - Monitor the process: `pm2 monit`
   - Check system resources: `pm2 status`

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| position | string | 'bottom-right' | Widget position ('bottom-right' or 'bottom-left') |
| primaryColor | string | '#007bff' | Primary color for the widget theme |
| title | string | 'Chat with us' | Title displayed in the widget header |
| placeholder | string | 'Type your message...' | Placeholder text for the input field |
| apiUrl | string | 'http://localhost:5000/api/chat' | Backend API URL for chat processing |
```

## How It Works

1. When you send a message through the web interface or API:
   - The message is sent to the `webform-bot` channel with your username as a prefix
   - The system waits for the next bot response in the channel
   - The bot's response is returned to you

2. The system will:
   - Wait up to 30 seconds for a bot response
   - Return "No response received" if no bot responds within that time
   - Ignore messages from the API bot itself
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| position | string | 'bottom-right' | Widget position ('bottom-right' or 'bottom-left') |
| primaryColor | string | '#007bff' | Primary color for the widget theme |
| title | string | 'Chat with us' | Title displayed in the widget header |
| placeholder | string | 'Type your message...' | Placeholder text for the input field |
| apiUrl | string | 'http://localhost:5000/api/chat' | Backend API URL for chat processing |


