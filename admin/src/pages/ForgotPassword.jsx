import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell, { Banner, authButtonClass, authInputClass, authLinkClass } from '../components/auth/AuthShell.jsx';
import OtpInput from '../components/auth/OtpInput.jsx';
import PasswordField from '../components/auth/PasswordField.jsx';
import { requestPasswordReset, resetPassword, verifyResetOtp } from '../api/authApi.js';

const OTP_LENGTH = 6;
const STEP_EMAIL = 0;
const STEP_CODE = 1;
const STEP_PASSWORD = 2;
const STEP_LABELS = ['Email', 'Verify', 'New password'];

// Mirrors passwordRules in server/routes/auth.routes.js.
const PASSWORD_CHECKS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { label: 'No spaces', test: (p) => p.length > 0 && !/\s/.test(p) },
];

const emptyOtp = () => Array(OTP_LENGTH).fill('');

function apiError(err) {
  if (!err?.response) return 'Could not reach the server. Check your connection and try again.';
  return err.response.data?.error || 'Something went wrong. Please try again.';
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Counts down to a fixed deadline, so a throttled background tab still shows the right time.
function useCountdown() {
  const [deadline, setDeadline] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!deadline) return undefined;
    const timer = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const start = (seconds) => {
    setDeadline(Date.now() + seconds * 1000);
    setRemaining(seconds);
  };

  return [remaining, start];
}

function StepIndicator({ current }) {
  return (
    <ol className="flex items-center" aria-label="Password reset progress">
      {STEP_LABELS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className={`flex items-center ${index < STEP_LABELS.length - 1 ? 'flex-1' : ''}`} aria-current={active ? 'step' : undefined}>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done || active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {done ? '✓' : index + 1}
            </span>
            <span className={`ml-2 whitespace-nowrap text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
            {index < STEP_LABELS.length - 1 && (
              <span className={`mx-2 h-px flex-1 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function PasswordChecklist({ password }) {
  return (
    <ul className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
      {PASSWORD_CHECKS.map(({ label, test }) => {
        const met = test(password);
        return (
          <li key={label} className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-700' : 'text-slate-500'}`}>
            <span aria-hidden="true" className="w-3 text-center font-bold">{met ? '✓' : '·'}</span>
            <span>
              {label}
              <span className="sr-only">{met ? ' (met)' : ' (not met)'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const STEP_COPY = {
  [STEP_EMAIL]: {
    title: 'Forgot password?',
    subtitle: () => "Enter your admin email and we'll send you a verification code.",
  },
  [STEP_CODE]: {
    title: 'Check your email',
    subtitle: (email) => `If an admin account exists for ${email}, a 6-digit code is on its way.`,
  },
  [STEP_PASSWORD]: {
    title: 'Set a new password',
    subtitle: () => 'Saving it will sign you out of all other devices.',
  },
};

export default function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP_EMAIL);
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState(emptyOtp);
  // Bumped to remount the OTP boxes, which clears them and refocuses the first one.
  const [otpRound, setOtpRound] = useState(0);
  // Held in memory only, so it disappears with the page.
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [codeExpiresIn, startCodeExpiry] = useCountdown();
  const [resendIn, startResendCooldown] = useCountdown();

  const passwordValid = PASSWORD_CHECKS.every(({ test }) => test(password));
  const passwordsMatch = password === confirmPassword;
  const codeExpired = codeExpiresIn === 0;

  function clearMessages() {
    setError('');
    setNotice('');
  }

  function clearOtp() {
    setOtp(emptyOtp());
    setOtpRound((round) => round + 1);
  }

  function restart() {
    clearOtp();
    setResetToken('');
    setPassword('');
    setConfirmPassword('');
    setStep(STEP_EMAIL);
  }

  async function sendCode({ isResend = false } = {}) {
    clearMessages();
    setBusy(true);
    try {
      const { data } = await requestPasswordReset(email.trim());
      startCodeExpiry(data.expiresInSeconds);
      startResendCooldown(data.resendAfterSeconds);
      clearOtp();
      setStep(STEP_CODE);
      if (isResend) setNotice("We've sent a new code if that email matches an admin account.");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(code) {
    clearMessages();
    setBusy(true);
    try {
      const { data } = await verifyResetOtp(email.trim(), code);
      setResetToken(data.resetToken);
      setStep(STEP_PASSWORD);
    } catch (err) {
      setError(apiError(err));
      clearOtp();
    } finally {
      setBusy(false);
    }
  }

  function handleOtpChange(next) {
    setOtp(next);
    if (next.every(Boolean) && !busy && !codeExpired) submitCode(next.join(''));
  }

  async function submitPassword(e) {
    e.preventDefault();
    clearMessages();
    setBusy(true);
    try {
      await resetPassword(resetToken, password);
      navigate('/login', {
        replace: true,
        state: { notice: 'Your password has been updated. Sign in with your new password.' },
      });
    } catch (err) {
      setError(apiError(err));
      if (err?.response?.data?.code === 'RESET_SESSION_EXPIRED') restart();
    } finally {
      setBusy(false);
    }
  }

  const copy = STEP_COPY[step];

  return (
    <AuthShell title={copy.title} subtitle={copy.subtitle(email.trim())}>
      <StepIndicator current={step} />

      {error && <Banner>{error}</Banner>}
      {notice && <Banner tone="success">{notice}</Banner>}

      {step === STEP_EMAIL && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
        >
          <div className="space-y-1">
            <label htmlFor="reset-email" className="text-sm font-semibold text-slate-700">Email</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="admin@example.com"
              className={authInputClass}
            />
          </div>
          <button type="submit" disabled={busy} className={authButtonClass}>
            {busy ? 'Sending...' : 'Send code'}
          </button>
        </form>
      )}

      {step === STEP_CODE && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitCode(otp.join(''));
          }}
        >
          <OtpInput key={otpRound} value={otp} onChange={handleOtpChange} disabled={busy || codeExpired} autoFocus invalid={Boolean(error)} />

          <p className={`text-center text-xs ${codeExpired ? 'font-semibold text-rose-700' : 'text-slate-500'}`} aria-live="polite">
            {codeExpired ? 'This code has expired. Request a new one below.' : `Code expires in ${formatTime(codeExpiresIn)}`}
          </p>

          <button type="submit" disabled={busy || codeExpired || !otp.every(Boolean)} className={authButtonClass}>
            {busy ? 'Verifying...' : 'Verify code'}
          </button>

          <div className="space-y-2 text-center">
            <p className="text-xs text-slate-500">
              Didn't get it? Check your spam folder, or{' '}
              <button
                type="button"
                onClick={() => sendCode({ isResend: true })}
                disabled={busy || resendIn > 0}
                className="font-semibold text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
              >
                {resendIn > 0 ? `resend in ${resendIn}s` : 'resend code'}
              </button>
            </p>
            <button
              type="button"
              onClick={() => {
                clearMessages();
                restart();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 hover:underline"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}

      {step === STEP_PASSWORD && (
        <form className="space-y-4" onSubmit={submitPassword}>
          {/* Tells password managers which account this new password belongs to. */}
          <input type="email" value={email.trim()} readOnly autoComplete="username" tabIndex={-1} aria-hidden="true" className="sr-only" />

          <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" autoFocus />
          <PasswordChecklist password={password} />

          <div className="space-y-1">
            <PasswordField id="confirm-password" label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
            {confirmPassword && !passwordsMatch && <p className="text-xs text-rose-700">Passwords don't match.</p>}
          </div>

          <button type="submit" disabled={busy || !passwordValid || !passwordsMatch} className={authButtonClass}>
            {busy ? 'Updating...' : 'Update password'}
          </button>
        </form>
      )}

      <p className="text-center">
        <Link to="/login" className={authLinkClass}>Back to login</Link>
      </p>
    </AuthShell>
  );
}
