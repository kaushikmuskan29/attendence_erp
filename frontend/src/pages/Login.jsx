/**
 * pages/Login.jsx
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { forgotPassword } from '../api/auth';
import logo from "../assets/logo.png";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck } from "react-icons/fi";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [view, setView] = useState('login'); // 'login' or 'forgot'

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear browser history state to prevent message from repeating on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) return setError('Email is required.');
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Please enter a valid email address.');

    if (view === 'login') {
      if (!password.trim()) return setError('Password is required.');

      setLoading(true);
      try {
        await login(email, password);
        navigate('/employees');
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await forgotPassword(email);
        setSuccess('If this email is registered, a reset link has been sent');
        setEmail('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to send reset link.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="login-page"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f5f2",
        backgroundImage: "radial-gradient(#e8d5c4 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >

      <div
        className="login-card"
        style={{
          position: "relative",
          zIndex: 1,
          width: "460px",
          maxWidth: "90%",
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(20px)",
          borderRadius: "28px",
          padding: "40px",
          border: "1.5px solid rgba(245, 124, 0, 0.12)",
          boxShadow: "0 20px 50px rgba(245, 124, 0, 0.03), 0 30px 60px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "0px",
          }}
        >
          <img
            src={logo}
            alt="Geeta Group Logo"
            style={{
              width: "100px",
              height: "100px",
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
            }}
          />
        </div>

        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: "800",
            textAlign: "center",
            marginTop: "0px",
            marginBottom: "6px",
            color: "#1e293b",
            letterSpacing: "-0.03em",
          }}
        >
          {view === 'login' ? 'AttendERP' : 'Forgot Password'}
        </h1>

        {view === 'login' ? (
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              textAlign: "center",
              color: "#F57C00",
              marginTop: "0px",
              marginBottom: "8px",
            }}
          >
            Geeta Group of Institutions
          </h2>
        ) : null}

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.85rem",
            marginTop: "0px",
            marginBottom: "25px",
          }}
        >
          {view === 'login'
            ? 'Employee Attendance Management System'
            : 'Enter your administrator email to receive a password reset link.'
          }
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: "1rem" }}>
              <FiAlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert" style={{ marginBottom: "1rem" }}>
              <FiCheck size={16} style={{ flexShrink: 0 }} /> {success}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="login-email" className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <FiMail
                style={{
                  position: "absolute",
                  left: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  fontSize: "1.2rem",
                  zIndex: 2,
                }}
              />
              <input
                id="login-email"
                type="email"
                placeholder="admin@example.com"
                className="form-input"
                style={{ paddingLeft: "52px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {view === 'login' && (
            <>
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label htmlFor="login-password" className="form-label">Password</label>
                <div style={{ position: "relative" }}>
                  <FiLock
                    style={{
                      position: "absolute",
                      left: "20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      fontSize: "1.2rem",
                      zIndex: 2,
                    }}
                  />
                  <input
                    id="login-password"
                    type={showPass ? "text" : "password"}
                    className="form-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: "52px", paddingRight: "52px" }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: "20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      zIndex: 2,
                    }}
                  >
                    {showPass ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div style={{ textAlign: "right", marginTop: "-0.5rem", marginBottom: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#F57C00",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary"
            style={{
              width: "100%",
              height: "58px",
              borderRadius: "30px",
              fontSize: "1rem",
              fontWeight: "600",
              marginTop: "0.5rem",
              justifyContent: "center",
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                {view === 'login' ? 'Signing in...' : 'Sending Link...'}
              </>
            ) : (
              view === 'login' ? 'LOG IN →' : 'SEND RESET LINK →'
            )}
          </button>

          {view === 'forgot' && (
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}
              >
                ← Back to Log In
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
