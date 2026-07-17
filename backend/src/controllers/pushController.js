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
    return res.status(400).json({ error: 'The browser returned an invalid notification subscription.' });
  }

  const subscription = await PushSubscription.findOneAndUpdate(
    { endpoint: req.body.endpoint },
    {
      keys: req.body.keys,
      userAgent: String(req.get('user-agent') || '').slice(0, 500),
      lastSeenAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  res.status(201).json({ subscribed: true, id: subscription.id });
};

export const unsubscribeFromPush = async (req, res) => {
  const endpoint = String(req.body?.endpoint || '');
  if (endpoint) await PushSubscription.deleteOne({ endpoint });
  res.json({ subscribed: false });
};

export const sendTestPush = async (_req, res) => {
  const result = await sendPushNotification({
    title: 'Pine Needle notifications are on',
    body: 'This phone will receive new order and booking alerts.',
    url: '/dashboard',
    tag: 'push-test',
  });
  res.json(result);
};
