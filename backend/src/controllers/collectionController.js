import { auditedRemoval, catalogTarget, removeUploadedMedia } from '../services/catalogAudit.js';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { Subcollection } from '../models/Subcollection.js';
import { createUniqueSlug } from '../utils/slug.js';
import { invalidateStorefrontCatalog } from '../services/storefrontCatalog.js';

export const listCollections = async (_req, res) => {
  const collections = await Collection.find().sort({ isSystem: 1, name: 1 }).lean();
  res.json(collections);
};

export const createCollection = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Collection name is required.' });
    }

    const maxSort = await Collection.findOne({ isSystem: false }).sort({ sortOrder: -1 }).select('sortOrder');
    const slug = await createUniqueSlug(Collection, name);

    const collection = await Collection.create({
      name,
      slug,
      sortOrder: (maxSort?.sortOrder ?? -1) + 1,
    });

    invalidateStorefrontCatalog('collection created');

    return res.status(201).json(collection);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'A collection with that name already exists.' });
    }
    console.error('Failed to create collection:', err);
    return res.status(500).json({ error: 'Failed to create collection.' });
  }
};

export const updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found.' });
    }

    if (collection.isSystem) {
      return res.status(400).json({ error: 'System collections cannot be renamed.' });
    }

    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Collection name is required.' });
    }

    collection.name = name;
    collection.slug = await createUniqueSlug(Collection, name, collection._id);
    await collection.save();
    invalidateStorefrontCatalog('collection updated');

    res.json(collection);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'A collection with that name already exists.' });
    }
    console.error('Failed to update collection:', err);
    return res.status(500).json({ error: 'Failed to update collection.' });
  }
};

export const deleteCollection = async (req, res) => {
  const collection = await Collection.findById(req.params.id);
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found.' });
  }

  if (collection.isSystem) {
    return res.status(400).json({ error: 'System collections cannot be deleted.' });
  }

  if (req.body?.confirmDelete !== true || req.body?.confirmName !== collection.name) {
    return res.status(400).json({
      error: 'Collection deletion must be confirmed with the exact collection name.',
    });
  }

  const products = await Product.find({ collectionId: collection._id }).select('name photos').lean();
  const subcollections = await Subcollection.find({ collectionId: collection._id }).select('name').lean();
  const productIds = products.map((product) => product._id);
  const uploadedPhotos = products
    .flatMap((product) => product.photos || [])
    .filter((photo) => String(photo).startsWith('/uploads/'));

  await auditedRemoval({
    targets: [catalogTarget('collections', collection),
      ...products.map((product) => catalogTarget('products', product)),
      ...subcollections.map((item) => catalogTarget('subcollections', item))],
    reason: 'Collection and its contents deleted',
  }, async () => {
    await Product.deleteMany({ _id: { $in: productIds } });
    await Subcollection.deleteMany({ collectionId: collection._id });
    await collection.deleteOne();
  });
  invalidateStorefrontCatalog('collection deleted');

  const remainingPhotoReferences = new Set(
    (await Product.find({ photos: { $in: uploadedPhotos } }).select('photos').lean())
      .flatMap((product) => product.photos || []),
  );
  await Promise.all(uploadedPhotos
    .filter((photo) => !remainingPhotoReferences.has(photo))
    .map((photo) => removeUploadedMedia(photo, 'Collection deleted').catch((error) => {
      if (error?.code !== 'ENOENT') {
        console.error(`Failed to remove deleted product photo ${photo}:`, error);
      }
    })));

  res.json({ success: true, deletedProducts: products.length });
};
