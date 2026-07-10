import { config } from '../config/index.js';

export const corsMiddleware = (req, res, next) => {
  const origin = req.get('origin');

  if (!origin || config.allowedOrigins.includes(origin)) {
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return origin && !config.allowedOrigins.includes(origin)
      ? res.sendStatus(403)
      : res.sendStatus(204);
  }

  return next();
};
