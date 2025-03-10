import fetch from 'node-fetch';
import pm2 from 'pm2';

const API_URL = 'http://localhost:3001';
const TIMEOUT = 5000; // 5 seconds timeout

async function checkProductionHealth() {
    console.log('Checking Production Server Health...\n');

    // Check PM2 Process
    try {
        await new Promise((resolve, reject) => {
            pm2.describe('discord-api', (err, proc) => {
                if (err) reject(err);
                if (!proc || proc.length === 0) {
                    console.log('❌ PM2 Process Status: Not Running');
                    reject(new Error('Process not found'));
                } else {
                    const process = proc[0];
                    console.log('PM2 Process Status:');
                    console.log('==================');
                    console.log(`Status: ${process.pm2_env.status}`);
                    console.log(`Uptime: ${Math.floor(process.pm2_env.pm_uptime / 1000)} seconds`);
                    console.log(`Restarts: ${process.pm2_env.restart_time}`);
                    console.log(`CPU Usage: ${process.monit.cpu}%`);
                    console.log(`Memory: ${Math.floor(process.monit.memory / 1024 / 1024)}MB`);
                    resolve();
                }
            });
        });
    } catch (error) {
        console.error('Failed to get PM2 status:', error.message);
    }

    // Check API Health
    try {
        console.log('\nAPI Health Status:');
        console.log('================');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT);

        const response = await fetch(`${API_URL}/health`, {
            signal: controller.signal
        });
        clearTimeout(timeout);
        
        const data = await response.json();
        
        console.log(`API Status: ${data.status}`);
        console.log(`Bot Connected: ${data.botConnected ? '✅ Yes' : '❌ No'}`);
        console.log(`Bot Tag: ${data.botTag || 'N/A'}`);
        console.log(`API Uptime: ${Math.floor(data.uptime)} seconds`);
        
        if (data.webformBotChannel) {
            console.log('\nWebform Bot Channel:');
            console.log('==================');
            console.log(`Name: ${data.webformBotChannel.name}`);
            console.log(`ID: ${data.webformBotChannel.id}`);
        } else {
            console.log('\n❌ Webform Bot Channel not found!');
        }
        
    } catch (error) {
        console.error('\n❌ API Health Check Failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\nTroubleshooting Steps:');
            console.log('1. Check if server is running: npm run prod');
            console.log('2. Check server logs: npm run logs');
            console.log('3. Verify port 3001 is available');
            console.log('4. Check Discord bot token and permissions');
        }
    }

    // Cleanup PM2 connection
    pm2.disconnect();
}

checkProductionHealth(); 