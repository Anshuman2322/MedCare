import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createInquiry } from '../services/api';
import { formatPrice } from '../utils/currency';

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

    setFormData({
      ...initialForm,
      strength: preselectedStrength,
      brand: preselectedBrand,
    });
    setErrors({});
    setServerError('');
    setReferenceId('');
    setStep(steps.customer);
    requestAnimationFrame(() => shellRef.current?.focus());
  }, [isOpen, medicine, hasMultipleStrengths, hasMultipleBrands, strengthOptions, brandOptions]);

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

  const priceLabel = selectedVariant?.price !== null && selectedVariant?.price !== undefined
    ? formatPrice(selectedVariant.price, currency)
    : 'Price on request';

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

    if (currentStep === steps.contact) {
      if (!trimmed.email && !trimmed.phone) {
        // both optional, so no errors
      } else {
        if (trimmed.email && !validEmail(trimmed.email)) nextErrors.email = 'Enter a valid email';
        if (trimmed.phone && !validPhone(trimmed.phone)) nextErrors.phone = 'Enter a valid phone';
      }
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
      setStep(steps.success);
    } catch (err) {
      setServerError(err?.message || 'Unable to submit inquiry right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const packagingLabel = formData.packagingType === 'strip' ? 'Strip' : 'Box';
  const variantLabel = [selectedVariant?.strength, selectedVariant?.form, selectedVariant?.packSize].filter(Boolean).join(' · ');

  const leftImage = medicine?.image || medicine?.images?.[0];

  if (!isOpen || !medicine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm px-6 py-8" aria-modal="true" role="dialog">
      <div className="absolute inset-0" onClick={() => (!submitting ? onClose?.() : null)} />
      <div
        ref={shellRef}
        tabIndex={-1}
        className="relative w-[75vw] max-w-[1100px] h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex"
      >
        <button
          type="button"
          onClick={() => (!submitting ? onClose?.() : null)}
          className="absolute right-4 top-4 z-20 h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:shadow-sm"
          aria-label="Close inquiry"
        >
          ×
        </button>

        <div className="w-[40%] min-w-[320px] bg-slate-50 border-r border-slate-100 h-full p-6 flex flex-col gap-4 justify-between">
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
              <div className="text-sm text-slate-600">{medicine?.manufacturer || medicine?.brand || 'Trusted supplier'}</div>
            </div>
            <div className="rounded-xl bg-white border border-slate-100 p-4 shadow-sm space-y-2">
              <InfoRow label="Variant" value={variantLabel || 'Select a strength'} />
              <InfoRow label="Packaging" value={packagingLabel} />
              <InfoRow label="Price" value={priceLabel} />
              <InfoRow label="Quantity" value={formData.quantity} />
            </div>
          </div>
        </div>

        <div className="w-[60%] h-full p-8 flex flex-col bg-white">
          <div className="space-y-2 mb-4">
            <div className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">Send Inquiry</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-slate-900">{medicine?.name}</div>
              <div className="text-sm text-slate-600">
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
              <div className="absolute inset-0 transition-all duration-200 ease-out opacity-100 space-y-0">
                <StepSection active={step === steps.success}>
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-1">
                    <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">✓</div>
                    <div className="text-2xl font-semibold text-gray-900">Thank you for your inquiry</div>
                    <p className="text-sm text-gray-600 max-w-md">Our team will reach out shortly with availability and pricing.</p>
                    {referenceId && <div className="text-xs font-semibold text-emerald-700">Reference ID: {referenceId}</div>}
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      Close
                    </button>
                  </div>
                </StepSection>

                <StepSection active={step === steps.review}>
                  <div className="space-y-4">
                    <div className="text-lg font-semibold text-gray-900">Review & Submit</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                      <InfoRow label="Name" value={formData.customerName || '—'} />
                      <InfoRow label="City" value={formData.city || '—'} />
                      <InfoRow label="Quantity" value={formData.quantity} />
                      <InfoRow label="Packaging" value={packagingLabel} />
                      {formData.strength && <InfoRow label="Strength" value={formData.strength} />}
                      {formData.brand && <InfoRow label="Brand" value={formData.brand} />}
                      <InfoRow label="Price" value={priceLabel} />
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
                      <p className="text-sm text-gray-600">Optional: add email or phone so we can reply fast.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField label="Email" type="email" value={formData.email} onChange={(v) => setField('email', v)} error={errors.email} placeholder="you@example.com" />
                      <TextField label="Phone" type="tel" value={formData.phone} onChange={(v) => setField('phone', v)} error={errors.phone} placeholder="+1 555 123 4567" />
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">We respect your privacy. Provide contact details only if you want a callback.</div>
                    <FooterNav onBack={handleBack} onNext={handleNext} nextDisabled={!validateStep(steps.contact, { silent: true })} />
                  </div>
                </StepSection>

                <StepSection active={step === steps.notes}>
                  <div className="space-y-4">
                    <div className="text-lg font-semibold text-gray-900">Additional requirement (optional)</div>
                    <textarea
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
                      <label className="text-sm font-semibold text-slate-800">Quantity</label>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          inputMode="numeric"
                          value={formData.quantity}
                          onChange={(e) => setField('quantity', Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                          className="w-28 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-900 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        <Pill active={formData.packagingType === 'box'} onClick={() => setField('packagingType', 'box')} label="Box" />
                        <Pill active={formData.packagingType === 'strip'} onClick={() => setField('packagingType', 'strip')} label="Strip" />
                      </div>
                    </div>
                    {errors.quantity && <div className="text-sm text-rose-600 font-medium">{errors.quantity}</div>}
                    {errors.packagingType && <div className="text-sm text-rose-600 font-medium">{errors.packagingType}</div>}

                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">Estimated Price</div>
                      <div className="text-base font-semibold text-emerald-700">{priceLabel}</div>
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

function StepSection({ active, children }) {
  return (
    <div style={{ display: active ? 'block' : 'none' }} className="w-full h-full">
      {children}
    </div>
  );
}

function Pill({ active, label, onClick }) {
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

function TextField({ label, value, onChange, required, error, type = 'text', placeholder }) {
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

function FooterNav({ onBack, onNext, nextDisabled, nextLabel = 'Next' }) {
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

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value || '—'}</span>
    </div>
  );
}
