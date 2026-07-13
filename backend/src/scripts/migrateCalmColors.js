import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { Product } from '../models/Product.js';

const OPTIONS = ['Pepper', 'Butter', 'Ivory', 'White', 'Natural White'];

const run = async () => {
  await mongoose.connect(config.mongoUri);
  const products = await Product.find({ 'customProperties.name': /^calm colors$/i });
  let migrated = 0;

  for (const product of products) {
    const property = product.customProperties.find(({ name }) => /^calm colors$/i.test(String(name).trim()));
    const selected = new Set((property?.options || []).map((value) => (
      /^white\s*\(natural\)$/i.test(String(value).trim()) ? 'natural white' : String(value).trim().toLowerCase()
    )));
    product.calmColors = OPTIONS.filter((option) => selected.has(option.toLowerCase()));
    product.customProperties = product.customProperties.filter(({ name }) => !/^calm colors$/i.test(String(name).trim()));
    await product.save();
    migrated += 1;
  }

  console.log(`Migrated Calm Colors for ${migrated} product(s).`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
