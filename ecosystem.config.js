module.exports = {
  apps: [
    {
      name: 'yadaphone-production',
      script: 'npm',
      args: 'start',
      cwd: './build',
      instances: 'max', // Use all available CPUs
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Logging
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      
      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 10000,
      
      // Environment file
      env_file: '.env.production'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/yadaphone-app.git',
      path: '/var/www/yadaphone',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};