import { cloverConfig, isCloverConfigured } from '../config/clover.js';
import { createHostedCheckoutSession } from '../services/cloverService.js';

const run = async () => {
  if (!isCloverConfigured()) {
    console.error('Clover credentials are not configured.');
    process.exitCode = 1;
    return;
  }

  console.log('Environment:', cloverConfig.environment);
  console.log('API URL:', cloverConfig.ecommerceApiUrl);

  try {
    const session = await createHostedCheckoutSession({
      lineItems: [{ name: 'Connection test', price: 100, unitQty: 1 }],
      customer: {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test@example.com',
      },
    });
    console.log('Hosted Checkout session created:', Boolean(session?.checkoutSessionId));
    console.log('Checkout URL returned:', Boolean(session?.href));
  } catch (error) {
    console.error('Hosted Checkout failed:', error.message);
    process.exitCode = 1;
  }
};

run();
