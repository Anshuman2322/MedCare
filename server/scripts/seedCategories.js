import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from '../models/Category.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categories = [
  'Antibiotics',
  'Pain Relief',
  'Cardiology',
  'Diabetes',
  'Multivitamins',
  'Dermatology',
  'Respiratory Care',
  'Gastro Care',
  'ED',
];

const makeSlug = (name) =>
  name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

async function seed() {
  try {
    await connectDB();
    let inserted = 0;
    for (const name of categories) {
      const slug = makeSlug(name);
      const res = await Category.updateOne(
        { slug },
        { $setOnInsert: { name, slug, description: '', isActive: true } },
        { upsert: true }
      );
      if (res.upsertedCount > 0) inserted += 1;
    }
    console.log(`Seeding complete. Inserted ${inserted} new categories.`);
  } catch (err) {
    console.error('Seeding failed', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
