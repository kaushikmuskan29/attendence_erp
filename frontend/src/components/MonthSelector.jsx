/**
 * components/MonthSelector.jsx
 */
export default function MonthSelector({ value, onChange, id = 'month-selector' }) {
  return (
    <div className="month-selector">
      <span style={{ fontSize: '1rem' }}>📅</span>
      <input
        id={id}
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select month"
      />
    </div>
  );
}
