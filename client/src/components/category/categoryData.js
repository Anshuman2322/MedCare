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
} from './CategoryIllustrations.jsx';

// Carousel entries are sourced directly from the real category taxonomy
// (server/scripts/seedCategories.js / the Category model - the admin
// medicine form's Category field is a <select> populated from that same
// list, so any category added there in the future is guaranteed to line
// up with one of these cards). Some may currently show 0 products until
// inventory is seeded for them, same as any other filter - that's
// expected. What's NOT okay is a card linking to a category name that
// doesn't exist in the taxonomy at all, which is the bug this replaced:
// 15 of the previous 18 entries (Heart Care, Baby Care, Cold & Flu, etc.)
// used invented category names with zero path to ever matching a product.
export const CAROUSEL_CATEGORIES = [
  { name: 'Antibiotics', description: 'Trusted antibiotics', illustration: AntibioticsIllustration },
  { name: 'Pain Relief', description: 'Fast pain relief medicines', illustration: PainReliefIllustration },
  { name: 'Erectile Dysfunction', description: "Men's wellness products", illustration: ErectileDysfunctionIllustration },
  { name: 'Cardiology', description: 'Heart health medicines', illustration: HeartCareIllustration },
  { name: 'Diabetes', description: 'Blood sugar management support', illustration: DiabetesCareIllustration },
  { name: 'Multivitamins', description: 'Daily vitamin support', illustration: VitaminsIllustration },
  { name: 'Dermatology', description: 'Skin health solutions', illustration: SkinCareIllustration },
  { name: 'Respiratory Care', description: 'Relief for cold, cough & breathing', illustration: ColdAndFluIllustration },
  { name: 'Gastro Care', description: 'Digestive health essentials', illustration: DigestiveCareIllustration },
];
