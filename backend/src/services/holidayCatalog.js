import { Collection } from '../models/Collection.js';
import { Subcollection } from '../models/Subcollection.js';
import { Product } from '../models/Product.js';
import { StoreSettings } from '../models/StoreSettings.js';
import { referenceId } from '../utils/collectionMemberships.js';
import { slugify } from '../utils/slug.js';

export const holidays = [
  'Christmas',
  'Easter',
  'Halloween',
  'Independence Day',
  "New Year's Day",
  "St. Patrick's Day",
  'Thanksgiving',
  "Valentine's Day",
];

// Only designs explicitly described as holiday items are assigned initially.
// Winter designs and general gift suggestions remain separate from Christmas.
export const holidayProductAssignments = [
  { name: 'Boo-Jee Boa', holiday: 'Halloween' },
  { name: 'Mischief Witch and Her Cat- Blinged Out', holiday: 'Halloween' },
];

export const ensureHolidayCatalog = async () => {
  const settings = await StoreSettings.findOne({ key: 'store' });
  if (settings?.holidayAssignmentsInitialized) return;
  const collection = await Collection.findOneAndUpdate(
    { slug: 'holiday' },
    { $setOnInsert: { name: 'Holiday', slug: 'holiday', isSystem: false,
      description: 'Find designs for your favorite holidays.', showWhenEmpty: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const subs = new Map();
  for (const [sortOrder, name] of holidays.entries()) {
    const slug = slugify(name);
    const sub = await Subcollection.findOneAndUpdate(
      { collectionId: collection._id, slug },
      { $setOnInsert: { collectionId: collection._id, name, slug, sortOrder } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    subs.set(name, sub);
  }
  for (const assignment of holidayProductAssignments) {
    const sub = subs.get(assignment.holiday);
    const products = await Product.find({ name: assignment.name });
    for (const product of products) {
      if (referenceId(product.collectionId) === String(collection._id)
        && referenceId(product.subCollectionId) === String(sub._id)) continue;
      await Product.updateOne({ _id: product._id }, { $addToSet: { additionalCollections: {
        collectionId: collection._id, subCollectionId: sub._id,
      } } });
    }
  }
  // Preserve later dashboard changes, including removed holiday assignments.
  await StoreSettings.updateOne({ key: 'store' },
    { $set: { holidayAssignmentsInitialized: true } }, { upsert: true });
};
