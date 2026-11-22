import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createBulkRequest } from '../../services/api';
import { formatPrice } from '../../utils/currency';
import { withCloudinaryTransform, variantLabel } from '../../utils/medicineDisplay.js';
import { StepSection, TextField, FooterNav, InfoRow, SubmittedPanel } from '../InquiryModal.jsx';
import { downloadInquiryPdf, SITE_URL } from '../../utils/inquiryPdf.js';
import { quantityLabel } from '../../utils/packs.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = "Sorry, we're having trouble submitting that right now.";

const steps = { customer: 1, items: 2, notes: 3, contact: 4, review: 5, success: 6 };
const flow = [steps.customer, steps.items, steps.notes, steps.contact, steps.review];

const initialForm = { name: '', city: '', notes: '', email: '', phone: '' };

function readableError(err) {
  const raw = err?.message || '';
  if (!raw) return GENERIC_ERROR;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.error === 'string' && parsed.error ? parsed.error : GENERIC_ERROR;
  } catch {
    return raw.length < 140 && !raw.includes('<') ? raw : GENERIC_ERROR;
  }
}

function ItemRow({ item, currency, compact }) {
  const image = withCloudinaryTransform(item.image, 120);
  const label = variantLabel(item.variant);

  return (
    <div className={`flex gap-3 ${compact ? '' : 'rounded-xl border border-slate-100 bg-white p-3 shadow-sm'}`}>
      {image ? (
        <img
          src={image}
          alt=""
          width="44"
          height="44"
          loading="lazy"
          className="h-11 w-11 shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-contain"
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-lg" aria-hidden="true">
          💊
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-900">{item.name}</div>
        {label && <div className="truncate text-xs text-slate-500">{label}</div>}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
          <span className="font-semibold text-slate-700">Qty: {item.quantity}</span>
          <span className="text-slate-400" aria-hidden="true">·</span>
          <span className="text-emerald-700">
            {Number.isFinite(item.listedPrice) ? formatPrice(item.listedPrice, currency) : 'Price on request'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RequestModal({ isOpen, onClose, items = [], requestType = 'inquiry', currency, onSubmitted }) {
  const shellRef = useRef(null);
  const [step, setStep] = useState(steps.customer);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState(null);
  // What was submitted, kept for the PDF (the cart may be cleared afterwards).
  const [receipt, setReceipt] = useState(null);
  const [pdfState, setPdfState] = useState('idle');

  const isBestPrice = requestType === 'best_price';
  const title = isBestPrice ? 'Request Best Price' : 'Submit Inquiry';

  const listedSubtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + (Number.isFinite(item.listedPrice) ? item.listedPrice * item.quantity : 0),
        0
      ),
    [items]
  );

  useEffect(() => {
    if (!isOpen) return;
    setFormData(initialForm);
    setErrors({});
    setServerError('');
    setResult(null);
    setReceipt(null);
    setPdfState('idle');
    setStep(steps.customer);
    requestAnimationFrame(() => shellRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [isOpen, onClose, submitting]);

  const setField = (key) => (value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const validate = (target, { silent = false } = {}) => {
    const next = {};

    if (target === steps.customer) {
      if (!formData.name.trim()) next.name = 'Name is required';
      if (!formData.city.trim()) next.city = 'Delivery location is required';
    }

    if (target === steps.contact) {
      if (!emailRegex.test(formData.email.trim())) next.email = 'Enter a valid email';
      if (formData.phone.trim() && formData.phone.trim().replace(/\D/g, '').length < 7) {
        next.phone = 'Enter a valid phone';
      }
    }

    if (!silent) setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (!validate(step)) return;
    setErrors({});
    setStep((prev) => Math.min(prev + 1, steps.review));
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => Math.max(prev - 1, steps.customer));
  };

  const handleSubmit = async () => {
    if (!validate(steps.customer)) return setStep(steps.customer);
    if (!validate(steps.contact)) return setStep(steps.contact);
    if (!items.length) return setServerError('Add at least one medicine before submitting.');

    try {
      setSubmitting(true);
      setServerError('');
      const response = await createBulkRequest({
        requestType,
        customer: {
          name: formData.name.trim(),
          city: formData.city.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
        notes: formData.notes.trim(),
        items: items.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          variant: item.variant,
        })),
      });
      setResult(response);
      setReceipt({
        emailedTo: response?.confirmationEmail ? formData.email.trim() : '',
        summary: buildSummary(response?.referenceId || ''),
      });
      setStep(steps.success);
      onSubmitted?.(response);
    } catch (err) {
      setServerError(readableError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Everything the PDF shows, as listed in this request.
  function buildSummary(reference) {
    const priced = items.filter((item) => Number.isFinite(item.listedPrice));
    return {
      kind: requestType === 'best_price' ? 'best_price' : 'inquiry',
      referenceId: reference,
      submittedAt: new Date(),
      currency,
      image: items.length === 1 ? items[0].image || '' : '',
      lines: items.map((item) => {
        const hasPrice = Number.isFinite(item.listedPrice);
        return {
          name: item.name || 'Medicine',
          url: item.slug ? `${SITE_URL}/medicine/${encodeURIComponent(item.slug)}` : '',
          variant: variantLabel(item.variant),
          packaging: item.variant?.packagingType ? `${item.variant.packagingType}${item.variant.packSize ? ` (${item.variant.packSize})` : ''}` : '',
          // "per strip" reads well under one product; the multi-medicine table says "each".
          unitPrice: hasPrice
            ? `${formatPrice(item.listedPrice, currency)}${items.length === 1 && item.variant?.packagingType ? ` per ${item.variant.packagingType.toLowerCase()}` : ''}`
            : null,
          quantity: quantityLabel(item.quantity, item.variant?.packagingType),
          total: hasPrice ? formatPrice(item.listedPrice * item.quantity, currency) : null,
        };
      }),
      total: priced.length ? formatPrice(listedSubtotal, currency) : 'Quoted on request',
      totalNote: !priced.length
        ? 'Our team will include the price in your quote.'
        : priced.length < items.length
          ? 'Items without a listed price are quoted separately.'
          : '',
      cityLabel: 'Delivery location',
      customer: {
        name: formData.name.trim(),
        city: formData.city.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      },
      notes: formData.notes.trim(),
    };
  }

  const handleDownloadPdf = async () => {
    if (!receipt || pdfState === 'busy') return;
    setPdfState('busy');
    try {
      await downloadInquiryPdf(receipt.summary);
      setPdfState('idle');
    } catch {
      setPdfState('error');
    }
  };

  if (!isOpen) return null;

  const stepIndex = Math.max(flow.indexOf(step), 0);
  const progress = step === steps.success ? 100 : ((stepIndex + 1) / flow.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-0 py-0 backdrop-blur-sm sm:px-6 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0" onClick={() => (!submitting ? onClose?.() : null)} />

      <div
        ref={shellRef}
        tabIndex={-1}
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl outline-none sm:h-[80vh] sm:max-h-[720px] sm:w-[90vw] sm:max-w-[1000px] sm:flex-row sm:rounded-2xl"
      >
        <button
          type="button"
          onClick={() => (!submitting ? onClose?.() : null)}
          className="absolute right-4 top-4 z-20 h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-label={`Close ${title}`}
        >
          ×
        </button>

        <aside className="hidden h-full w-[38%] min-w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-100 bg-slate-50 p-6 sm:flex">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">
              {isBestPrice ? 'Best Price Request' : 'Combined Inquiry'}
            </div>
            <div className="text-lg font-semibold leading-snug text-slate-900">
              {items.length} {items.length === 1 ? 'medicine' : 'medicines'}
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <ItemRow key={item.lineId || item.medicineId} item={item} currency={currency} />
            ))}
          </div>

          <div className="mt-auto space-y-2 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <InfoRow label="Listed Subtotal" value={formatPrice(listedSubtotal, currency)} />
            <p className="text-xs leading-relaxed text-slate-500">
              {isBestPrice
                ? 'Our team reviews your quantities and replies with the best available quote.'
                : 'Final pricing will be confirmed by our team.'}
            </p>
          </div>
        </aside>

        <div className="flex h-full min-h-0 flex-1 flex-col bg-white p-5 sm:p-8">
          <div className="mb-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xl font-semibold text-slate-900 sm:text-2xl">
                {items.length === 1 ? items[0].name : `${items.length} medicines`}
              </div>
              <div className="shrink-0 text-sm text-slate-600">
                {step === steps.success ? 'Completed' : `Step ${stepIndex + 1} of ${flow.length}`}
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            {serverError && step !== steps.review && step !== steps.success && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {serverError}
              </div>
            )}

            <StepSection active={step === steps.customer}>
              <div className="space-y-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Tell us about you</div>
                  <p className="text-sm text-gray-600">So our team knows who to get back to.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextField label="Name" value={formData.name} onChange={setField('name')} error={errors.name} required />
                  <TextField
                    label="Delivery Location"
                    value={formData.city}
                    onChange={setField('city')}
                    error={errors.city}
                    placeholder="City, Country"
                    required
                  />
                </div>
                <FooterNav onNext={handleNext} nextDisabled={!validate(steps.customer, { silent: true })} />
              </div>
            </StepSection>

            <StepSection active={step === steps.items}>
              <div className="space-y-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Review your medicines</div>
                  <p className="text-sm text-gray-600">
                    {items.length === 1
                      ? 'Confirm the item and quantity below.'
                      : 'All of these go into one single request.'}
                  </p>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <ItemRow key={item.lineId || item.medicineId} item={item} currency={currency} />
                  ))}
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  Need a different quantity? Close this and adjust it in your cart.
                </div>
                <FooterNav onBack={handleBack} onNext={handleNext} />
              </div>
            </StepSection>

            <StepSection active={step === steps.notes}>
              <div className="space-y-4">
                <label htmlFor="request-notes" className="block text-lg font-semibold text-gray-900">
                  Additional requirement (optional)
                </label>
                <textarea
                  id="request-notes"
                  rows="5"
                  value={formData.notes}
                  onChange={(event) => setField('notes')(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder={
                    isBestPrice
                      ? 'Target budget, expected repeat volume, delivery timelines…'
                      : 'Add delivery timelines, special instructions, or preferences.'
                  }
                />
                <FooterNav onBack={handleBack} onNext={handleNext} />
              </div>
            </StepSection>

            <StepSection active={step === steps.contact}>
              <div className="space-y-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">How should we reach you?</div>
                  <p className="text-sm text-gray-600">
                    {isBestPrice ? 'We send your quote to this email.' : 'We reply to this email with next steps.'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextField
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={setField('email')}
                    error={errors.email}
                    placeholder="you@example.com"
                    required
                  />
                  <TextField
                    label="Phone"
                    type="tel"
                    value={formData.phone}
                    onChange={setField('phone')}
                    error={errors.phone}
                    placeholder="+1 555 123 4567"
                  />
                </div>
                <FooterNav onBack={handleBack} onNext={handleNext} nextDisabled={!validate(steps.contact, { silent: true })} />
              </div>
            </StepSection>

            <StepSection active={step === steps.review}>
              <div className="space-y-4">
                <div className="text-lg font-semibold text-gray-900">Review &amp; Submit</div>
                <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                  <InfoRow label="Name" value={formData.name || '—'} />
                  <InfoRow label="Delivery Location" value={formData.city || '—'} />
                  <InfoRow label="Email" value={formData.email || '—'} />
                  <InfoRow label="Phone" value={formData.phone || '—'} />
                  <InfoRow label="Medicines" value={String(items.length)} />
                  <InfoRow label="Listed Subtotal" value={formatPrice(listedSubtotal, currency)} />
                </div>

                <div className="space-y-2 sm:hidden">
                  {items.map((item) => (
                    <ItemRow key={item.lineId || item.medicineId} item={item} currency={currency} />
                  ))}
                </div>

                {formData.notes && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                    <div className="mb-1 font-semibold text-slate-900">Additional Requirement</div>
                    <div className="whitespace-pre-line">{formData.notes}</div>
                  </div>
                )}

                <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-900">
                  {isBestPrice
                    ? 'This is a request for a quote, not an order. Our team reviews your quantities and replies with the best available price.'
                    : 'Final pricing, availability and delivery are confirmed by our team before anything is finalised.'}
                </div>

                {serverError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {serverError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={submitting}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm ${
                      submitting ? 'cursor-not-allowed bg-emerald-300' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {submitting ? 'Submitting...' : title}
                  </button>
                </div>
              </div>
            </StepSection>

            <StepSection active={step === steps.success}>
              <SubmittedPanel
                title={isBestPrice ? 'Best-price request submitted' : 'Thank you for your inquiry'}
                message={
                  isBestPrice
                    ? 'Our team will review your requested quantity and contact you with the best available quote.'
                    : 'Our team will reach out shortly with availability, pricing and delivery details.'
                }
                referenceId={result?.referenceId}
                emailedTo={receipt?.emailedTo}
                pdfState={pdfState}
                onDownload={handleDownloadPdf}
                onClose={onClose}
              />
            </StepSection>
          </div>
        </div>
      </div>
    </div>
  );
}
