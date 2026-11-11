import { Collection } from '../models/Collection.js';
import { Subcollection } from '../models/Subcollection.js';
import { Product } from '../models/Product.js';
import { StoreSettings } from '../models/StoreSettings.js';
import { referenceId } from '../utils/collectionMemberships.js';

export const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
// Reviewed existing catalog items. Ordinary gift suggestions, flowers and warm
// clothing alone do not establish seasonal intent. Future placements are manual.
export const seasonalProductAssignments = [
  { name: "America She's Beautiful", season: 'Summer' },
  { name: 'Autumn Cowgirl', season: 'Fall' },
  { name: 'Boo-Jee Boa', season: 'Fall' },
  { name: 'Mischief Witch and Her Cat- Blinged Out', season: 'Fall' },
  { name: 'SNOW DIVA T-shirt', season: 'Winter' },
];

export const ensureSeasonalCatalog = async () => {
  const settings = await StoreSettings.findOne({ key: 'store' });
  if (settings?.seasonalAssignmentsInitialized) return;
  const collection = await Collection.findOneAndUpdate(
    { slug: 'seasonal' },
    { $setOnInsert: { name: 'Seasonal', slug: 'seasonal', isSystem: false,
      description: 'Designs for Spring, Summer, Fall, and Winter.', showWhenEmpty: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const subs = new Map();
  for (const [sortOrder, name] of seasons.entries()) {
    const sub = await Subcollection.findOneAndUpdate(
      { collectionId: collection._id, slug: name.toLowerCase() },
      { $setOnInsert: { collectionId: collection._id, name, slug: name.toLowerCase(), sortOrder } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    subs.set(name, sub);
  }
  // Resume safely after interruption, but never reassign products after the
  // initial migration has completed and the owner starts editing placements.
  for (const assignment of seasonalProductAssignments) {
    const sub = subs.get(assignment.season);
    const products = await Product.find({ name: assignment.name });
    for (const product of products) {
      if (referenceId(product.collectionId) === String(collection._id)
        && referenceId(product.subCollectionId) === String(sub._id)) continue;
      await Product.updateOne({ _id: product._id }, { $addToSet: { additionalCollections: {
        collectionId: collection._id, subCollectionId: sub._id,
      } } });
    }
  }
  await StoreSettings.updateOne({ key: 'store' },
    { $set: { seasonalAssignmentsInitialized: true } }, { upsert: true });
};
