import fs from 'fs/promises';
import path from 'path';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { Subcollection } from '../models/Subcollection.js';
import { isValidObjectId, Types } from 'mongoose';
import { config } from '../config/index.js';
import { sortSizeOptions } from '../utils/sizeOptions.js';

const validId = (value) => typeof value === 'string' && isValidObjectId(value);
const objectId = (value) => Types.ObjectId.createFromHexString(String(value));

const normalizeSubCollectionId = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const id = String(value).trim();
  return id || null;
};

const resolveSubCollectionId = async (collectionId, subCollectionId, { requireWhenAvailable = false } = {}) => {
  const id = normalizeSubCollectionId(subCollectionId);
  const subcollectionCount = await Subcollection.countDocuments({ collectionId });

  if (subcollectionCount > 0 && requireWhenAvailable && !id) {
    return { id: null, error: 'Subcollection is required for this collection.' };
  }

  if (!id) {
    return { id: null, error: null };
  }
  if (!validId(id)) {
    return { id: null, error: 'Subcollection is invalid for this collection.' };
  }

  const subcollection = await Subcollection.findOne({
    _id: objectId(id),
    collectionId,
  }).select('_id');
  if (!subcollection) {
    return { id: null, error: 'Subcollection is invalid for this collection.' };
  }

  return { id: subcollection._id, error: null };
};

const normalizeCustomProperties = (properties) => {
  if (typeof properties === 'string') {
    try {
      return normalizeCustomProperties(JSON.parse(properties));
    } catch {
      return [];
    }
  }

  if (!Array.isArray(properties)) {
    return [];
  }

  return properties
    .map((property) => ({
      name: String(property?.name || '').trim(),
      required: Boolean(property?.required),
      options: Array.isArray(property?.options)
        ? property.options.map((option) => String(option || '').trim()).filter(Boolean)
          .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }))
        : [],
    }))
    .filter((property) => property.name && !['color', 'size', 'shirt size', 'shoe size', 'style'].includes(property.name.toLowerCase()))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' }));
};

const parseBooleanField = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return Boolean(value);
};

const normalizeShoeSizes = (value) => [...new Set(String(value || '')
  .split(',')
  .map((size) => size.trim())
  .filter((size) => /^(?:[6-9]|1[0-2])$/.test(size)))]
  .sort((left, right) => Number(left) - Number(right))
  .join(', ');

const normalizePhotos = (photos) => {
  if (typeof photos === 'string') {
    try {
      return normalizePhotos(JSON.parse(photos));
    } catch {
      return [];
    }
  }
  return Array.isArray(photos) ? photos.map((photo) => String(photo || '').trim()).filter(Boolean) : [];
};

const normalizeStringList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return normalizeStringList(parsed);
  } catch {}
  return value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
};

const normalizePlaceholders = (value) => {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const parseRequestBody = (body) => ({
  ...body,
  freeShipping: parseBooleanField(body?.freeShipping),
  outOfStock: parseBooleanField(body?.outOfStock),
  customProperties: normalizeCustomProperties(body?.customProperties),
  photos: body?.photos !== undefined ? normalizePhotos(body.photos) : undefined,
  meta: body?.meta !== undefined ? normalizeStringList(body.meta) : undefined,
  videos: body?.videos !== undefined ? normalizeStringList(body.videos) : undefined,
  videoPosters: body?.videoPosters !== undefined ? normalizeStringList(body.videoPosters) : undefined,
  bagTypes: body?.bagTypes !== undefined ? normalizeStringList(body.bagTypes) : undefined,
  filters: body?.filters !== undefined ? normalizeStringList(body.filters) : undefined,
  shoeTypes: body?.shoeTypes !== undefined ? normalizeStringList(body.shoeTypes) : undefined,
  optionPlaceholders: body?.optionPlaceholders !== undefined ? normalizePlaceholders(body.optionPlaceholders) : undefined,
  subCollectionId: body?.subCollectionId !== undefined
    ? normalizeSubCollectionId(body.subCollectionId)
    : undefined,
});

const validateProductPayload = (body, { requireAll = true } = {}) => {
  const errors = [];
  const name = String(body?.name || '').trim();
  const description = String(body?.description || '').trim();
  const collectionId = body?.collectionId;
  if (requireAll && !name) errors.push('Item name is required.');
  if (requireAll && !description) errors.push('Description is required.');
  if (requireAll && !collectionId) errors.push('Collection is required.');
  if (body?.price !== undefined && Number(body.price) < 0) errors.push('Price must be zero or greater.');
  if (body?.shippingCost !== undefined && Number(body.shippingCost) < 0) errors.push('Shipping cost must be zero or greater.');
  if (body?.noBlingPrice !== undefined && body.noBlingPrice !== '' && Number(body.noBlingPrice) < 0) {
    errors.push('Price without bling must be zero or greater.');
  }
  if (body?.noBlingPrice !== undefined && body.noBlingPrice !== '' && !String(body?.noBlingDescription || '').trim()) {
    errors.push('Description without Bling is required when the item has a No Bling style.');
  }
  if (body?.quantity !== undefined && (!Number.isInteger(Number(body.quantity)) || Number(body.quantity) < 0)) {
    errors.push('Quantity must be a whole number of zero or greater.');
  }

  return {
    errors,
    data: {
      name,
      description,
      collectionId,
      color: String(body?.color || '').trim(),
      size: sortSizeOptions(String(body?.size || '').split(',').map((size) => size.trim()).filter(Boolean)).join(', '),
      shoeSize: normalizeShoeSizes(body?.shoeSize),
      customProperties: normalizeCustomProperties(body?.customProperties),
      photos: Array.isArray(body?.photos) ? body.photos.filter(Boolean) : [],
      price: body?.price !== undefined ? Number(body.price) : undefined,
      noBlingPrice: body?.noBlingPrice !== undefined && body.noBlingPrice !== ''
        ? Number(body.noBlingPrice)
        : null,
      noBlingDescription: String(body?.noBlingDescription || '').trim(),
      shippingCost: body?.shippingCost !== undefined ? Number(body.shippingCost) : undefined,
      freeShipping: Boolean(body?.freeShipping),
      outOfStock: Boolean(body?.outOfStock),
      quantity: body?.quantity !== undefined ? Number(body.quantity) : undefined,
      meta: body?.meta,
      videos: body?.videos,
      videoPosters: body?.videoPosters,
      maker: String(body?.maker || '').trim(),
      bagTypes: body?.bagTypes,
      filters: body?.filters,
      shoeTypes: body?.shoeTypes,
      imageWrapper: String(body?.imageWrapper || '').trim(),
      optionPlaceholders: body?.optionPlaceholders,
    },
  };
};

const productPopulatePaths = [
  { path: 'collectionId', select: 'name slug isSystem' },
  { path: 'subCollectionId', select: 'name slug sortOrder collectionId' },
];

const formatProductForDashboard = (product) => ({
  ...product,
  size: sortSizeOptions(String(product.size || '').split(',').map((size) => size.trim()).filter(Boolean)).join(', '),
  shoeSize: normalizeShoeSizes(product.shoeSize),
  customProperties: normalizeCustomProperties(product.customProperties),
});

export const listProductsGrouped = async (_req, res) => {
  const collections = await Collection.find().sort({ isSystem: 1, name: 1 }).lean();
  const subcollections = await Subcollection.find().sort({ sortOrder: 1, name: 1 }).lean();
  const products = await Product.find()
    .populate('collectionId', 'name slug isSystem sortOrder')
    .populate('subCollectionId', 'name slug sortOrder')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const grouped = collections.map((collection) => ({
    ...collection,
    subcollections: subcollections.filter(
      (subcollection) => String(subcollection.collectionId) === String(collection._id),
    ),
    products: products
      .filter((product) => String(product.collectionId?._id || product.collectionId) === String(collection._id))
      .map((product) => ({
        ...formatProductForDashboard(product),
        collectionName: collection.name,
      })),
  }));
  res.json(grouped);
};

export const listProducts = async (req, res) => {
  const filter = {};
  if (req.query.collectionId) {
    if (!validId(req.query.collectionId)) return res.status(400).json({ error: 'Invalid collection ID.' });
    filter.collectionId = objectId(req.query.collectionId);
  }
  if (req.query.subCollectionId) {
    if (!validId(req.query.subCollectionId)) return res.status(400).json({ error: 'Invalid subcollection ID.' });
    filter.subCollectionId = objectId(req.query.subCollectionId);
  }

  const products = await Product.find(filter)
    .populate('collectionId', 'name slug isSystem')
    .populate('subCollectionId', 'name slug sortOrder')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  res.json(products.map(formatProductForDashboard));
};

export const getProduct = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid product ID.' });
  const product = await Product.findById(objectId(req.params.id))
    .populate('collectionId', 'name slug isSystem')
    .populate('subCollectionId', 'name slug sortOrder collectionId')
    .lean();

  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  res.json(formatProductForDashboard(product));
};

export const createProduct = async (req, res) => {
  const body = parseRequestBody(req.body);
  const uploadedPhotos = (req.files?.photos || []).map((file) => `/uploads/${file.filename}`);
  const uploadedVideos = (req.files?.videos || []).map((file) => `/uploads/${file.filename}`);

  if (!uploadedPhotos.length) {
    return res.status(400).json({ error: 'At least one photo is required.' });
  }

  const { errors, data } = validateProductPayload({
    ...body,
    photos: uploadedPhotos,
  });

  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ') });
  }
  if (!validId(String(data.collectionId))) return res.status(400).json({ error: 'Invalid collection ID.' });

  const collection = await Collection.findById(objectId(data.collectionId));
  if (!collection) {
    return res.status(400).json({ error: 'Collection not found.' });
  }

  const subcollectionResult = await resolveSubCollectionId(
    collection._id,
    body.subCollectionId,
    { requireWhenAvailable: true },
  );
  if (subcollectionResult.error) {
    return res.status(400).json({ error: subcollectionResult.error });
  }

  const maxSort = await Product.findOne({ collectionId: collection._id }).sort({ sortOrder: -1 }).select('sortOrder');
  const product = await Product.create({
    name: data.name,
    description: data.description,
    collectionId: collection._id,
    subCollectionId: subcollectionResult.id,
    color: data.color,
    size: data.size,
    shoeSize: data.shoeSize,
    customProperties: data.customProperties,
    photos: data.photos,
    price: data.price,
    noBlingPrice: data.noBlingPrice,
    noBlingDescription: data.noBlingDescription,
    shippingCost: data.shippingCost ?? 0,
    freeShipping: data.freeShipping,
    outOfStock: data.quantity === 0 || data.outOfStock,
    quantity: data.quantity ?? 1,
    sortOrder: (maxSort?.sortOrder ?? -1) + 1,
    videos: [...(data.videos || []), ...uploadedVideos],
    videoPosters: data.videoPosters || [],
    meta: data.meta || [],
    maker: data.maker,
    bagTypes: data.bagTypes || [],
    filters: data.filters || [],
    shoeTypes: data.shoeTypes || [],
    imageWrapper: data.imageWrapper,
    optionPlaceholders: data.optionPlaceholders,
  });

  const populated = await product.populate(productPopulatePaths);
  res.status(201).json(populated);
};

export const updateProduct = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid product ID.' });
  const product = await Product.findById(objectId(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const body = parseRequestBody(req.body);
  const previousPhotos = [...(product.photos || [])];
  const previousVideos = [...(product.videos || [])];
  const uploadedPhotos = (req.files?.photos || []).map((file) => `/uploads/${file.filename}`);
  const uploadedVideos = (req.files?.videos || []).map((file) => `/uploads/${file.filename}`);
  const { errors, data } = validateProductPayload(body, { requireAll: false });
  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  if (data.name) product.name = data.name;
  if (data.description) product.description = data.description;
  if (req.body?.color !== undefined) product.color = data.color;
  if (req.body?.size !== undefined) product.size = data.size;
  if (req.body?.shoeSize !== undefined) product.shoeSize = data.shoeSize;
  if (body.customProperties !== undefined && req.body?.customProperties !== undefined) {
    product.customProperties = data.customProperties;
  }
  if (req.body?.photos !== undefined || uploadedPhotos.length) {
    product.photos = [...(data.photos || []), ...uploadedPhotos];
    if (!product.photos.length) {
      return res.status(400).json({ error: 'At least one photo is required.' });
    }
    if (product.photos.length > 20) {
      await Promise.all(uploadedPhotos.map((photo) => (
        fs.unlink(path.join(config.uploadsDir, path.basename(photo))).catch(() => {})
      )));
      return res.status(400).json({ error: 'A maximum of 20 photos is allowed.' });
    }
  }
  if (req.body?.videos !== undefined || uploadedVideos.length) product.videos = [...(data.videos || []), ...uploadedVideos];
  if (req.body?.videoPosters !== undefined) product.videoPosters = data.videoPosters;
  if (req.body?.meta !== undefined) product.meta = data.meta;
  if (req.body?.maker !== undefined) product.maker = data.maker;
  if (req.body?.bagTypes !== undefined) product.bagTypes = data.bagTypes;
  if (req.body?.filters !== undefined) product.filters = data.filters;
  if (req.body?.shoeTypes !== undefined) product.shoeTypes = data.shoeTypes;
  if (req.body?.imageWrapper !== undefined) product.imageWrapper = data.imageWrapper;
  if (req.body?.optionPlaceholders !== undefined) product.optionPlaceholders = data.optionPlaceholders;
  if (req.body?.price !== undefined) product.price = data.price;
  if (req.body?.noBlingPrice !== undefined) product.noBlingPrice = data.noBlingPrice;
  if (req.body?.noBlingDescription !== undefined) product.noBlingDescription = data.noBlingDescription;
  if (req.body?.shippingCost !== undefined) product.shippingCost = data.shippingCost;
  if (req.body?.freeShipping !== undefined) product.freeShipping = data.freeShipping;
  if (req.body?.quantity !== undefined) product.quantity = data.quantity;
  if (req.body?.outOfStock !== undefined) product.outOfStock = data.outOfStock;
  if (product.quantity === 0) product.outOfStock = true;

  if (data.collectionId) {
    if (!validId(String(data.collectionId))) return res.status(400).json({ error: 'Invalid collection ID.' });
    const collection = await Collection.findById(objectId(data.collectionId));
    if (!collection) {
      return res.status(400).json({ error: 'Collection not found.' });
    }
    product.collectionId = collection._id;
  }

  if (body.subCollectionId !== undefined && req.body?.subCollectionId !== undefined) {
    const subcollectionResult = await resolveSubCollectionId(
      product.collectionId,
      body.subCollectionId,
      { requireWhenAvailable: true },
    );
    if (subcollectionResult.error) {
      return res.status(400).json({ error: subcollectionResult.error });
    }
    product.subCollectionId = subcollectionResult.id;
  } else if (data.collectionId && req.body?.collectionId !== undefined) {
    const subcollectionResult = await resolveSubCollectionId(
      product.collectionId,
      null,
      { requireWhenAvailable: true },
    );
    if (subcollectionResult.error) {
      return res.status(400).json({ error: subcollectionResult.error });
    }
    product.subCollectionId = null;
  }

  await product.save();

  const removedPhotos = previousPhotos.filter(
    (photo) => String(photo).startsWith('/uploads/') && !product.photos.includes(photo),
  );
  if (removedPhotos.length) {
    const stillReferenced = new Set(
      (await Product.find({ photos: { $in: removedPhotos } }).select('photos').lean())
        .flatMap((otherProduct) => otherProduct.photos || []),
    );
    await Promise.all(removedPhotos
      .filter((photo) => !stillReferenced.has(photo))
      .map((photo) => fs.unlink(path.join(config.uploadsDir, path.basename(photo))).catch((error) => {
        if (error?.code !== 'ENOENT') console.error(`Failed to remove product photo ${photo}:`, error);
      })));
  }

  const removedVideos = previousVideos.filter(
    (video) => String(video).startsWith('/uploads/') && !product.videos.includes(video),
  );
  if (removedVideos.length) {
    const stillReferenced = new Set(
      (await Product.find({ videos: { $in: removedVideos } }).select('videos').lean())
        .flatMap((otherProduct) => otherProduct.videos || []),
    );
    await Promise.all(removedVideos
      .filter((video) => !stillReferenced.has(video))
      .map((video) => fs.unlink(path.join(config.uploadsDir, path.basename(video))).catch((error) => {
        if (error?.code !== 'ENOENT') console.error(`Failed to remove product video ${video}:`, error);
      })));
  }

  const populated = await product.populate(productPopulatePaths);
  res.json(populated);
};

export const deleteProduct = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid product ID.' });
  const product = await Product.findByIdAndDelete(objectId(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const uploadedMedia = [...(product.photos || []), ...(product.videos || [])]
    .filter((media) => String(media).startsWith('/uploads/'));
  if (uploadedMedia.length) {
    const referencedProducts = await Product.find({
      $or: [{ photos: { $in: uploadedMedia } }, { videos: { $in: uploadedMedia } }],
    }).select('photos videos').lean();
    const stillReferenced = new Set(referencedProducts.flatMap((item) => [
      ...(item.photos || []),
      ...(item.videos || []),
    ]));
    await Promise.all(uploadedMedia
      .filter((media) => !stillReferenced.has(media))
      .map((media) => fs.unlink(path.join(config.uploadsDir, path.basename(media))).catch((error) => {
        if (error?.code !== 'ENOENT') console.error(`Failed to remove product media ${media}:`, error);
      })));
  }

  res.json({ success: true });
};
