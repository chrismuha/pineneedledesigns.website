import { config } from './index.js';

const CLOVER_ECOMMERCE_SANDBOX_URL = 'https://apisandbox.dev.clover.com';
const CLOVER_ECOMMERCE_PRODUCTION_URL = 'https://api.clover.com';

const environment = String(config.clover?.environment || process.env.CLOVER_ENVIRONMENT || 'sandbox').trim().toLowerCase();
const isProduction = environment === 'production';

const normalizeSecret = (value) => String(value || '').trim().replace(/^['"]|['"]$/g, '');

export const cloverConfig = {
  environment,
  isProduction,
  ecommerceApiUrl: isProduction ? CLOVER_ECOMMERCE_PRODUCTION_URL : CLOVER_ECOMMERCE_SANDBOX_URL,
  merchantId: normalizeSecret(config.clover?.merchantId || process.env.CLOVER_MERCHANT_ID),
  // Ecommerce API private token (Hosted Checkout integration type). Backend-only.
  accessToken: normalizeSecret(
    config.clover?.accessToken
    || process.env.CLOVER_ACCESS_TOKEN
    || process.env.CLOVER_PRIVATE_TOKEN,
  ),
  pageConfigUuid: normalizeSecret(config.clover?.pageConfigUuid || process.env.CLOVER_PAGE_CONFIG_UUID),
  webhookSecret: normalizeSecret(config.clover?.webhookSecret || process.env.CLOVER_WEBHOOK_SECRET),
};

export const CLOVER_REQUIRED_ENV_VARS = [
  'CLOVER_ENVIRONMENT',
  'CLOVER_MERCHANT_ID',
  'CLOVER_ACCESS_TOKEN',
];

const PLACEHOLDER_PATTERN = /^(your_|placeholder|changeme|xxx+|test_token|YOUR_)/i;

const isRealCredential = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  if (PLACEHOLDER_PATTERN.test(trimmed)) return false;
  if (/^your[_-]/i.test(trimmed)) return false;
  return true;
};

export const isCloverConfigured = () => (
  Boolean(cloverConfig.environment)
  && isRealCredential(cloverConfig.merchantId)
  && isRealCredential(cloverConfig.accessToken)
);

export const assertCloverConfigured = () => {
  if (!isRealCredential(cloverConfig.merchantId)) {
    const error = new Error('Clover merchant ID is not configured. Set CLOVER_MERCHANT_ID in backend/.env.');
    error.code = 'CLOVER_NOT_CONFIGURED';
    throw error;
  }
  if (!isRealCredential(cloverConfig.accessToken)) {
    const error = new Error('Clover Ecommerce API private token is not configured. Generate a Hosted Checkout private token in the Clover merchant dashboard and set CLOVER_ACCESS_TOKEN.');
    error.code = 'CLOVER_NOT_CONFIGURED';
    throw error;
  }
};
