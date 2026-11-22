// Public proof about the business, shown across the site. Everything here is
// either on CureNeed's IndiaMART profile (anyone can check it through the links)
// or supplied by the owner. Update the numbers here when they change.
const INDIAMART = 'https://www.indiamart.com/cureneed/';

const indiamart = {
  profileUrl: INDIAMART,
  reviewsUrl: `${INDIAMART}testimonial.html`,
  // Shown as "Rated 4.8/5 by buyers on IndiaMART".
  rating: 4.8,
  // Never shown on the site (owner's choice); only weights the combined
  // average on the reviews page so IndiaMART counts for its real size.
  ratingCount: 42,
  // IndiaMART's own sub-scores on the testimonials page.
  scores: { quality: 93, response: 88, satisfaction: 86 },
  trustSeal: { id: '229285', verified: ['GST registration', 'bank account', 'business address'] },
  checkedOn: 'November 2026',
};

export const BUSINESS = {
  indiamart,

  // Review platforms besides this website. To add one (Trustpilot, Google...):
  // add an entry here and its reviews to `externalReviews` with the same `source`.
  // It then appears in the reviews list, its badge, the filters and the
  // combined rating automatically.
  reviewSources: {
    indiamart: { name: 'IndiaMART', url: indiamart.reviewsUrl, rating: indiamart.rating, ratingCount: indiamart.ratingCount },
    // trustpilot: { name: 'Trustpilot', url: 'https://www.trustpilot.com/review/cureneed.com', rating: 4.7, ratingCount: 12 },
  },

  // Buyer countries: from IndiaMART reviews (USA, New Zealand, Kuwait,
  // Philippines, Bangladesh, Aruba, India) plus the owner (UK, Canada, Australia).
  countries: [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'New Zealand',
    'India',
    'Kuwait',
    'Philippines',
    'Bangladesh',
    'Aruba',
  ],

  // Written reviews from other platforms, quoted as posted (one word clarified
  // in brackets). Surnames are shortened to an initial. `date` is the date the
  // platform shows; `rating` is optional (IndiaMART does not show one per review).
  externalReviews: [
    { source: 'indiamart', name: 'John R.', place: 'Aruba', date: '2026-10-29', product: 'Sildenafil Tablets', text: 'Very helpful and responds back fast.' },
    { source: 'indiamart', name: 'Zac', place: 'United States', date: '2026-07-30', product: 'Tretinoin Cream', text: 'Trustworthy [seller] gave me good price and good deal.' },
    { source: 'indiamart', name: 'Torquex International', place: 'Bihar, India', date: '2026-07-01', product: null, text: 'Excellent service, genuine products, and timely delivery. Highly recommended!' },
    { source: 'indiamart', name: 'James B.', place: 'United States', date: '2026-06-02', product: 'Ivermectin Tablets', text: 'Very happy with service and product.' },
    { source: 'indiamart', name: 'Manuel', place: 'United States', date: '2026-02-11', product: 'Tadalafil Tablets', text: 'Had some shipping issues and these guys took care of me!!! Very good customer service' },
  ],
};
