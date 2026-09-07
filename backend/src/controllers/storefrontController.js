import {
  getStorefrontCatalog,
  getStorefrontCollectionBySlug,
  getStorefrontProductsBySlug,
  getStorefrontSubcollectionsBySlug,
} from '../services/storefrontCatalog.js';

export const getCatalog = async (_req, res) => {
  const startedAt = Date.now();
  const catalog = await getStorefrontCatalog();
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  console.log(`[storefrontController] getCatalog in ${Date.now() - startedAt}ms`);
  res.json(catalog);
};

export const getCollectionBySlug = async (req, res) => {
  const startedAt = Date.now();
  const collection = await getStorefrontCollectionBySlug(req.params.slug);

  if (!collection) {
    return res.status(404).json({ error: 'Collection not found.' });
  }

  console.log(`[storefrontController] getCollectionBySlug(${req.params.slug}) in ${Date.now() - startedAt}ms`);
  return res.json(collection);
};

export const getSubcollectionsBySlug = async (req, res) => {
  const startedAt = Date.now();
  const subcollections = await getStorefrontSubcollectionsBySlug(req.params.slug);

  if (!subcollections) {
    return res.status(404).json({ error: 'Collection not found.' });
  }

  console.log(`[storefrontController] getSubcollectionsBySlug(${req.params.slug}) in ${Date.now() - startedAt}ms`);
  return res.json(subcollections);
};

export const getProductsBySlug = async (req, res) => {
  const startedAt = Date.now();
  const products = await getStorefrontProductsBySlug(
    req.params.slug,
    req.query.subCollectionId || null,
  );

  if (!products) {
    return res.status(404).json({ error: 'Collection not found.' });
  }

  console.log(`[storefrontController] getProductsBySlug(${req.params.slug}) in ${Date.now() - startedAt}ms`);
  return res.json(products);
};
