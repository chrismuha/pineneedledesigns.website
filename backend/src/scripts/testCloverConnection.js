import { cloverConfig, isCloverConfigured } from '../config/clover.js';

const run = async () => {
  console.log('Clover environment:', cloverConfig.environment);
  console.log('Clover API URL:', cloverConfig.ecommerceApiUrl);
  console.log('Configured:', isCloverConfigured());

  if (!isCloverConfigured()) {
    console.error('Clover is not configured. Set CLOVER_MERCHANT_ID and CLOVER_ACCESS_TOKEN.');
    process.exitCode = 1;
    return;
  }

  const merchantUrl = `${cloverConfig.ecommerceApiUrl}/v3/merchants/${encodeURIComponent(cloverConfig.merchantId)}`;
  const merchantResponse = await fetch(merchantUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${cloverConfig.accessToken}`,
    },
  });
  const merchant = await merchantResponse.json().catch(() => ({}));
  if (!merchantResponse.ok) {
    console.error('Clover merchant lookup failed:', merchantResponse.status, merchant.message || merchant);
    process.exitCode = 1;
    return;
  }

  console.log('\n✅ Clover authentication succeeded');
  console.log('Merchant authenticated:', Boolean(merchant.id));
};

run().catch((error) => {
  console.error('Clover API test failed:', error.message);
  process.exitCode = 1;
});
