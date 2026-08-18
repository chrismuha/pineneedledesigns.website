import mongoose from 'mongoose';
import { isCloverConfigured } from '../config/clover.js';

export const healthCheck = (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;

  res.json({
    status: mongoReady ? 'OK' : 'DEGRADED',
    mongo: mongoReady ? 'connected' : 'disconnected',
    clover: isCloverConfigured() ? 'configured' : 'not_configured',
    timestamp: new Date().toISOString(),
  });
};
