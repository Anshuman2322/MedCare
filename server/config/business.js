// Public business details used in customer-facing emails and the support chat.
// They match the storefront's client/src/config/contact.js; change both together.
export const BUSINESS = {
  name: 'CureNeed',
  tagline: 'Trust in every dose',
  email: 'cureneed@gmail.com',
  phone: '+91 77190 82210',
  phoneHref: 'tel:+917719082210',
  indiamartUrl: 'https://www.indiamart.com/cureneed/',
  // Same list as client/src/config/business.js (buyer countries the owner
  // confirmed). Other destinations are confirmed per inquiry.
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
  // What IndiaMART's TrustSEAL verified, as shown on the About page.
  verified: ['GST registration', 'bank account', 'business address'],
};

// The storefront's public address, used for links in emails.
const DEFAULT_SITE_URL = 'https://www.cureneed.com';

// PUBLIC_SITE_URL can point links elsewhere (e.g. a staging site); anything
// that isn't an http(s) URL is ignored.
export function siteUrl() {
  const configured = (process.env.PUBLIC_SITE_URL || '').trim();
  return (/^https?:\/\/[^\s/]+(\/[^\s]*)?$/i.test(configured) ? configured : DEFAULT_SITE_URL).replace(/\/+$/, '');
}
