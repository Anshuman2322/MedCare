import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import medicinesRouter from './routes/medicines.js';
import uploadRouter from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Serve shared images folder so admin can preview
app.use('/medicines', express.static(path.join(PUBLIC_DIR, 'medicines')));

// API routes
app.use('/api', medicinesRouter);
app.use('/api', uploadRouter);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  // Log full error to help troubleshoot 500s
  // eslint-disable-next-line no-console
  console.error('[API Error]', { status, message: err.message, stack: err.stack });
  res.status(status).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`Serving images from ${path.join(PUBLIC_DIR, 'medicines')}`);
});
