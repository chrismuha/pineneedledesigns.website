import { connectDatabase, disconnectDatabase, runDatabaseMaintenance } from '../config/database.js';

const main = async () => {
  await connectDatabase();
  try {
    await runDatabaseMaintenance();
  } finally {
    await disconnectDatabase();
  }
};

main().catch((error) => {
  console.error('❌ Mongo maintenance failed:', error);
  process.exit(1);
});
