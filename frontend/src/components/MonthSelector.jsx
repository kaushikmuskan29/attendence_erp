/**
 * components/MonthSelector.jsx
 */
export default function MonthSelector({ value, onChange, id = 'month-selector' }) {
  const [yearStr, monthStr] = (value || '').split('-');
  
  // Safe fallbacks to current year/month if empty or invalid
  const currentYear = yearStr || new Date().getFullYear().toString();
  const currentMonth = monthStr || String(new Date().getMonth() + 1).padStart(2, '0');

  // Generate range of years (e.g. 2022 to 2030)
  const years = [];
  const startYear = 2022;
  const endYear = 2030;
  for (let y = startYear; y <= endYear; y++) {
    years.push(y.toString());
  }

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const handleYearChange = (e) => {
    onChange(`${e.target.value}-${currentMonth}`);
  };

  const handleMonthChange = (e) => {
    onChange(`${currentYear}-${e.target.value}`);
  };

  return (
    <div className="month-selector">
      {/* Month Dropdown */}
      <select
        id={`${id}-month`}
        value={currentMonth}
        onChange={handleMonthChange}
        className="month-selector-select"
        aria-label="Select month"
        style={{ width: '130px' }}
      >
        {months.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      {/* Year Dropdown */}
      <select
        id={`${id}-year`}
        value={currentYear}
        onChange={handleYearChange}
        className="month-selector-select"
        aria-label="Select year"
        style={{ width: '90px' }}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}

