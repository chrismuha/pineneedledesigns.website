import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { Subcollection } from '../models/Subcollection.js';
import { StoreSettings } from '../models/StoreSettings.js';

export const initializeWebsiteVisibility = async () => {
  const settings = await StoreSettings.findOne({ key: 'store' });
  if (settings?.websiteVisibilityInitialized) return;
  // The initial rollout starts every existing item, collection and sub-collection
  // enabled as requested. Subsequent starts must preserve checkbox choices.
  for (const Model of [Product, Collection, Subcollection]) {
    await Model.updateMany({}, { $set: { hidden: false } });
  }
  await StoreSettings.updateOne({ key: 'store' },
    { $set: { websiteVisibilityInitialized: true } }, { upsert: true });
};
