import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';
const TIMEOUT = 45000; // 45 seconds timeout

async function testHealth() {
    try {
        console.log('Testing health endpoint...');
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log('\nHealth check response:');
        console.log('====================');
        console.log(`Status: ${data.status}`);
        console.log(`Bot Connected: ${data.botConnected ? '✅ Yes' : '❌ No'}`);
        console.log(`Bot Tag: ${data.botTag || 'N/A'}`);
        console.log(`Uptime: ${Math.floor(data.uptime)} seconds`);
        
        if (data.webformBotChannel) {
            console.log('\nWebform Bot Channel:');
            console.log('==================');
            console.log(`Name: ${data.webformBotChannel.name}`);
            console.log(`ID: ${data.webformBotChannel.id}`);
        }

        return data.botConnected;
    } catch (error) {
        console.error('\nHealth check failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\nTroubleshooting steps:');
            console.log('1. Check if the server is running (npm run prod)');
            console.log('2. Verify the server is listening on port 3001');
            console.log('3. Check server logs: npm run logs');
        }
        return false;
    }
}

async function testChat(message, username) {
    try {
        console.log(`\nSending message as ${username}: ${message}`);
        
        // Send the message and wait for response
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, username })
        });

        // Check for non-200 responses
        if (!response.ok) {
            const errorData = await response.json();
            console.error('\nServer Error:');
            console.error('=============');
            console.error('Status:', response.status);
            console.error('Error:', errorData.error);
            console.error('Details:', errorData.details);
            return null;
        }

        // Parse the response
        const responseData = await response.json();
        
        console.log('\nBot Response:');
        console.log('============');
        if (responseData.response) {
            console.log('✅ Response received:');
            console.log('-------------------');
            console.log(responseData.response);
            console.log('-------------------');
        } else {
            console.log('❌ No response received from bot');
        }

        return responseData;
    } catch (error) {
        console.error('\nChat test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\nTroubleshooting steps:');
            console.log('1. Check if the server is running (npm run prod)');
            console.log('2. Verify the server is listening on port 3001');
            console.log('3. Check server logs: npm run logs');
        }
        return null;
    }
}

async function testDM(userId, message) {
    try {
        console.log(`\nSending DM to user ${userId}: ${message}`);
        
        // Send the DM request
        const response = await fetch(`${API_URL}/api/dm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, message })
        });

        // Check for non-200 responses
        if (!response.ok) {
            const errorData = await response.json();
            console.error('\nDM Error:');
            console.error('=========');
            console.error('Status:', response.status);
            console.error('Error:', errorData.error);
            console.error('Details:', errorData.details);
            return null;
        }

        // Parse the response
        const responseData = await response.json();
        
        console.log('\nDM Result:');
        console.log('==========');
        if (responseData.success) {
            console.log('✅ DM sent successfully');
        } else {
            console.log('❌ Failed to send DM');
            if (responseData.error) {
                console.log('Error:', responseData.error);
            }
        }

        return responseData;
    } catch (error) {
        console.error('\nDM test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\nTroubleshooting steps:');
            console.log('1. Check if the server is running (npm run prod)');
            console.log('2. Verify the server is listening on port 3001');
            console.log('3. Check server logs: npm run logs');
        }
        return null;
    }
}

async function runTests() {
    console.log('Starting API tests...\n');
    
    // Test health endpoint
    const isConnected = await testHealth();
    if (!isConnected) {
        console.log('\n❌ Bot is not connected. Please check your Discord token and bot status.');
        return;
    }
    
    console.log('\n✅ Bot is connected. Testing chat endpoint...\n');
    
    // Test chat endpoint with a longer timeout
    const startTime = Date.now();
    const chatResult = await testChat('Hello! This is a test message.', 'TestUser');
    
    // Test DM functionality
    console.log('\nTesting DM functionality...');
    const dmResult = await testDM('756724128588759231', 'Hello! This is a test DM from the bot.');
    
    const endTime = Date.now();
    
    console.log('\nTest Summary:');
    console.log('============');
    console.log(`Time taken: ${(endTime - startTime) / 1000} seconds`);
    console.log(`Chat Test: ${chatResult ? '✅ Complete' : '❌ Failed'}`);
    console.log(`DM Test: ${dmResult ? '✅ Complete' : '❌ Failed'}`);
}

// Run the tests
runTests(); 