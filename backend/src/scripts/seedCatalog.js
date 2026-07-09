import { connectDatabase } from '../config/database.js';
import mongoose from 'mongoose';

const run = async () => {
  await connectDatabase();
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Catalog seed failed:', error);
  process.exit(1);
});
