/**
 * components/StatusBadge.jsx
 * Renders color-coded attendance status badges with Feather icons.
 */
import { FiCheckCircle, FiClock, FiMinus, FiXCircle, FiHelpCircle, FiCalendar } from 'react-icons/fi';

const STATUS_CONFIG = {
  'Present':   { cls: 'badge-present',   Icon: FiCheckCircle },
  'Late Free': { cls: 'badge-late-free', Icon: FiClock       },
  'Half Day':  { cls: 'badge-half-day',  Icon: FiMinus       },
  'Absent':    { cls: 'badge-absent',    Icon: FiXCircle     },
  'Leave':     { cls: 'badge-leave',     Icon: FiCalendar    },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { cls: '', Icon: FiHelpCircle };
  const { Icon } = config;
  return (
    <span className={`badge ${config.cls}`}>
      <Icon size={12} style={{ flexShrink: 0 }} />
      {status}
    </span>
  );
}
