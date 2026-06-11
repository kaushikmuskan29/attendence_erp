/**
 * components/Navbar.jsx
 */
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employee Management',
  '/upload':    'Upload Attendance',
  '/reports':   'Attendance Reports',
  '/settings':  'Settings',
};

export default function Navbar() {
  const { admin } = useAuth();
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'AttendERP';

  return (
    <header className="navbar">
      <div className="navbar-title">{title}</div>
      <div className="navbar-right">
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div className="admin-badge">
          <div className="admin-avatar">
            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <span className="admin-name">{admin?.name || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
}
