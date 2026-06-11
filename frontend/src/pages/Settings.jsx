/**
 * pages/Settings.jsx
 * Admin profile details modification and system information display.
 */
import { useState } from 'react';
import { updateProfile } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { admin, login } = useAuth(); // login from context updates stored token if needed, or we can just fetch me again
  const [name, setName]         = useState(admin?.name || '');
  const [email, setEmail]       = useState(admin?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) return setError('Name is required.');
    if (!email.trim()) return setError('Email is required.');

    if (password) {
      if (password.length < 6) {
        return setError('Password must be at least 6 characters long.');
      }
      if (password !== confirmPass) {
        return setError('Passwords do not match.');
      }
    }

    setSaving(true);
    try {
      const payload = { name, email };
      if (password) payload.password = password;

      const res = await updateProfile(payload);
      
      // Update local storage / context admin info
      if (res.data?.success) {
        setSuccess('Profile updated successfully.');
        setPassword('');
        setConfirmPass('');
        
        // Context might store admin. We can trigger a state update by refreshing window or directly updating context
        // Context stores token. If token payload is updated or we just update local storage:
        const currentData = JSON.parse(localStorage.getItem('attend_erp_auth') || '{}');
        if (currentData.admin) {
          currentData.admin = { ...currentData.admin, name, email };
          localStorage.setItem('attend_erp_auth', JSON.stringify(currentData));
        }
        // Force refresh context values or advise user to re-login to see sidebar updates
        setSuccess('Profile updated successfully! Refresh the page to see changes in the sidebar.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage portal configurations and administrator profile</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🔐 Admin Credentials</h2>
          </div>
          
          <form onSubmit={handleSave}>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="settings-name">Full Name</label>
              <input
                id="settings-name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="System Admin"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-email">Email Address</label>
              <input
                id="settings-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-password">New Password (optional)</label>
              <input
                id="settings-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-confirm">Confirm New Password</label>
              <input
                id="settings-confirm"
                type="password"
                className="form-input"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Confirm password if changing"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* System info Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">⚙️ System Configuration</h2>
          </div>
          
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 0.5rem' }}>
            Attendance Rules & Calculations
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
            The AttendERP system calculates employee attendance status on the fly based on punch-in times and individual settings:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: '0.75rem', backgroundColor: '#FAFBFD' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                Present Status
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Punch-in time is before or equal to: <code style={{ background: '#E5E7EB', padding: '1px 4px', borderRadius: 3 }}>Office Start Time + Grace Period</code>.
              </div>
            </div>

            <div style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: '0.75rem', backgroundColor: '#FAFBFD' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-info)', marginBottom: '0.25rem' }}>
                Late Free Status
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Punch-in time exceeds the grace period, but the total late arrivals in the selected month are within the employee's <code style={{ background: '#E5E7EB', padding: '1px 4px', borderRadius: 3 }}>Free Lates Allowed</code> limit.
              </div>
            </div>

            <div style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: '0.75rem', backgroundColor: '#FAFBFD' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-warning)', marginBottom: '0.25rem' }}>
                Half Day Status
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Punch-in time exceeds the grace period, and the employee has already used up all their monthly free lates allowance.
              </div>
            </div>
            
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: '0.75rem', backgroundColor: '#FAFBFD' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-danger)', marginBottom: '0.25rem' }}>
                Absent Status
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                No attendance record is uploaded/available for the date. Counts as 0.0 working day.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
