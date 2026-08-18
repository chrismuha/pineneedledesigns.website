import { connectDatabase } from '../config/database.js';
import { Order } from '../models/Order.js';
import { persistCapturedOrder } from '../services/orderPersistence.js';
import mongoose from 'mongoose';

const run = async () => {
  await connectDatabase();

  const indexes = await Order.collection.indexes();
  const paypalIndex = indexes.find((index) => index.name === 'paypalOrderId_1');
  const filter = paypalIndex?.partialFilterExpression?.paypalOrderId;
  if (!paypalIndex?.unique || filter?.$gt !== '') {
    throw new Error('paypalOrderId_1 is not a partial unique index on non-empty PayPal IDs.');
  }

  const historicalPaypal = await Order.countDocuments({ paypalOrderId: { $gt: '' } });
  const first = await persistCapturedOrder({
    paymentProvider: 'clover',
    paymentStatus: 'pending',
    gatewayOrderId: `clover-verify-${Date.now()}-a`,
    customer: { type: 'Individual', email: 'verify-a@example.com', phone: '+15555550100' },
    billingAddress: { name: 'Verify A' },
    shippingAddress: { name: 'Verify A' },
    items: [],
    lineItems: [],
    inventoryLines: [],
    summary: { subtotal: 1, finalTotal: 1 },
  });
  const second = await persistCapturedOrder({
    paymentProvider: 'clover',
    paymentStatus: 'pending',
    gatewayOrderId: `clover-verify-${Date.now()}-b`,
    customer: { type: 'Individual', email: 'verify-b@example.com', phone: '+15555550101' },
    billingAddress: { name: 'Verify B' },
    shippingAddress: { name: 'Verify B' },
    items: [],
    lineItems: [],
    inventoryLines: [],
    summary: { subtotal: 2, finalTotal: 2 },
  });

  const createdWithoutPaypalId = !first.paypalOrderId && !second.paypalOrderId;
  const distinctIds = String(first._id) !== String(second._id);
  const historicalAfter = await Order.countDocuments({ paypalOrderId: { $gt: '' } });

  await Order.deleteMany({ _id: { $in: [first._id, second._id] } });

  console.log('paypalOrderId_1 partial unique:', true);
  console.log('created two Clover orders:', distinctIds);
  console.log('Clover orders omitted paypalOrderId:', createdWithoutPaypalId);
  console.log('historical PayPal IDs unchanged:', historicalPaypal === historicalAfter);

  if (!distinctIds || !createdWithoutPaypalId || historicalPaypal !== historicalAfter) {
    throw new Error('Clover order uniqueness verification failed.');
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exitCode = 1;
});
