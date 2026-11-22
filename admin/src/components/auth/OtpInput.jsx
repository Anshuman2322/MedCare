import React, { useRef } from 'react';

// `value` is an array of single-digit strings, one per box ('' when empty).
export default function OtpInput({ value, onChange, disabled, autoFocus, invalid }) {
  const boxes = useRef([]);
  const length = value.length;

  function focusBox(index) {
    const box = boxes.current[Math.min(Math.max(index, 0), length - 1)];
    box?.focus();
    box?.select();
  }

  function fillFrom(index, text) {
    const digits = text.replace(/\D/g, '').slice(0, length - index).split('');
    if (!digits.length) return;
    const next = [...value];
    digits.forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    onChange(next);
    focusBox(index + digits.length);
  }

  function handleChange(index, raw) {
    if (!raw) {
      const next = [...value];
      next[index] = '';
      onChange(next);
      return;
    }
    // Typing into a filled box yields two characters; keep only the new one.
    fillFrom(index, value[index] && raw.length > 1 ? raw.replace(value[index], '') : raw);
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      e.preventDefault();
      const next = [...value];
      next[index - 1] = '';
      onChange(next);
      focusBox(index - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusBox(index + 1);
    }
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
      {value.map((digit, index) => (
        <input
          // eslint-disable-next-line react/no-array-index-key -- boxes are positional
          key={index}
          ref={(el) => {
            boxes.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          // Longer than one so an SMS/email autofill can land the whole code in box one.
          maxLength={length}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          onPaste={(e) => {
            e.preventDefault();
            fillFrom(0, e.clipboardData.getData('text'));
          }}
          className={`h-12 w-full min-w-0 rounded-lg border text-center text-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
            invalid
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
              : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-100'
          }`}
        />
      ))}
    </div>
  );
}
