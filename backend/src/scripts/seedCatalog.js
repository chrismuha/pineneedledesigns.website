import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { seedCatalog } from '../services/catalogSeed.js';

const run = async () => {
  await connectDatabase();
  await seedCatalog();
  await disconnectDatabase();
  process.exit(0);
};

run().catch((error) => {
  console.error('Catalog seed failed:', error);
  process.exit(1);
});
