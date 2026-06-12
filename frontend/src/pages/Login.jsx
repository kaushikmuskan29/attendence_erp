/**
 * pages/Login.jsx
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from "../assets/logo.png"

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim())    return setError('Email is required.');
    if (!password.trim()) return setError('Password is required.');
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Please enter a valid email address.');

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background orbs */}
      <div className="login-bg-orb" style={{ width: 400, height: 400, background: 'var(--color-primary)', top: -100, left: -100 }} />
      <div className="login-bg-orb" style={{ width: 300, height: 300, background: '#FB923C', bottom: -80, right: -80 }} />
      <div className="login-bg-orb" style={{ width: 200, height: 200, background: 'var(--color-warning)', bottom: 100, left: '30%' }} />

      <div className="login-card">
        {/* Logo */}
        <div
  style={{
    width: 90,
    height: 90,
    margin: '0 auto 1rem',
  }}
>
  <img
    src={logo}
    alt="AttendERP Logo"
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    }}
  />
</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
            AttendERP
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: '0.35rem 0 0' }}>
            Employee Attendance Management
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="alert alert-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              style={{
                position: 'absolute', right: '0.75rem', top: '2rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', fontSize: '1rem',
              }}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                Signing in...
              </>
            ) : (
              'Log In →'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-faint)', fontSize: '0.75rem' }}>
          Default: admin@example.com / password
        </div>
      </div>
    </div>
  );
}
