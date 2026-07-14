import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
dotenv.config({ path: envPath });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pineneedledesigns';

if (process.env.NODE_ENV === 'production' && (!process.env.MONGODB_URI || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost'))) {
  throw new Error(
    'Production requires MONGODB_URI pointing to DigitalOcean MongoDB. '
    + 'Set the GitHub Actions secret MONGODB_URI and redeploy.',
  );
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  isProduction: process.env.NODE_ENV === 'production',
  mongoUri,
  sessionSecret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-only'),
  appBaseUrl: process.env.APP_BASE_URL || (process.env.NODE_ENV === 'production'
    ? 'https://pineneedledesigns.store'
    : 'http://localhost:5173'),
  docsDir: path.join(rootDir, 'docs'),
  sessionDir: path.join(rootDir, '.sessions'),
  uploadsDir: path.join(rootDir, 'backend', 'uploads'),
  productionMediaOrigin: process.env.PRODUCTION_MEDIA_ORIGIN || 'https://pineneedledesigns.store',
  allowedOrigins: [
    'http://localhost:5173',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'https://pineneedledesigns.store',
    'https://www.pineneedledesigns.store',
  ],
  email: {
    sender: process.env.EMAIL,
    recipients: process.env.ORDER_EMAILS,
    resendFrom: process.env.RESEND_FROM || 'orders@pineneedledesigns.store',
    resendApiKey: process.env.RESEND_API_KEY,
    appPassword: process.env.EMAIL_APP_PASSWORD,
  },
  paypal: {
    bookingDepositsEnabled: String(process.env.PAYPAL_BOOKING_DEPOSITS_ENABLED || '').toLowerCase() === 'true',
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    sandboxClientId: process.env.SANDBOX_PAYPAL_CLIENT_ID,
    sandboxClientSecret: process.env.SANDBOX_PAYPAL_CLIENT_SECRET,
  },
};

export const isLocalApp = config.appBaseUrl.includes('localhost')
  || config.appBaseUrl.includes('127.0.0.1')
  || config.appBaseUrl.startsWith('http://');
