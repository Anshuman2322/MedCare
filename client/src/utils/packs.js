// Naming for pack types ("box", "strip", "bottle"...) in quantities and labels.
const PLURALS = { box: 'boxes', strip: 'strips', bottle: 'bottles', tube: 'tubes', vial: 'vials', jar: 'jars', sachet: 'sachets' };

export const titleCase = (text) => (text ? text[0].toUpperCase() + text.slice(1).toLowerCase() : '');

export const unitName = (pack, count) => (count === 1 ? pack : PLURALS[pack] || `${pack}s`);

// "3 bottles", or just "3" when the pack type isn't known.
export function quantityLabel(count, packagingType) {
  const pack = String(packagingType || '').trim().toLowerCase();
  return pack ? `${count} ${unitName(pack, count)}` : String(count);
}
