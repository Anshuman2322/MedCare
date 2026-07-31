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
  DiabetesCareIllustration,
  FirstAidIllustration,
  MentalWellnessIllustration,
  AllergyReliefIllustration,
  BabyCareIllustration,
  PersonalCareIllustration,
  MedicalDevicesIllustration,
} from './CategoryIllustrations.jsx';

// Curated browse list for the homepage category carousel. This always
// shows the full set of categories customers expect to be able to
// explore on a premium US pharmacy site, rather than shrinking to
// whatever 2-3 categories happen to have stock today - some may return
// zero products until more inventory is seeded, same as any other filter.
export const CAROUSEL_CATEGORIES = [
  { name: 'Pain Relief', description: 'Fast pain relief medicines', illustration: PainReliefIllustration },
  { name: "Men's Health", description: "Men's wellness products", illustration: MensHealthIllustration },
  { name: "Women's Health", description: "Women's care essentials", illustration: WomensHealthIllustration },
  { name: 'Heart Care', description: 'Heart health solutions', illustration: HeartCareIllustration },
  { name: 'Diabetes Care', description: 'Blood sugar management support', illustration: DiabetesCareIllustration },
  { name: 'Cold & Flu', description: 'Cold & flu relief', illustration: ColdAndFluIllustration },
  { name: 'Skin Care', description: 'Skin health solutions', illustration: SkinCareIllustration },
  { name: 'Digestive Health', description: 'Digestive care essentials', illustration: DigestiveCareIllustration },
  { name: 'Vitamins & Supplements', description: 'Daily vitamin support', illustration: VitaminsIllustration },
  { name: 'First Aid', description: 'Everyday first aid essentials', illustration: FirstAidIllustration },
  { name: 'Prescription Medicines', description: 'Doctor recommended products', illustration: PrescriptionIllustration },
  { name: 'Mental Wellness', description: 'Support for mind and mood', illustration: MentalWellnessIllustration },
  { name: 'Allergy Relief', description: 'Fast seasonal allergy relief', illustration: AllergyReliefIllustration },
  { name: 'Baby Care', description: 'Gentle care for your little one', illustration: BabyCareIllustration },
  { name: 'Personal Care', description: 'Daily hygiene essentials', illustration: PersonalCareIllustration },
  { name: 'Medical Devices', description: 'Trusted home health devices', illustration: MedicalDevicesIllustration },
  { name: 'Antibiotics', description: 'Trusted antibiotics', illustration: AntibioticsIllustration },
  { name: 'Erectile Dysfunction', description: "Men's wellness products", illustration: ErectileDysfunctionIllustration },
];
