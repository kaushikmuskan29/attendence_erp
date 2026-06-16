/**
 * pages/ResetPassword.jsx
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import logo from "../assets/logo.png";
import bgImage from "../assets/bg-img.webp";
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck } from "react-icons/fi";

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. No token provided.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      return setError('Cannot reset password without a valid reset token.');
    }
    if (!password.trim()) {
      return setError('New password is required.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (password !== confirmPass) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess('Password reset successful. Please log in.');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful. Please log in.' } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
        <div style={{ textAlign: "center", marginBottom: "0px" }}>
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
          Reset Password
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.85rem",
            marginTop: "0px",
            marginBottom: "25px",
          }}
        >
          Choose a new password for your administrator portal account.
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
            <label htmlFor="new-password" className="form-label">New Password</label>
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
                id="new-password"
                type={showPass ? "text" : "password"}
                placeholder="New Password"
                className="form-input"
                style={{ paddingLeft: "52px", paddingRight: "52px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={!token || loading}
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
                disabled={!token || loading}
              >
                {showPass ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="confirm-password" className="form-label">Confirm New Password</label>
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
                id="confirm-password"
                type={showConfirmPass ? "text" : "password"}
                placeholder="Confirm New Password"
                className="form-input"
                style={{ paddingLeft: "52px", paddingRight: "52px" }}
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                autoComplete="new-password"
                disabled={!token || loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
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
                disabled={!token || loading}
              >
                {showConfirmPass ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          <button
            id="reset-submit-btn"
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
            disabled={!token || loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                Saving...
              </>
            ) : (
              'SAVE PASSWORD →'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
