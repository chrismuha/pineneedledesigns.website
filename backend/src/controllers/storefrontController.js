import {
  getStorefrontCatalog,
  getStorefrontCollectionBySlug,
  getStorefrontProductsBySlug,
  getStorefrontSubcollectionsBySlug,
} from '../services/storefrontCatalog.js';

export const getCatalog = async (_req, res) => {
  const catalog = await getStorefrontCatalog();
  res.json(catalog);
};

export const getCollectionBySlug = async (req, res) => {
  const collection = await getStorefrontCollectionBySlug(req.params.slug);

  if (!collection) {
    return res.status(404).json({ error: 'Collection not found.' });
  }

  return res.json(collection);
};

export const getSubcollectionsBySlug = async (req, res) => {
  const subcollections = await getStorefrontSubcollectionsBySlug(req.params.slug);

  if (!subcollections) {
    return res.status(404).json({ error: 'Collection not found.' });
  }

  return res.json(subcollections);
};

export const getProductsBySlug = async (req, res) => {
  const products = await getStorefrontProductsBySlug(
    req.params.slug,
    req.query.subCollectionId || null,
  );

  if (!products) {
    return res.status(404).json({ error: 'Collection not found.' });
  }

  return res.json(products);
};
