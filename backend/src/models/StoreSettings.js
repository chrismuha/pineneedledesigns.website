import mongoose from 'mongoose';

const storeSettingsSchema = new mongoose.Schema({
  newArrivals: {
    type: new mongoose.Schema({
      enabled: { type: Boolean, default: true },
      mode: { type: String, enum: ['automatic', 'mixed', 'manual'], default: 'automatic' },
      latestCount: { type: Number, min: 0, max: 10, validate: Number.isInteger, default: 10 },
      customCount: { type: Number, min: 0, max: 10, validate: Number.isInteger, default: 0 },
      productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    }, { _id: false }),
    default: () => ({}),
  },
  key: { type: String, default: 'store', unique: true },
  freeShippingEnabled: { type: Boolean, default: true },
  freeShippingMinimum: { type: Number, default: 28, min: 0 },
  fallbackShippingCost: { type: Number, default: 5, min: 0 },
  toastTimeoutSeconds: { type: Number, default: 6, min: 2, max: 30 },
  updateNotificationDelayMinutes: { type: Number, default: 0, enum: [0, 5, 15, 30, 60, 240, 1440] },
}, { timestamps: true });

export const StoreSettings = mongoose.model('StoreSettings', storeSettingsSchema);
