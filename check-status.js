import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

async function checkStatus() {
    try {
        console.log('Checking Discord bot status...\n');
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        
        console.log('Status Summary:');
        console.log('==============');
        console.log(`Bot Connected: ${data.botConnected ? '✅ Yes' : '❌ No'}`);
        console.log(`Bot Tag: ${data.botTag || 'N/A'}`);
        console.log(`Bot ID: ${data.botId || 'N/A'}`);
        console.log(`Uptime: ${Math.floor(data.uptime)} seconds`);
        
        if (data.webformBotChannel) {
            console.log('\nWebform Bot Channel:');
            console.log('==================');
            console.log(`Name: ${data.webformBotChannel.name}`);
            console.log(`ID: ${data.webformBotChannel.id}`);
        } else {
            console.log('\n❌ Webform Bot Channel not found!');
        }
        
        if (data.channels.length > 0) {
            console.log('\nAvailable Text Channels:');
            console.log('=====================');
            data.channels.forEach(channel => {
                console.log(`- ${channel.name} (${channel.id})`);
            });
        }
        
    } catch (error) {
        console.error('\n❌ Error checking status:', error.message);
        console.log('\nMake sure:');
        console.log('1. The server is running (npm run prod)');
        console.log('2. You\'re using the correct port (3001)');
        console.log('3. The Discord bot token is valid');
    }
}

checkStatus(); 