import { Collection } from '../models/Collection.js';
import { StoreSettings } from '../models/StoreSettings.js';

export const ensureClearanceCatalog = async () => {
  const settings = await StoreSettings.findOne({ key: 'store' });
  if (settings?.clearanceCollectionInitialized) return;

  // Reuse an existing collection without replacing its settings or contents.
  await Collection.findOneAndUpdate(
    { slug: 'clearance' },
    { $setOnInsert: { name: 'Clearance', slug: 'clearance', isSystem: false,
      description: 'Shop our clearance designs.', showWhenEmpty: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  // Run once so later owner changes, including deletion, remain in effect.
  await StoreSettings.updateOne({ key: 'store' },
    { $set: { clearanceCollectionInitialized: true } }, { upsert: true });
};
