import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { getNextOrderNumber } from '../models/OrderCounter.js';

export const deductCapturedInventory = async (inventoryLines = []) => {
  for (const line of inventoryLines) {
    const product = await Product.findOneAndUpdate(
      { _id: line.productId, quantity: { $gte: line.quantity } },
      { $inc: { quantity: -line.quantity } },
      { new: true },
    );
    if (!product) {
      console.error(`Inventory deduction failed for product ${line.productId}.`);
      continue;
    }
    if (product.quantity === 0 && !product.outOfStock) {
      product.outOfStock = true;
      await product.save();
    }
  }
};

const normalizeSummary = (summary = {}) => {
  const subtotal = Number(summary.subtotal || 0);
  const discount = Number(summary.discount || 0);
  const tax = Number(summary.tax || 0);
  const shipping = Number(summary.shipping || 0);
  const discountedTotal = summary.discountedTotal !== undefined
    ? Number(summary.discountedTotal)
    : Math.max(0, subtotal - discount);
  const finalTotal = summary.finalTotal !== undefined
    ? Number(summary.finalTotal)
    : discountedTotal + shipping + tax;

  return {
    subtotal,
    discount,
    discountedTotal,
    shipping,
    tax,
    finalTotal,
  };
};

const nonEmpty = (value) => {
  const normalized = String(value || '').trim();
  return normalized || undefined;
};

export const persistCapturedOrder = async ({
  paypalOrderId,
  gatewayOrderId,
  paymentProvider = 'clover',
  paymentStatus = 'paid',
  idempotencyKey,
  customer,
  billingAddress,
  shippingAddress,
  discountCode,
  items,
  lineItems,
  inventoryLines,
  summary,
  tax,
}) => {
  const payload = {
    customer: customer || {},
    billingAddress: billingAddress || {},
    shippingAddress: shippingAddress || {},
    discountCode: discountCode || '',
    items: Array.isArray(items) ? items : [],
    lineItems: Array.isArray(lineItems) ? lineItems : [],
    inventoryLines: Array.isArray(inventoryLines) ? inventoryLines : [],
    summary: normalizeSummary(summary),
    tax: tax || {},
  };

  const nextPaypalOrderId = nonEmpty(paypalOrderId);
  const nextGatewayOrderId = nonEmpty(gatewayOrderId);
  const nextIdempotencyKey = nonEmpty(idempotencyKey);

  const query = [];
  if (nextPaypalOrderId) query.push({ paypalOrderId: nextPaypalOrderId });
  if (nextGatewayOrderId) query.push({ gatewayOrderId: nextGatewayOrderId });
  if (nextIdempotencyKey) query.push({ idempotencyKey: nextIdempotencyKey });

  const existing = query.length ? await Order.findOne({ $or: query }) : null;
  if (existing) {
    existing.set(payload);
    if (nextGatewayOrderId) existing.gatewayOrderId = nextGatewayOrderId;
    if (paymentProvider) existing.paymentProvider = paymentProvider;
    if (paymentStatus) existing.paymentStatus = paymentStatus;
    if (nextIdempotencyKey) existing.idempotencyKey = nextIdempotencyKey;
    if (nextPaypalOrderId) existing.paypalOrderId = nextPaypalOrderId;
    await existing.save();
    return existing;
  }

  const orderNumber = await getNextOrderNumber();
  const created = {
    orderNumber,
    paymentProvider,
    paymentStatus,
    status: 'open',
    timeline: [{ label: 'Order submitted', at: new Date() }],
    ...payload,
  };
  if (nextPaypalOrderId) created.paypalOrderId = nextPaypalOrderId;
  if (nextGatewayOrderId) created.gatewayOrderId = nextGatewayOrderId;
  if (nextIdempotencyKey) created.idempotencyKey = nextIdempotencyKey;
  return Order.create(created);
};
