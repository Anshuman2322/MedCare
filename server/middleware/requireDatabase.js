import mongoose from 'mongoose';

// Without a database connection the catalogue and admin routes used to answer
// from a bundled sample dataset (client/src/data/*.json) and to write admin
// changes into those files. That is a development convenience. In production
// an outage has to look like an outage (503, retry shortly), never like a store
// full of sample products or admin edits saved somewhere they'd be lost.
export function requireDatabase(_req, res, next) {
  if (process.env.NODE_ENV === 'production' && mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Service temporarily unavailable. Please try again shortly.' });
  }
  return next();
}
