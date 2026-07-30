import { logger } from '../config/logger.js';

export function notFound(_req, res, _next) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  logger.error(
    { err, status, method: req.method, url: req.originalUrl, reqId: req.id },
    err.message
  );

  // Controller-thrown errors (validation, 4xx) carry an intentional, safe-to-show
  // message. Unexpected 5xx failures may leak internals (driver errors, stack
  // traces) — mask those behind a generic message once in production.
  const message = status >= 500 && isProduction ? 'Internal server error' : err.message || 'Server error';

  res.status(status).json({ error: message });
}
