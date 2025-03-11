# Discord Survey Bot

A Discord bot that allows you to conduct surveys through DMs and collect responses.

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd discord-survey-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with:
```env
DISCORD_TOKEN=your_discord_bot_token
PORT=3001 # Optional, defaults to 3001
ALLOWED_ORIGINS=* # Optional, for CORS
```

## Running the Server

### Development Mode
```bash
npm run dev
```
This will:
- Start the server with nodemon for auto-reloading
- Watch for file changes
- Show detailed logs in the console

### Production Mode
```bash
npm run prod
```
This will:
- Start the server using PM2 for process management
- Run in the background
- Auto-restart on crashes
- Handle logs automatically

### Useful PM2 Commands
```bash
# View logs
npm run logs

# Stop the server
npm run stop

# Restart the server
npm run restart

# Check server status
npm run status
```

## Testing the Bot

1. Start a survey:
```bash
curl -X POST http://localhost:3001/api/dm \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_DISCORD_USER_ID",
    "isStart": true,
    "questions": [
      {
        "question": "How satisfied are you?",
        "format": "number"
      },
      {
        "question": "Would you recommend us?",
        "format": "yesno"
      }
    ]
  }'
```

2. Check server health:
```bash
curl http://localhost:3001/health
```

3. Get active survey status:
```bash
curl http://localhost:3001/api/survey-status/YOUR_DISCORD_USER_ID
```

## Question Formats

The bot supports several question formats:

1. `number` - Accepts numbers 1-10
```json
{
  "question": "Rate our service (1-10)",
  "format": "number"
}
```

2. `yesno` - Accepts "yes" or "no"
```json
{
  "question": "Would you recommend us?",
  "format": "yesno"
}
```

3. `text` - Accepts any text response
```json
{
  "question": "Any additional feedback?",
  "format": "text"
}
```

4. `multiple` - Multiple choice with options
```json
{
  "question": "Which feature do you use most?",
  "format": "multiple",
  "options": {
    "A": "Dashboard",
    "B": "Reports",
    "C": "Analytics",
    "D": "Settings"
  }
}
```

## Troubleshooting

1. **Bot not connecting:**
   - Check if your Discord token is correct
   - Ensure the bot is invited to your server
   - Verify the bot has proper permissions

2. **DMs not working:**
   - Make sure the user exists
   - Check if the user has DMs enabled
   - Verify the user ID is correct

3. **Server issues:**
   - Check logs: `npm run logs`
   - Verify port 3001 is available
   - Check if the bot is running: `npm run status`

## Development

To modify the bot:

1. Make changes in development mode:
```bash
npm run dev
```

2. Test your changes:
```bash
# Start a test survey
curl -X POST http://localhost:3001/api/dm -H "Content-Type: application/json" -d '{
  "userId": "YOUR_DISCORD_USER_ID",
  "isStart": true,
  "questions": [
    {
      "question": "Test question?",
      "format": "text"
    }
  ]
}'
```

3. Deploy to production:
```bash
git pull  # Get latest changes
npm install  # Update dependencies
npm run restart  # Restart the production server
```

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


