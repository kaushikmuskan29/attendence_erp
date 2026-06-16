/**
 * components/ErrorMessage.jsx
 */
import { FiAlertCircle } from 'react-icons/fi';

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert alert-error" role="alert">
      <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        {message}
        {onRetry && (
          <button
            onClick={onRetry}
            style={{ marginLeft: '0.75rem', textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
