import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { StoreSettings } from '../models/StoreSettings.js';
import { DISCOUNT_RULES } from '../constants/index.js';
import { config } from '../config/index.js';
import { createHostedCheckoutSession, refundCloverPayment } from '../services/cloverService.js';
import { sendOrderEventEmails } from '../services/orderEmails.js';
import { sendPushNotification } from '../services/pushNotifications.js';

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));
const orderLabel = (order) => order.orderNumber ? `#${order.orderNumber}` : String(order._id);
const buildOrderFilter = (query) => ['open', 'closed'].includes(String(query?.status || '').toLowerCase())
  ? { status: String(query.status).toLowerCase() } : {};

const notifyEvent = async (order, details) => Promise.allSettled([
  sendOrderEventEmails(order, details),
  sendPushNotification({
    title: `${details.kind === 'canceled' ? 'Canceled' : 'Updated'} order ${orderLabel(order)}`,
    body: details.kind === 'canceled' ? `Refund submitted: $${Number(details.amount || 0).toFixed(2)}` : details.reason || 'The customer was notified.',
    url: `/dashboard/orders?order=${order._id}`,
    tag: `order-event-${order._id}-${Date.now()}`,
    type: 'order',
  }),
]);

const discountFor = (subtotal, code) => {
  const rule = DISCOUNT_RULES[String(code || '').trim().toUpperCase()];
  if (!rule) return 0;
  return roundMoney(rule.type === 'fixed' ? Math.min(rule.value, subtotal) : subtotal * rule.value / 100);
};

const buildProposedOrder = async (order, requestedItems) => {
  if (!Array.isArray(requestedItems) || !requestedItems.length) throw Object.assign(new Error('An order must contain at least one item. Use Cancel Order & Refund to cancel it.'), { status: 400 });
  const normalized = requestedItems.map((item) => ({
    productId: String(item.productId || item.id || '').trim(),
    quantity: Math.floor(Number(item.quantity || 0)),
  }));
  if (normalized.some((item) => !item.productId || item.quantity < 1)) throw Object.assign(new Error('Every item must have a product and a positive whole-number quantity.'), { status: 400 });

  const combined = new Map();
  normalized.forEach((item) => combined.set(item.productId, (combined.get(item.productId) || 0) + item.quantity));
  const products = await Product.find({ _id: { $in: [...combined.keys()] } });
  if (products.length !== combined.size) throw Object.assign(new Error('One or more selected items are no longer available.'), { status: 409 });
  const oldQuantities = new Map((order.inventoryLines || []).map((line) => [String(line.productId), Number(line.quantity || 0)]));
  for (const product of products) {
    const additional = combined.get(String(product._id)) - (oldQuantities.get(String(product._id)) || 0);
    if (additional > Number(product.quantity || 0)) throw Object.assign(new Error(`${product.name} has only ${Number(product.quantity || 0)} additional available.`), { status: 409 });
  }

  const inventoryLines = products.map((product) => ({ productId: product._id, productName: product.name, quantity: combined.get(String(product._id)), shippingCost: Number(product.shippingCost || 0) }));
  const subtotal = roundMoney(products.reduce((sum, product) => sum + Number(product.price || 0) * combined.get(String(product._id)), 0));
  const discount = discountFor(subtotal, order.discountCode);
  const discountedTotal = roundMoney(Math.max(0, subtotal - discount));
  const settings = await StoreSettings.findOne({ key: 'store' }).lean() || {};
  const freeShipping = Boolean(settings.freeShippingEnabled) && discountedTotal >= Number(settings.freeShippingMinimum || 0);
  const itemShipping = inventoryLines.reduce((sum, line) => sum + Number(line.shippingCost || 0) * line.quantity, 0);
  const shipping = roundMoney(freeShipping ? 0 : itemShipping || Number(settings.fallbackShippingCost ?? order.summary?.shipping ?? 5));
  const previousDiscounted = Number(order.summary?.discountedTotal || 0);
  const effectiveTaxRate = previousDiscounted > 0 ? Number(order.summary?.tax || 0) / previousDiscounted : 0;
  const tax = roundMoney(discountedTotal * effectiveTaxRate);
  const finalTotal = roundMoney(discountedTotal + shipping + tax);
  const lineItems = products.map((product) => {
    const quantity = combined.get(String(product._id));
    const lineSubtotal = roundMoney(Number(product.price || 0) * quantity);
    const discountAmount = subtotal ? roundMoney(discount * lineSubtotal / subtotal) : 0;
    const taxable = Math.max(0, lineSubtotal - discountAmount);
    const taxAmount = roundMoney(taxable * effectiveTaxRate);
    return { id: String(product._id), title: product.name, quantity, subtotal: lineSubtotal, discountAmount, discountPercentDisplay: subtotal ? `${roundMoney(discount / subtotal * 100)}%` : '0%', taxAmount, taxRateDisplay: `${roundMoney(effectiveTaxRate * 100)}%`, lineTotal: roundMoney(taxable + taxAmount) };
  });
  return {
    items: products.map((product) => ({ id: String(product._id), title: product.name, quantity: combined.get(String(product._id)), price: Number(product.price || 0) })),
    lineItems, inventoryLines, summary: { subtotal, discount, discountedTotal, shipping, tax, finalTotal },
  };
};

export const applyInventoryChange = async (oldLines = [], newLines = []) => {
  const oldMap = new Map(oldLines.map((line) => [String(line.productId), Number(line.quantity || 0)]));
  const newMap = new Map(newLines.map((line) => [String(line.productId), Number(line.quantity || 0)]));
  const ids = new Set([...oldMap.keys(), ...newMap.keys()]);
  const applied = [];
  try {
    for (const id of ids) {
      const delta = (newMap.get(id) || 0) - (oldMap.get(id) || 0);
      if (!delta) continue;
      const product = delta > 0
        ? await Product.findOneAndUpdate({ _id: id, quantity: { $gte: delta } }, { $inc: { quantity: -delta } }, { new: true })
        : await Product.findByIdAndUpdate(id, { $inc: { quantity: -delta }, $set: { outOfStock: false } }, { new: true });
      if (!product) throw new Error('Inventory changed while this order was being updated.');
      if (product.quantity === 0) await Product.updateOne({ _id: id }, { $set: { outOfStock: true } });
      applied.push({ id, delta });
    }
  } catch (error) {
    for (const entry of applied.reverse()) await Product.updateOne({ _id: entry.id }, { $inc: { quantity: entry.delta }, $set: { outOfStock: false } });
    throw Object.assign(error, { status: 409 });
  }
};

export const commitPendingOrderChange = async (order, payment) => {
  const change = order.pendingChange;
  if (!change || String(change.paymentId || '') !== String(payment?.paymentId || '')) return order;
  try {
    await applyInventoryChange(order.inventoryLines || [], change.proposed.inventoryLines || []);
  } catch (inventoryError) {
    const amountCents = Number(payment?.amount || Math.round(Number(change.amount || 0) * 100));
    const refund = await refundCloverPayment({ paymentId: payment.transactionId, amountCents, idempotencyKey: `failed-order-change-${order._id}-${payment._id}` });
    payment.status = 'refunded';
    payment.metadata = { ...payment.metadata, refundedAmountCents: amountCents, refunds: [...(payment.metadata?.refunds || []), refund], amendmentFailure: inventoryError.message };
    await payment.save();
    order.pendingChange = null;
    order.timeline.push({ label: `Additional payment refunded; order unchanged because inventory became unavailable`, at: new Date() });
    await order.save();
    await notifyEvent(order, { kind: 'payment_failed', amount: change.amount, reason: 'The item became unavailable, so the additional payment was refunded and the original order was not changed.' });
    return order;
  }
  order.items = change.proposed.items;
  order.lineItems = change.proposed.lineItems;
  order.inventoryLines = change.proposed.inventoryLines;
  order.summary = change.proposed.summary;
  order.pendingChange = null;
  order.timeline.push({ label: `Order updated; additional payment of $${Number(change.amount || 0).toFixed(2)} received`, at: new Date() });
  await order.save();
  await notifyEvent(order, { kind: 'changed', amount: change.amount });
  return order;
};

const refundAcrossPayments = async (order, amountCents) => {
  let remaining = Math.round(amountCents);
  const payments = await Payment.find({ orderId: order._id, status: { $in: ['paid', 'refunded'] } }).sort({ createdAt: -1 });
  for (const payment of payments) {
    if (remaining <= 0) break;
    const alreadyRefunded = Number(payment.metadata?.refundedAmountCents || 0);
    const amount = Math.min(remaining, Math.max(0, Number(payment.amount || 0) - alreadyRefunded));
    if (!amount) continue;
    if (!payment.transactionId) throw Object.assign(new Error('The Clover transaction ID is missing; the refund was not attempted.'), { status: 409 });
    const result = await refundCloverPayment({ paymentId: payment.transactionId, amountCents: amount, idempotencyKey: `order-${order._id}-payment-${payment._id}-refunded-${alreadyRefunded + amount}` });
    payment.metadata = { ...payment.metadata, refundedAmountCents: alreadyRefunded + amount, refunds: [...(payment.metadata?.refunds || []), result] };
    if (alreadyRefunded + amount >= payment.amount) payment.status = 'refunded';
    await payment.save();
    remaining -= amount;
  }
  if (remaining > 0) throw Object.assign(new Error('Clover payment records do not contain enough refundable funds.'), { status: 409 });
};

export const listOrders = async (req, res) => res.json(await Order.find(buildOrderFilter(req.query)).sort({ createdAt: -1 }).lean());
export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  return order ? res.json(order) : res.status(404).json({ error: 'Order not found.' });
};

export const changeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.resolution !== 'active') return res.status(409).json({ error: 'Canceled or refunded orders cannot be changed.' });
    if (order.pendingChange) return res.status(409).json({ error: 'This order already has a change awaiting payment.' });
    const proposed = await buildProposedOrder(order, req.body?.items);
    const delta = roundMoney(proposed.summary.finalTotal - Number(order.summary?.finalTotal || 0));
    if (delta > 0) {
      const baseUrl = String(config.appBaseUrl || '').replace(/\/$/, '');
      const nameParts = String(order.billingAddress?.name || 'Customer').trim().split(/\s+/);
      const session = await createHostedCheckoutSession({
        lineItems: [{ name: `Additional amount for order ${orderLabel(order)}`, price: Math.round(delta * 100), unitQty: 1 }],
        customer: {
          firstName: nameParts[0] || 'Customer',
          lastName: nameParts.slice(1).join(' '),
          email: order.customer?.email || '',
          phoneNumber: String(order.customer?.phone || '').replace(/\D/g, '').slice(-10),
          address: {
            address1: order.billingAddress?.address1 || '', address2: order.billingAddress?.address2 || '',
            city: order.billingAddress?.city || '', state: order.billingAddress?.state || '',
            zip: order.billingAddress?.zip || '', country: 'US',
          },
        },
        redirectUrls: baseUrl.startsWith('https://') ? { success: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`, failure: `${baseUrl}/order-failure?session_id={CHECKOUT_SESSION_ID}`, cancel: `${baseUrl}/order-cancelled?session_id={CHECKOUT_SESSION_ID}` } : undefined,
        idempotencyKey: `order-change-${order._id}-${crypto.randomUUID()}`,
      });
      const paymentId = String(session?.checkoutSessionId || '');
      const paymentUrl = String(session?.href || '');
      if (!paymentId || !paymentUrl) throw new Error('Clover did not return a payment link.');
      await Payment.create({ orderId: order._id, provider: 'clover', paymentId, amount: Math.round(delta * 100), currency: 'USD', status: 'pending', metadata: { kind: 'order_change', checkoutSession: session } });
      order.pendingChange = { paymentId, amount: delta, proposed, createdAt: new Date() };
      order.timeline.push({ label: `Order change proposed; $${delta.toFixed(2)} payment requested`, at: new Date() });
      await order.save();
      await notifyEvent(order, { kind: 'payment_required', amount: delta, paymentUrl });
      return res.status(202).json({ order, paymentRequired: true, paymentUrl });
    }
    await applyInventoryChange(order.inventoryLines || [], proposed.inventoryLines || []);
    try {
      if (delta < 0) await refundAcrossPayments(order, Math.round(Math.abs(delta) * 100));
    } catch (error) {
      await applyInventoryChange(proposed.inventoryLines || [], order.inventoryLines || []);
      throw error;
    }
    order.items = proposed.items;
    order.lineItems = proposed.lineItems;
    order.inventoryLines = proposed.inventoryLines;
    order.summary = proposed.summary;
    order.timeline.push({ label: delta < 0 ? `Order updated; $${Math.abs(delta).toFixed(2)} refunded` : 'Order items updated', at: new Date() });
    await order.save();
    await notifyEvent(order, { kind: 'changed', amount: delta });
    return res.json({ order, paymentRequired: false, refunded: delta < 0 ? Math.abs(delta) : 0 });
  } catch (error) {
    console.error('Order change failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Order change failed.' });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.resolution !== 'active') return res.status(409).json({ error: 'This order has already been canceled or refunded.' });
    if (order.pendingChange) return res.status(409).json({ error: 'This order has an additional payment awaiting the customer. Wait for it to finish before canceling.' });
    const payments = await Payment.find({ orderId: order._id, status: { $in: ['paid', 'refunded'] } });
    const paidCents = payments.reduce((sum, payment) => sum + Math.max(0, Number(payment.amount || 0) - Number(payment.metadata?.refundedAmountCents || 0)), 0);
    await applyInventoryChange(order.inventoryLines || [], []);
    try {
      if (paidCents > 0) await refundAcrossPayments(order, paidCents);
    } catch (error) {
      await applyInventoryChange([], order.inventoryLines || []);
      throw error;
    }
    order.resolution = paidCents > 0 ? 'refunded' : 'canceled';
    order.inventoryReturnedAt = new Date();
    order.status = 'closed';
    order.paymentStatus = paidCents > 0 ? 'cancelled' : order.paymentStatus;
    order.pendingChange = null;
    order.timeline.push({ label: paidCents > 0 ? `Order canceled; $${(paidCents / 100).toFixed(2)} refunded and inventory returned` : 'Order canceled; inventory returned', at: new Date() });
    await order.save();
    await notifyEvent(order, { kind: 'canceled', amount: paidCents / 100 });
    return res.json(order);
  } catch (error) {
    console.error('Cancel and refund failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'The order was not canceled because the refund could not be completed.' });
  }
};

export const updateOrderStatus = async (req, res) => {
  const status = String(req.body?.status || '').toLowerCase();
  if (!['open', 'closed'].includes(status)) return res.status(400).json({ error: 'Status must be open or closed.' });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status !== status) {
    order.status = status;
    order.timeline.push({ label: status === 'closed' ? 'Order closed' : 'Order reopened', at: new Date() });
    await order.save();
  }
  return res.json(order);
};

export const resolveOrder = async (req, res) => {
  if (String(req.body?.resolution || '').toLowerCase() === 'refunded') return deleteOrder(req, res);
  return res.status(400).json({ error: 'Use Cancel Order & Refund so payment and inventory are handled together.' });
};
