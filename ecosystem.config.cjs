// PM2 Ecosystem Configuration
module.exports = {
  apps: [
    {
      name: 'webapp',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 1000,
      max_restarts: 5
    }
  ]
};