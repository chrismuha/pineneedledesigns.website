import mongoose from 'mongoose';

const storeSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'store', unique: true },
  freeShippingEnabled: { type: Boolean, default: true },
  freeShippingMinimum: { type: Number, default: 28, min: 0 },
  fallbackShippingCost: { type: Number, default: 5, min: 0 },
  toastTimeoutSeconds: { type: Number, default: 6, min: 2, max: 30 },
  updateNotificationDelayMinutes: { type: Number, default: 0, enum: [0, 5, 15, 30, 60, 240, 1440] },
}, { timestamps: true });

export const StoreSettings = mongoose.model('StoreSettings', storeSettingsSchema);
