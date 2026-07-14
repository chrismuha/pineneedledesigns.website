import path from 'path';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import cors from 'cors';
import { csrfSync } from 'csrf-sync';

import bodyParser from "body-parser";

import { config } from './config/index.js';
import { setRevalidationHeaders } from './middleware/cacheControl.js';
import { createSessionMiddleware } from './middleware/session.js';
import apiRouter from './routes/index.js';

export const createApp = () => {
  const app = express();
  const { generateToken, csrfSynchronisedProtection } = csrfSync();

  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(cors({
    credentials: true,
    origin(origin, callback) {
      callback(null, !origin || config.allowedOrigins.includes(origin));
    },
  }));
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
  app.get('/api/csrf-token', (req, res) => {
    res.json({ token: generateToken(req) });
  });
  app.use('/api', csrfSynchronisedProtection);
  app.use('/uploads', express.static(config.uploadsDir));
  if (!config.isProduction) {
    app.use('/uploads', (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();

      const productionUrl = new URL(req.originalUrl, config.productionMediaOrigin);
      return res.redirect(307, productionUrl.href);
    });
  }
  app.use('/api', apiRouter);

  app.use('/api', (error, _req, res, _next) => {
    console.error('API request failed:', error);

    const uploadErrors = {
      LIMIT_FILE_SIZE: 'One of the selected files exceeds the 100 MB file limit.',
      LIMIT_FILE_COUNT: 'Too many files were selected for one upload.',
      LIMIT_UNEXPECTED_FILE: 'Too many files were selected, or an unsupported upload field was used.',
      LIMIT_FIELD_VALUE: 'One of the submitted fields is too large.',
    };
    const status = Number(error?.status || error?.statusCode) || 500;
    const isCsrfError = status === 403 && /csrf/i.test(String(error?.message || ''));
    const message = uploadErrors[error?.code]
      || (isCsrfError ? 'Your session security token expired. Refresh the page and try again.' : '')
      || (status === 413 ? 'The selected files are too large to upload in one request.' : '')
      || (status >= 500
        ? 'The server could not complete the request. Please try again.'
        : String(error?.message || 'The request could not be completed.'));

    res.status(status).json({ error: message });
  });

  app.use((req, res) => {
    setRevalidationHeaders(res);
    res.sendFile(path.join(config.docsDir, 'index.html'));
  });

  return app;
};
