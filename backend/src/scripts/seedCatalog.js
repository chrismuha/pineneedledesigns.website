import { connectDatabase } from '../config/database.js';
import mongoose from 'mongoose';
import { seedCatalog } from '../services/catalogSeed.js';

const run = async () => {
  await connectDatabase();
  await seedCatalog();
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Catalog seed failed:', error);
  process.exit(1);
});
