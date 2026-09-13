export function parseMedicinePrice(medicine) {
  const candidates = [
    medicine?.price,
    medicine?.variants?.[0]?.price,
    medicine?.defaultVariant?.price,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === '') continue;

    const normalized = typeof candidate === 'string'
      ? candidate.replace(/[^0-9.-]/g, '')
      : candidate;
    const value = Number(normalized);
    if (Number.isFinite(value)) return value;
  }

  return 0;
}

// Inserts Cloudinary's auto-format/auto-quality/width transform right after
// "/upload/" in a Cloudinary delivery URL, so images are served as
// WebP/AVIF at (roughly) the size they're actually rendered at instead of
// their original upload resolution/format. Non-Cloudinary URLs (or ones
// that already carry a transformation) pass through untouched.
export function withCloudinaryTransform(url, width) {
  if (!url || !width) return url || '';
  if (!/res\.cloudinary\.com/.test(url)) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}

export function resolveMedicineImage(medicine, width) {
  const url = medicine?.image || medicine?.images?.[0] || '';
  return withCloudinaryTransform(url, width);
}