import mongoose from 'mongoose';
import { isCloverConfigured } from '../config/clover.js';

export const healthCheck = (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;

  res.status(mongoReady ? 200 : 503).json({
    status: mongoReady ? 'OK' : 'DEGRADED',
    mongo: mongoReady ? 'connected' : 'disconnected',
    clover: isCloverConfigured() ? 'configured' : 'not_configured',
    timestamp: new Date().toISOString(),
  });
};
