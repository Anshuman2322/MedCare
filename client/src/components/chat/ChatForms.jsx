import React, { useState } from 'react';
import { createInquiry } from '../../services/api';
import { formatPrice } from '../../utils/currency';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = "Sorry, we're having trouble processing that right now.";

// services/api.js rejects with the raw response body, which is JSON for our own
// validation errors and anything at all for an upstream failure.
function readableError(err) {
  const raw = err?.message || '';
  if (!raw) return GENERIC_ERROR;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.error === 'string' && parsed.error ? parsed.error : GENERIC_ERROR;
  } catch {
    return raw.length < 120 && !raw.includes('<') ? raw : GENERIC_ERROR;
  }
}

function Field({ id, label, type = 'text', value, onChange, error, placeholder, required, inputMode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="text-[11px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function FormShell({ title, subtitle, children, onCancel, onSubmit, submitLabel, submitting, formError }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3 rounded-xl border border-emerald-100 bg-white p-3 shadow-sm"
    >
      <div>
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>

      {children}

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {formError}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          {submitting ? 'Please wait…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

const titleCase = (text) => (text ? text[0].toUpperCase() + text.slice(1) : '');
const validPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

// The product's own pack (the one its listed price is for) comes first; the
// other common pack can still be requested and is priced in the quote.
function packOptions(medicine) {
  const own = String(medicine?.packagingType || '').trim().toLowerCase() || 'box';
  return [own, own === 'box' ? 'strip' : 'box'];
}

export function InquiryForm({ medicine, initialQuantity, initialPackaging, currency, visitor, onCancel, onSubmitted }) {
  const [ownPack] = packOptions(medicine);
  const [values, setValues] = useState({
    quantity: Number(initialQuantity) > 0 ? Number(initialQuantity) : 1,
    packagingType: packOptions(medicine).includes(initialPackaging) ? initialPackaging : ownPack,
    name: visitor?.name || '',
    email: visitor?.email || '',
    phone: '',
    location: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (value) => setValues((prev) => ({ ...prev, [key]: value }));

  const qty = Math.max(1, Math.floor(Number(values.quantity) || 1));
  const unitPrice = values.packagingType === ownPack && Number(medicine?.price) > 0 ? Number(medicine.price) : null;
  const plural = (pack, count) => (count === 1 ? pack : pack === 'box' ? 'boxes' : `${pack}s`);

  async function handleSubmit() {
    const email = values.email.trim();
    const phone = values.phone.trim();
    const next = {};
    if (!values.name.trim()) next.name = 'Name is required';
    if (!values.location.trim()) next.location = 'Delivery location is required';
    if (!Number(values.quantity) || Number(values.quantity) < 1) next.quantity = 'Minimum quantity is 1';
    if (!email && !phone) next.contact = 'Add your email or phone number so we can send your quote.';
    if (email && !emailRegex.test(email)) next.email = 'Enter a valid email';
    if (phone && !validPhone(phone)) next.phone = 'Enter a valid phone number';

    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setFormError('');

    try {
      const response = await createInquiry({
        medicineId: medicine.id,
        customer: {
          name: values.name.trim(),
          city: values.location.trim(),
          email,
          phone,
        },
        product: {
          quantity: qty,
          packagingType: values.packagingType,
          strength: medicine.strength || '',
          brand: '',
        },
        notes: 'Submitted via CureNeed support chat',
      });
      await onSubmitted(response?.referenceId || '');
    } catch (err) {
      setFormError(readableError(err));
      setSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Get a Quote"
      subtitle="Our team confirms availability, pricing and delivery after you submit."
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Send Quote Request"
      submitting={submitting}
      formError={formError}
    >
      <div className="rounded-lg bg-emerald-50/70 px-3 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Medicine</div>
        <div className="text-sm font-semibold text-gray-900">{medicine.name}</div>
        {medicine.packSize && <div className="text-xs text-gray-600">{medicine.packSize}</div>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field
          id="chat-inquiry-qty"
          label={`Quantity (${plural(values.packagingType, 2)})`}
          type="number"
          inputMode="numeric"
          value={values.quantity}
          onChange={setField('quantity')}
          error={errors.quantity}
          required
        />
        <div className="space-y-1">
          <span className="block text-xs font-semibold text-gray-700">Packaging</span>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Packaging">
            {packOptions(medicine).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={values.packagingType === option}
                onClick={() => setField('packagingType')(option)}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  values.packagingType === option
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {titleCase(option)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2" aria-live="polite">
        <div>
          <div className="text-xs font-semibold text-gray-900">Estimated total</div>
          <div className="text-[11px] text-gray-500">
            {unitPrice !== null
              ? `${formatPrice(unitPrice, currency)} per ${values.packagingType} × ${qty} ${plural(values.packagingType, qty)}`
              : `${titleCase(values.packagingType)} pricing comes with your quote`}
          </div>
        </div>
        <div className="text-sm font-bold text-emerald-700">
          {unitPrice !== null ? formatPrice(unitPrice * qty, currency) : 'On request'}
        </div>
      </div>

      <Field id="chat-inquiry-name" label="Name" value={values.name} onChange={setField('name')} error={errors.name} required />
      <p className="-mb-1 text-[11px] text-gray-500">Email or phone: at least one, so we can send your quote.</p>
      <Field
        id="chat-inquiry-email"
        label="Email"
        type="email"
        value={values.email}
        onChange={setField('email')}
        error={errors.email}
        placeholder="you@example.com"
      />
      <Field
        id="chat-inquiry-phone"
        label="Phone"
        type="tel"
        inputMode="tel"
        value={values.phone}
        onChange={setField('phone')}
        error={errors.phone}
        placeholder="+1 555 123 4567"
      />
      {errors.contact && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
          {errors.contact}
        </p>
      )}
      <Field
        id="chat-inquiry-location"
        label="Delivery Location"
        value={values.location}
        onChange={setField('location')}
        error={errors.location}
        placeholder="City, Country"
        required
      />
    </FormShell>
  );
}

export function StatusForm({ onCancel, onSubmit, initialReference = '' }) {
  const [referenceId, setReferenceId] = useState(initialReference);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const next = {};
    if (!referenceId.trim()) next.referenceId = 'Inquiry reference is required';
    if (!emailRegex.test(email.trim())) next.email = 'Enter the email used on the inquiry';

    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setFormError('');

    try {
      await onSubmit({ referenceId: referenceId.trim(), email: email.trim() });
    } catch (err) {
      setFormError(err?.message || GENERIC_ERROR);
      setSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Check My Inquiry"
      subtitle="We ask for your email so inquiry details stay private."
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Check Status"
      submitting={submitting}
      formError={formError}
    >
      <Field
        id="chat-status-ref"
        label="Inquiry Reference"
        value={referenceId}
        onChange={setReferenceId}
        error={errors.referenceId}
        placeholder="CN-2026-0001"
        required
      />
      <Field
        id="chat-status-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        error={errors.email}
        placeholder="you@example.com"
        required
      />
    </FormShell>
  );
}

export function HandoffForm({ onCancel, onSubmit, team, visitor }) {
  const [values, setValues] = useState({ name: visitor?.name || '', email: visitor?.email || '', phone: '', message: '' });
  const away = team?.available === false;
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (value) => setValues((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit() {
    const next = {};
    if (!values.name.trim()) next.name = 'Name is required';
    if (!emailRegex.test(values.email.trim())) next.email = 'Enter a valid email';
    if (!values.message.trim()) next.message = 'Tell us how we can help';

    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setFormError('');

    try {
      await onSubmit({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        message: values.message.trim(),
      });
    } catch (err) {
      setFormError(err?.message || GENERIC_ERROR);
      setSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Talk to Our Team"
      subtitle={
        away
          ? "Our team is away right now. Leave your message: they'll reply here, or by email if you've left."
          : `An expert usually joins within ${team?.waitText || '5–10 minutes'}. If you leave, we'll email you our reply.`
      }
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel={away ? 'Send Message' : 'Start Live Chat'}
      submitting={submitting}
      formError={formError}
    >
      <Field id="chat-handoff-name" label="Name" value={values.name} onChange={setField('name')} error={errors.name} required />
      <Field
        id="chat-handoff-email"
        label="Email"
        type="email"
        value={values.email}
        onChange={setField('email')}
        error={errors.email}
        placeholder="you@example.com"
        required
      />
      <Field
        id="chat-handoff-phone"
        label="Phone"
        type="tel"
        inputMode="tel"
        value={values.phone}
        onChange={setField('phone')}
        error={errors.phone}
      />
      <div className="space-y-1">
        <label htmlFor="chat-handoff-message" className="block text-xs font-semibold text-gray-700">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="chat-handoff-message"
          rows="3"
          value={values.message}
          onChange={(event) => setField('message')(event.target.value)}
          aria-invalid={Boolean(errors.message)}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            errors.message
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'
          }`}
          placeholder="How can our team help?"
        />
        {errors.message && <p className="text-[11px] font-medium text-red-600">{errors.message}</p>}
      </div>
    </FormShell>
  );
}
