import webpush from 'web-push';
import { config } from '../config/index.js';
import { PushSubscription } from '../models/PushSubscription.js';

export const pushNotificationsConfigured = Boolean(
  config.webPush.publicKey && config.webPush.privateKey,
);

if (pushNotificationsConfigured) {
  webpush.setVapidDetails(
    config.webPush.subject,
    config.webPush.publicKey,
    config.webPush.privateKey,
  );
}

export const sendPushNotification = async ({
  title,
  body,
  url,
  tag,
  type = 'store-update',
  icon = '/pwa-icon-192.png',
}) => {
  if (!pushNotificationsConfigured) return { sent: 0 };

  const subscriptions = await PushSubscription.find({}).lean();
  const eligibleSubscriptions = subscriptions.filter((subscription) => {
    if (type === 'order') return subscription.preferences?.orders !== false;
    if (type === 'booking') return subscription.preferences?.bookings !== false;
    return true;
  });
  const payload = JSON.stringify({ title, body, url, tag, type, icon });
  let sent = 0;

  await Promise.all(eligibleSubscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }, payload, {
        // Keep alerts available if the phone is temporarily offline and ask
        // the push service to prioritize these time-sensitive store events.
        TTL: 24 * 60 * 60,
        urgency: 'high',
      });
      sent += 1;
    } catch (error) {
      // 401/403 also mean this stored endpoint can no longer be used with the
      // server's current VAPID credentials. The app will recreate and sync it.
      if ([401, 403, 404, 410].includes(error?.statusCode)) {
        await PushSubscription.deleteOne({ endpoint: subscription.endpoint });
        return;
      }
      console.error('Web push delivery failed:', error?.message || error);
    }
  }));

  return { sent };
};
