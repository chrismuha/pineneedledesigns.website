import dns from 'node:dns/promises';
import mongoose from 'mongoose';
import { config, getMongoDatabaseName, maskMongoUri } from '../config/index.js';
import { MONGO_CONNECT_OPTIONS } from '../config/database.js';

const getHostname = () => {
  const uri = config.mongoUri
    .replace(/^mongodb\+srv:/, 'https:')
    .replace(/^mongodb:/, 'https:');
  return new URL(uri).hostname;
};

const run = async () => {
  const hostname = getHostname();
  const dbName = getMongoDatabaseName(config.mongoUri) || '(default)';
  console.log(`Testing MongoDB host: ${hostname}`);
  console.log(`Database: ${dbName}`);
  console.log(`URI: ${maskMongoUri(config.mongoUri)}`);

  if (!config.mongoUri.startsWith('mongodb+srv:')) {
    console.log('ℹ️ Skipping SRV lookup (not a mongodb+srv URI)');
  } else {
    try {
      const srvHost = `_mongodb._tcp.${hostname}`;
      const records = await dns.resolveSrv(srvHost);
      console.log(`✅ SRV lookup OK (${records.length} record(s))`);
    } catch (error) {
      console.error('❌ SRV lookup failed:', error.message);
      console.error('The hostname in MONGODB_URI does not exist or DNS cannot resolve it.');
      console.error('Copy a fresh connection string from DigitalOcean → Databases → Connection details.');
      process.exit(1);
    }
  }

  try {
    await mongoose.connect(config.mongoUri, MONGO_CONNECT_OPTIONS);
    const ping = await mongoose.connection.db.admin().command({ ping: 1 });
    const collections = await mongoose.connection.db.listCollections().toArray();
    const names = collections.map((collection) => collection.name).filter((name) => !name.startsWith('system.'));
    const orderCount = names.includes('orders')
      ? await mongoose.connection.db.collection('orders').countDocuments()
      : 0;
    const productCount = names.includes('products')
      ? await mongoose.connection.db.collection('products').countDocuments()
      : 0;

    console.log('✅ MongoDB connection OK');
    console.log(`✅ Ping: ${ping?.ok === 1 ? 'ok' : 'unexpected'}`);
    console.log(`Connected db: ${mongoose.connection.name}`);
    console.log(`Collections: ${names.length}`);
    console.log(`Products: ${productCount}`);
    console.log(`Orders: ${orderCount}`);

    if (names.includes('orders')) {
      const indexes = await mongoose.connection.db.collection('orders').indexes();
      const paypalIndex = indexes.find((index) => index.name === 'paypalOrderId_1');
      const gatewayIndex = indexes.find((index) => index.name === 'gatewayOrderId_1');
      console.log(
        'paypalOrderId_1:',
        paypalIndex
          ? `unique=${Boolean(paypalIndex.unique)} partial=${Boolean(paypalIndex.partialFilterExpression)}`
          : 'missing',
      );
      console.log(
        'gatewayOrderId_1:',
        gatewayIndex
          ? `unique=${Boolean(gatewayIndex.unique)} partial=${Boolean(gatewayIndex.partialFilterExpression)}`
          : 'missing',
      );
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    if (/authentication failed/i.test(error.message)) {
      console.error('The host is reachable, but the username/password in MONGODB_URI was rejected.');
      console.error('Reset the database user password in DigitalOcean → Databases → Users, then update MONGODB_URI in backend/.env and the GitHub Actions secret. Do not keep a different MONGODB_URI in the repo-root .env.');
    }
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  }
};

run();
