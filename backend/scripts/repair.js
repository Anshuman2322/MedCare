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
  }
  if (changed) {
    await fsp.writeFile(DATA_JSON_PATH, JSON.stringify(list, null, 2), 'utf-8');
    console.log(`Repaired ${changed} entries`);
  } else {
    console.log('No changes made');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
