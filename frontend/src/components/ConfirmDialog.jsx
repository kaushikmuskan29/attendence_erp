/**
 * components/ConfirmDialog.jsx
 * Confirmation modal for destructive actions.
 */
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  confirmClass = 'btn-danger',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn ${confirmClass}`}
            onClick={onConfirm}
            disabled={loading}
            id="confirm-dialog-btn"
          >
            {loading ? '...' : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{message}</p>
    </Modal>
  );
}
