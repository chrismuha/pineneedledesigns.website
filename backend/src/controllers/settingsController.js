import { StoreSettings } from '../models/StoreSettings.js';

export const getStoreSettings = async (_req, res) => {
  const settings = await StoreSettings.findOneAndUpdate(
    { key: 'store' },
    { $setOnInsert: { freeShippingEnabled: true, freeShippingMinimum: 28, fallbackShippingCost: 5 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  res.json(settings);
};

export const updateStoreSettings = async (req, res) => {
  const enabled = req.body?.freeShippingEnabled === true || req.body?.freeShippingEnabled === 'true';
  const minimum = Number(req.body?.freeShippingMinimum);
  const fallbackShippingCost = Number(req.body?.fallbackShippingCost);
  if (enabled && (!Number.isFinite(minimum) || minimum < 0)) {
    return res.status(400).json({ error: 'Free shipping minimum must be zero or greater.' });
  }
  if (!Number.isFinite(fallbackShippingCost) || fallbackShippingCost < 0) {
    return res.status(400).json({ error: 'Fallback shipping charge must be zero or greater.' });
  }

  const settings = await StoreSettings.findOneAndUpdate(
    { key: 'store' },
    {
      $set: {
        freeShippingEnabled: enabled,
        freeShippingMinimum: enabled ? minimum : null,
        fallbackShippingCost,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return res.json(settings);
};
