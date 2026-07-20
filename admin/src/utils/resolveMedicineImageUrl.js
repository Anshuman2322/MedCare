const DEFAULT_ASSET_ORIGIN = (import.meta.env.VITE_MEDICINE_ASSET_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');

export function resolveMedicineImageUrl(src) {
  if (!src) return '';

  const value = String(src).trim();
  if (!value) return '';

  if (/^(https?:|data:|blob:)/i.test(value) || value.startsWith('//')) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${DEFAULT_ASSET_ORIGIN}${value}`;
  }

  return `${DEFAULT_ASSET_ORIGIN}/${value.replace(/^\/+/, '')}`;
}