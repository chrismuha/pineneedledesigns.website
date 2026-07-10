module.exports = {
  apps: [
    {
      name: 'server',
      cwd: './backend',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || '3001',
        MONGODB_URI: process.env.MONGODB_URI || '',
        SESSION_SECRET: process.env.SESSION_SECRET || '',
        APP_BASE_URL: process.env.APP_BASE_URL || 'https://pineneedledesigns.store',
        RESEND_API_KEY: process.env.RESEND_API_KEY || '',
        RESEND_FROM: process.env.RESEND_FROM || 'orders@pineneedledesigns.store',
        PAYPAL_BOOKING_DEPOSITS_ENABLED: process.env.PAYPAL_BOOKING_DEPOSITS_ENABLED || 'false',
        PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',
        PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || '',
      },
    },
  ],
};
