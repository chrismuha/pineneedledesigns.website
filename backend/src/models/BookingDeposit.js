import mongoose from 'mongoose';

const bookingDepositSchema = new mongoose.Schema({
  checkoutSessionId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  service: {
    type: String,
    required: true,
    enum: ['fitting', 'brides'],
    trim: true,
  },
  customer: {
    name: { type: String, required: true, trim: true, default: '' },
    email: { type: String, required: true, trim: true, default: '' },
    phone: { type: String, required: true, trim: true, default: '' },
  },
  amountCents: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  cloverPaymentId: {
    type: String,
    trim: true,
    default: '',
  },
  finalizedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

bookingDepositSchema.index({ status: 1, createdAt: -1 });

export const BookingDeposit = mongoose.model('BookingDeposit', bookingDepositSchema);
