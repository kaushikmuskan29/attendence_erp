/**
 * components/StatusBadge.jsx
 * Renders color-coded attendance status badges.
 */
const STATUS_CONFIG = {
  'Present':   { cls: 'badge-present',   icon: '✅' },
  'Late Free': { cls: 'badge-late-free', icon: '🕐' },
  'Half Day':  { cls: 'badge-half-day',  icon: '⚡' },
  'Absent':    { cls: 'badge-absent',    icon: '❌' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { cls: '', icon: '❓' };
  return (
    <span className={`badge ${config.cls}`}>
      {config.icon} {status}
    </span>
  );
}
