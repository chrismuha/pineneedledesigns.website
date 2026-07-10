import mongoose from 'mongoose';
import { config } from '../config/index.js';

const toDbUri = (uri, dbName) => {
  const [withoutQuery, query = ''] = uri.split('?');
  const base = withoutQuery.replace(/\/[^/]*$/, `/${dbName}`);
  return query ? `${base}?${query}` : base;
};

const summarize = async (uri) => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const cols = await db.listCollections().toArray();
  const counts = {};

  for (const col of cols) {
    if (col.name.startsWith('system.')) continue;
    try {
      counts[col.name] = await db.collection(col.name).countDocuments();
    } catch (error) {
      counts[col.name] = `error: ${error.codeName || error.message}`;
    }
  }

  const summary = {
    connectedDb: mongoose.connection.name,
    counts,
  };
  await mongoose.disconnect();
  return summary;
};

const run = async () => {
  const adminUri = toDbUri(config.mongoUri, 'admin');
  const appUri = toDbUri(config.mongoUri, 'pineneedledesigns');

  console.log('admin:', JSON.stringify(await summarize(adminUri), null, 2));
  console.log('pineneedledesigns:', JSON.stringify(await summarize(appUri), null, 2));
};

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
