import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'CureNeed';
const DEFAULT_DESCRIPTION = 'Browse verified pharmaceutical products, trusted suppliers and transparent healthcare procurement — submit an inquiry and our team will follow up directly.';

// Note: this app has no server-side rendering, so these tags land in the DOM
// after JS runs. That's enough for Google (Googlebot executes JS), but
// crawlers that don't run JS — most link-preview bots on WhatsApp/Slack/
// Facebook/Twitter — will still see the static tags baked into index.html
// instead. Full social-preview fidelity needs SSR or a prerender step.
export default function SEO({ title, description = DEFAULT_DESCRIPTION, image, path = '', type = 'website' }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Trusted Medicines, Delivered with Clarity`;
  const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
