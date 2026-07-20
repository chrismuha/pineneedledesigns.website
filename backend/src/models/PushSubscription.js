import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: { type: String, default: '' },
  lastSeenAt: { type: Date, default: Date.now },
  preferences: {
    orders: { type: Boolean, default: true },
    bookings: { type: Boolean, default: true },
  },
}, { timestamps: true });

export const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
