import path from 'path';
import express from 'express';
import { rateLimit } from 'express-rate-limit';

import bodyParser from "body-parser";

import { config } from './config/index.js';
import { corsMiddleware } from './middleware/cors.js';
import { setRevalidationHeaders } from './middleware/cacheControl.js';
import { createSessionMiddleware } from './middleware/session.js';
import apiRouter from './routes/index.js';

export const createApp = () => {
  const app = express();

  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(corsMiddleware);
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }));
  app.use((req, res, next) => {
    setRevalidationHeaders(res);
    next();
  });

  app.use(bodyParser.urlencoded({ extended: false }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.static(config.docsDir, {
    setHeaders(res) {
      setRevalidationHeaders(res);
    },
  }));
  
  app.use(createSessionMiddleware());
  app.use('/uploads', express.static(config.uploadsDir));
  app.use('/api', apiRouter);

  app.use((req, res) => {
    setRevalidationHeaders(res);
    res.sendFile(path.join(config.docsDir, 'index.html'));
  });

  return app;
};
