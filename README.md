# AI Chatbot with Discord Integration

A customizable chatbot widget that can be embedded into any website, integrated with a Discord bot powered by Mistral AI.

## Features

- Beautiful, customizable chat widget
- Discord bot integration
- Powered by Mistral AI for intelligent responses
- Real-time communication
- Cross-origin resource sharing (CORS) support

## Installation

1. Clone the repository and install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your environment variables in a `.env` file:
```
DISCORD_TOKEN=your_discord_bot_token
MISTRAL_API_KEY=your_mistral_api_key
PORT=5000  # Optional, defaults to 5000
```

3. Start the backend server:
```bash
python server.py
```

4. Start the Discord bot:
```bash
python bot.py
```

5. Include the widget in your website:
```html
<script src="path/to/widget.js"></script>
<script>
    const chatbot = new ChatbotWidget({
        position: 'bottom-right', // or 'bottom-left'
        primaryColor: '#007bff', // any valid CSS color
        title: 'Chat with us', // header title
        placeholder: 'Type your message...', // input placeholder
        apiUrl: 'http://localhost:5000/api/chat' // backend API URL
    });
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| position | string | 'bottom-right' | Widget position ('bottom-right' or 'bottom-left') |
| primaryColor | string | '#007bff' | Primary color for the widget theme |
| title | string | 'Chat with us' | Title displayed in the widget header |
| placeholder | string | 'Type your message...' | Placeholder text for the input field |
| apiUrl | string | 'http://localhost:5000/api/chat' | Backend API URL for chat processing |

## Development

The project consists of three main components:
1. `widget.js` - The frontend chat widget
2. `server.py` - The backend server that handles communication between the widget and Discord bot
3. `bot.py` - The Discord bot implementation

The widget communicates with the backend server, which processes messages using the Mistral AI agent. The same agent is used by both the Discord bot and the widget, ensuring consistent responses across platforms.
