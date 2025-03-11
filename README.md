# Discord Survey Platform

A platform that allows you to create custom surveys that will be sent via Discord DMs.

## Prerequisites

- Node.js installed on your system
- Python 3.x installed for the development server
- A Discord bot token
- PM2 (for production deployment)

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   # Install production server dependencies
   npm run discord-api:install
   
   # Install development server dependencies
   npm run dev:install
   ```
3. Create a `.env` file in the prodserver directory:
   ```
   DISCORD_TOKEN=your_bot_token_here
   ALLOWED_ORIGINS=*  # Or your specific domains
   ```

## Running the Servers

### Production Server

1. Start the production server:
   ```bash
   npm run prod
   ```
   This will start the server using PM2 for process management.

2. Check the production server status:
   ```bash
   npm run health
   ```
   This will show:
   - If the bot is connected
   - The bot's tag and ID
   - Available channels
   - Server uptime

3. View server logs:
   ```bash
   npm run logs
   ```

4. Stop the production server:
   ```bash
   cd prodserver && pm2 stop discord-api
   ```

### Development Server

1. Start the development server:
   ```bash
   npm run dev
   ```
   This will start the Flask development server on port 5001.

2. Check the development server status:
   - Open your browser to http://localhost:5001
   - The developer platform interface should load
   - Check the browser console for any errors
   - Server logs will appear in the terminal where you ran `npm run dev`

3. Stop the development server:
   - Press Ctrl+C in the terminal where the server is running

## Troubleshooting

### Production Server Issues

1. If the health check fails:
   - Verify the Discord bot token in prodserver/.env
   - Check if PM2 is running: `pm2 status`
   - Review the logs: `npm run logs`

2. If the bot isn't responding:
   - Check if the bot is online in Discord
   - Verify the bot has proper permissions
   - Check the server logs for connection errors

### Development Server Issues

1. If the server won't start:
   - Check if Python and required packages are installed
   - Verify port 5001 is not in use
   - Check for errors in the terminal output

2. If the interface doesn't load:
   - Verify you're using http://localhost:5001
   - Check the browser console for JavaScript errors
   - Ensure all static files are being served correctly

## API Endpoints

### POST /api/dm
Send a survey to a Discord user via DM.

**Request Body:**
```json
{
    "userId": "Discord user ID",
    "message": "Survey question",
    "isStart": true,
    "questions": [
        {
            "question": "What is your favorite color?",
            "format": "text"
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "message": "Survey started"
}
```

### GET /health
Check the status of the production server and bot connection.

**Response:**
```json
{
    "status": "ok",
    "botConnected": true,
    "uptime": 123456,
    "botTag": "BotName#1234",
    "botId": "bot-id",
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
2. Input validation is implemented for all survey responses
3. Error handling is implemented to prevent server crashes
4. The server automatically attempts to reconnect if the Discord connection is lost

## Question Formats

The platform supports multiple question formats:

1. Text
   - Free-form text responses
   - No format restrictions

2. Number (1-10)
   - Numeric responses only
   - Must be between 1 and 10

3. Yes/No
   - Only accepts "yes" or "no" (case insensitive)

4. Multiple Choice
   - Lettered options (A, B, C, D)
   - Must select one of the provided options
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| position | string | 'bottom-right' | Widget position ('bottom-right' or 'bottom-left') |
| primaryColor | string | '#007bff' | Primary color for the widget theme |
| title | string | 'Chat with us' | Title displayed in the widget header |
| placeholder | string | 'Type your message...' | Placeholder text for the input field |
| apiUrl | string | 'http://localhost:5000/api/chat' | Backend API URL for chat processing |


