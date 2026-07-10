import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

const buildOrderFilter = (query) => {
  const status = String(query?.status || 'all').toLowerCase();
  if (status === 'open' || status === 'closed') {
    return { status };
  }
  return {};
};

export const listOrders = async (req, res) => {
  const orders = await Order.find(buildOrderFilter(req.query))
    .sort({ createdAt: -1 })
    .lean();

  res.json(orders);
};

export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  res.json(order);
};

export const updateOrderStatus = async (req, res) => {
  
  const status = String(req.body?.status || '').toLowerCase();

  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Status must be open or closed.' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.status === status) {
    return res.json(order);
  }

  order.status = status;
  order.timeline.push({
    label: status === 'closed' ? 'Order closed' : 'Order reopened',
    at: new Date(),
  });

  await order.save();
  res.json(order);
};

export const resolveOrder = async (req, res) => {
  const resolution = String(req.body?.resolution || '').toLowerCase();
  if (!['canceled', 'refunded'].includes(resolution)) {
    return res.status(400).json({ error: 'Resolution must be canceled or refunded.' });
  }

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, inventoryReturnedAt: null, resolution: 'active' },
    {
      $set: { resolution, inventoryReturnedAt: new Date() },
      $push: { timeline: { label: resolution === 'refunded' ? 'Order refunded; inventory returned' : 'Order canceled; inventory returned', at: new Date() } },
    },
    { new: true },
  );

  if (!order) {
    const existing = await Order.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Order not found.' });
    return res.status(409).json({ error: 'Inventory has already been returned for this order.' });
  }

  const lines = Array.isArray(order.inventoryLines) ? order.inventoryLines : [];
  if (lines.length) {
    await Product.bulkWrite(lines.map((line) => ({
      updateOne: {
        filter: { _id: line.productId },
        update: { $inc: { quantity: Number(line.quantity || 0) }, $set: { outOfStock: false } },
      },
    })));
  }

  order.status = 'closed';
  await order.save();
  res.json(order);
};
