import { config } from '../config/index.js';
import { isCloverConfigured, cloverConfig } from '../config/clover.js';
import { DISCOUNT_RULES } from '../constants/index.js';
import {
  createHostedCheckoutSession,
  findSuccessfulPaymentForSession,
  normalizeHostedCheckoutWebhookStatus,
  verifyCloverWebhookSignature,
} from '../services/cloverService.js';
import { deductCapturedInventory, persistCapturedOrder } from '../services/orderPersistence.js';
import { sendOrderConfirmationEmails } from '../services/orderEmails.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { StoreSettings } from '../models/StoreSettings.js';
import mongoose, { isValidObjectId, Types } from 'mongoose';
import { sendPushNotification } from '../services/pushNotifications.js';
import { tryFinalizeBookingDepositFromWebhook } from '../controllers/bookingController.js';
import { commitPendingOrderChange } from './orderController.js';
import { sendOrderEventEmails } from '../services/orderEmails.js';

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const formatError = (error, fallbackMessage = 'Payment could not be completed.') => ({
  success: false,
  message: error?.message || fallbackMessage,
  code: error?.code || 'PAYMENT_FAILED',
});

const splitCustomerName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: 'Customer', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

const findProductByStorefrontId = async (id) => {
  const value = String(id || '').trim();
  const filters = [];
  if (isValidObjectId(value)) filters.push({ _id: Types.ObjectId.createFromHexString(value) });
  if (/^\d+$/.test(value)) filters.push({ legacyId: Number(value) });
  return filters.length ? Product.findOne({ $or: filters }) : null;
};

const productPriceForCartItem = (product, item) => {
  const selected = item.selectedOptions || {};
  const sizeKeys = [
    ['Size', 'shirt'],
    ['Shirt Size', 'shirt'],
    ['Sweatshirt Size', 'sweatshirt'],
    ['Shoe Size', 'shoe'],
    ['Belt Size', 'belt'],
  ];
  for (const [optionName, prefix] of sizeKeys) {
    const size = selected[optionName];
    const sizePrice = size ? product.sizePrices?.get?.(`${prefix}:${size}`) : undefined;
    if (Number.isFinite(sizePrice)) return sizePrice;
  }
  if (selected.Style === 'Bling' && Number.isFinite(product.blingPrice)) return product.blingPrice;
  if (selected.Style === 'No Bling' && Number.isFinite(product.noBlingPrice)) return product.noBlingPrice;
  return product.price;
};

const validateCartInventory = async (cart) => {
  const requestedByProduct = new Map();
  for (const item of cart) {
    const id = String(item.id || '');
    requestedByProduct.set(id, (requestedByProduct.get(id) || 0) + Number(item.quantity || 0));
  }

  const inventoryLines = [];
  const productsByStorefrontId = new Map();
  for (const [id, requestedQuantity] of requestedByProduct) {
    const product = await findProductByStorefrontId(id);
    if (!product) return { error: 'An item in your cart is no longer available.' };
    const availableQuantity = Number.isInteger(product.quantity) ? product.quantity : 1;
    if (product.outOfStock || requestedQuantity > availableQuantity) {
      return {
        error: `${product.name} has only ${availableQuantity} available. Please update your cart.`,
      };
    }
    productsByStorefrontId.set(id, product);
    inventoryLines.push({
      productId: product._id,
      productName: product.name,
      quantity: requestedQuantity,
      shippingCost: Number(product.shippingCost || 0),
    });
  }

  const pricedCart = cart.map((item) => {
    const product = productsByStorefrontId.get(String(item.id || ''));
    return { ...item, price: productPriceForCartItem(product, item) };
  });

  return { inventoryLines, pricedCart };
};

const getDiscountAmount = (total, code) => {
  if (!code || typeof code !== 'string') return 0;
  const rule = DISCOUNT_RULES[code.trim().toUpperCase()];
  if (!rule) return 0;
  if (rule.type === 'fixed') {
    return Math.min(rule.value, total);
  }
  return Number(((total * rule.value) / 100).toFixed(2));
};

const buildHostedCheckoutLineItems = (lineItems, shipping) => {
  const hostedItems = lineItems.map((item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const lineTotalCents = Math.round(Number(item.lineTotal || 0) * 100);
    return {
      name: String(item.title || item.name || 'Item').slice(0, 120),
      price: Math.max(1, Math.round(lineTotalCents / quantity)),
      unitQty: quantity,
    };
  });

  if (shipping > 0) {
    hostedItems.push({
      name: 'Shipping',
      price: Math.round(shipping * 100),
      unitQty: 1,
    });
  }

  return hostedItems;
};

const buildRedirectUrls = () => {
  const baseUrl = String(config.appBaseUrl || '').replace(/\/$/, '');
  if (baseUrl.startsWith('https://')) {
    return {
      success: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      failure: `${baseUrl}/order-failure?session_id={CHECKOUT_SESSION_ID}`,
      cancel: `${baseUrl}/order-cancelled?session_id={CHECKOUT_SESSION_ID}`,
    };
  }
  // Local dev without HTTPS: omit redirect URLs and use Clover's default confirmation page.
  if (!config.isProduction) {
    return undefined;
  }
  return null;
};

const finalizePaidOrder = async ({ order, paymentRecord, cloverPaymentId, req }) => {
  if (order.paymentStatus === 'paid') {
    return order;
  }

  await deductCapturedInventory(order.inventoryLines || []);
  order.paymentStatus = 'paid';
  order.status = 'closed';
  order.gatewayOrderId = order.gatewayOrderId || paymentRecord?.paymentId || '';
  order.timeline = [
    ...(order.timeline || []),
    { label: 'Clover payment paid', at: new Date() },
  ];
  await order.save();

  if (paymentRecord) {
    paymentRecord.status = 'paid';
    paymentRecord.transactionId = cloverPaymentId || paymentRecord.transactionId;
    paymentRecord.metadata = {
      ...paymentRecord.metadata,
      finalizedAt: new Date().toISOString(),
    };
    await paymentRecord.save();
  }

  if (req?.session) {
    req.session.cart = [];
  }

  try {
    await sendPushNotification({
      title: `New Clover order #${order.orderNumber}`,
      body: `${order.shippingAddress?.name || 'Customer'} placed an order for $${Number(order.summary?.finalTotal || 0).toFixed(2)}`,
      url: `/dashboard/orders?order=${order.id}`,
      tag: `order-${order.id}`,
      type: 'order',
    });
  } catch (pushErr) {
    console.error('Clover order push notification failed:', pushErr);
  }

  if (!paymentRecord?.metadata?.emailsSentAt) {
    try {
      await sendOrderConfirmationEmails(order, { transactionId: cloverPaymentId });
      if (paymentRecord) {
        paymentRecord.metadata = {
          ...paymentRecord.metadata,
          emailsSentAt: new Date().toISOString(),
        };
        await paymentRecord.save();
      }
    } catch (mailErr) {
      console.error('Clover order email failed:', mailErr);
    }
  }

  return order;
};

export const createCloverPaymentHandler = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json(formatError({
        message: 'The store is temporarily unavailable. Please try checkout again in a moment.',
        code: 'DATABASE_UNAVAILABLE',
      }));
    }

    if (!isCloverConfigured()) {
      return res.status(503).json(formatError({
        message: 'Clover payment is not configured on the server.',
        code: 'CLOVER_NOT_CONFIGURED',
      }));
    }

    const redirectUrls = buildRedirectUrls();
    if (redirectUrls === null) {
      return res.status(422).json(formatError({
        message: 'Production requires APP_BASE_URL to use HTTPS for Clover redirect URLs.',
        code: 'INVALID_REDIRECT_URL',
      }));
    }

    const { code, customer, billingAddress, shippingAddress, cartItems } = req.body || {};

    // Use session cart. If the server restarted and the session is fresh,
    // fall back to the cart items the client sent in the request body.
    let cart = Array.isArray(req.session.cart) && req.session.cart.length > 0
      ? req.session.cart
      : Array.isArray(cartItems) ? cartItems : [];

    // Sync the client-provided cart back into the session so downstream
    // operations (e.g. inventory reserve) use a consistent source of truth.
    if (cart.length && (!req.session.cart || !req.session.cart.length)) {
      req.session.cart = cart;
    }

    if (!cart.length) {
      return res.status(400).json(formatError({ message: 'Your cart is empty.', code: 'EMPTY_CART' }));
    }

    const inventoryCheck = await validateCartInventory(cart);
    if (inventoryCheck.error) {
      return res.status(409).json(formatError({ message: inventoryCheck.error, code: 'CART_INVALID' }));
    }

    if (!customer?.email || !customer?.phone || !customer?.type) {
      return res.status(400).json(formatError({ message: 'Customer email, phone, and type are required.', code: 'MISSING_CUSTOMER' }));
    }

    if (!billingAddress?.name || !billingAddress?.address1 || !billingAddress?.city || !billingAddress?.state || !billingAddress?.zip) {
      return res.status(400).json(formatError({ message: 'Complete billing address is required.', code: 'MISSING_BILLING_ADDRESS' }));
    }

    if (!shippingAddress?.name || !shippingAddress?.address1 || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.zip) {
      return res.status(400).json(formatError({ message: 'Complete shipping address is required.', code: 'MISSING_SHIPPING_ADDRESS' }));
    }

    const pricedCart = inventoryCheck.pricedCart;
    const total = pricedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = getDiscountAmount(total, code);
    const totalAfterDiscount = Math.max(0, total - discount);
    const settings = await StoreSettings.findOneAndUpdate(
      { key: 'store' },
      { $setOnInsert: { freeShippingEnabled: true, freeShippingMinimum: 28, fallbackShippingCost: 5 } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    ).lean();
    const qualifiesForFreeShipping = settings.freeShippingEnabled
      && Number.isFinite(settings.freeShippingMinimum)
      && totalAfterDiscount >= settings.freeShippingMinimum;
    const itemShippingTotal = inventoryCheck.inventoryLines.reduce(
      (sum, line) => sum + (line.shippingCost * line.quantity),
      0,
    );
    const shipping = roundMoney(qualifiesForFreeShipping
      ? 0
      : itemShippingTotal || Number(settings.fallbackShippingCost ?? 5));
    const tax = roundMoney(Math.max(0, Number(req.body?.summary?.tax || 0)));
    const finalTotal = roundMoney(totalAfterDiscount + shipping + tax);

    const lineItems = pricedCart.map((item) => {
      const subtotal = roundMoney(item.price * item.quantity);
      const discountAmount = total > 0 ? roundMoney((subtotal / total) * discount) : 0;
      const discountedLine = Math.max(0, subtotal - discountAmount);
      const taxAmount = totalAfterDiscount > 0
        ? roundMoney((discountedLine / totalAfterDiscount) * tax)
        : 0;
      return {
        id: item.id,
        title: item.title || item.name || 'Item',
        quantity: item.quantity,
        subtotal,
        discountAmount,
        taxAmount,
        lineTotal: roundMoney(discountedLine + taxAmount),
      };
    });

    const idempotencyKey = String(req.body?.idempotencyKey || '').trim() || undefined;
    const paymentProvider = 'clover';

    const existingOrder = idempotencyKey
      ? await Order.findOne({ idempotencyKey, paymentProvider })
      : null;

    if (existingOrder?.paymentStatus === 'paid') {
      return res.json({
        success: true,
        paymentId: existingOrder.gatewayOrderId,
        status: existingOrder.paymentStatus,
        orderId: existingOrder._id,
        redirectUrl: '/order-success',
      });
    }

    const { firstName, lastName } = splitCustomerName(billingAddress.name);
    const phoneDigits = String(customer.phone || '').replace(/\D/g, '').slice(-10);
    const hostedLineItems = buildHostedCheckoutLineItems(lineItems, shipping);

    const checkoutSession = await createHostedCheckoutSession({
      lineItems: hostedLineItems,
      customer: {
        firstName,
        lastName,
        email: customer.email,
        phoneNumber: phoneDigits,
        address: {
          address1: billingAddress.address1,
          address2: billingAddress.address2 || '',
          city: billingAddress.city,
          state: billingAddress.state,
          zip: billingAddress.zip,
          country: 'US',
        },
      },
      redirectUrls,
      idempotencyKey,
    });

    const checkoutSessionId = String(checkoutSession?.checkoutSessionId || '');
    const checkoutUrl = String(checkoutSession?.href || '');
    if (!checkoutSessionId || !checkoutUrl) {
      return res.status(502).json(formatError({
        message: 'Clover did not return a checkout session.',
        code: 'CLOVER_SESSION_FAILED',
      }));
    }

    const persistedOrder = await persistCapturedOrder({
      paymentProvider,
      paymentStatus: 'pending',
      gatewayOrderId: checkoutSessionId,
      idempotencyKey,
      customer: {
        type: customer.type,
        email: customer.email,
        phone: customer.phone,
      },
      billingAddress,
      shippingAddress,
      discountCode: code ? code.trim().toUpperCase() : '',
      items: pricedCart,
      lineItems,
      inventoryLines: inventoryCheck.inventoryLines,
      summary: {
        subtotal: total,
        discount,
        discountedTotal: totalAfterDiscount,
        shipping,
        tax,
        finalTotal,
      },
      tax: req.body.tax || {},
    });

    const existingPayment = idempotencyKey
      ? await Payment.findOne({ provider: paymentProvider, idempotencyKey })
      : null;

    if (existingPayment) {
      existingPayment.orderId = persistedOrder._id;
      existingPayment.paymentId = checkoutSessionId;
      existingPayment.amount = Math.round(finalTotal * 100);
      existingPayment.currency = 'USD';
      existingPayment.status = 'pending';
      existingPayment.metadata = { ...existingPayment.metadata, checkoutSession };
      existingPayment.attempts = Number(existingPayment.attempts || 0) + 1;
      existingPayment.lastAttemptAt = new Date();
      await existingPayment.save();
    } else {
      await Payment.create({
        orderId: persistedOrder._id,
        provider: paymentProvider,
        paymentId: checkoutSessionId,
        transactionId: '',
        amount: Math.round(finalTotal * 100),
        currency: 'USD',
        status: 'pending',
        idempotencyKey,
        metadata: { checkoutSession },
        attempts: 1,
        lastAttemptAt: new Date(),
      });
    }

    persistedOrder.timeline = [
      ...(persistedOrder.timeline || []),
      { label: 'Clover checkout session created', at: new Date() },
    ];
    await persistedOrder.save();

    return res.json({
      success: true,
      paymentId: checkoutSessionId,
      status: 'pending',
      orderId: persistedOrder._id,
      redirectUrl: checkoutUrl,
    });
  } catch (error) {
    console.error('Clover checkout session creation failed:', error?.stack || error);
    const status = error?.code === 'CLOVER_NOT_CONFIGURED'
      ? 503
      : error?.code === 401 || String(error?.message || '').includes('401')
        ? 401
        : 500;
    return res.status(status).json(formatError(error));
  }
};

export const confirmCloverPaymentHandler = async (req, res) => {
  try {
    const sessionId = String(req.params.sessionId || req.query.session_id || '').trim();
    if (!sessionId) {
      return res.status(400).json(formatError({ message: 'Checkout session ID is required.', code: 'MISSING_SESSION_ID' }));
    }

    const payment = await Payment.findOne({ paymentId: sessionId, provider: 'clover' });
    let order = await Order.findOne({ gatewayOrderId: sessionId, paymentProvider: 'clover' });
    if (!order && payment?.orderId) order = await Order.findById(payment.orderId);
    if (!order) {
      return res.status(404).json(formatError({ message: 'Order not found for this checkout session.', code: 'ORDER_NOT_FOUND' }));
    }

    if (payment?.metadata?.kind === 'order_change' || order.paymentStatus !== 'paid') {
      const cloverPayment = await findSuccessfulPaymentForSession({
        checkoutSessionId: sessionId,
        amountCents: payment?.amount || Math.round(Number(order.summary?.finalTotal || 0) * 100),
        createdAfter: order.createdAt,
      });

      if (cloverPayment) {
        if (payment) {
          payment.status = 'paid';
          payment.transactionId = String(cloverPayment.id || payment.transactionId);
          payment.metadata = { ...payment.metadata, syncedPayment: cloverPayment };
          await payment.save();
        }
        order = payment?.metadata?.kind === 'order_change'
          ? await commitPendingOrderChange(order, payment)
          : await finalizePaidOrder({ order, paymentRecord: payment, cloverPaymentId: String(cloverPayment.id || ''), req });
      }
    }

    if (payment?.metadata?.kind === 'order_change' && payment.status === 'refunded') {
      return res.json({
        success: false,
        status: 'refunded',
        orderId: order._id,
        message: 'The added item became unavailable. The additional payment was refunded and the original order was not changed.',
        code: 'ORDER_CHANGE_REFUNDED',
      });
    }

    if (order.paymentStatus === 'paid') {
      if (req.session) req.session.cart = [];
      return res.json({
        success: true,
        status: 'paid',
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }

    return res.json({
      success: false,
      status: order.paymentStatus || 'pending',
      orderId: order._id,
      message: payment?.status === 'failed'
        ? 'Payment was declined.'
        : 'Payment is still being confirmed. Please wait a moment and refresh.',
      code: payment?.status === 'failed' ? 'PAYMENT_FAILED' : 'PAYMENT_PENDING',
    });
  } catch (error) {
    console.error('Clover payment confirmation failed:', error?.stack || error);
    return res.status(500).json(formatError(error));
  }
};

export const cloverWebhookHandler = async (req, res) => {
  try {
    const rawBody = req.rawBody || req.body;
    const rawBodyString = Buffer.isBuffer(rawBody)
      ? rawBody.toString('utf8')
      : typeof rawBody === 'string'
        ? rawBody
        : JSON.stringify(rawBody || {});

    const signatureHeader = req.get('Clover-Signature') || req.get('clover-signature') || '';
    if (cloverConfig.webhookSecret && !verifyCloverWebhookSignature({ rawBody: rawBodyString, signatureHeader })) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature.' });
    }

    if (config.isProduction && !cloverConfig.webhookSecret) {
      console.error('Clover webhook received without CLOVER_WEBHOOK_SECRET configured in production.');
    }

    const payload = Buffer.isBuffer(rawBody)
      ? JSON.parse(rawBodyString)
      : typeof rawBody === 'string'
        ? JSON.parse(rawBodyString)
        : rawBody;

    const checkoutSessionId = String(payload?.data || payload?.Data || '').trim();
    const cloverPaymentId = String(payload?.id || payload?.Id || '').trim();
    const normalizedStatus = normalizeHostedCheckoutWebhookStatus(payload);

    if (!checkoutSessionId) {
      return res.status(400).json({ success: false, message: 'Missing checkout session ID in webhook payload.' });
    }

    const payment = await Payment.findOne({ paymentId: checkoutSessionId, provider: 'clover' });
    let order = await Order.findOne({ gatewayOrderId: checkoutSessionId, paymentProvider: 'clover' });
    if (!order && payment?.orderId) order = await Order.findById(payment.orderId);
    if (!order) {
      const bookingResult = await tryFinalizeBookingDepositFromWebhook(checkoutSessionId, cloverPaymentId);
      if (bookingResult) {
        return res.json({ success: true, status: normalizedStatus, type: 'booking_deposit' });
      }
      return res.status(404).json({ success: false, message: 'Order not found for webhook checkout session.' });
    }

    if (payment) {
      payment.status = normalizedStatus;
      payment.transactionId = cloverPaymentId || payment.transactionId;
      payment.metadata = { ...payment.metadata, webhook: payload };
      payment.lastAttemptAt = new Date();
      await payment.save();
    }

    if (normalizedStatus === 'paid') {
      if (payment?.metadata?.kind === 'order_change') {
        await commitPendingOrderChange(order, payment);
      } else {
        await finalizePaidOrder({ order, paymentRecord: payment, cloverPaymentId, req });
      }
    } else if (normalizedStatus === 'failed') {
      if (payment?.metadata?.kind !== 'order_change') order.paymentStatus = 'failed';
      order.timeline = [
        ...(order.timeline || []),
        { label: payment?.metadata?.kind === 'order_change' ? 'Additional payment declined; order unchanged' : 'Clover payment failed', at: new Date() },
      ];
      if (payment?.metadata?.kind === 'order_change') order.pendingChange = null;
      await order.save();
      if (payment?.metadata?.kind === 'order_change') {
        await sendOrderEventEmails(order, { kind: 'payment_failed', amount: Number(payment.amount || 0) / 100, reason: 'Clover declined the card.' });
      }
    }

    return res.json({ success: true, status: normalizedStatus });
  } catch (error) {
    console.error('Clover webhook processing failed:', error?.stack || error);
    return res.status(500).json({ success: false, message: 'Webhook processing failed.' });
  }
};

export const getPaymentStatusHandler = async (req, res) => {
  try {
    const paymentId = String(req.params.paymentId || '').trim();
    if (!paymentId) {
      return res.status(400).json(formatError({ message: 'paymentId is required.', code: 'MISSING_PAYMENT_ID' }));
    }

    const payment = await Payment.findOne({ paymentId, provider: 'clover' });
    if (!payment) {
      return res.status(404).json(formatError({ message: 'Payment record not found.', code: 'PAYMENT_NOT_FOUND' }));
    }

    const order = await Order.findById(payment.orderId);
    return res.json({
      success: order?.paymentStatus === 'paid',
      status: order?.paymentStatus || payment.status,
      transactionId: payment.transactionId,
      amount: payment.amount,
      currency: payment.currency,
      orderId: payment.orderId,
    });
  } catch (error) {
    console.error('Clover payment status check failed:', error?.stack || error);
    return res.status(500).json(formatError(error));
  }
};
