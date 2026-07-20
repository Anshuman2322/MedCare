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

export function resolveMedicineImage(medicine) {
  return medicine?.image || medicine?.images?.[0] || '';
}