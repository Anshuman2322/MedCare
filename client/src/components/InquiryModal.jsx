import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createInquiry } from '../services/api';
import { formatPrice } from '../utils/currency';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatUSPhone = (value = '') => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const normalizeVariant = (v = {}) => ({
  strength: v.strength || '',
  form: v.form || '',
  packSize: v.packSize || '',
  packagingType: v.packagingType || '',
  price: Number.isFinite(Number(v.price)) ? Number(v.price) : null,
  sku: v.sku || v.SKU || '',
  stock: v.stock ?? (v.inStock ? 1 : null),
});

export default function InquiryModal({ isOpen, onClose, medicine, currency }) {
  const shellRef = useRef(null);
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [strengths, setStrengths] = useState([]);
  const [selectedStrength, setSelectedStrength] = useState('');
  const [filteredVariants, setFilteredVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const variants = useMemo(() => {
    if (!medicine?.variants?.length) return [];
    return medicine.variants.map((v) => normalizeVariant(v)).filter((v) => v.strength || v.packSize || v.form);
  }, [medicine]);

  useEffect(() => {
    if (!isOpen) return;
    const list = Array.from(new Set((variants || []).map((v) => v.strength).filter(Boolean)));
    setStrengths(list);
    const initialStrength = list[0] || variants[0]?.strength || '';
    setSelectedStrength(initialStrength);
    const initialFiltered = variants.filter((v) => !initialStrength || v.strength === initialStrength);
    setFilteredVariants(initialFiltered);
    setSelectedVariant(initialFiltered[0] || variants[0] || null);
    setQuantity(1);
    setAdditionalNotes('');
    setFormData({ firstName: '', lastName: '', email: '', phone: '', city: '', state: '' });
    setErrors({});
    setServerError('');
    setReferenceId('');
    setStep(1);
    requestAnimationFrame(() => shellRef.current?.focus());
  }, [isOpen, variants]);

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

  useEffect(() => {
    if (!isOpen) return;
    const filtered = selectedStrength ? variants.filter((v) => v.strength === selectedStrength) : variants;
    setFilteredVariants(filtered);
    setSelectedVariant(filtered[0] || null);
  }, [selectedStrength, variants, isOpen]);

  if (!isOpen || !medicine) return null;

  const packSizeOptions = useMemo(
    () => Array.from(new Set((filteredVariants || []).map((v) => v.packSize).filter(Boolean))),
    [filteredVariants]
  );

  const handleStrengthChange = (value) => {
    setSelectedStrength(value);
  };

  const handlePackSizeChange = (value) => {
    if (!filteredVariants.length) return;
    const match = filteredVariants.find((v) => v.packSize === value);
    setSelectedVariant(match || filteredVariants[0] || null);
  };

  const handleContactChange = (key, value) => {
    const nextValue = key === 'phone' ? formatUSPhone(value) : value;
    setFormData((prev) => ({ ...prev, [key]: nextValue }));
  };

  const validateContact = () => {
    const next = {};
    if (!formData.firstName.trim()) next.firstName = 'Required';
    if (!formData.lastName.trim()) next.lastName = 'Required';
    if (!formData.email.trim()) next.email = 'Email required';
    else if (!emailRegex.test(formData.email.trim())) next.email = 'Invalid email';
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) next.phone = 'Phone must be 10+ digits';
    if (!formData.state.trim()) next.state = 'Required';
    if (!formData.city.trim()) next.city = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const contactIsValid = useMemo(() => {
    const phoneDigits = formData.phone.replace(/\D/g, '');
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      emailRegex.test(formData.email.trim()) &&
      phoneDigits.length >= 10 &&
      formData.city.trim() &&
      formData.state.trim() &&
      Boolean(selectedVariant)
    );
  }, [formData, selectedVariant]);

  const handleNext = () => {
    if (step === 1 && !selectedVariant) {
      setErrors({ variant: 'Select a variant.' });
      return;
    }
    if (step === 3 && !validateContact()) return;
    setErrors({});
    setStep((s) => Math.min(4, s + 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    if (!selectedVariant) {
      setErrors({ variant: 'Select a variant.' });
      return;
    }
    if (!validateContact()) return;
    try {
      setSubmitting(true);
      setServerError('');
      const payload = {
        medicineId: medicine?._id || medicine?.id,
        medicineName: medicine?.name,
        selectedVariant: {
          strength: selectedVariant.strength,
          form: selectedVariant.form,
          packSize: selectedVariant.packSize,
          packagingType: selectedVariant.packagingType,
          price: selectedVariant.price,
          sku: selectedVariant.sku,
        },
        quantity,
        additionalNotes,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
      };
      const res = await createInquiry(payload);
      setReferenceId(res.referenceId || '');
      setStep(4);
    } catch (err) {
      setServerError(err?.message || 'Unable to submit inquiry right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const priceLabel = selectedVariant?.price !== null && selectedVariant?.price !== undefined
    ? formatPrice(selectedVariant.price, currency)
    : 'Price on request';
  const stockLabel = Number.isFinite(Number(selectedVariant?.stock)) ? Number(selectedVariant.stock) : null;

  const progress = ((Math.min(step, 4) - 1) / 3) * 100;

  const renderStepContent = () => {
    if (step === 1) {
      if (!variants.length) {
        return <div className="text-sm text-rose-600 font-medium">No variants available for this medicine.</div>;
      }
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-800" htmlFor="strength">
              <span>Strength</span>
              <select
                id="strength"
                value={selectedStrength}
                onChange={(e) => handleStrengthChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
              >
                {strengths.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-800" htmlFor="packSize">
              <span>Pack Size</span>
              <select
                id="packSize"
                value={selectedVariant?.packSize || ''}
                onChange={(e) => handlePackSizeChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
              >
                {packSizeOptions.length === 0 ? (
                  <option value="">Select pack size</option>
                ) : (
                  packSizeOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))
                )}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-gray-500">Price</div>
              <div className="text-lg font-semibold text-gray-900">{priceLabel}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-gray-500">Stock</div>
              <div className="text-lg font-semibold text-gray-900">{stockLabel ?? 'N/A'}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-700">Quantity</span>
              <div className="inline-flex items-center overflow-hidden rounded-xl bg-gray-100 shadow-inner">
                <button
                  type="button"
                  className={`h-11 w-10 text-gray-700 hover:bg-gray-200/60 ${quantity === 1 ? 'text-gray-300 cursor-not-allowed' : ''}`}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity === 1}
                >
                  −
                </button>
                <div className="h-11 min-w-11 px-3 inline-flex items-center justify-center text-gray-900 font-medium select-none">
                  {quantity}
                </div>
                <button
                  type="button"
                  className="h-11 w-10 text-gray-700 hover:bg-gray-200/60"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {errors.variant && <div className="text-sm text-rose-600 font-medium">{errors.variant}</div>}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-800" htmlFor="additionalNotes">
            <span>Additional Notes (optional)</span>
            <textarea
              id="additionalNotes"
              rows="4"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
              placeholder="Tell us about delivery timelines, brand preferences, or other details."
            />
          </label>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-800" htmlFor="firstName">
              <span>First Name<span className="text-rose-500">*</span></span>
              <input
                id="firstName"
                name="firstName"
                type="text"
                aria-required="true"
                aria-invalid={Boolean(errors.firstName)}
                required
                value={formData.firstName}
                onChange={(e) => handleContactChange('firstName', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base transition-all duration-150 bg-white placeholder:text-gray-400 ${errors.firstName ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-400' : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-sky-100 focus:border-sky-400'}`}
              />
              {errors.firstName && <span className="text-xs text-rose-600 font-medium">{errors.firstName}</span>}
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-800" htmlFor="lastName">
              <span>Last Name<span className="text-rose-500">*</span></span>
              <input
                id="lastName"
                name="lastName"
                type="text"
                aria-required="true"
                aria-invalid={Boolean(errors.lastName)}
                required
                value={formData.lastName}
                onChange={(e) => handleContactChange('lastName', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base transition-all duration-150 bg-white placeholder:text-gray-400 ${errors.lastName ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-400' : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-sky-100 focus:border-sky-400'}`}
              />
              {errors.lastName && <span className="text-xs text-rose-600 font-medium">{errors.lastName}</span>}
            </label>

            <label className="md:col-span-2 flex flex-col gap-1 text-sm font-medium text-gray-800" htmlFor="email">
              <span>Email Address<span className="text-rose-500">*</span></span>
              <input
                id="email"
                name="email"
                type="email"
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                required
                value={formData.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base transition-all duration-150 bg-white placeholder:text-gray-400 ${errors.email ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-400' : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-sky-100 focus:border-sky-400'}`}
              />
              {errors.email && <span className="text-xs text-rose-600 font-medium">{errors.email}</span>}
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-800" htmlFor="phone">
              <span>Phone Number<span className="text-rose-500">*</span></span>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                aria-required="true"
                aria-invalid={Boolean(errors.phone)}
                required
                value={formData.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base transition-all duration-150 bg-white placeholder:text-gray-400 ${errors.phone ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-400' : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-sky-100 focus:border-sky-400'}`}
                placeholder="(555) 123-4567"
              />
              {errors.phone && <span className="text-xs text-rose-600 font-medium">{errors.phone}</span>}
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-800" htmlFor="state">
              <span>State<span className="text-rose-500">*</span></span>
              <input
                id="state"
                name="state"
                type="text"
                aria-required="true"
                aria-invalid={Boolean(errors.state)}
                required
                value={formData.state}
                onChange={(e) => handleContactChange('state', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base transition-all duration-150 bg-white placeholder:text-gray-400 ${errors.state ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-400' : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-sky-100 focus:border-sky-400'}`}
              />
              {errors.state && <span className="text-xs text-rose-600 font-medium">{errors.state}</span>}
            </label>

            <label className="md:col-span-2 flex flex-col gap-1 text-sm font-medium text-gray-800" htmlFor="city">
              <span>City<span className="text-rose-500">*</span></span>
              <input
                id="city"
                name="city"
                type="text"
                aria-required="true"
                aria-invalid={Boolean(errors.city)}
                required
                value={formData.city}
                onChange={(e) => handleContactChange('city', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base transition-all duration-150 bg-white placeholder:text-gray-400 ${errors.city ? 'border-rose-300 focus:ring-rose-100 focus:border-rose-400' : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-sky-100 focus:border-sky-400'}`}
              />
              {errors.city && <span className="text-xs text-rose-600 font-medium">{errors.city}</span>}
            </label>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Your information is secure and will only be used to respond to your inquiry.
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center text-center space-y-3 py-10">
        <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">✓</div>
        <div className="text-xl font-semibold text-gray-900">Inquiry Submitted Successfully</div>
        <div className="text-sm text-gray-700">Reference ID: {referenceId || 'Pending'}</div>
        <p className="text-sm text-gray-600 max-w-lg">
          Our team will review your request and contact you within 1 business day.
        </p>
      </div>
    );
  };

  const nextLabel = step === 3 ? 'Submit Inquiry Request' : 'Next';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0" onClick={() => (!submitting ? onClose?.() : null)} />
      <div
        ref={shellRef}
        tabIndex={-1}
        className="relative w-[85%] max-w-3xl min-h-[560px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden transition duration-200 ease-out"
      >
        <div className="absolute right-4 top-4 z-10">
          <button
            type="button"
            onClick={() => (!submitting ? onClose?.() : null)}
            className="h-9 w-9 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:shadow-sm"
            aria-label="Close inquiry"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex flex-col px-8 pb-8 pt-6 gap-4">
          <div className="space-y-2">
            <div className="text-sm uppercase tracking-[0.12em] text-gray-500">Send Inquiry</div>
            <div className="text-2xl font-semibold text-gray-900 leading-tight">{medicine?.name}</div>
            <div className="text-sm text-gray-600">Step {Math.min(step, 4)} of 4</div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex-1 border border-gray-100 rounded-lg bg-white shadow-inner p-5">
            {serverError && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{serverError}</div>
            )}
            {renderStepContent()}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-500">{step < 4 ? 'Please review carefully before submitting.' : ''}</div>
            <div className="flex gap-2">
              {step > 1 && step < 4 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              {step < 4 && (
                <button
                  type="button"
                  onClick={step === 3 ? handleSubmit : handleNext}
                  disabled={submitting || (step === 3 && !contactIsValid)}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm ${
                    submitting || (step === 3 && !contactIsValid)
                      ? 'bg-emerald-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : nextLabel}
                </button>
              )}
              {step === 4 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Continue Browsing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
