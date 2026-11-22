// One list and one rating across every review platform: this website's own
// reviews plus the ones in BUSINESS.externalReviews (IndiaMART today, others
// later). Every review gets the same shape, so cards only look at `source`.
import { BUSINESS } from '../../config/business';

export const SITE_SOURCE = 'cureneed';

/** Display name for a source key ("cureneed" -> "CureNeed"). */
export const sourceName = (key) => (key === SITE_SOURCE ? 'CureNeed' : BUSINESS.reviewSources[key]?.name || key);

export const fromSiteReview = (r) => ({
  id: `site-${r.id}`,
  source: SITE_SOURCE,
  author: r.author,
  place: r.country || '',
  date: r.createdAt,
  rating: r.rating,
  title: r.title || '',
  body: r.body,
  topics: r.topics || [],
  verifiedBuyer: Boolean(r.verifiedBuyer),
  reply: r.reply || '',
  product: r.product ? { name: r.product.name, slug: r.product.slug } : null,
});

export const fromExternalReview = (r, i) => ({
  id: `${r.source}-${i}`,
  source: r.source,
  author: r.name,
  place: r.place || '',
  date: r.date,
  rating: typeof r.rating === 'number' ? r.rating : null,
  title: r.title || '',
  body: r.text,
  topics: [],
  verifiedBuyer: false,
  reply: '',
  product: r.product ? { name: r.product, slug: null } : null,
});

export const externalReviews = () =>
  BUSINESS.externalReviews.filter((r) => BUSINESS.reviewSources[r.source]).map(fromExternalReview);

const time = (value) => new Date(value).getTime() || 0;

/** newest | highest | lowest. Reviews without a star rating go after rated ones when sorting by stars. */
export function sortReviews(list, sort) {
  const copy = [...list];
  if (sort === 'highest' || sort === 'lowest') {
    const dir = sort === 'highest' ? -1 : 1;
    return copy.sort((a, b) => {
      if (a.rating == null || b.rating == null) return (a.rating == null) - (b.rating == null) || time(b.date) - time(a.date);
      return dir * (a.rating - b.rating) || time(b.date) - time(a.date);
    });
  }
  return copy.sort((a, b) => time(b.date) - time(a.date));
}

/**
 * Average across platforms, each weighted by its number of ratings, plus each
 * platform's own rating. `site` is this website's summary ({ average, count }).
 */
export function combinedRating(site) {
  const platforms = [];
  if (site?.count) platforms.push({ key: SITE_SOURCE, name: 'CureNeed', rating: site.average, count: site.count, url: null });
  for (const [key, s] of Object.entries(BUSINESS.reviewSources)) {
    if (s.rating) platforms.push({ key, name: s.name, rating: s.rating, count: s.ratingCount || 1, url: s.url });
  }
  const weight = platforms.reduce((sum, p) => sum + p.count, 0);
  const average = weight ? Math.round((platforms.reduce((sum, p) => sum + p.rating * p.count, 0) / weight) * 10) / 10 : 0;
  // Counts only weight the average; they are not shown.
  return { average, platforms: platforms.map((p) => ({ key: p.key, name: p.name, rating: p.rating, url: p.url })) };
}
