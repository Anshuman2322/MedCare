import express from 'express';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { logger } from './config/logger.js';
import medicineRoutes from './routes/medicineRoutes.js';
import uploadRoute from './routes/uploadRoute.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import testRoutes from './routes/test.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { requireDatabase } from './middleware/requireDatabase.js';
import {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  resetVerifyLimiter,
  inquiryLimiter,
  chatLimiter,
} from './middleware/rateLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:4173',
];
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])];

app.set('trust proxy', 1);
app.use(compression());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // A foreign origin is a refused request (403), not a server fault (500).
      const error = new Error('Not allowed by CORS');
      error.status = 403;
      return callback(error);
    },
    credentials: true,
  })
);
// Every JSON body here is a form or a catalogue record: well under 1 MB. (Images
// go to Cloudinary directly from the admin panel or through multer, not as JSON.)
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/api/health',
    },
    // Never let request/response logs echo credentials or tokens.
    redact: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.body.password',
      'req.body.otp',
      'req.body.resetToken',
      'req.body.email',
    ],
  })
);

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/bootstrap', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/verify-reset-otp', resetVerifyLimiter);
app.use('/api/auth/reset-password', resetVerifyLimiter);
app.use('/api/inquiries', inquiryLimiter);
app.use('/api/inquiry', inquiryLimiter);
app.use('/api/contact', inquiryLimiter);
app.use('/api/chat', chatLimiter);

app.use('/api/medicines', requireDatabase, medicineRoutes);
app.use('/api/upload', uploadRoute);
app.use('/api/auth', authRoutes);
app.use('/api/admin', requireDatabase, adminRoutes);
app.use('/api/categories', requireDatabase, categoryRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/inquiry', inquiryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/faq', faqRoutes);
// Internal diagnostic route (sends a real email via a paid provider on every
// hit) — never mounted in production, so a hit against it there 404s before
// any auth/rate-limit middleware even runs.
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
}

app.get('/api/health', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: dbConnected ? 'connected' : 'disconnected',
  });
});

// The API can also serve a built storefront (client/dist) as a single deployable
// unit. Only when that build is actually next to it: in the API-only Docker image
// there is none, and every non-API path should then just be a 404.
const clientPath = path.resolve(__dirname, '../client/dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(clientPath, 'index.html'))) {
  app.use(
    express.static(clientPath, {
      // Vite fingerprints built asset filenames by content hash, so they're safe
      // to cache "forever" — a new deploy produces new filenames. index.html
      // (served below, uncached) is what points browsers at the new hashes.
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
  app.get('*', (req, res, next) => {
    // Unmatched /api/* paths must fall through to the real JSON 404 handler
    // below, not be swallowed by the SPA fallback — otherwise a route that's
    // conditionally unmounted (e.g. /api/test in production) would render as
    // an HTML 200 instead of a 404.
    if (req.path.startsWith('/api/')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
