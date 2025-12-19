import { Router } from 'express';
import {
  listMedicines,
  getMedicine,
  listCategories,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  restoreMedicine,
  purgeDeleted,
  addImagesToMedicine,
  removeImageFromMedicine
} from '../controllers/medicinesController.js';
import { uploadImages } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.get('/medicines', listMedicines);
router.get('/medicines/:id', getMedicine);
router.get('/categories', listCategories);
router.post('/medicines', uploadImages.array('images', 20), createMedicine);
router.put('/medicines/:id', uploadImages.array('images', 20), updateMedicine);
router.delete('/medicines/:id', deleteMedicine);
router.put('/medicines/:id/restore', restoreMedicine);
router.post('/medicines/purge', purgeDeleted);

// Image ops for an existing medicine
router.post('/medicines/:id/images', uploadImages.array('images', 20), addImagesToMedicine);
router.delete('/medicines/:id/images', removeImageFromMedicine);
// Reorder images for a medicine
router.put('/medicines/:id/images/order', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order } = req.body || {};
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of URLs' });
    const data = await (await import('../controllers/medicinesController.js')).readJson?.();
    // Fallback: re-read using internal function when not exported
    const fsmod = await import('node:fs/promises');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const ROOT = path.resolve(__dirname, '..', '..');
    const DATA_JSON_PATH = path.resolve(ROOT, 'src', 'data', 'medicines.json');
    const raw = await fsmod.readFile(DATA_JSON_PATH, 'utf-8');
    const list = JSON.parse(raw);
    const entry = list.find((m) => m.id === id);
    if (!entry) return res.status(404).json({ error: 'Not found' });
    const current = Array.isArray(entry.images) ? entry.images.slice() : [];
    const set = new Set(current);
    const next = order.filter((u) => set.has(u));
    for (const u of current) if (!next.includes(u)) next.push(u);
    entry.images = next;
    entry.image = entry.images[0] || '';
    await fsmod.writeFile(DATA_JSON_PATH, JSON.stringify(list, null, 2), 'utf-8');
    res.json({ images: entry.images });
  } catch (err) {
    next(err);
  }
});

export default router;
