import { collectionCategoryOrder } from '../../../frontend/src/data/siteData.js';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { Subcollection } from '../models/Subcollection.js';
import { isValidObjectId, Types } from 'mongoose';

const mapProductToStorefront = (product, categoryFilters = []) => {
  const placeholders = product.optionPlaceholders instanceof Map
    ? Object.fromEntries(product.optionPlaceholders)
    : (product.optionPlaceholders || {});

  const customProperties = product.customProperties || [];
  const propertyValues = (name) => customProperties
    .find((property) => String(property.name).trim().toLowerCase() === name.toLowerCase())
    ?.options?.map((value) => String(value).trim()).filter(Boolean) || [];
  const customOptions = customProperties
    .filter((property) => !['color', 'size'].includes(String(property.name).toLowerCase()))
    .map((property) => ({
      name: property.name,
      values: property.options || [],
      placeholder: placeholders[property.name] || `Select ${String(property.name).toLowerCase()}`,
    }));
  const colors = String(product.color || '').split(',').map((value) => value.trim()).filter(Boolean);
  const sizes = String(product.size || '').split(',').map((value) => value.trim()).filter(Boolean);
  const colorOptions = colors.length ? colors : propertyValues('Color');
  const sizeOptions = sizes.length ? sizes : propertyValues('Size');
  const hasStyleOption = customOptions.some((option) => option.name.toLowerCase() === 'style');
  const blingOptions = product.noBlingPrice != null && !hasStyleOption
    ? [{ name: 'Style', values: ['Bling', 'No Bling'], placeholder: placeholders.Style || 'Select style' }]
    : [];
  const options = [
    ...blingOptions,
    ...(colorOptions.length ? [{ name: 'Color', values: colorOptions, placeholder: placeholders.Color || 'Select color' }] : []),
    ...(sizeOptions.length ? [{ name: 'Size', values: sizeOptions, placeholder: placeholders.Size || 'Select size' }] : []),
    ...customOptions,
  ];

  const filters = [...new Set([...(product.filters || []), ...categoryFilters].filter(Boolean))];

  return {
    id: product.legacyId ?? product._id,
    title: product.name,
    price: product.price,
    noBlingPrice: product.noBlingPrice ?? undefined,
    meta: product.meta || [],
    description: product.description,
    noBlingDescription: product.noBlingDescription || undefined,
    options: options.length ? options : undefined,
    images: product.photos || [],
    videos: product.videos?.length ? product.videos : undefined,
    videoPosters: product.videoPosters?.length ? product.videoPosters : undefined,
    imageWrapper: product.imageWrapper || undefined,
    filters: filters.length ? filters : undefined,
    bagTypes: product.bagTypes?.length ? product.bagTypes : undefined,
    shoeTypes: product.shoeTypes?.length ? product.shoeTypes : undefined,
    maker: product.maker || undefined,
    sold: product.outOfStock || undefined,
    availableQuantity: Number.isInteger(product.quantity) ? product.quantity : 1,
    freeShipping: product.freeShipping || undefined,
  };
};

const buildCollectionPage = (collection, subcollections, products) => {
  const filters = subcollections.map((subcollection) => subcollection.name);
  const subcollectionNames = new Map(
    subcollections.map((subcollection) => [String(subcollection._id), subcollection.name]),
  );
  const storefrontProducts = products.map((product) => {
    const subcollectionName = subcollectionNames.get(String(product.subCollectionId));
    const categoryFilters = subcollectionName === 'Boa'
      ? ['Boa', 'T-Shirts']
      : [subcollectionName].filter(Boolean);

    return mapProductToStorefront(product, categoryFilters);
  });

  const count = storefrontProducts.length;
  let cardImage = collection.cardImage || '';

  if (collection.cardImageFromProduct) {
    const firstImage = storefrontProducts.find((product) => product.images?.length)?.images?.[0];
    cardImage = firstImage || cardImage;
  }

  return {
    slug: collection.slug,
    title: collection.name,
    path: `/collections/${collection.slug}`,
    cardImage,
    description: collection.description || '',
    hidden: collection.hidden || false,
    showWhenEmpty: collection.showWhenEmpty || false,
    cardImageFromProduct: collection.cardImageFromProduct || false,
    filters: filters.length ? filters : undefined,
    products: storefrontProducts,
    count,
  };
};

const attachCollectionNavigation = (pages) => {
  const visiblePages = pages.filter((page) => (page.count > 0 || page.showWhenEmpty) && !page.hidden);
  const visibleBySlug = new Map(visiblePages.map((page) => [page.slug, page]));
  const groupedSlugs = new Set(collectionCategoryOrder.flatMap((group) => group.slugs));
  const orderedVisiblePages = [
    ...collectionCategoryOrder.flatMap((group) =>
      group.slugs.map((slug) => visibleBySlug.get(slug)).filter(Boolean)),
    ...visiblePages.filter((page) => !groupedSlugs.has(page.slug)),
  ];

  orderedVisiblePages.forEach((page, index) => {
    const previousIndex = (index - 1 + orderedVisiblePages.length) % orderedVisiblePages.length;
    const nextIndex = (index + 1) % orderedVisiblePages.length;

    page.previous = orderedVisiblePages.length > 1
      ? orderedVisiblePages[previousIndex].slug
      : null;
    page.next = orderedVisiblePages.length > 1
      ? orderedVisiblePages[nextIndex].slug
      : null;
  });

  return {
    collectionPages: pages,
    visibleCollectionPages: visiblePages,
    otherCollections: visiblePages.map((collection) => ({
      slug: collection.slug,
      title: collection.title,
      path: collection.path,
      cardImage: collection.cardImage,
      count: collection.count,
    })),
    collectionCategoryOrder,
    navLinks: [
      { label: 'Home', path: '/' },
      { label: 'All Collections', path: '/collections' },
      ...visiblePages.map((page) => ({
        label: page.title.replace(/ Collection$/, ''),
        path: page.path,
        slug: page.slug,
      })),
    ],
  };
};

export const getStorefrontCatalog = async () => {
  const collections = await Collection.find({ isSystem: false }).sort({ sortOrder: 1, name: 1 }).lean();
  const subcollections = await Subcollection.find().sort({ sortOrder: 1, name: 1 }).lean();
  const products = await Product.find().sort({ sortOrder: 1, name: 1 }).lean();

  const subcollectionsByCollectionId = subcollections.reduce((groups, subcollection) => {
    const key = String(subcollection.collectionId);
    if (!groups[key]) groups[key] = [];
    groups[key].push(subcollection);
    return groups;
  }, {});

  const productsByCollectionId = products.reduce((groups, product) => {
    const key = String(product.collectionId);
    if (!groups[key]) groups[key] = [];
    groups[key].push(product);
    return groups;
  }, {});

  const collectionPages = collections.map((collection) => buildCollectionPage(
    collection,
    subcollectionsByCollectionId[String(collection._id)] || [],
    productsByCollectionId[String(collection._id)] || [],
  ));

  return attachCollectionNavigation(collectionPages);
};

export const getStorefrontCollectionBySlug = async (slug) => {
  const catalog = await getStorefrontCatalog();
  return catalog.collectionPages.find((page) => page.slug === slug) || null;
};

export const getStorefrontSubcollectionsBySlug = async (slug) => {
  const collection = await Collection.findOne({ slug, isSystem: false }).lean();
  if (!collection) return null;

  const subcollections = await Subcollection.find({ collectionId: collection._id })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return subcollections.map((subcollection) => ({
    _id: subcollection._id,
    name: subcollection.name,
    slug: subcollection.slug,
    sortOrder: subcollection.sortOrder,
  }));
};

export const getStorefrontProductsBySlug = async (slug, subCollectionId = null) => {
  const collection = await Collection.findOne({ slug, isSystem: false }).lean();
  if (!collection) return null;

  const filter = { collectionId: collection._id };

  if (subCollectionId) {
    if (!isValidObjectId(subCollectionId)) return [];
    const safeSubCollectionId = Types.ObjectId.createFromHexString(String(subCollectionId));
    const subcollection = await Subcollection.findOne({
      _id: safeSubCollectionId,
      collectionId: collection._id,
    }).lean();

    if (!subcollection) {
      return [];
    }

    filter.$or = [
      { subCollectionId: subcollection._id },
      { filters: subcollection.name },
    ];
  }

  const products = await Product.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return products.map(mapProductToStorefront);
};
