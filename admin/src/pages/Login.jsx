import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthShell, { Banner, authButtonClass, authInputClass } from '../components/auth/AuthShell.jsx';
import PasswordField from '../components/auth/PasswordField.jsx';

export default function Login() {
  const { login, setError, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const notice = location.state?.notice;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Admin Login" subtitle="Sign in to manage CureNeed">
      {notice && !error && <Banner tone="success">{notice}</Banner>}
      {error && <Banner>{error}</Banner>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label htmlFor="login-email" className="text-sm font-semibold text-slate-700">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={authInputClass}
            placeholder="admin@example.com"
            autoComplete="email"
          />
        </div>

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          labelAction={
            <Link
              to="/forgot-password"
              state={{ email }}
              onClick={() => setError('')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Forgot password?
            </Link>
          }
        />

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </AuthShell>
  );
}
