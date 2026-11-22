import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/currency';
import { withCloudinaryTransform } from '../../utils/medicineDisplay';

// Site paths, emails and phone numbers in a reply become links. Only known
// storefront paths are linked, so a reply can never point anywhere else.
const SITE_PATHS = /^\/(?:about|contact|faq|reviews|shop|shipping-policy|privacy-policy|terms-of-service|cart|medicine\/[a-z0-9-]+)(?:\?[^\s]*)?$/i;
const TOKEN = /(\/[a-z][a-z0-9/?=&%.-]*[a-z0-9]|[^\s@]+@[^\s@]+\.[a-z]{2,}|\+\d[\d ]{8,}\d)/gi;

function RichText({ text, onNavigate }) {
  const parts = String(text || '').split(TOKEN);
  return parts.map((part, index) => {
    if (index % 2 === 0) return part;
    const linkClass = 'font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800';
    if (part.startsWith('/') && SITE_PATHS.test(part)) {
      return (
        <Link key={index} to={part} onClick={onNavigate} className={linkClass}>
          {part}
        </Link>
      );
    }
    if (part.includes('@')) {
      return (
        <a key={index} href={`mailto:${part}`} className={linkClass}>
          {part}
        </a>
      );
    }
    if (part.startsWith('+')) {
      return (
        <a key={index} href={`tel:${part.replace(/\s+/g, '')}`} className={linkClass}>
          {part}
        </a>
      );
    }
    return part;
  });
}

const formatTime = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

function MedicineCard({ card, currency, onInquire, onNavigate }) {
  const image = withCloudinaryTransform(card.image, 120);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        {image ? (
          <img
            src={image}
            alt=""
            width="48"
            height="48"
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-lg border border-gray-100 bg-gray-50 object-contain"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-lg" aria-hidden="true">
            💊
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-gray-900">{card.name}</div>
          {card.category && <div className="truncate text-xs text-gray-500">{card.category}</div>}

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-emerald-700">
              {card.price === null || card.price === undefined
                ? 'Price on request'
                : formatPrice(card.price, currency)}
            </span>
            {!card.inStock && (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                Out of stock
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Link
          to={`/medicine/${card.slug}`}
          onClick={onNavigate}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-center text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          View Medicine
        </Link>
        <button
          type="button"
          onClick={() => onInquire(card)}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          Send Inquiry
        </button>
      </div>
    </div>
  );
}

export default function ChatMessage({ message, currency, onAction, onInquire, onNavigate, disabled }) {
  const isUser = message.role === 'user';
  const isAgent = message.role === 'agent';

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      {isAgent && (
        <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          {message.agentName || 'CureNeed Support'}
        </span>
      )}

      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md bg-emerald-600 text-white'
            : 'rounded-bl-md border border-emerald-100 bg-emerald-50/70 text-gray-800'
        }`}
      >
        {isUser ? message.text : <RichText text={message.text} onNavigate={onNavigate} />}
      </div>

      {message.cards?.length > 0 && (
        <div className="w-full space-y-2">
          {message.cards.map((card) => (
            <MedicineCard
              key={card.slug || card.id}
              card={card}
              currency={currency}
              onInquire={onInquire}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {message.quickActions?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.quickActions.map((action) =>
            action.href && SITE_PATHS.test(action.href) ? (
              <Link
                key={`${action.id}-${action.href}`}
                to={action.href}
                onClick={onNavigate}
                className="rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {action.icon ? `${action.icon} ${action.label}` : action.label}
              </Link>
            ) : (
              <button
                key={action.id}
                type="button"
                disabled={disabled}
                onClick={() => onAction(action)}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {action.icon ? `${action.icon} ${action.label}` : action.label}
              </button>
            )
          )}
        </div>
      )}

      <span className="px-1 text-[10px] text-gray-400">{formatTime(message.at)}</span>
    </div>
  );
}
