import { config } from '../config/index.js';
import { PushSubscription } from '../models/PushSubscription.js';
import { pushNotificationsConfigured, sendPushNotification } from '../services/pushNotifications.js';

const validSubscription = (subscription) => (
  subscription
  && typeof subscription.endpoint === 'string'
  && subscription.endpoint.startsWith('https://')
  && typeof subscription.keys?.p256dh === 'string'
  && typeof subscription.keys?.auth === 'string'
);

export const getPushConfig = (_req, res) => {
  res.json({
    configured: pushNotificationsConfigured,
    publicKey: pushNotificationsConfigured ? config.webPush.publicKey : '',
  });
};

export const subscribeToPush = async (req, res) => {
  if (!pushNotificationsConfigured) {
    return res.status(503).json({ error: 'Phone notifications are not configured on the server yet.' });
  }
  if (!validSubscription(req.body)) {
    return res.status(400).json({ error: 'This device returned an invalid notification subscription.' });
  }

  const preferences = {
    orders: req.body?.preferences?.orders !== false,
    bookings: req.body?.preferences?.bookings !== false,
  };
  const subscription = await PushSubscription.findOneAndUpdate(
    { endpoint: req.body.endpoint },
    {
      keys: req.body.keys,
      userAgent: String(req.get('user-agent') || '').slice(0, 500),
      lastSeenAt: new Date(),
      preferences,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  res.status(201).json({ subscribed: true, id: subscription.id, preferences: subscription.preferences });
};

export const unsubscribeFromPush = async (req, res) => {
  const endpoint = String(req.body?.endpoint || '');
  if (endpoint) await PushSubscription.deleteOne({ endpoint });
  res.json({ subscribed: false });
};

export const sendTestPush = async (req, res) => {
  const requestedDelay = Number(req.body?.delaySeconds ?? 5);
  if (!Number.isFinite(requestedDelay) || requestedDelay < 0 || requestedDelay > 300) {
    return res.status(400).json({ error: 'Test notification delay must be between 0 and 300 seconds.' });
  }
  const delaySeconds = Math.round(requestedDelay);
  if (delaySeconds) {
    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
  }
  const result = await sendPushNotification({
    title: 'Test notification',
    body: 'This phone will receive new order and booking alerts.',
    url: '/dashboard',
    tag: 'push-test',
    type: 'test',
  });
  if (result.sent === 0) {
    return res.status(503).json({
      error: 'No subscribed device accepted the test notification. Re-enable alerts on this device and try again.',
      ...result,
    });
  }
  res.json({ ...result, delaySeconds });
};
