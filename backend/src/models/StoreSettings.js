import mongoose from 'mongoose';

const storeSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'store', unique: true },
  freeShippingEnabled: { type: Boolean, default: true },
  freeShippingMinimum: { type: Number, default: 28, min: 0 },
  fallbackShippingCost: { type: Number, default: 5, min: 0 },
}, { timestamps: true });

export const StoreSettings = mongoose.model('StoreSettings', storeSettingsSchema);
