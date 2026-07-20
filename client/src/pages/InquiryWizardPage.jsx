import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StepRequirement from '../components/inquiry/StepRequirement.jsx';
import StepPreferences from '../components/inquiry/StepPreferences.jsx';
import StepContact from '../components/inquiry/StepContact.jsx';
import StepSuccess from '../components/inquiry/StepSuccess.jsx';
import { createInquiry } from '../services/api';

const contactDefaults = {
  brandPreference: '',
  additionalNotes: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InquiryWizardPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [medicine, setMedicine] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedStrength, setSelectedStrength] = useState('');
  const [filteredVariants, setFilteredVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState(contactDefaults);
  const [errors, setErrors] = useState({});
  const [referenceId, setReferenceId] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`http://localhost:5002/api/medicines/${slug}`);
        if (!res.ok) throw new Error('Failed to load medicine');
        const med = await res.json();
        if (!active) return;
        setMedicine(med);
        const derived = deriveVariants(med);
        setVariants(derived);
        setError(derived.length ? '' : 'No variants available for this medicine.');
      } catch (err) {
        setError('Unable to load this medicine right now.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const strengthOptions = useMemo(
    () => Array.from(new Set((variants || []).map((v) => (v?.strength || '').trim()).filter(Boolean))),
    [variants]
  );

  const packSizeOptions = useMemo(
    () => Array.from(new Set((filteredVariants || []).map((v) => (v?.packSize || '').trim()).filter(Boolean))),
    [filteredVariants]
  );

  useEffect(() => {
    if (!variants.length) {
      setSelectedStrength('');
      setFilteredVariants([]);
      setSelectedVariant(null);
      return;
    }

    setSelectedStrength((prev) => {
      if (prev && strengthOptions.includes(prev)) return prev;
      return strengthOptions[0] || variants[0].strength || '';
    });
  }, [variants, strengthOptions]);

  useEffect(() => {
    if (!variants.length) {
      setFilteredVariants([]);
      setSelectedVariant(null);
      return;
    }

    const filtered = selectedStrength
      ? variants.filter((v) => v.strength === selectedStrength)
      : variants;
    setFilteredVariants(filtered);
    setSelectedVariant(filtered[0] || null);
  }, [selectedStrength, variants]);

  const handleStrengthChange = (value) => {
    setSelectedStrength(value);
  };

  const handlePackSizeChange = (packSize) => {
    if (!filteredVariants.length) return;
    const variant = filteredVariants.find((v) => v.packSize === packSize);
    setSelectedVariant(variant || filteredVariants[0] || null);
  };

  const handlePrefChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateContact = () => {
    const next = {};
    if (!formData.firstName.trim()) next.firstName = 'Required';
    if (!formData.lastName.trim()) next.lastName = 'Required';
    if (!formData.email.trim()) next.email = 'Email required';
    else if (!emailRegex.test(formData.email.trim())) next.email = 'Invalid email';
    if (!formData.phone.trim() || formData.phone.trim().replace(/\D/g, '').length < 10) next.phone = 'Phone must be 10+ digits';
    if (!formData.city.trim()) next.city = 'Required';
    if (!formData.state.trim()) next.state = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const contactIsValid = useMemo(() => {
    const phoneDigits = formData.phone.trim().replace(/\D/g, '');
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
    if (step === 3) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const handleBack = () => {
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
      setError('');
      const variantPayload = selectedVariant
        ? {
            strength: selectedVariant.strength || '',
            form: selectedVariant.form || '',
            packSize: selectedVariant.packSize || '',
            packagingType: selectedVariant.packagingType || '',
            price: selectedVariant.price ?? null,
            sku: selectedVariant.sku || '',
            stock: selectedVariant.stock ?? null,
          }
        : null;
      const payload = {
        medicineId: medicine?._id || medicine?.id,
        medicineName: medicine?.name,
        slug: medicine?.slug,
        selectedVariant: variantPayload,
        quantity,
        additionalNotes: formData.additionalNotes,
        brandPreference: formData.brandPreference,
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
      setError(err?.message || 'Unable to submit inquiry right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 3;
  const progress = Math.min(step, totalSteps) / totalSteps * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">Loading inquiry...</div>
    );
  }

  if (error && !medicine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700 space-y-3">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to shop
        </button>
      </div>
    );
  }

  if (!variants.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700 space-y-3 px-4 text-center">
        <p>No variants available for this medicine.</p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm flex flex-col gap-3">
          <div className="text-sm font-semibold text-gray-900">Inquiry for {medicine?.name}</div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Step {Math.min(step, totalSteps)} / {totalSteps}</div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {error && medicine && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>
        )}

        {step === 1 && (
          <StepRequirement
            medicineName={medicine?.name}
            strengthOptions={strengthOptions}
            packSizeOptions={packSizeOptions}
            selectedStrength={selectedStrength}
            selectedVariant={selectedVariant}
            onStrengthChange={handleStrengthChange}
            onPackSizeChange={handlePackSizeChange}
            quantity={quantity}
            setQuantity={setQuantity}
          />
        )}

        {step === 2 && (
          <StepPreferences formData={formData} onChange={handlePrefChange} />
        )}

        {step === 3 && (
          <StepContact formData={formData} errors={errors} onChange={handlePrefChange} />
        )}

        {step === 4 && (
          <StepSuccess firstName={formData.firstName} referenceId={referenceId} medicineSlug={medicine?.slug} />
        )}

        {step <= 3 && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={step === 1 ? () => navigate(-1) : handleBack}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <div className="flex gap-2">
              {step < 3 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Next
                </button>
              )}
              {step === 3 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !contactIsValid}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm ${
                    submitting || !contactIsValid
                      ? 'bg-emerald-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function deriveVariants(medicine) {
  const normalizeVariant = (v = {}, med = {}) => ({
    ...v,
    strength: v.strength || '',
    form: v.form || '',
    packSize: v.packSize || '',
    packagingType: v.packagingType || '',
    price: v.price ?? null,
    sku: v.sku || v.SKU || med.sku || '',
    stock: v.stock ?? (v.inStock ? 1 : null),
  });

  if (Array.isArray(medicine?.variants) && medicine.variants.length) return medicine.variants.map((v) => normalizeVariant(v, medicine));
  if (!medicine) return [];
  const legacyVariant = normalizeVariant({
    strength: medicine.strength || '',
    form: medicine.form || '',
    packSize: medicine.packSize || '',
    packagingType: medicine.packagingType || '',
    price: medicine.price ?? undefined,
    stock: medicine.inStock ? 1 : 0,
  }, medicine);
  const hasLegacy = Object.values(legacyVariant).some((value) => value !== '' && value !== undefined && value !== null);
  return hasLegacy ? [legacyVariant] : [];
}
