import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  provider: {
    type: String,
    required: true,
    enum: ['paypal', 'clover', 'manual'],
    default: 'clover',
  },
  paymentId: {
    type: String,
    required: true,
    trim: true,
  },
  transactionId: {
    type: String,
    trim: true,
    default: '',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
  },
  idempotencyKey: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastAttemptAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ paymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ provider: 1, status: 1 });
paymentSchema.index({ provider: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const Payment = mongoose.model('Payment', paymentSchema);
