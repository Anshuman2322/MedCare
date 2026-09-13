import rateLimit from 'express-rate-limit';

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

function jsonRateLimitHandler(req, res) {
  res.status(429).json({ error: 'Too many requests. Please try again later.' });
}

// General ceiling for all /api traffic — generous enough for normal browsing/admin use.
export const apiLimiter = rateLimit({
  windowMs,
  limit: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

// Tighter limit on login/register — the classic credential-stuffing / brute-force target.
export const authLimiter = rateLimit({
  windowMs,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: jsonRateLimitHandler,
});

// Inquiry submission is public and triggers email/WhatsApp sends — cap it to deter spam/abuse.
export const inquiryLimiter = rateLimit({
  windowMs,
  limit: Number(process.env.INQUIRY_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

// Dedicated, tight limiter for the /api/test/email diagnostic route — its sole
// purpose is sending a real email through a paid provider, so on top of the
// route being dev-only and admin-gated, it also gets its own low ceiling
// independent of (and much lower than) the general apiLimiter.
export const testEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});
