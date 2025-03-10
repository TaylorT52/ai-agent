module.exports = {
  apps: [{
    name: 'discord-api',
    script: 'server.js',
    cwd: '/Users/taylortam/Downloads/code/ai-agent/prodserver',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}; 