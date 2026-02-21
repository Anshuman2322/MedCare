import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Medicine from '../server/src/models/Medicine.js';
import { connectDB } from '../server/src/config/db.js';

dotenv.config();

const JSON_PATH = process.env.LEGACY_JSON_PATH || path.resolve('src/data/medicines.json');

async function run() {
  await connectDB();
  const raw = await fs.readFile(JSON_PATH, 'utf-8');
  const items = JSON.parse(raw);
  const docs = items.map((m) => ({
    name: m.name,
    category: m.category || 'General',
    price: Number(m.price) || 0,
    form: m.form || 'Tablet',
    description: m.description || '',
    manufacturer: m.manufacturer || '',
    composition: m.composition || '',
    requiresPrescription: m.requiresPrescription !== false,
    inStock: m.inStock !== false,
    dosage: m.dosage || '',
    usage: m.usage || '',
    image: Array.isArray(m.images) ? m.images[0] : m.image || '',
    images: Array.isArray(m.images) ? m.images : [],
  }));

  await Medicine.insertMany(docs, { ordered: false });
  console.log(`Imported ${docs.length} medicines`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
