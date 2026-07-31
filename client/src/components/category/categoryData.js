import {
  PainReliefIllustration,
  AntibioticsIllustration,
  ErectileDysfunctionIllustration,
  HeartCareIllustration,
  MensHealthIllustration,
  WomensHealthIllustration,
  PrescriptionIllustration,
  VitaminsIllustration,
  SkinCareIllustration,
  DigestiveCareIllustration,
  ColdAndFluIllustration,
  GeneralHealthIllustration,
} from './CategoryIllustrations.jsx';

// Maps a raw category name (as stored on a medicine) to display metadata:
// a premium flat illustration and a benefit-led description, in place of
// a raw "N products" count. Matched by keyword so new categories added in
// the admin panel degrade gracefully to a sensible default rather than
// breaking the section.
const CATEGORY_META = [
  { test: /pain/i, illustration: PainReliefIllustration, description: 'Fast pain relief medicines' },
  { test: /antibiot/i, illustration: AntibioticsIllustration, description: 'Trusted antibiotics' },
  { test: /erectile|^ed$/i, illustration: ErectileDysfunctionIllustration, description: "Men's wellness products" },
  { test: /heart|cardiac|chronic/i, illustration: HeartCareIllustration, description: 'Heart health solutions' },
  { test: /men'?s? health/i, illustration: MensHealthIllustration, description: "Men's wellness products" },
  { test: /women'?s? health/i, illustration: WomensHealthIllustration, description: "Women's care essentials" },
  { test: /prescription|rx/i, illustration: PrescriptionIllustration, description: 'Doctor recommended products' },
  { test: /vitamin|supplement/i, illustration: VitaminsIllustration, description: 'Daily vitamin support' },
  { test: /skin/i, illustration: SkinCareIllustration, description: 'Skin health solutions' },
  { test: /digestive|gastro/i, illustration: DigestiveCareIllustration, description: 'Digestive care essentials' },
  { test: /cold|flu|allergy|asthma/i, illustration: ColdAndFluIllustration, description: 'Cold & flu relief' },
];

export function getCategoryMeta(name) {
  const match = CATEGORY_META.find((entry) => entry.test.test(name || ''));
  if (match) return { illustration: match.illustration, description: match.description };
  return { illustration: GeneralHealthIllustration, description: 'Daily wellness essentials' };
}
