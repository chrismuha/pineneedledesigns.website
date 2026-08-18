import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  address1: { type: String, default: '' },
  address2: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  county: { type: String, default: '' },
  zip: { type: String, default: '' },
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  label: { type: String, required: true },
  at: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    unique: true,
    sparse: true,
  },
  paypalOrderId: {
    type: String,
    trim: true,
  },
  gatewayOrderId: {
    type: String,
    trim: true,
  },
  paymentProvider: {
    type: String,
    enum: ['paypal', 'clover', 'manual'],
    default: 'clover',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'cancelled'],
    default: 'pending',
  },
  idempotencyKey: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
  },
  customer: {
    type: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  billingAddress: {
    type: addressSchema,
    default: () => ({}),
  },
  shippingAddress: {
    type: addressSchema,
    default: () => ({}),
  },
  discountCode: { type: String, default: '' },
  items: { type: [mongoose.Schema.Types.Mixed], default: [] },
  lineItems: { type: [mongoose.Schema.Types.Mixed], default: [] },
  inventoryLines: { type: [mongoose.Schema.Types.Mixed], default: [] },
  resolution: {
    type: String,
    enum: ['active', 'canceled', 'refunded'],
    default: 'active',
  },
  inventoryReturnedAt: { type: Date, default: null },
  summary: {
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountedTotal: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    finalTotal: { type: Number, default: 0 },
  },
  tax: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  timeline: {
    type: [timelineSchema],
    default: () => [{ label: 'Order submitted', at: new Date() }],
  },
}, {
  timestamps: true,
  autoIndex: false,
});

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: -1 });
orderSchema.index({ idempotencyKey: 1 }, {
  unique: true,
  sparse: true,
  partialFilterExpression: { idempotencyKey: { $type: 'string', $gt: '' } },
});
orderSchema.index({ paypalOrderId: 1 }, {
  unique: true,
  name: 'paypalOrderId_1',
  partialFilterExpression: { paypalOrderId: { $type: 'string', $gt: '' } },
});
orderSchema.index({ gatewayOrderId: 1 }, {
  unique: true,
  name: 'gatewayOrderId_1',
  partialFilterExpression: { gatewayOrderId: { $type: 'string', $gt: '' } },
});

export const Order = mongoose.model('Order', orderSchema);
