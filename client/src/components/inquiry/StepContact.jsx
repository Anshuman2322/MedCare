import React from 'react';

const formatUSPhone = (value = '') => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export default function StepContact({ formData, errors = {}, onChange }) {
  const handleChange = (key, value) => {
    const nextValue = key === 'phone' ? formatUSPhone(value) : value;
    onChange(key, nextValue);
  };

  const baseInputClasses =
    'w-full rounded-lg border px-3 py-2.5 text-base transition-all duration-150 bg-white placeholder:text-gray-400';
  const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400';
  const errorClasses = 'border-rose-300 focus:ring-rose-100 focus:border-rose-400';
  const normalClasses = 'border-gray-200 hover:border-gray-300';

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
      <div className="space-y-1">
        <div className="text-xl font-semibold text-gray-900">Contact Details</div>
        <p className="text-sm text-gray-600">Tell us how to reach you. We will only use this to respond to your inquiry.</p>
      </div>

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
            onChange={(e) => handleChange('firstName', e.target.value)}
            className={`${baseInputClasses} ${errors.firstName ? errorClasses : normalClasses} ${focusClasses}`}
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
            onChange={(e) => handleChange('lastName', e.target.value)}
            className={`${baseInputClasses} ${errors.lastName ? errorClasses : normalClasses} ${focusClasses}`}
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
            onChange={(e) => handleChange('email', e.target.value)}
            className={`${baseInputClasses} ${errors.email ? errorClasses : normalClasses} ${focusClasses}`}
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
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`${baseInputClasses} ${errors.phone ? errorClasses : normalClasses} ${focusClasses}`}
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
            onChange={(e) => handleChange('state', e.target.value)}
            className={`${baseInputClasses} ${errors.state ? errorClasses : normalClasses} ${focusClasses}`}
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
            onChange={(e) => handleChange('city', e.target.value)}
            className={`${baseInputClasses} ${errors.city ? errorClasses : normalClasses} ${focusClasses}`}
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
