import {
  PainReliefIllustration,
  AntibioticsIllustration,
  ErectileDysfunctionIllustration,
  HeartCareIllustration,
  VitaminsIllustration,
  SkinCareIllustration,
  DigestiveCareIllustration,
  ColdAndFluIllustration,
  DiabetesCareIllustration,
  MentalWellnessIllustration,
  EyeCareIllustration,
  AntiParasiticIllustration,
  AntiMalarialIllustration,
} from './CategoryIllustrations.jsx';

// Carousel entries are sourced directly from the real category taxonomy
// (server/scripts/seedCategories.js / the Category model - the admin
// medicine form's Category field is a <select> populated from that same
// list, so any category added there in the future is guaranteed to line
// up with one of these cards). What's NOT okay is a card linking to a
// category name that doesn't exist in the taxonomy at all, which is the bug
// this replaced: 15 of the previous 18 entries (Heart Care, Baby Care, Cold &
// Flu, etc.) used invented category names with zero path to ever matching a
// product.
//
// `category` is the value stored on products when it differs from the card's
// display name. CategorySection hides cards whose category has no products on
// the public site yet, so every card leads somewhere.
export const CAROUSEL_CATEGORIES = [
  { name: 'Antibiotics', description: 'Antibiotics for bacterial infections', illustration: AntibioticsIllustration },
  { name: 'Erectile Dysfunction', category: 'ED', description: "Men's wellness products", illustration: ErectileDysfunctionIllustration },
  { name: 'Anti-Parasitic', description: 'Treatments for worm and parasite infections', illustration: AntiParasiticIllustration },
  { name: 'Eye Care', description: 'Eye drops for dryness and allergy', illustration: EyeCareIllustration },
  { name: 'Pain Relief', description: 'Pain and fever relief medicines', illustration: PainReliefIllustration },
  { name: 'Anti-Malarial', description: 'Medicines used against malaria', illustration: AntiMalarialIllustration },
  { name: 'Dermatology', description: 'Skin health solutions', illustration: SkinCareIllustration },
  { name: 'Mental Health', description: 'Medicines for anxiety and depression', illustration: MentalWellnessIllustration },
  { name: 'Diabetes', description: 'Blood sugar management support', illustration: DiabetesCareIllustration },
  { name: 'Cardiology', description: 'Heart health medicines', illustration: HeartCareIllustration },
  { name: 'Multivitamins', description: 'Daily vitamin support', illustration: VitaminsIllustration },
  { name: 'Respiratory Care', description: 'Relief for cold, cough & breathing', illustration: ColdAndFluIllustration },
  { name: 'Gastro Care', description: 'Digestive health essentials', illustration: DigestiveCareIllustration },
];

/**
 * Cards for the categories that have products on the public site, each with
 * its product count. Until the catalogue loads (or if it fails) every card is
 * shown without a count, as before.
 */
export function categoriesWithProducts(categories, medicines, ready) {
  if (!ready) return categories;
  const counts = new Map();
  for (const med of Array.isArray(medicines) ? medicines : []) {
    const key = String(med?.category || '').trim().toLowerCase();
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return categories
    .map((c) => ({ ...c, count: counts.get((c.category || c.name).toLowerCase()) || 0 }))
    .filter((c) => c.count > 0);
}
