// Facts derived from the live public catalogue, so every number and brand the
// site shows about itself is true at the moment it is shown.

const CATEGORY_STYLE = {
  'ED': { icon: 'capsule', color: '#2563eb' },
  'Mental Health': { icon: 'wave', color: '#7c3aed' },
  'Anti-Parasitic': { icon: 'shield', color: '#00a86b' },
  'Anti-Malarial': { icon: 'hexagon', color: '#0d9488' },
  'Antibiotics': { icon: 'cross', color: '#0891b2' },
  'Eye Care': { icon: 'eye', color: '#0ea5e9' },
  'Dermatology': { icon: 'leaf', color: '#16a34a' },
  'Diabetes': { icon: 'droplet', color: '#db2777' },
  'Pain Relief': { icon: 'heart', color: '#e11d48' },
};
const DEFAULT_STYLE = { icon: 'capsule', color: '#64748b' };

const list = (medicines) => (Array.isArray(medicines) ? medicines.filter(Boolean) : []);

/**
 * Brands of the products currently on the public site. A brand only counts when
 * the product is sold under it (the brand appears in the product name), so a
 * company name or a placeholder in the brand field never shows up, and the shop
 * search a brand links to always finds it. Each category is spread evenly along
 * the result, so a category with many brands is not bunched up in one stretch.
 */
export function brandsFromCatalogue(medicines) {
  const byName = new Map();
  for (const med of list(medicines)) {
    const brand = String(med.brand || '').trim();
    if (!brand || !String(med.name || '').toLowerCase().includes(brand.toLowerCase())) continue;
    const key = brand.toLowerCase();
    const entry = byName.get(key) || { name: brand, count: 0, categories: new Map() };
    entry.count += 1;
    const category = med.category || '';
    entry.categories.set(category, (entry.categories.get(category) || 0) + 1);
    byName.set(key, entry);
  }

  const groups = new Map();
  for (const entry of byName.values()) {
    const [category] = [...entry.categories].sort((a, b) => b[1] - a[1])[0];
    const brand = { name: entry.name, count: entry.count, category, ...(CATEGORY_STYLE[category] || DEFAULT_STYLE) };
    groups.set(category, [...(groups.get(category) || []), brand]);
  }

  // Brand i of a category with n brands sits at (i + 0.5) / n along the strip.
  const placed = [...groups.values()].flatMap((group) =>
    group
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .map((brand, i) => ({ brand, at: (i + 0.5) / group.length, size: group.length }))
  );
  placed.sort((a, b) => a.at - b.at || b.size - a.size || a.brand.category.localeCompare(b.brand.category));
  return placed.map(({ brand }) => {
    const shown = { ...brand };
    delete shown.category; // only needed for ordering
    return shown;
  });
}

/** Counts for the stats strips: products, brands and categories on the public site. */
export function catalogueStats(medicines) {
  const meds = list(medicines);
  return {
    products: meds.length,
    brands: brandsFromCatalogue(meds).length,
    categories: new Set(meds.map((m) => String(m.category || '').trim()).filter(Boolean)).size,
  };
}
