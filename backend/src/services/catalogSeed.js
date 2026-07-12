import { collectionPages } from '../../../frontend/src/data/siteData.js';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { Subcollection } from '../models/Subcollection.js';
import { slugify } from '../utils/slug.js';
import { sortSizeOptions } from '../utils/sizeOptions.js';

const freeShippingMeta = 'Free shipping';

const hasFreeShipping = (meta) => {
  const items = Array.isArray(meta) ? meta : [meta].filter(Boolean);
  return items.some((item) => String(item).trim().toLowerCase() === freeShippingMeta.toLowerCase());
};

const mapOptionsToCustomProperties = (options) => {
  if (!Array.isArray(options)) return [];

  return options
    .map((option) => ({
      name: String(option?.name || '').trim(),
      required: false,
      options: Array.isArray(option?.values)
        ? option.values.map((value) => String(value || '').trim()).filter(Boolean)
        : [],
    }))
    .filter((option) => option.name && !['color', 'size', 'style'].includes(option.name.toLowerCase()));
};

const mapOptionPlaceholders = (options) => {
  if (!Array.isArray(options)) return undefined;

  const placeholders = options.reduce((map, option) => {
    const name = String(option?.name || '').trim();
    const placeholder = String(option?.placeholder || '').trim();
    if (name && placeholder) {
      map.set(name, placeholder);
    }
    return map;
  }, new Map());

  return placeholders.size ? placeholders : undefined;
};

const optionValues = (options, name) => (Array.isArray(options) ? options : [])
  .find((option) => String(option?.name || '').trim().toLowerCase() === name.toLowerCase())
  ?.values?.map((value) => String(value || '').trim()).filter(Boolean) || [];

const resolveSubcollectionName = (productFilters, collectionFilters) => {
  const filters = Array.isArray(productFilters) ? productFilters : [productFilters].filter(Boolean);
  const available = new Set((collectionFilters || []).map((name) => String(name).trim().toLowerCase()));

  return filters.find((filter) => available.has(String(filter).trim().toLowerCase())) || null;
};

const firstProductImage = (page) =>
  page.products.find((product) => !product.placeholder && product.images?.length)?.images[0];

export const seedCatalog = async () => {
  let collectionCount = 0;
  let subcollectionCount = 0;
  let productCount = 0;

  for (const [collectionIndex, page] of collectionPages.entries()) {
    const cardImage = page.cardImageFromProduct
      ? (firstProductImage(page) || page.cardImage || '')
      : (page.cardImage || '');

    const collection = await Collection.findOneAndUpdate(
      { slug: page.slug },
      {
        $set: {
          name: page.title,
          slug: page.slug,
          sortOrder: collectionIndex,
          isSystem: false,
          description: page.description || '',
          cardImage,
          hidden: Boolean(page.hidden),
          showWhenEmpty: Boolean(page.showWhenEmpty),
          cardImageFromProduct: Boolean(page.cardImageFromProduct),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    collectionCount += 1;

    const subcollectionIdsByName = new Map();
    const collectionFilters = Array.isArray(page.filters) ? page.filters : [];

    for (const [filterIndex, filterName] of collectionFilters.entries()) {
      const name = String(filterName || '').trim();
      if (!name) continue;

      const subcollection = await Subcollection.findOneAndUpdate(
        { collectionId: collection._id, name },
        {
          $set: {
            collectionId: collection._id,
            name,
            slug: slugify(name),
            sortOrder: filterIndex,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      subcollectionIdsByName.set(name.toLowerCase(), subcollection._id);
      subcollectionCount += 1;
    }

    for (const [productIndex, product] of page.products.entries()) {
      if (product.placeholder) continue;

      const subcollectionName = resolveSubcollectionName(product.filters, collectionFilters);
      const subCollectionId = subcollectionName
        ? subcollectionIdsByName.get(subcollectionName.toLowerCase()) || null
        : null;

      const meta = Array.isArray(product.meta) ? product.meta : [product.meta].filter(Boolean);
      const legacyId = Number(product.id);

      await Product.findOneAndUpdate(
        Number.isFinite(legacyId) ? { legacyId } : { name: product.title, collectionId: collection._id },
        {
          $set: {
            legacyId: Number.isFinite(legacyId) ? legacyId : undefined,
            name: product.title,
            description: product.description || '',
            color: optionValues(product.options, 'Color').join(', '),
            size: sortSizeOptions(optionValues(product.options, 'Size')).join(', '),
            collectionId: collection._id,
            subCollectionId,
            photos: Array.isArray(product.images) ? product.images : [],
            price: Number(product.price) || 0,
            shippingCost: 0,
            freeShipping: hasFreeShipping(meta),
            outOfStock: Boolean(product.sold || product.soldOut),
            sortOrder: productIndex,
            meta,
            videos: Array.isArray(product.videos) ? product.videos : [],
            videoPosters: Array.isArray(product.videoPosters) ? product.videoPosters : [],
            noBlingPrice: Number.isFinite(product.noBlingPrice) ? product.noBlingPrice : null,
            noBlingDescription: product.noBlingDescription || '',
            maker: product.maker || '',
            bagTypes: Array.isArray(product.bagTypes) ? product.bagTypes : [],
            filters: Array.isArray(product.filters) ? product.filters : [],
            shoeTypes: Array.isArray(product.shoeTypes) ? product.shoeTypes : [],
            imageWrapper: product.imageWrapper || '',
            customProperties: mapOptionsToCustomProperties(product.options),
            optionPlaceholders: mapOptionPlaceholders(product.options),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      productCount += 1;
    }
  }

  console.log(`ℹ️ Seeded catalog: ${collectionCount} collections, ${subcollectionCount} subcollections, ${productCount} products`);
};
