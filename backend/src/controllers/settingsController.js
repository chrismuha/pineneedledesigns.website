import { StoreSettings } from '../models/StoreSettings.js';

export const getStoreSettings = async (_req, res) => {
  const settings = await StoreSettings.findOneAndUpdate(
    { key: 'store' },
    { $setOnInsert: { freeShippingEnabled: true, freeShippingMinimum: 28, fallbackShippingCost: 5, toastTimeoutSeconds: 6 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  res.json(settings);
};

export const updateStoreSettings = async (req, res) => {
  const enabled = req.body?.freeShippingEnabled === true || req.body?.freeShippingEnabled === 'true';
  const minimum = Number(req.body?.freeShippingMinimum);
  const fallbackShippingCost = Number(req.body?.fallbackShippingCost);
  const toastTimeoutSeconds = req.body?.toastTimeoutSeconds === undefined
    ? null
    : Number(req.body.toastTimeoutSeconds);
  if (enabled && (!Number.isFinite(minimum) || minimum < 0)) {
    return res.status(400).json({ error: 'Free shipping minimum must be zero or greater.' });
  }
  if (!Number.isFinite(fallbackShippingCost) || fallbackShippingCost < 0) {
    return res.status(400).json({ error: 'Fallback shipping charge must be zero or greater.' });
  }
  if (toastTimeoutSeconds !== null && (
    !Number.isFinite(toastTimeoutSeconds) || toastTimeoutSeconds < 2 || toastTimeoutSeconds > 30
  )) {
    return res.status(400).json({ error: 'Toast timeout must be between 2 and 30 seconds.' });
  }

  const settings = await StoreSettings.findOneAndUpdate(
    { key: 'store' },
    {
      $set: {
        freeShippingEnabled: enabled,
        freeShippingMinimum: enabled ? minimum : null,
        fallbackShippingCost,
        ...(toastTimeoutSeconds === null ? {} : { toastTimeoutSeconds }),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return res.json(settings);
};
