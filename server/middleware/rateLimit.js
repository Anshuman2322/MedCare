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

// Every accepted forgot-password request can send a real email. This per-IP cap
// sits on top of the per-account quota in passwordReset.controller.js.
export const passwordResetLimiter = rateLimit({
  windowMs,
  limit: Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

// Counts failures only, so it limits one IP guessing codes across many accounts.
export const resetVerifyLimiter = rateLimit({
  windowMs,
  limit: Number(process.env.OTP_VERIFY_RATE_LIMIT_MAX) || 20,
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

// Support chat is public and writes a document per message, so it needs a
// ceiling of its own — higher than inquiries (a real conversation is chatty)
// but well below the general API limit.
export const chatLimiter = rateLimit({
  windowMs,
  limit: Number(process.env.CHAT_RATE_LIMIT_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

// Public review form. A real customer writes one or two; anything more from one
// IP inside an hour is almost certainly spam.
export const reviewSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.REVIEW_RATE_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

// "Write it for me" drafts can call a paid AI model, so they get their own
// ceiling: enough for a customer to try several wordings, not for scripting.
export const reviewSuggestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.REVIEW_SUGGEST_RATE_LIMIT_MAX) || 20,
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
