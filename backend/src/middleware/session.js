import session from 'express-session';
import sessionFileStore from 'session-file-store';
import { config } from '../config/index.js';

const FileStore = sessionFileStore(session);

export const createSessionMiddleware = () => {
  if (!config.sessionSecret) {
    throw new Error('SESSION_SECRET is required in production.');
  }

  const useSecureCookie = config.isProduction && config.appBaseUrl.startsWith('https://');

  return session({
    store: new FileStore({
      path: config.sessionDir,
      ttl: 24 * 60 * 60,
      retries: 1,
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: useSecureCookie,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
};
