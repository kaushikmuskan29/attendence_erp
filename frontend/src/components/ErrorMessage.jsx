/**
 * components/ErrorMessage.jsx
 */
export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert alert-error" role="alert">
      <span>⚠️</span>
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
