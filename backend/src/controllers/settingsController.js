import { invalidateStorefrontCatalog } from '../services/storefrontCatalog.js';
import { normalizeNewArrivalsSettings } from '../../../frontend/src/utils/newArrivals.js';
import { StoreSettings } from '../models/StoreSettings.js';

export const getStoreSettings = async (_req, res) => {
  const settings = await StoreSettings.findOneAndUpdate(
    { key: 'store' },
    { $setOnInsert: { freeShippingEnabled: true, freeShippingMinimum: 28, fallbackShippingCost: 5, toastTimeoutSeconds: 6, updateNotificationDelayMinutes: 0 } },
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
  const updateNotificationDelayMinutes = req.body?.updateNotificationDelayMinutes === undefined
    ? null
    : Number(req.body.updateNotificationDelayMinutes);
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
  if (updateNotificationDelayMinutes !== null && (
    ![0, 5, 15, 30, 60, 240, 1440].includes(updateNotificationDelayMinutes)
  )) {
    return res.status(400).json({ error: 'Choose a valid app update notification delay.' });
  }

  const settings = await StoreSettings.findOneAndUpdate(
    { key: 'store' },
    {
      $set: {
        freeShippingEnabled: enabled,
        freeShippingMinimum: enabled ? minimum : null,
        fallbackShippingCost,
        ...(toastTimeoutSeconds === null ? {} : { toastTimeoutSeconds }),
        ...(updateNotificationDelayMinutes === null ? {} : { updateNotificationDelayMinutes }),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return res.json(settings);
};


// A dedicated update keeps storefront preferences independent of checkout settings.
export const updateNewArrivalsSettings = async (req, res) => {
  const input = req.body;
  if (!input || typeof input.enabled !== 'boolean'
    || !['automatic', 'mixed', 'manual'].includes(input.mode)
    || !Number.isInteger(input.latestCount) || input.latestCount < 0 || input.latestCount > 10
    || !Number.isInteger(input.customCount) || input.customCount < 0 || input.customCount > 10
    || input.latestCount + input.customCount < 1 || input.latestCount + input.customCount > 10
    || (input.mode === 'automatic' && input.customCount !== 0)
    || (input.mode === 'manual' && input.latestCount !== 0)
    || !Array.isArray(input.productIds) || input.productIds.length > input.customCount
    || input.productIds.some((id) => typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id))) {
    return res.status(400).json({ error: 'Choose 1–10 total New Arrivals items and a valid product selection.' });
  }
  const newArrivals = {
    enabled: input.enabled,
    mode: input.mode,
    latestCount: input.latestCount,
    customCount: input.customCount,
    productIds: [...new Set(input.productIds)],
  };
  const settings = await StoreSettings.findOneAndUpdate(
    { key: 'store' },
    { $set: { newArrivals } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean();
  invalidateStorefrontCatalog('New Arrivals settings updated');
  return res.json(normalizeNewArrivalsSettings(settings.newArrivals));
};
