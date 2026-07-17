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

export const sendPushNotification = async ({ title, body, url, tag }) => {
  if (!pushNotificationsConfigured) return { sent: 0 };

  const subscriptions = await PushSubscription.find({}).lean();
  const payload = JSON.stringify({ title, body, url, tag });
  let sent = 0;

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }, payload, { TTL: 60 * 60 });
      sent += 1;
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await PushSubscription.deleteOne({ endpoint: subscription.endpoint });
        return;
      }
      console.error('Web push delivery failed:', error?.message || error);
    }
  }));

  return { sent };
};
