/**
 * App.jsx
 * Root component with routing and layout.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import ResetPassword from './pages/ResetPassword';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content">
        <main>{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected */}
          {/* /dashboard redirects to /employees for any stale links */}
          <Route path="/dashboard" element={<Navigate to="/employees" replace />} />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <AppLayout><Employees /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <AppLayout><Reports /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirect root and unknown paths to /employees */}
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="*" element={<Navigate to="/employees" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
