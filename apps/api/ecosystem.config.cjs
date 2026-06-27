module.exports = {
  apps: [
    {
      name: 'waiichia-api',
      script: './src/index.js',
      cwd: '/opt/waiichia/apps/api',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false
    }
  ]
};
