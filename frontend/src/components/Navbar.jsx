/**
 * components/Navbar.jsx
 */
import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/auth';
import logo from '../assets/logo.png';
import Modal from './Modal';
import { FiChevronDown, FiLock, FiLogOut, FiCheck, FiAlertCircle } from 'react-icons/fi';

export default function Navbar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setError('');
    setSuccess('');
  };

  const handleSavePassword = async () => {
    setError('');
    setSuccess('');

    if (!currentPass) return setError('Current password is required.');
    if (!newPass) return setError('New password is required.');
    if (newPass.length < 6) return setError('New password must be at least 6 characters long.');
    if (newPass !== confirmPass) return setError('Passwords do not match.');

    setSaving(true);
    try {
      // API requires name and email, password is optional (when updating password, we pass the new one)
      const payload = {
        name: admin.name,
        email: admin.email,
        password: newPass
      };
      
      const res = await updateProfile(payload);
      if (res.data?.success) {
        setSuccess('Password updated successfully.');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          {/* Logo & Branding */}
          <div className="navbar-logo-container">
            <img
              src={logo}
              alt="AttendERP Logo"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
            <div>
              <div className="navbar-logo-text">AttendERP</div>
              <div className="navbar-logo-sub">Admin Portal</div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="navbar-nav">
            <NavLink
              to="/employees"
              className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            >
              Employees
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            >
              Reports
            </NavLink>
          </nav>
        </div>

        <div className="navbar-right">
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          
          <div 
            className={`admin-badge-container${dropdownOpen ? ' open' : ''}`} 
            ref={dropdownRef}
          >
            <div className="admin-badge" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="admin-avatar">
                {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="admin-name">{admin?.name || 'Admin'}</span>
              <FiChevronDown className="admin-chevron" size={14} style={{ color: 'var(--color-text-muted)', marginLeft: 4 }} />
            </div>

            {dropdownOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-info">
                  <div className="profile-dropdown-label">Info</div>
                  <div className="profile-dropdown-val-name">{admin?.name || 'System Admin'}</div>
                  <div className="profile-dropdown-val-email">{admin?.email || ''}</div>
                </div>
                
                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    setModalOpen(true);
                  }}
                >
                  <FiLock size={14} />
                  <span>Change Password</span>
                </button>
                
                <button
                  type="button"
                  className="profile-dropdown-item danger"
                  onClick={handleLogout}
                >
                  <FiLogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Change Password"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={closeModal} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSavePassword} disabled={saving}>
              {saving ? 'Saving...' : 'Save Password'}
            </button>
          </>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSavePassword(); }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiAlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiCheck size={16} style={{ flexShrink: 0 }} /> {success}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="current-pass">Current Password</label>
            <input
              id="current-pass"
              type="password"
              className="form-input"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="Enter current password"
              style={{ height: '44px', borderRadius: '8px', padding: '0 12px' }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-pass">New Password</label>
            <input
              id="new-pass"
              type="password"
              className="form-input"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="At least 6 characters"
              style={{ height: '44px', borderRadius: '8px', padding: '0 12px' }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="confirm-pass">Confirm New Password</label>
            <input
              id="confirm-pass"
              type="password"
              className="form-input"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Confirm new password"
              style={{ height: '44px', borderRadius: '8px', padding: '0 12px' }}
              required
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
