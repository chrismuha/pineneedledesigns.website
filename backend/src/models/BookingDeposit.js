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
    trim: true,
  },
  customer: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  amountCents: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  cloverPaymentId: {
    type: String,
    default: '',
    trim: true,
  },
  finalizedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

export const BookingDeposit = mongoose.model('BookingDeposit', bookingDepositSchema);
