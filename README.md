# Discord Bot API

A simple API that allows you to send messages to a Discord channel and receive bot responses through a web interface.

## Prerequisites

- Node.js installed on your system
- A Discord bot token
- A Discord server with a channel named `webform-bot`

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your Discord bot token:
   ```
   DISCORD_TOKEN=your_bot_token_here
   PORT=3001  # Optional, defaults to 3001
   ```

## Running the Application

1. Start the API server:
   ```bash
   npm start
   ```
   The server will start on port 3001 (or the port specified in your .env file).

2. In a separate terminal, start the web server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000/test.html
   ```

## Using the API

### Web Interface

The web interface provides a simple form to:
1. Enter your name
2. Enter your message
3. Send the message and receive bot responses

### API Endpoints

#### POST /api/chat
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

#### GET /health
Check the status of the API and bot connection.

**Response:**
```json
{
    "status": "ok",
    "botConnected": true,
    "channels": [
        {
            "name": "channel-name",
            "id": "channel-id",
            "type": "text"
        }
    ]
}
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

## Troubleshooting

1. If you see "Bot is not connected":
   - Check that your Discord bot token is correct
   - Ensure the bot is online in Discord

2. If you see "webform-bot channel is not found":
   - Create a text channel named exactly `webform-bot` in your Discord server
   - Make sure the bot has access to the channel

3. If you get "Cannot connect to server":
   - Ensure both the API server and web server are running
   - Check that you're using the correct ports
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| position | string | 'bottom-right' | Widget position ('bottom-right' or 'bottom-left') |
| primaryColor | string | '#007bff' | Primary color for the widget theme |
| title | string | 'Chat with us' | Title displayed in the widget header |
| placeholder | string | 'Type your message...' | Placeholder text for the input field |
| apiUrl | string | 'http://localhost:5000/api/chat' | Backend API URL for chat processing |


