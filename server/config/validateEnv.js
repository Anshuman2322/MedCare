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

// Optional numeric overrides consumed via `Number(process.env.X) || default`
// in rateLimit.js — that pattern silently falls back to the default on both
// "unset" and "set but not a number", so validation here is what gives an
// operator visibility into which case they're actually in.
const OPTIONAL_NUMERIC = {
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX: 300,
  AUTH_RATE_LIMIT_MAX: 20,
  INQUIRY_RATE_LIMIT_MAX: 30,
};

function validateOptionalNumericEnv() {
  for (const [key, defaultValue] of Object.entries(OPTIONAL_NUMERIC)) {
    const raw = process.env[key];

    if (raw === undefined) {
      logger.info(`${key} not set — using default of ${defaultValue}.`);
      continue;
    }

    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      logger.fatal(`${key} must be a positive integer if set (got "${raw}").`);
      process.exit(1);
    }
  }
}

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

  validateOptionalNumericEnv();

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
