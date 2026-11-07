const linkKeys = new Set(['url', 'href', 'src', 'srcset', 'link', 'productpath', 'productslug']);
const mediaKey = /image|photo|video|thumbnail|poster|media/;

const isMediaReference = (value) => {
  let text = value;
  try { text = decodeURIComponent(text); } catch { /* Keep malformed text as-is. */ }
  return /\/uploads\/|\/collections\/|data:(?:image|video)\/|blob:|https?:\/\/\S+\.(?:avif|gif|heic|jpe?g|mov|mp4|ogg|png|svg|webm|webp)(?:[?#\s]|$)/i.test(text);
};

// Keep the financial/inventory snapshot, but never expose product media or links.
// Works on legacy Mixed snapshots as well as new checkout and edit payloads.
export const orderTextRecord = (value) => {
  if (typeof value === 'string') return isMediaReference(value) ? undefined : value;
  if (Array.isArray(value)) return value.map(orderTextRecord).filter((entry) => entry !== undefined);
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return value;
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
    const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (mediaKey.test(normalized) || linkKeys.has(normalized) || /^product(?:url|link)/.test(normalized)) return [];
    const text = orderTextRecord(entry);
    return text === undefined ? [] : [[key, text]];
  }));
};
