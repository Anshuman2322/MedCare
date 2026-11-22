import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import FavoriteButton from '../components/common/FavoriteButton.jsx';
import { showToast } from '../store/toastStore.js';
import { useCurrency } from '../store/useStore.jsx';
import { formatPrice } from '../utils/currency';
import { withCloudinaryTransform, parseMedicinePrice } from '../utils/medicineDisplay.js';
import { fetchMedicines } from '../api/medicines';
import { useFavorites } from '../store/favoritesStore.js';
import { addToCart } from '../store/cartStore.js';

function FavoriteCard({ product, currency }) {
  const image = withCloudinaryTransform(product.image || product.images?.[0], 320);
  const price = parseMedicinePrice(product);
  const category = Array.isArray(product.categories) && product.categories.length ? product.categories[0] : product.category;
  const available = product.inStock !== false;

  const handleAddToCart = () => {
    addToCart(product, { quantity: 1 });
    showToast({ text: 'Added to cart', actionLabel: 'View Cart', actionTo: '/cart' });
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <FavoriteButton product={product} size="sm" className="absolute right-3 top-3 z-10" />

      <Link
        to={`/medicine/${product.slug}`}
        className="flex h-40 items-center justify-center bg-gray-50 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        {image ? (
          <img src={image} alt={product.name} loading="lazy" className="h-full w-auto max-w-full object-contain" />
        ) : (
          <span className="text-4xl" aria-hidden="true">💊</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {category && <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{category}</div>}
        <Link to={`/medicine/${product.slug}`} className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900 hover:text-emerald-700">
          {product.name}
        </Link>
        {product.manufacturer && <div className="mt-0.5 truncate text-xs text-gray-600">{product.manufacturer}</div>}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold text-emerald-700">{formatPrice(price, currency)}</span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${available ? 'text-emerald-700' : 'text-red-600'}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-red-400'}`} aria-hidden="true" />
            {available ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            to={`/medicine/${product.slug}`}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Favorites() {
  const { currency } = useCurrency();
  const favoriteSlugs = useFavorites();
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Favourites store slugs only, so price and availability are always read back
  // from the catalogue rather than from a snapshot saved months ago.
  useEffect(() => {
    let active = true;
    fetchMedicines()
      .then((list) => {
        if (active) setCatalogue(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (active) setError('Unable to load your favorites right now.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const products = useMemo(() => {
    const wanted = new Set(favoriteSlugs);
    return catalogue.filter((item) => wanted.has(item.slug) || wanted.has(String(item._id)));
  }, [catalogue, favoriteSlugs]);

  const missingCount = favoriteSlugs.length - products.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title="Your Favorites" description="Medicines you saved to request later on CureNeed." path="/favorites" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Your Favorites</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">Save medicines you may want to request later.</p>
        </header>

        {loading && <p className="py-16 text-center text-sm text-gray-500">Loading your favorites…</p>}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl" aria-hidden="true">
              ♡
            </div>
            <h2 className="mt-5 text-xl font-semibold text-gray-900">No favorites yet</h2>
            <p className="mt-2 text-sm text-gray-600">
              Tap the heart on any medicine to save it here for later.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            >
              Browse Medicines
            </Link>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <FavoriteCard key={product.slug || product._id} product={product} currency={currency} />
              ))}
            </div>
            {missingCount > 0 && (
              <p className="mt-6 text-xs text-gray-500">
                {missingCount} saved {missingCount === 1 ? 'medicine is' : 'medicines are'} no longer in the catalogue.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
