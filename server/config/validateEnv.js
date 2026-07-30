import { logger } from './logger.js';

const REQUIRED = ['JWT_SECRET'];

// Not fatal if missing — the app already has documented graceful-degradation paths
// (no DB → read-only fallback data, no Cloudinary → uploads disabled, etc.) — but
// worth a loud warning in production so a misconfiguration doesn't go unnoticed.
const RECOMMENDED_IN_PRODUCTION = [
  'MONGO_URI',
  'CORS_ORIGINS',
  'CLOUD_NAME',
  'CLOUD_API_KEY',
  'CLOUD_API_SECRET',
];

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length) {
    logger.fatal(
      `Missing required environment variable(s): ${missing.join(', ')}. Copy server/.env.example to server/.env and fill them in.`
    );
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 16) {
    logger.fatal('JWT_SECRET is too short (minimum 16 characters) — refusing to start with a weak signing secret.');
    process.exit(1);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) return;

  if (process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET is shorter than the recommended 32 characters for a production deployment.');
  }

  const missingRecommended = RECOMMENDED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missingRecommended.length) {
    logger.warn(
      `Running in production without: ${missingRecommended.join(', ')}. The features that depend on them will be degraded or unavailable.`
    );
  }

  if (!process.env.CORS_ORIGINS) {
    logger.warn(
      'CORS_ORIGINS is not set in production — only the built-in localhost dev origins are allowed, which likely blocks your real frontend domain.'
    );
  }
}
