import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import FavoriteButton from '../components/common/FavoriteButton.jsx';
import { showToast } from '../store/toastStore.js';
import RequestModal from '../components/request/RequestModal.jsx';
import { useCurrency } from '../store/useStore.jsx';
import { formatPrice } from '../utils/currency';
import { withCloudinaryTransform, variantLabel } from '../utils/medicineDisplay.js';
import { useCart, setLineQuantity, removeFromCart, clearCart, cartSubtotal } from '../store/cartStore.js';

function QuantityStepper({ value, onChange, label }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl bg-gray-100 shadow-inner">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={`Decrease quantity of ${label}`}
        className="h-10 w-10 text-lg text-gray-700 transition-colors hover:bg-gray-200/60 disabled:cursor-not-allowed disabled:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        −
      </button>
      <input
        type="number"
        min="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`Quantity of ${label}`}
        className="h-10 w-14 border-0 bg-transparent text-center text-sm font-semibold text-gray-900 [appearance:textfield] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={`Increase quantity of ${label}`}
        className="h-10 w-10 text-lg text-gray-700 transition-colors hover:bg-gray-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        +
      </button>
    </div>
  );
}

function CartLine({ line, currency }) {
  const image = withCloudinaryTransform(line.image, 240);
  const label = variantLabel(line.variant);
  const lineTotal = Number.isFinite(line.listedPrice) ? line.listedPrice * line.quantity : null;

  const handleRemove = () => {
    removeFromCart(line.lineId);
    showToast({ text: 'Removed from cart' });
  };

  return (
    <div className="flex flex-col gap-4 border-b border-gray-100 py-5 last:border-b-0 sm:flex-row">
      <Link
        to={`/medicine/${line.slug}`}
        className="shrink-0 self-start rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        {image ? (
          <img
            src={image}
            alt={line.name}
            width="96"
            height="96"
            loading="lazy"
            className="h-24 w-24 rounded-xl border border-gray-100 bg-gray-50 object-contain p-2"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-emerald-50 text-3xl" aria-hidden="true">
            💊
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/medicine/${line.slug}`}
              className="block truncate text-base font-semibold text-gray-900 hover:text-emerald-700"
            >
              {line.name}
            </Link>
            {line.manufacturer && <div className="truncate text-sm text-gray-600">{line.manufacturer}</div>}
            {label && <div className="mt-0.5 truncate text-sm text-gray-500">{label}</div>}
          </div>
          <FavoriteButton product={line} size="sm" className="shrink-0" />
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Current listed price</div>
            <div className="text-lg font-semibold text-emerald-700">
              {Number.isFinite(line.listedPrice) ? formatPrice(line.listedPrice, currency) : 'Price on request'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <QuantityStepper
              value={line.quantity}
              label={line.name}
              onChange={(next) => setLineQuantity(line.lineId, next)}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Remove
            </button>
          </div>
        </div>

        {lineTotal !== null && line.quantity > 1 && (
          <div className="mt-2 text-right text-sm text-gray-600">
            Line total: <span className="font-semibold text-gray-900">{formatPrice(lineTotal, currency)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl" aria-hidden="true">
        🛒
      </div>
      <h2 className="mt-5 text-xl font-semibold text-gray-900">Your cart is empty</h2>
      <p className="mt-2 text-sm text-gray-600">Add medicines to your cart to request pricing and availability.</p>
      <Link
        to="/shop"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
      >
        Browse Medicines
      </Link>
    </div>
  );
}

export default function Cart() {
  const { currency } = useCurrency();
  const lines = useCart();
  const [requestType, setRequestType] = useState(null);
  const submittedRef = useRef(false);

  const subtotal = cartSubtotal(lines);

  // The modal's success screen still lists what was sent, so the cart is only
  // emptied once the customer closes it.
  const handleClose = () => {
    setRequestType(null);
    if (!submittedRef.current) return;
    submittedRef.current = false;
    clearCart();
    showToast({ text: 'Request submitted — our team will be in touch' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Your Cart"
        description="Review your selected medicines before submitting a combined inquiry or requesting our best available price."
        path="/cart"
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Your Cart</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Review your selected medicines before submitting your inquiry.
          </p>
        </header>

        {lines.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between pb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {lines.length} {lines.length === 1 ? 'medicine' : 'medicines'}
                </h2>
                <Link to="/shop" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  Continue shopping
                </Link>
              </div>
              {lines.map((line) => (
                <CartLine key={line.lineId} line={line} currency={currency} />
              ))}
            </section>

            <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold text-gray-900">Cart Summary</h2>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600">Items</dt>
                  <dd className="font-semibold text-gray-900">{lines.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600">Listed Subtotal</dt>
                  <dd className="text-lg font-semibold text-emerald-700">{formatPrice(subtotal, currency)}</dd>
                </div>
              </dl>

              <p className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
                This is the total of currently listed prices, not a payable amount. Final pricing will be confirmed by our
                team.
              </p>

              <button
                type="button"
                onClick={() => setRequestType('inquiry')}
                className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
              >
                Submit Inquiry
              </button>

              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <p className="text-xs font-medium text-emerald-900">Want our best available quote for your quantity?</p>
                <button
                  type="button"
                  onClick={() => setRequestType('best_price')}
                  className="mt-2 w-full rounded-xl border border-emerald-600 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                >
                  Request Best Price
                </button>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-gray-500">
                <span className="font-semibold text-gray-700">Submit Inquiry</span> asks our team about availability,
                pricing and delivery. <span className="font-semibold text-gray-700">Request Best Price</span> asks them
                for the best quote they can offer on these exact quantities.
              </p>
            </aside>
          </div>
        )}
      </div>

      <RequestModal
        isOpen={Boolean(requestType)}
        requestType={requestType || 'inquiry'}
        items={lines}
        currency={currency}
        onClose={handleClose}
        onSubmitted={() => {
          submittedRef.current = true;
        }}
      />
    </div>
  );
}
