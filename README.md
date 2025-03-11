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

### GET /api/completed-surveys
Retrieve all completed surveys.

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "userId": "123456789",
            "questions": [
                {
                    "question": "What is your favorite color?",
                    "format": "text"
                }
            ],
            "answers": [
                {
                    "question": "What is your favorite color?",
                    "answer": "Blue",
                    "format": "text",
                    "timestamp": "2024-03-21T10:30:00Z"
                }
            ],
            "completedAt": "2024-03-21T10:30:00Z"
        }
    ]
}
```

## Survey Response Webhooks

When starting a survey, you can provide a webhook URL to receive the survey results immediately upon completion.

### Setting up the Webhook

When making the initial survey request, include a `webhookUrl` parameter:

```json
{
    "userId": "Discord user ID",
    "isStart": true,
    "webhookUrl": "https://your-server.com/webhook",
    "questions": [
        {
            "question": "What is your favorite color?",
            "format": "text"
        }
    ]
}
```

### Webhook Response Format

When a survey is completed, your webhook URL will receive a POST request with the following data:

```json
{
    "success": true,
    "data": {
        "userId": "Discord user ID",
        "questions": [
            {
                "question": "What is your favorite color?",
                "format": "text"
            }
        ],
        "answers": [
            {
                "question": "What is your favorite color?",
                "answer": "Blue",
                "format": "text",
                "timestamp": "2024-03-21T10:30:00Z"
            }
        ],
        "completedAt": "2024-03-21T10:30:00Z"
    }
}
```

### Example Webhook Server

Here's a simple example of how to receive webhook data:

```javascript
// Using Express.js
app.post('/webhook', (req, res) => {
    const surveyData = req.body;
    console.log('Received survey response:', surveyData);
    
    // Process the survey data as needed
    // Store in database, send notifications, etc.
    
    res.json({ received: true });
});
```

### Security Considerations

1. Your webhook endpoint should be HTTPS
2. Consider implementing authentication for your webhook endpoint
3. Validate the incoming data before processing
4. Handle webhook failures gracefully

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

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| position | string | 'bottom-right' | Widget position ('bottom-right' or 'bottom-left') |
| primaryColor | string | '#007bff' | Primary color for the widget theme |
| title | string | 'Chat with us' | Title displayed in the widget header |
| placeholder | string | 'Type your message...' | Placeholder text for the input field |
| apiUrl | string | 'http://localhost:5000/api/chat' | Backend API URL for chat processing |

## Survey Responses

Survey responses are automatically saved as CSV files in the `completed_surveys` directory when a user completes a survey. Each file is named using the format: `survey_USER_ID_TIMESTAMP.csv`

### CSV Format
The CSV files contain the following columns:
- Question: The survey question
- Answer: The user's response
- Format: The question format (text, number, yesno, or multiple)
- Timestamp: When the answer was provided

### File Location
- CSV files are stored in the `completed_surveys` directory
- Each survey gets its own file
- Files are named with pattern: `survey_USER_ID_TIMESTAMP.csv`
- Timestamps use ISO format with dashes for compatibility

### Example CSV Content
```csv
"Question","Answer","Format","Timestamp"
"What is your satisfaction level?","8","number","2024-03-21T10:30:00Z"
"Would you recommend our service?","yes","yesno","2024-03-21T10:30:15Z"
"What is your favorite feature?","Analytics","multiple","2024-03-21T10:30:30Z"
```


