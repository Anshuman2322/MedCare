export function notFound(_req, res, _next) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  console.error('[API Error]', status, err.message);
  res.status(status).json({ error: err.message || 'Server error' });
}
