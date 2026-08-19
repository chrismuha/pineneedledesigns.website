import webpush from 'web-push';
import { config } from '../config/index.js';
import { PushSubscription } from '../models/PushSubscription.js';

const PLACEHOLDER_KEY_PATTERN = /generate-with|placeholder|your_|keep-this-secret/i;
const PUSH_SEND_CONCURRENCY = 10;

const runLimited = async (items, limit, worker) => {
  let nextIndex = 0;

  const runNext = async () => {
    const currentIndex = nextIndex;
    nextIndex += 1;
    if (currentIndex >= items.length) return;
    await worker(items[currentIndex], currentIndex);
    await runNext();
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runNext());
  await Promise.all(workers);
};

const hasValidVapidKeys = () => {
  const { publicKey, privateKey } = config.webPush;
  if (!publicKey || !privateKey) return false;
  if (PLACEHOLDER_KEY_PATTERN.test(publicKey) || PLACEHOLDER_KEY_PATTERN.test(privateKey)) {
    return false;
  }

  try {
    webpush.setVapidDetails(
      config.webPush.subject,
      publicKey,
      privateKey,
    );
    return true;
  } catch (error) {
    if (!config.isProduction) {
      console.warn(
        'Web push disabled: invalid VAPID keys. Generate valid keys with: npx web-push generate-vapid-keys',
      );
    } else {
      console.error('Web push disabled: invalid VAPID keys in production environment.');
    }
    return false;
  }
};

export const pushNotificationsConfigured = hasValidVapidKeys();

export const sendPushNotification = async ({
  title,
  body,
  url,
  tag,
  type = 'store-update',
  icon = '/pwa-icon-192.png',
}) => {
  if (!pushNotificationsConfigured) return { sent: 0 };

  const subscriptionFilter = type === 'order'
    ? { 'preferences.orders': { $ne: false } }
    : type === 'booking'
      ? { 'preferences.bookings': { $ne: false } }
      : {};
  const eligibleSubscriptions = await PushSubscription.find(subscriptionFilter).lean();
  const payload = JSON.stringify({ title, body, url, tag, type, icon });
  let sent = 0;

  await runLimited(eligibleSubscriptions, PUSH_SEND_CONCURRENCY, async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }, payload, {
        TTL: 24 * 60 * 60,
        urgency: 'high',
      });
      sent += 1;
    } catch (error) {
      if ([401, 403, 404, 410].includes(error?.statusCode)) {
        await PushSubscription.deleteOne({ endpoint: subscription.endpoint });
        return;
      }
      console.error('Web push delivery failed:', error?.message || error);
    }
  });

  return { sent };
};
