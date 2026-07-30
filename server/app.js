import express from 'express';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import mongoose from 'mongoose';
import path from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { logger } from './config/logger.js';
import medicineRoutes from './routes/medicineRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoute from './routes/uploadRoute.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import testRoutes from './routes/test.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, inquiryLimiter } from './middleware/rateLimit.js';

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
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/api/health',
    },
    // Never let request/response logs echo credentials or tokens.
    redact: ['req.headers.cookie', 'req.headers.authorization', 'req.body.password'],
  })
);

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/bootstrap', authLimiter);
app.use('/api/inquiries', inquiryLimiter);
app.use('/api/inquiry', inquiryLimiter);

app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoute);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/inquiry', inquiryRoutes);
app.use('/api/test', testRoutes);

app.get('/api/health', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: dbConnected ? 'connected' : 'disconnected',
  });
});

if (process.env.NODE_ENV === 'production') {
  const clientPath = path.resolve(__dirname, '../client/dist');
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
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
