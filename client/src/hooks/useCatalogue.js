import { useEffect, useState } from 'react';
import { fetchMedicines } from '../api/medicines';

/**
 * The public catalogue for components that describe it (brand strip, stats).
 * status: 'loading' | 'ready' | 'error'. Components mounting together share one
 * request, because fetchMedicines reuses an identical request still in flight.
 */
export default function useCatalogue() {
  const [state, setState] = useState({ status: 'loading', medicines: [] });

  useEffect(() => {
    let active = true;
    fetchMedicines()
      .then((meds) => active && setState({ status: 'ready', medicines: Array.isArray(meds) ? meds : [] }))
      .catch(() => active && setState({ status: 'error', medicines: [] }));
    return () => {
      active = false;
    };
  }, []);

  return state;
}
