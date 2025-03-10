#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "DISCORD_TOKEN=your_discord_bot_token" > .env
    echo "Please edit .env and add your Discord bot token"
fi

# Start the server in the background
echo "Starting the server..."
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Start Python HTTP server for the test page
echo "Starting test page server..."
python3 -m http.server 8000 &
PYTHON_PID=$!

echo "Setup complete!"
echo "1. Edit .env and add your Discord bot token if you haven't already"
echo "2. Open http://localhost:8000/test.html in your browser"
echo "3. Generate an API key from the developer portal"
echo "4. Use the API key and send test messages to the bot"
echo ""
echo "Press Ctrl+C to stop the servers"

# Wait for Ctrl+C
trap "kill $SERVER_PID $PYTHON_PID; exit" INT
wait 
