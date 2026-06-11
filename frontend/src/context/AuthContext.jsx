/**
 * context/AuthContext.jsx
 * Authentication context – stores JWT, admin info, handles login/logout.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin]     = useState(() => {
    const stored = localStorage.getItem('erp_admin');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken]     = useState(() => localStorage.getItem('erp_token') || null);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await getMe();
        setAdmin(res.data.data);
        localStorage.setItem('erp_admin', JSON.stringify(res.data.data));
      } catch {
        // Token invalid – clear session
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_admin');
        setToken(null);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []); // run only once on mount

  const login = useCallback(async (email, password) => {
    const res = await apiLogin({ email, password });
    const { token: t, admin: a } = res.data.data;

    localStorage.setItem('erp_token', t);
    localStorage.setItem('erp_admin', JSON.stringify(a));
    setToken(t);
    setAdmin(a);
    return a;
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch (_) {}
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_admin');
    setToken(null);
    setAdmin(null);
  }, []);

  const isAuthenticated = !!token && !!admin;

  return (
    <AuthContext.Provider value={{ admin, token, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
