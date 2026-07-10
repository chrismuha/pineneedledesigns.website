import fs from 'fs/promises';
import path from 'path';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { Subcollection } from '../models/Subcollection.js';
import { isValidObjectId, Types } from 'mongoose';
import { config } from '../config/index.js';

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
    .filter((property) => property.name && !['color', 'size'].includes(property.name.toLowerCase()))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' }));
};

const parseBooleanField = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return Boolean(value);
};

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

const parseRequestBody = (body) => ({
  ...body,
  freeShipping: parseBooleanField(body?.freeShipping),
  outOfStock: parseBooleanField(body?.outOfStock),
  customProperties: normalizeCustomProperties(body?.customProperties),
  photos: body?.photos !== undefined ? normalizePhotos(body.photos) : undefined,
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
      size: String(body?.size || '').trim(),
      customProperties: normalizeCustomProperties(body?.customProperties),
      photos: Array.isArray(body?.photos) ? body.photos.filter(Boolean) : [],
      price: body?.price !== undefined ? Number(body.price) : undefined,
      shippingCost: body?.shippingCost !== undefined ? Number(body.shippingCost) : undefined,
      freeShipping: Boolean(body?.freeShipping),
      outOfStock: Boolean(body?.outOfStock),
      quantity: body?.quantity !== undefined ? Number(body.quantity) : undefined,
    },
  };
};

const productPopulatePaths = [
  { path: 'collectionId', select: 'name slug isSystem' },
  { path: 'subCollectionId', select: 'name slug sortOrder collectionId' },
];

export const listProductsGrouped = async (_req, res) => {
  const collections = await Collection.find().sort({ sortOrder: 1, name: 1 }).lean();
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
        ...product,
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

  res.json(products);
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

  res.json(product);
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
    customProperties: data.customProperties,
    photos: data.photos,
    price: data.price,
    shippingCost: data.shippingCost ?? 0,
    freeShipping: data.freeShipping,
    outOfStock: data.quantity === 0 || data.outOfStock,
    quantity: data.quantity ?? 1,
    sortOrder: (maxSort?.sortOrder ?? -1) + 1,
    videos: uploadedVideos,
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
  if (uploadedVideos.length) product.videos = [...(product.videos || []), ...uploadedVideos];
  if (req.body?.price !== undefined) product.price = data.price;
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

  const populated = await product.populate(productPopulatePaths);
  res.json(populated);
};

export const deleteProduct = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid product ID.' });
  const product = await Product.findByIdAndDelete(objectId(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  res.json({ success: true });
};
