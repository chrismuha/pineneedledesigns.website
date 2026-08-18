import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';
import { logMailerStatus } from './services/mailer.js';
import { isCloverConfigured } from './config/clover.js';
import { verifyCloverHostedCheckoutAuth } from './services/cloverService.js';

const start = async () => {
  await connectDatabase();
  await logMailerStatus();

  if (isCloverConfigured()) {
    console.log('✅ Clover Hosted Checkout is configured');
    if (!config.isProduction) {
      verifyCloverHostedCheckoutAuth()
        .then((ok) => {
          if (!ok) {
            console.warn('⚠️ Clover credentials are set but Hosted Checkout authentication failed.');
            console.warn('   Run: npm run diagnose:clover -w backend');
          }
        })
        .catch(() => {});
    }
  } else {
    console.warn('⚠️ Clover payment is not configured. Set CLOVER_MERCHANT_ID and CLOVER_ACCESS_TOKEN (Hosted Checkout private token).');
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`✅ Server running on http://localhost:${config.port}`);
    console.log('🛑 Press Ctrl+C to stop the server');
  });

  // Nginx gives dashboard media uploads ten minutes to arrive and finish.
  // Node's five-minute default request timeout otherwise closes slower mobile
  // uploads mid-stream, which Multer/Busboy reports as "Unexpected end of form".
  server.requestTimeout = 11 * 60 * 1000;

  setInterval(() => {}, 30000);

  return server;
};

start().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
