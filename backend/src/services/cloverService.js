import crypto from 'crypto';
import { assertCloverConfigured, cloverConfig } from '../config/clover.js';

const fetchClient = globalThis.fetch && typeof globalThis.fetch === 'function'
  ? globalThis.fetch
  : null;

const buildHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'PineNeedleDesigns/1.0',
  Authorization: `Bearer ${cloverConfig.accessToken}`,
  'X-Clover-Merchant-Id': cloverConfig.merchantId,
});

const buildUrl = (path) => `${cloverConfig.ecommerceApiUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

const parseJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

export const createHostedCheckoutSession = async ({
  lineItems,
  customer,
  redirectUrls,
  idempotencyKey,
}) => {
  if (!fetchClient) {
    throw new Error('A fetch implementation is required by Clover service. Use Node 18+.');
  }
  assertCloverConfigured();

  if (!Array.isArray(lineItems) || !lineItems.length) {
    throw new Error('At least one checkout line item is required.');
  }

  const body = {
    shoppingCart: { lineItems },
    customer,
  };

  if (redirectUrls) {
    body.redirectUrls = redirectUrls;
  }

  if (cloverConfig.pageConfigUuid) {
    body.pageConfigUuid = cloverConfig.pageConfigUuid;
  }

  const requestCheckout = async (apiUrl) => fetch(
    `${apiUrl.replace(/\/$/, '')}/invoicingcheckoutservice/v1/checkouts`,
    {
      method: 'POST',
      headers: {
        ...buildHeaders(),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
    },
  );

  let response = await requestCheckout(cloverConfig.ecommerceApiUrl);
  let payload = await parseJsonResponse(response);

  // Credentials often belong to production even when CLOVER_ENVIRONMENT=sandbox.
  if (!response.ok && response.status === 401 && !cloverConfig.isProduction) {
    const productionUrl = 'https://api.clover.com';
    const retry = await requestCheckout(productionUrl);
    const retryPayload = await parseJsonResponse(retry);
    if (retry.ok) {
      console.warn('Clover token authenticated against production, not sandbox. Using https://api.clover.com. Set CLOVER_ENVIRONMENT=production.');
      cloverConfig.environment = 'production';
      cloverConfig.isProduction = true;
      cloverConfig.ecommerceApiUrl = productionUrl;
      return retryPayload;
    }
    payload = retryPayload;
    response = retry;
  }

  if (!response.ok) {
    let message = payload?.message || payload?.error?.message || 'Clover Hosted Checkout request failed';
    if (response.status === 401) {
      message = cloverConfig.isProduction
        ? 'Clover authentication failed. Confirm CLOVER_ACCESS_TOKEN is the Hosted Checkout private token for this production merchant.'
        : 'Clover authentication failed. The current token is not valid in sandbox. Use sandbox Hosted Checkout credentials, or set CLOVER_ENVIRONMENT=production if these are live credentials.';
    }
    const error = new Error(message);
    error.code = payload?.error?.code || payload?.code || response.status;
    error.details = payload;
    throw error;
  }

  return payload;
};

const isSuccessfulCloverPayment = (payment = {}) => {
  const result = String(payment.result || '').toUpperCase();
  const state = String(payment.state || payment.status || '').toLowerCase();
  return result === 'SUCCESS' || state === 'paid' || state === 'completed' || state === 'approved';
};

export const findSuccessfulPaymentForSession = async ({
  checkoutSessionId,
  amountCents,
  createdAfter,
}) => {
  assertCloverConfigured();

  const response = await fetch(
    buildUrl(`/v3/merchants/${encodeURIComponent(cloverConfig.merchantId)}/payments?limit=50`),
    { method: 'GET', headers: buildHeaders() },
  );

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    return null;
  }

  const payments = payload?.elements || payload?.data || [];
  const since = createdAfter ? new Date(createdAfter).getTime() : 0;
  const sessionNeedle = String(checkoutSessionId || '').toLowerCase();

  for (const payment of payments) {
    const createdTime = Number(payment.createdTime || 0);
    if (since && createdTime && createdTime < since) continue;
    if (Number(payment.amount || 0) !== Number(amountCents || 0)) continue;
    if (!isSuccessfulCloverPayment(payment)) continue;

    const haystack = [
      payment.externalReferenceId,
      payment.referenceId,
      payment.note,
      payment.orderId,
      JSON.stringify(payment.externalPaymentId || ''),
    ].join(' ').toLowerCase();

    if (sessionNeedle && haystack.includes(sessionNeedle)) {
      return payment;
    }
  }

  // Fallback: single successful payment with matching amount in the recent window.
  const amountMatches = payments.filter((payment) => {
    const createdTime = Number(payment.createdTime || 0);
    if (since && createdTime && createdTime < since) return false;
    return Number(payment.amount || 0) === Number(amountCents || 0) && isSuccessfulCloverPayment(payment);
  });

  return amountMatches.length === 1 ? amountMatches[0] : null;
};

export const verifyCloverWebhookSignature = ({ rawBody, signatureHeader }) => {
  if (!cloverConfig.webhookSecret) {
    return false;
  }
  if (!signatureHeader || !rawBody) {
    return false;
  }

  const parts = String(signatureHeader).split(',').reduce((acc, part) => {
    const [key, value] = part.trim().split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', cloverConfig.webhookSecret)
    .update(signedPayload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
};

export const normalizeHostedCheckoutWebhookStatus = (payload = {}) => {
  const status = String(payload?.status || payload?.Status || '').toUpperCase();
  if (status === 'APPROVED') return 'paid';
  if (status === 'DECLINED') return 'failed';
  return 'processing';
};

export const verifyCloverHostedCheckoutAuth = async () => {
  if (!cloverConfig.accessToken || !cloverConfig.merchantId) {
    return false;
  }

  const merchantPath = `/v3/merchants/${encodeURIComponent(cloverConfig.merchantId)}`;
  const urls = cloverConfig.isProduction
    ? [`https://api.clover.com${merchantPath}`]
    : [
      `https://apisandbox.dev.clover.com${merchantPath}`,
      `https://sandbox.dev.clover.com${merchantPath}`,
      `https://api.clover.com${merchantPath}`,
    ];

  for (const url of urls) {
    try {
      const response = await fetch(url, { method: 'GET', headers: buildHeaders() });
      if (response.ok) {
        if (url.includes('api.clover.com') && !cloverConfig.isProduction) {
          console.warn('Clover token is a production credential. Set CLOVER_ENVIRONMENT=production.');
          cloverConfig.environment = 'production';
          cloverConfig.isProduction = true;
          cloverConfig.ecommerceApiUrl = 'https://api.clover.com';
        }
        return true;
      }
    } catch {
      // try the next host
    }
  }

  return false;
};
