import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/auth/me');
        if (mounted) {
          setAdmin(data?.admin || data);
          setError('');
        }
      } catch (_err) {
        if (mounted) {
          setAdmin(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setAdmin(data?.admin || null);
    setError('');
    return data;
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setAdmin(null);
  };

  const value = useMemo(
    () => ({ admin, loading, error, setError, login, logout, setAdmin }),
    [admin, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
