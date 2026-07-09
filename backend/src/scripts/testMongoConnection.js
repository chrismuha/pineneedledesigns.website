import dns from 'node:dns/promises';
import mongoose from 'mongoose';
import { config } from '../config/index.js';

const getHostname = () => {
  const uri = config.mongoUri
    .replace(/^mongodb\+srv:/, 'https:')
    .replace(/^mongodb:/, 'https:');
  return new URL(uri).hostname;
};

const run = async () => {
  const hostname = getHostname();
  console.log(`Testing MongoDB host: ${hostname}`);

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

  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ MongoDB connection OK');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

run();
