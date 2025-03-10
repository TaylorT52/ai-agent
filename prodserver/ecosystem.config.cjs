module.exports = {
  apps: [{
    name: 'discord-api',
    script: 'server.js',
    node_args: '--experimental-modules',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    watch: true,
    ignore_watch: ['node_modules', 'logs'],
    max_memory_restart: '1G',
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true
  }]
}; 