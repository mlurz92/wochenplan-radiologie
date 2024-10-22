module.exports = {
    apps: [{
      name: 'wochenplan-radiologie',
      script: 'server.js',
      env: {
        NODE_ENV: 'development',
        USER: 'mlurz92'
      },
      env_production: {
        NODE_ENV: 'production',
        USER: 'mlurz92'
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      user: 'mlurz92'
    }]
  };