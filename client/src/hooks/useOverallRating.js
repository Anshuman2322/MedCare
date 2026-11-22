import { useEffect, useMemo, useState } from 'react';
import { fetchFeaturedReviews } from '../api/reviews';
import { combinedRating, externalReviews, fromSiteReview, sortReviews } from '../components/reviews/combined.js';

/**
 * One rating across every platform the business is reviewed on (this website,
 * IndiaMART, and any added later), plus the latest reviews from all of them.
 * status: 'loading' | 'ready' | 'error'. If this site's reviews can't load, the
 * other platforms still count. `refreshKey` reloads (e.g. after a new review).
 */
export default function useOverallRating(refreshKey = 0) {
  const [state, setState] = useState({ status: 'loading', summary: null, siteReviews: [] });

  useEffect(() => {
    let active = true;
    fetchFeaturedReviews()
      .then((data) => {
        if (!active) return;
        setState({
          status: 'ready',
          summary: data?.summary || null,
          siteReviews: Array.isArray(data?.reviews) ? data.reviews : [],
        });
      })
      .catch(() => active && setState({ status: 'error', summary: null, siteReviews: [] }));
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return useMemo(() => {
    const { average, platforms } = combinedRating(state.summary);
    const latest = sortReviews([...state.siteReviews.map(fromSiteReview), ...externalReviews()], 'newest');
    return { status: state.status, average, platforms, siteReviews: state.siteReviews, latest };
  }, [state]);
}
