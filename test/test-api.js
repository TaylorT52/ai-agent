import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

async function testHealth() {
    try {
        console.log('Testing health endpoint...');
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log('Health check response:', data);
        return data.botConnected;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}

async function testChat(message, username) {
    try {
        console.log(`Sending message as ${username}: ${message}`);
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, username })
        });
        
        const data = await response.json();
        console.log('Chat response:', data);
        return data;
    } catch (error) {
        console.error('Chat test failed:', error);
        return null;
    }
}

async function runTests() {
    console.log('Starting API tests...\n');
    
    // Test health endpoint
    const isConnected = await testHealth();
    if (!isConnected) {
        console.log('Bot is not connected. Please check your Discord token and bot status.');
        return;
    }
    
    console.log('\nBot is connected. Testing chat endpoint...\n');
    
    // Test chat endpoint
    await testChat('Hello! This is a test message.', 'TestUser');
}

// Run the tests
runTests(); 