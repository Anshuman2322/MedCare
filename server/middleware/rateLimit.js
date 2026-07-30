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
