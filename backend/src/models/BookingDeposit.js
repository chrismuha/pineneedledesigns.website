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
<<<<<<< HEAD
    enum: ['fitting', 'brides'],
  },
  customer: {
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
=======
    trim: true,
  },
  customer: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
>>>>>>> origin/main
  },
  amountCents: {
    type: Number,
    required: true,
<<<<<<< HEAD
    min: 0,
=======
    min: 1,
>>>>>>> origin/main
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  cloverPaymentId: {
    type: String,
<<<<<<< HEAD
    trim: true,
    default: '',
=======
    default: '',
    trim: true,
>>>>>>> origin/main
  },
  finalizedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

<<<<<<< HEAD
bookingDepositSchema.index({ status: 1, createdAt: -1 });

=======
>>>>>>> origin/main
export const BookingDeposit = mongoose.model('BookingDeposit', bookingDepositSchema);
