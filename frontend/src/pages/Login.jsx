/**
 * pages/Login.jsx
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from "../assets/logo.png";
import bgImage from "../assets/bg-img.webp";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Email is required.');
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
    <div
      className="login-page"
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Dark Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
        }}
      ></div>

      <div
        className="login-card"
        style={{
          position: "relative",
          zIndex: 1,
          width: "580px",
          maxWidth: "90%",
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(20px)",
          borderRadius: "28px",
          padding: "45px 50px",
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
              width: "90px",
              height: "90px",
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
            }}
          />
        </div>

        <h1
          style={{
            fontSize: "2.8rem",
            fontWeight: "800",
            textAlign: "center",
            marginTop: "0px",
            marginBottom: "8px",
            color: "#1e293b",
            letterSpacing: "-0.03em",
          }}
        >
          AttendERP
        </h1>

        <h2
          style={{
            fontSize: "1.45rem",
            fontWeight: "700",
            textAlign: "center",
            color: "#F57C00",
            marginTop: "0px",
            marginBottom: "10px",
          }}
        >
          Geeta Group of Institutions
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.95rem",
            marginTop: "0px",
            marginBottom: "30px",
          }}
        >
          Employee Attendance Management System
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="alert alert-error" role="alert">
              <span>⚠️</span> {error}
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
              marginTop: "1rem",
              justifyContent: "center",
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                Signing in...
              </>
            ) : (
              'LOG IN →'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
