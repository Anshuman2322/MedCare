import path from 'node:path';
import fsp from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const DATA_JSON_PATH = path.resolve(ROOT, 'src', 'data', 'medicines.json');
const PUBLIC_MEDICINES_DIR = path.resolve(ROOT, 'public', 'medicines');

const slug = (s) => s.toString().trim().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
const imageUrl = (id, file) => `/medicines/${id}/${file}`;

async function main() {
  const raw = await fsp.readFile(DATA_JSON_PATH, 'utf-8');
  const list = JSON.parse(raw);
  let changed = 0;
  const PREDEFINED = [
    'Brand Name','Manufacturer','Strength','Composition','Form','Pack Size','Packaging Type','Tablets in a Strip','Shelf Life','Category','Medicine Type','Storage'
  ];
  for (const m of list) {
    const id = slug(m.id || m.name || '');
    const dir = path.join(PUBLIC_MEDICINES_DIR, id);
    try {
      const files = await fsp.readdir(dir);
      const imgs = files
        .filter((f) => /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(f))
        .sort((a, b) => {
          const na = parseInt(a, 10);
          const nb = parseInt(b, 10);
          if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
          return a.localeCompare(b);
        })
        .map((f) => imageUrl(id, f));
      if (imgs.length) {
        m.id = id;
        m.images = imgs;
        m.image = imgs[0];
        changed++;
      }
    } catch {
      // folder missing; skip
    }
    // Ensure categories array includes primary category
    if (!Array.isArray(m.categories) || m.categories.length === 0) {
      if (m.category) m.categories = [m.category];
      else m.categories = [];
      changed++;
    }
    // Ensure predefined details rows exist
    const by = new Map();
    for (const r of Array.isArray(m.details) ? m.details : []) {
      if (r?.label) by.set(r.label, { label: r.label, value: String(r.value ?? '') });
    }
    const defaults = new Map([
      ['Brand Name', m.name ?? ''],
      ['Manufacturer', m.manufacturer ?? ''],
      ['Strength', (by.get('Strength')?.value) || ''],
      ['Composition', m.composition ?? by.get('Composition')?.value || ''],
      ['Form', m.form ?? ''],
      ['Pack Size', by.get('Pack Size')?.value || ''],
      ['Packaging Type', by.get('Packaging Type')?.value || ''],
      ['Tablets in a Strip', by.get('Tablets in a Strip')?.value || ''],
      ['Shelf Life', by.get('Shelf Life')?.value || ''],
      ['Category', m.category ?? ''],
      ['Medicine Type', by.get('Medicine Type')?.value || ''],
      ['Storage', by.get('Storage')?.value || '']
    ]);
    const merged = [];
    for (const label of PREDEFINED) {
      const val = (by.get(label)?.value) ?? (defaults.get(label) ?? '');
      merged.push({ label, value: val });
      by.delete(label);
    }
    for (const rest of by.values()) merged.push(rest);
    if (JSON.stringify(merged) !== JSON.stringify(m.details || [])) {
      m.details = merged;
      changed++;
    }
    if (m.composition == null) {
      const fromDetails = merged.find(r => r.label === 'Composition')?.value || '';
      m.composition = fromDetails;
      changed++;
    }
  }
  if (changed) {
    await fsp.writeFile(DATA_JSON_PATH, JSON.stringify(list, null, 2), 'utf-8');
    console.log(`Repaired ${changed} entries`);
  } else {
    console.log('No changes made');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
