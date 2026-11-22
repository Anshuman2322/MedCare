import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createInquiry } from '../services/api';
import { formatPrice } from '../utils/currency';
import { titleCase, unitName } from '../utils/packs.js';
import { downloadInquiryPdf, SITE_URL } from '../utils/inquiryPdf.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeVariant = (v = {}) => ({
  strength: v.strength || '',
  form: v.form || '',
  packSize: v.packSize || '',
  packagingType: v.packagingType || '',
  price: Number.isFinite(Number(v.price)) ? Number(v.price) : null,
  sku: v.sku || v.SKU || '',
  stock: v.stock ?? (v.inStock ? 1 : null),
  brand: v.brand || '',
});

// A product's listed price is for its own pack (e.g. "Strip of 10 Tablets").
// That pack is offered first with its price; the other common pack (box or
// strip) can still be requested, but its price comes with the quote.
function packagingOptions(variant) {
  const own = (variant?.packagingType || '').trim().toLowerCase() || 'box';
  const other = own === 'box' ? 'strip' : 'box';
  const hasPrice = Number.isFinite(variant?.price);
  return [
    { key: own, label: titleCase(own), detail: variant?.packSize || '', priced: hasPrice },
    { key: other, label: titleCase(other), detail: '', priced: false },
  ];
}

const steps = {
  customer: 1,
  quantity: 2,
  strength: 3,
  brand: 4,
  notes: 5,
  contact: 6,
  review: 7,
  success: 8,
};

const initialForm = {
  customerName: '',
  city: '',
  quantity: 1,
  packagingType: 'box',
  strength: '',
  brand: '',
  notes: '',
  email: '',
  phone: '',
};

export default function InquiryModal({ isOpen, onClose, medicine, currency }) {
  const shellRef = useRef(null);
  const [step, setStep] = useState(steps.customer);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [referenceId, setReferenceId] = useState('');
  // What was submitted, kept for the PDF and the confirmation line.
  const [receipt, setReceipt] = useState(null);
  const [pdfState, setPdfState] = useState('idle');

  const variants = useMemo(() => {
    if (!medicine?.variants?.length) return [];
    return medicine.variants.map((v) => normalizeVariant(v)).filter((v) => v.strength || v.packSize || v.form || v.brand);
  }, [medicine]);

  const strengthOptions = useMemo(() => {
    const list = (variants || []).map((v) => (v.strength || '').trim()).filter(Boolean);
    return Array.from(new Set(list));
  }, [variants]);

  const brandOptions = useMemo(() => {
    const declared = (medicine?.brands || []).map((b) => (b || '').trim()).filter(Boolean);
    const variantDerived = (variants || [])
      .map((v) => (v.brand || medicine?.brand || medicine?.manufacturer || '').trim())
      .filter(Boolean);
    const merged = declared.length ? declared : variantDerived;
    return Array.from(new Set(merged));
  }, [medicine, variants]);

  const hasMultipleStrengths = strengthOptions.length > 1;
  const hasMultipleBrands = brandOptions.length > 1;

  useEffect(() => {
    if (!isOpen || !medicine) return;

    const preselectedStrength = hasMultipleStrengths ? '' : strengthOptions[0] || '';
    const preselectedBrand = hasMultipleBrands ? '' : brandOptions[0] || '';
    const firstVariant = variants.find((v) => v.strength === preselectedStrength) || variants[0];

    setFormData({
      ...initialForm,
      strength: preselectedStrength,
      brand: preselectedBrand,
      packagingType: packagingOptions(firstVariant)[0].key,
    });
    setErrors({});
    setServerError('');
    setReferenceId('');
    setReceipt(null);
    setPdfState('idle');
    setStep(steps.customer);
    requestAnimationFrame(() => shellRef.current?.focus());
  }, [isOpen, medicine, hasMultipleStrengths, hasMultipleBrands, strengthOptions, brandOptions, variants]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (!submitting) onClose?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, submitting]);

  const selectedVariant = useMemo(() => {
    const byStrength = formData.strength ? variants.filter((v) => v.strength === formData.strength) : variants;
    const byBrand = formData.brand ? byStrength.filter((v) => v.brand === formData.brand) : byStrength;
    return byBrand[0] || variants[0] || null;
  }, [formData.brand, formData.strength, variants]);

  const packOptions = useMemo(() => packagingOptions(selectedVariant), [selectedVariant]);
  const chosenPack = packOptions.find((o) => o.key === formData.packagingType) || packOptions[0];
  const qty = Math.max(1, Number(formData.quantity) || 1);
  const unitPrice = chosenPack.priced ? selectedVariant.price : null;
  const estimatedTotal = unitPrice !== null ? unitPrice * qty : null;
  const unitPriceLabel = unitPrice !== null ? `${formatPrice(unitPrice, currency)} per ${chosenPack.key}` : 'On request';
  const totalLabel = estimatedTotal !== null ? formatPrice(estimatedTotal, currency) : 'Quoted on request';
  const quantityLabel = `${qty} ${unitName(chosenPack.key, qty)}`;

  // If a different strength changes the pack, fall back to that pack.
  useEffect(() => {
    if (!packOptions.some((o) => o.key === formData.packagingType)) {
      setFormData((prev) => ({ ...prev, packagingType: packOptions[0].key }));
    }
  }, [packOptions, formData.packagingType]);

  const visibleSteps = useMemo(() => {
    const flow = [steps.customer, steps.quantity];
    if (hasMultipleStrengths) flow.push(steps.strength);
    if (hasMultipleBrands) flow.push(steps.brand);
    flow.push(steps.notes, steps.contact, steps.review);
    return flow;
  }, [hasMultipleStrengths, hasMultipleBrands]);

  const currentStepIndex = Math.max(visibleSteps.indexOf(step), 0);
  const progressStep = step === steps.success ? visibleSteps.length : currentStepIndex + 1;
  const progressPercent = (progressStep / visibleSteps.length) * 100;

  const validEmail = (value) => emailRegex.test((value || '').trim());
  const validPhone = (value) => {
    const digits = (value || '').replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  };

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateStep = (currentStep, { silent = false } = {}) => {
    const trimmed = {
      customerName: formData.customerName.trim(),
      city: formData.city.trim(),
      quantity: Number(formData.quantity) || 0,
      packagingType: formData.packagingType,
      strength: formData.strength,
      brand: formData.brand,
      notes: formData.notes,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    };

    const nextErrors = {};

    if (currentStep === steps.customer) {
      if (!trimmed.customerName) nextErrors.customerName = 'Name is required';
      if (!trimmed.city) nextErrors.city = 'City is required';
    }

    if (currentStep === steps.quantity) {
      if (!trimmed.quantity || trimmed.quantity < 1) nextErrors.quantity = 'Minimum quantity is 1';
      if (!trimmed.packagingType) nextErrors.packagingType = 'Select a packaging type';
    }

    if (currentStep === steps.strength && hasMultipleStrengths) {
      if (!trimmed.strength) nextErrors.strength = 'Choose a strength';
    }

    if (currentStep === steps.brand && hasMultipleBrands) {
      if (!trimmed.brand) nextErrors.brand = 'Choose a brand';
    }

    // At least one way to reply is required; whatever is given must be valid.
    if (currentStep === steps.contact) {
      if (!trimmed.email && !trimmed.phone) {
        nextErrors.contact = 'Please add your email or phone number so we can send your quote.';
      }
      if (trimmed.email && !validEmail(trimmed.email)) nextErrors.email = 'Enter a valid email';
      if (trimmed.phone && !validPhone(trimmed.phone)) nextErrors.phone = 'Enter a valid phone number';
    }

    if (!silent) setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resolveNextStep = (current) => {
    let next = current + 1;
    if (next === steps.strength && !hasMultipleStrengths) next += 1;
    if (next === steps.brand && !hasMultipleBrands) next += 1;
    return Math.min(next, steps.review);
  };

  const resolvePrevStep = (current) => {
    let prev = current - 1;
    if (prev === steps.brand && !hasMultipleBrands) prev -= 1;
    if (prev === steps.strength && !hasMultipleStrengths) prev -= 1;
    return Math.max(prev, steps.customer);
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setErrors({});
    setStep((prev) => resolveNextStep(prev));
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => resolvePrevStep(prev));
  };

  const handleSubmit = async () => {
    const contactValid = validateStep(steps.contact);
    if (!contactValid) {
      setStep(steps.contact);
      return;
    }

    try {
      setSubmitting(true);
      setServerError('');
      const payload = {
        medicineId: medicine?._id || medicine?.id,
        customer: {
          name: formData.customerName.trim(),
          city: formData.city.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
        },
        product: {
          quantity: Number(formData.quantity) || 1,
          packagingType: formData.packagingType,
          strength: formData.strength,
          brand: formData.brand,
        },
        notes: formData.notes,
      };

      const res = await createInquiry(payload);
      setReferenceId(res.referenceId || '');
      setReceipt({
        emailedTo: res.confirmationEmail ? payload.customer.email : '',
        summary: buildSummary(res.referenceId || ''),
      });
      setStep(steps.success);
    } catch (err) {
      setServerError(err?.message || 'Unable to submit inquiry right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const packagingLabel = chosenPack.detail ? `${chosenPack.label} (${chosenPack.detail})` : chosenPack.label;
  const variantLabel = [selectedVariant?.strength, selectedVariant?.form, selectedVariant?.packSize].filter(Boolean).join(' · ');

  const leftImage = medicine?.image || medicine?.images?.[0];

  // Everything the PDF shows, as the customer saw it. The pack size belongs to
  // the product's own pack, so it is left out when another pack was chosen.
  function buildSummary(reference) {
    const ownPack = chosenPack.key === packOptions[0].key;
    const manufacturer = (medicine?.manufacturer || medicine?.brand || '').trim();
    return {
      kind: 'inquiry',
      referenceId: reference,
      submittedAt: new Date(),
      currency,
      image: leftImage || '',
      lines: [
        {
          name: medicine?.name || 'Medicine',
          url: medicine?.slug ? `${SITE_URL}/medicine/${encodeURIComponent(medicine.slug)}` : '',
          manufacturer,
          variant: [selectedVariant?.strength, selectedVariant?.form, ownPack ? selectedVariant?.packSize : ''].filter(Boolean).join(' · '),
          packaging: packagingLabel,
          unitPrice: unitPrice !== null ? unitPriceLabel : 'On request',
          quantity: quantityLabel,
          total: estimatedTotal !== null ? totalLabel : null,
        },
      ],
      total: totalLabel,
      totalNote: unitPrice === null ? `${chosenPack.label} pricing isn't listed. Our team will include it in your quote.` : '',
      brand: formData.brand,
      customer: {
        name: formData.customerName.trim(),
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

  if (!isOpen || !medicine) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:px-6 sm:py-8" aria-modal="true" role="dialog">
      <div className="absolute inset-0" onClick={() => (!submitting ? onClose?.() : null)} />
      <div
        ref={shellRef}
        tabIndex={-1}
        className="relative flex h-[92vh] w-full max-w-[1100px] overflow-hidden rounded-2xl bg-white shadow-2xl md:h-[80vh] md:w-[90vw] lg:w-[75vw]"
      >
        <button
          type="button"
          onClick={() => (!submitting ? onClose?.() : null)}
          className="absolute right-4 top-4 z-20 h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:shadow-sm"
          aria-label="Close inquiry"
        >
          ×
        </button>

        <div className="hidden md:flex w-[40%] min-w-[300px] bg-slate-50 border-r border-slate-100 h-full max-h-full overflow-y-auto p-6 flex-col gap-4 justify-between">
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm">
              {leftImage ? (
                <img src={leftImage} alt={medicine?.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400">No image</div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-sm uppercase tracking-[0.1em] text-emerald-600 font-semibold">Medicine</div>
              <div className="text-xl font-semibold text-slate-900 leading-snug">{medicine?.name}</div>
              {(medicine?.manufacturer || medicine?.brand) && (
                <div className="text-sm text-slate-600">{medicine.manufacturer || medicine.brand}</div>
              )}
            </div>
            <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm space-y-2">
              <InfoRow label="Variant" value={variantLabel || 'Select a strength'} />
              <InfoRow label="Packaging" value={packagingLabel} />
              <InfoRow label="Unit price" value={unitPriceLabel} />
              <InfoRow label="Quantity" value={quantityLabel} />
              <div className="border-t border-slate-100 pt-2">
                <InfoRow label="Estimated total" value={<span className="text-emerald-700">{totalLabel}</span>} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-full w-full flex-col bg-white p-4 pt-14 sm:p-6 sm:pt-14 md:w-[60%] md:p-8">
          <div className="space-y-2 mb-4">
            <div className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">Send Inquiry</div>
            <div className="flex items-start justify-between gap-3">
              <div className="text-lg font-semibold leading-snug text-slate-900 sm:text-2xl">{medicine?.name}</div>
              <div className="shrink-0 pt-1 text-sm text-slate-600">
                {step === steps.success ? 'Completed' : `Step ${currentStepIndex + 1} of ${visibleSteps.length}`}
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="flex-1 relative rounded-xl border border-slate-100 bg-white shadow-sm p-4">
            {serverError && step !== steps.review && step !== steps.success && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{serverError}</div>
            )}

            <div className="relative w-full h-full">
              <div className="absolute inset-0 overflow-y-auto transition-all duration-200 ease-out opacity-100 space-y-0">
                <StepSection active={step === steps.success}>
                  <SubmittedPanel
                    title="Thank you for your inquiry"
                    message="Our team will reach out shortly with availability and pricing."
                    referenceId={referenceId}
                    emailedTo={receipt?.emailedTo}
                    pdfState={pdfState}
                    onDownload={handleDownloadPdf}
                    onClose={onClose}
                  />
                </StepSection>

                <StepSection active={step === steps.review}>
                  <div className="space-y-4">
                    <div className="text-lg font-semibold text-gray-900">Review & Submit</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                      <InfoRow label="Name" value={formData.customerName || '—'} />
                      <InfoRow label="City" value={formData.city || '—'} />
                      <InfoRow label="Quantity" value={quantityLabel} />
                      <InfoRow label="Packaging" value={packagingLabel} />
                      {formData.strength && <InfoRow label="Strength" value={formData.strength} />}
                      {formData.brand && <InfoRow label="Brand" value={formData.brand} />}
                      <InfoRow label="Unit price" value={unitPriceLabel} />
                      <InfoRow label="Estimated total" value={totalLabel} />
                      {formData.email && <InfoRow label="Email" value={formData.email} />}
                      {formData.phone && <InfoRow label="Phone" value={formData.phone} />}
                    </div>
                    {formData.notes && (
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm text-slate-700">
                        <div className="font-semibold text-slate-900 mb-1">Additional Requirement</div>
                        <div>{formData.notes}</div>
                      </div>
                    )}
                    {serverError && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{serverError}</div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSubmit}
                        className={`rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm ${
                          submitting ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {submitting ? 'Submitting...' : 'Submit Inquiry'}
                      </button>
                    </div>
                  </div>
                </StepSection>

                <StepSection active={step === steps.contact}>
                  <div className="space-y-4">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">How should we contact you?</div>
                      <p className="text-sm text-gray-600">
                        Add your email or phone number <span className="font-semibold text-slate-800">(at least one)</span> so we can send your quote.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField label="Email" type="email" value={formData.email} onChange={(v) => setField('email', v)} error={errors.email} placeholder="you@example.com" />
                      <TextField label="Phone" type="tel" value={formData.phone} onChange={(v) => setField('phone', v)} error={errors.phone} placeholder="+1 555 123 4567" />
                    </div>
                    {errors.contact && (
                      <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                        {errors.contact}
                      </div>
                    )}
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">We respect your privacy and only use these details to reply to this inquiry.</div>
                    <FooterNav onBack={handleBack} onNext={handleNext} />
                  </div>
                </StepSection>

                <StepSection active={step === steps.notes}>
                  <div className="space-y-4">
                    <label htmlFor="inquiry-notes" className="block text-lg font-semibold text-gray-900">Additional requirement (optional)</label>
                    <textarea
                      id="inquiry-notes"
                      rows="5"
                      value={formData.notes}
                      onChange={(e) => setField('notes', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                      placeholder="Add delivery timelines, special instructions, or preferences."
                    />
                    <FooterNav onBack={handleBack} onNext={handleNext} />
                  </div>
                </StepSection>

                <StepSection active={step === steps.brand}>
                  <div className="space-y-4">
                    <div className="text-lg font-semibold text-gray-900">Choose brand</div>
                    <div className="flex flex-wrap gap-2">
                      {(brandOptions.length ? brandOptions : ['Any brand']).map((b) => (
                        <Pill key={b} active={formData.brand === b || (!formData.brand && b === 'Any brand')} onClick={() => setField('brand', b === 'Any brand' ? '' : b)} label={b || 'Any brand'} />
                      ))}
                    </div>
                    {errors.brand && <div className="text-sm text-rose-600 font-medium">{errors.brand}</div>}
                    <FooterNav onBack={handleBack} onNext={handleNext} nextDisabled={!validateStep(steps.brand, { silent: true })} />
                  </div>
                </StepSection>

                <StepSection active={step === steps.strength}>
                  <div className="space-y-4">
                    <div className="text-lg font-semibold text-gray-900">Select strength</div>
                    <div className="flex flex-wrap gap-2">
                      {(strengthOptions.length ? strengthOptions : ['Standard']).map((s) => (
                        <Pill key={s} active={formData.strength === s} onClick={() => setField('strength', s)} label={s} />
                      ))}
                    </div>
                    {errors.strength && <div className="text-sm text-rose-600 font-medium">{errors.strength}</div>}
                    <FooterNav onBack={handleBack} onNext={handleNext} nextDisabled={!validateStep(steps.strength, { silent: true })} />
                  </div>
                </StepSection>

                <StepSection active={step === steps.customer}>
                  <div className="space-y-4">
                    <div className="text-lg font-semibold text-gray-900">Tell us about you</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField label="Name" value={formData.customerName} onChange={(v) => setField('customerName', v)} error={errors.customerName} required />
                      <TextField label="City" value={formData.city} onChange={(v) => setField('city', v)} error={errors.city} required />
                    </div>
                    <FooterNav onNext={handleNext} nextDisabled={!validateStep(steps.customer, { silent: true })} />
                  </div>
                </StepSection>

                <StepSection active={step === steps.quantity}>
                  <div className="space-y-6">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">Quantity & packaging</div>
                      <p className="text-sm text-gray-600">Select how much you need and the packaging style.</p>
                    </div>

                    <div className="space-y-2">
                      <div id="inquiry-packaging-label" className="text-sm font-semibold text-slate-800">Packaging</div>
                      <div role="radiogroup" aria-labelledby="inquiry-packaging-label" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {packOptions.map((option) => {
                          const active = chosenPack.key === option.key;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setField('packagingType', option.key)}
                              className={`rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                                active ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 bg-white hover:border-emerald-300'
                              }`}
                            >
                              <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                              <span className="mt-0.5 block text-xs text-slate-500">
                                {option.priced
                                  ? `${formatPrice(selectedVariant.price, currency)} per ${option.key}${option.detail ? ` · ${option.detail}` : ''}`
                                  : 'Price on request'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="inquiry-quantity" className="text-sm font-semibold text-slate-800">
                        Number of {unitName(chosenPack.key, 2)}
                      </label>
                      <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={qty <= 1}
                          onClick={() => setField('quantity', Math.max(1, qty - 1))}
                          className="h-11 w-11 text-lg text-slate-700 hover:bg-slate-50 disabled:text-slate-300"
                        >
                          −
                        </button>
                        <input
                          id="inquiry-quantity"
                          type="number"
                          min="1"
                          inputMode="numeric"
                          value={formData.quantity}
                          onChange={(e) => setField('quantity', Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                          className="h-11 w-20 border-x border-slate-200 text-center text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setField('quantity', qty + 1)}
                          className="h-11 w-11 text-lg text-slate-700 hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {errors.quantity && <div className="text-sm text-rose-600 font-medium">{errors.quantity}</div>}
                    {errors.packagingType && <div className="text-sm text-rose-600 font-medium">{errors.packagingType}</div>}

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4" aria-live="polite">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">Estimated total</div>
                        <div className="text-xl font-bold text-emerald-700">{totalLabel}</div>
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {unitPrice !== null
                          ? `${formatPrice(unitPrice, currency)} per ${chosenPack.key} × ${quantityLabel}`
                          : `${chosenPack.label} pricing isn't listed. Our team will include it in your quote.`}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">The final price is confirmed in your quote.</div>
                    </div>

                    <FooterNav onBack={handleBack} onNext={handleNext} nextDisabled={!validateStep(steps.quantity, { silent: true })} />
                  </div>
                </StepSection>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 14.5V16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// The "done" screen shared by the inquiry and request modals: reference ID,
// where the confirmation email went, and a PDF copy of the request.
export function SubmittedPanel({ title, message, referenceId, emailedTo, pdfState, onDownload, onClose }) {
  const busy = pdfState === 'busy';
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-1 py-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7">
          <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="text-2xl font-semibold text-gray-900">{title}</div>
      <p className="max-w-md text-sm text-gray-600">{message}</p>
      {referenceId && (
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-800">
          Reference ID: {referenceId}
        </div>
      )}
      {emailedTo && (
        <p className="max-w-md text-sm text-slate-600">
          A confirmation with these details is on its way to <span className="font-semibold text-slate-900 [overflow-wrap:anywhere]">{emailedTo}</span>.
        </p>
      )}
      <div className="flex w-full flex-col gap-2 pt-1 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm ${
            busy ? 'cursor-wait bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          <DownloadIcon />
          {busy ? 'Preparing PDF…' : 'Download PDF'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
      {pdfState === 'error' && (
        <p role="alert" className="text-sm font-medium text-rose-600">
          We couldn't create the PDF. Please try again.
        </p>
      )}
    </div>
  );
}

export function StepSection({ active, children }) {
  return (
    <div style={{ display: active ? 'block' : 'none' }} className="w-full h-full">
      {children}
    </div>
  );
}

export function Pill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors border ${
        active ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

export function TextField({ label, value, onChange, required, error, type = 'text', placeholder }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-800">
      <span>
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2.5 text-base transition-all bg-white placeholder:text-slate-400 ${
          error ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-400' : 'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400'
        }`}
      />
      {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
    </label>
  );
}

export function FooterNav({ onBack, onNext, nextDisabled, nextLabel = 'Next' }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={`rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm ${
            nextDisabled ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

export function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value || '—'}</span>
    </div>
  );
}
