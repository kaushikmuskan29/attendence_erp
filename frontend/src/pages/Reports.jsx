/**
 * pages/Reports.jsx
 * Attendance reports with month/employee selectors, Table View, and visual Calendar View.
 */
import { useState, useEffect, useCallback } from 'react';
import { getAllReports, getEmployeeReport } from '../api/reports';
import { getEmployees } from '../api/employees';
import MonthSelector from '../components/MonthSelector';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  FiList,
  FiCalendar,
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiMinus,
  FiXCircle,
  FiPercent,
  FiSearch,
} from 'react-icons/fi';

const thisMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function Reports() {
  const [month, setMonth]             = useState(thisMonth);
  const [employees, setEmployees]     = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('all');
  const [report, setReport]           = useState(null);
  const [allReport, setAllReport]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [exporting, setExporting]     = useState(false);

  // Checked checkboxes for multi-employee export
  const [selectedEmpIds, setSelectedEmpIds] = useState(new Set());

  // View mode for single employee report: 'table' or 'calendar'
  const [viewMode, setViewMode] = useState('table');
  const [search, setSearch] = useState('');

  // Load employee list for filter dropdown
  useEffect(() => {
    getEmployees({ limit: 200 })
      .then(r => {
        setEmployees(r.data.data);
      })
      .catch(() => {});
  }, []);

  // Filtered employees for dropdown
  const filteredDropdownEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_code.toLowerCase().includes(search.toLowerCase())
  );

  // Automatically select the first match when search text filters the list (only if a single employee was selected)
  useEffect(() => {
    if (search.trim() !== '' && selectedEmp !== 'all') {
      const matches = employees.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.employee_code.toLowerCase().includes(search.toLowerCase())
      );
      if (matches.length > 0 && !matches.some(m => String(m.id) === String(selectedEmp))) {
        setSelectedEmp(matches[0].id);
      }
    }
  }, [search, employees, selectedEmp]);

  const fetchReport = useCallback(async () => {
    if (!selectedEmp) {
      setReport(null);
      setAllReport([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (selectedEmp === 'all') {
        const res = await getAllReports(month);
        setAllReport(res.data.data.report || []);
        setReport(null);
      } else {
        const res = await getEmployeeReport(selectedEmp, month);
        setReport(res.data.data);
        setAllReport([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, [month, selectedEmp]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Parse Month string to extract name and year
  const getMonthYearNames = (monthStr) => {
    const [year, monthNum] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    return { monthName, year };
  };

  // CSV formatting helper
  const generateCSVContent = (empReport, monthStr) => {
    const { employee, days, summary } = empReport;
    const { monthName, year } = getMonthYearNames(monthStr);

    const lines = [];
    
    // Row 1: Employee info
    lines.push(`Employee Code,Employee Name`);
    lines.push(`"${employee.employee_code}","${employee.name}"`);
    
    // Row 2: Month, Year
    lines.push(`Month,Year`);
    lines.push(`"${monthName}","${year}"`);
    
    lines.push(``); // spacing
    
    // Row 3: Headers
    lines.push(`Date,Punch In,Punch Out,Status`);
    
    // Row 4+: Daily data
    days.forEach(d => {
      lines.push(`"${d.date}","${d.punch_in || ''}","${d.punch_out || ''}","${d.status}"`);
    });
    
    lines.push(``); // spacing
    
    // Summary headers
    lines.push(`Total Present,Total Late Free,Total Half Days,Total Absent,Day Count,Attendance %`);
    
    // Summary values
    const attendancePct = summary.total_days > 0
      ? `${Math.round((summary.total_day_count / summary.total_days) * 100)}%`
      : '—';
    lines.push(`"${summary.present}","${summary.late_free}","${summary.half_day}","${summary.absent}","${summary.total_day_count}","${attendancePct}"`);

    return lines.join('\n');
  };

  const downloadCSV = (filename, csvContent) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Trigger download for single employee details view
  const handleExportCSV = () => {
    if (!report) return;
    const { monthName, year } = getMonthYearNames(month);
    const safeName = report.employee.name.replace(/\s+/g, '_');
    const filename = `${report.employee.employee_code}_${safeName}_${monthName}_${year}.csv`;
    const csvContent = generateCSVContent(report, month);
    downloadCSV(filename, csvContent);
  };

  // Trigger download for a row within the summary table
  const handleExportSingleReport = (empReport) => {
    const { monthName, year } = getMonthYearNames(month);
    const safeName = empReport.employee.name.replace(/\s+/g, '_');
    const filename = `${empReport.employee.employee_code}_${safeName}_${monthName}_${year}.csv`;
    const csvContent = generateCSVContent(empReport, month);
    downloadCSV(filename, csvContent);
  };

  // Bulk downloads selected employees sequentially
  const handleExportSelected = async () => {
    const selectedReports = filteredAllReport.filter(r => selectedEmpIds.has(r.employee.id));
    if (selectedReports.length === 0) return;

    setExporting(true);
    try {
      for (let i = 0; i < selectedReports.length; i++) {
        const empReport = selectedReports[i];
        const { monthName, year } = getMonthYearNames(month);
        const safeName = empReport.employee.name.replace(/\s+/g, '_');
        const filename = `${empReport.employee.employee_code}_${safeName}_${monthName}_${year}.csv`;
        const csvContent = generateCSVContent(empReport, month);

        // Download in quick succession spreading with slight delay to prevent browser blockages
        await new Promise(resolve => setTimeout(resolve, i * 150));
        downloadCSV(filename, csvContent);
      }
    } catch {
      setError('Failed to download some CSV files.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedEmpIds(new Set());
  };

  const statusColors = {
    'Present':   { text: '#15803D', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)',   label: 'P' },
    'Late Free': { text: '#0369A1', bg: 'rgba(14, 165, 233, 0.1)', border: 'rgba(14, 165, 233, 0.2)', label: 'L' },
    'Half Day':  { text: '#B45309', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', label: 'H' },
    'Absent':    { text: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.15)', label: 'A' },
    'Leave':     { text: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)', border: 'rgba(124, 58, 237, 0.15)', label: 'Exc' },
  };

  // Build calendar grid days
  const renderCalendar = () => {
    if (!report || !report.days) return null;

    const [yearStr, monthStr] = month.split('-');
    const year       = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    const firstDayIndex = new Date(year, monthIndex, 1).getDay();
    const totalDays     = report.summary.total_days || 30;

    const calendarCells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      calendarCells.push(
        <div
          key={`empty-${i}`}
          className="calendar-cell empty"
          style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-alt)',
            borderRadius: 6,
            height: 85
          }}
        />
      );
    }

    for (let d = 1; d <= totalDays; d++) {
      const dayStr  = `${month}-${String(d).padStart(2, '0')}`;
      const dayData = report.days.find(day => day.date === dayStr) || { status: 'Absent', punch_in: null, punch_out: null };
      const config  = statusColors[dayData.status] || { text: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB', label: '?' };

      calendarCells.push(
        <div
          key={`day-${d}`}
          className="calendar-cell"
          title={dayData.exception ? `Exception: ${dayData.exception.note}` : undefined}
          style={{
            border: '1px solid var(--color-border)',
            padding: '0.6rem',
            height: 85,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 6,
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{d}</span>
            <span
              style={{
                backgroundColor: config.bg,
                color: config.text,
                border: `1px solid ${config.border}`,
                borderRadius: 4,
                padding: '1px 5px',
                fontSize: '0.65rem',
                fontWeight: 700
              }}
            >
              {config.label}
            </span>
          </div>

          <div>
            {dayData.exception ? (
              <div style={{ fontSize: '0.68rem', color: '#7C3AED', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.62rem', color: 'rgba(124, 58, 237, 0.8)', textTransform: 'uppercase', fontWeight: 600 }}>Leave/Exc</span>
                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={dayData.exception.note}>
                  {dayData.exception.note}
                </span>
              </div>
            ) : dayData.punch_in ? (
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', fontWeight: 600 }}>Punches</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>In: {dayData.punch_in.slice(0, 5)}</span>
                  {dayData.punch_out && <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Out: {dayData.punch_out.slice(0, 5)}</span>}
                </div>
              </div>
            ) : (
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)', fontStyle: 'italic' }}>
                No punches
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {report.employee.name} — {new Date(year, monthIndex).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            {Object.entries(statusColors).map(([status, cfg]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--color-bg)', padding: '0.25rem 0.5rem', borderRadius: 4, border: '1px solid var(--color-border)' }}>
                <span style={{ display: 'inline-block', width: 14, height: 14, backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, borderRadius: 3, textAlign: 'center', lineHeight: '12px', fontWeight: 700, fontSize: '0.6rem' }}>{cfg.label}</span>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{status}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
            <div key={w} style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{w}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {calendarCells}
        </div>
      </div>
    );
  };

  const filteredAllReport = allReport.filter(empReport => 
    empReport.employee.name.toLowerCase().includes(search.toLowerCase()) ||
    empReport.employee.employee_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Attendance Reports</h1>
          <p className="page-subtitle">Monthly attendance summaries and day-wise records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <MonthSelector value={month} onChange={setMonth} id="reports-month" />
          
          <select
            id="reports-employee-filter"
            className="month-selector-select"
            style={{ width: 250 }}
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
          >
            <option value="all">All Employees Summary</option>
            {filteredDropdownEmployees.length === 0 ? (
              <option value="">No matching employees</option>
            ) : (
              filteredDropdownEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>
              ))
            )}
          </select>

          {/* Table / Calendar Toggle */}
          {selectedEmp !== 'all' && (
            <div className="flex" style={{ border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}>
              <button
                className="btn btn-sm"
                style={{ borderRadius: 0, backgroundColor: viewMode === 'table' ? 'var(--color-primary)' : 'var(--color-surface)', color: viewMode === 'table' ? '#FFFFFF' : 'var(--color-text-muted)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setViewMode('table')}
              >
                <FiList size={16} /> Table
              </button>
              <button
                className="btn btn-sm"
                style={{ borderRadius: 0, backgroundColor: viewMode === 'calendar' ? 'var(--color-primary)' : 'var(--color-surface)', color: viewMode === 'calendar' ? '#FFFFFF' : 'var(--color-text-muted)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setViewMode('calendar')}
              >
                <FiCalendar size={16} /> Calendar
              </button>
            </div>
          )}

          {/* Export Actions */}
          {selectedEmp === 'all' ? (
            <>
              {selectedEmpIds.size > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleClearSelection}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                >
                  Clear Selection
                </button>
              )}
              <button
                id="export-selected-btn"
                className="btn btn-success btn-sm"
                onClick={handleExportSelected}
                disabled={selectedEmpIds.size === 0 || exporting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <FiDownload size={16} />
                {exporting ? 'Exporting...' : `Export Selected (${selectedEmpIds.size})`}
              </button>
            </>
          ) : (
            report && (
              <button
                id="export-csv-btn"
                className="btn btn-success btn-sm"
                onClick={handleExportCSV}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <FiDownload size={16} />
                Export CSV
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
          <div className="search-wrapper" style={{ flex: 1 }}>
            <FiSearch size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--color-text-faint)', pointerEvents: 'none' }} />
            <input
              id="reports-search"
              className="form-input search-input"
              placeholder="Search by employee name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <button
            id="reports-search-btn"
            className="btn btn-primary"
            style={{ borderRadius: 50, padding: '0 1.75rem', height: 60, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
            onClick={fetchReport}
          >
            <FiSearch size={18} />
            Search
          </button>
        </div>
      </div>

      <ErrorMessage message={error} onRetry={fetchReport} />

      {loading ? (
        <div className="loading-page"><LoadingSpinner size={40} /></div>
      ) : selectedEmp === 'all' ? (
        /* ── All Employees Summary Table View ── */
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              All Employees summary — {month}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {filteredAllReport.length} employees found
            </span>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px', paddingLeft: '1.5rem' }}>
                    <input
                      type="checkbox"
                      checked={filteredAllReport.length > 0 && filteredAllReport.every(r => selectedEmpIds.has(r.employee.id))}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedEmpIds(prev => {
                          const next = new Set(prev);
                          filteredAllReport.forEach(r => {
                            if (checked) {
                              next.add(r.employee.id);
                            } else {
                              next.delete(r.employee.id);
                            }
                          });
                          return next;
                        });
                      }}
                      style={{ cursor: 'pointer', scale: '1.1' }}
                    />
                  </th>
                  <th>Employee Code</th>
                  <th>Employee Name</th>
                  <th>Present</th>
                  <th>Late Free</th>
                  <th>Half Day</th>
                  <th>Day Count</th>
                  <th>Absent</th>
                  <th>Leave</th>
                  <th>Attendance %</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllReport.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                      No employees match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAllReport.map((empReport) => {
                    const isSelected = selectedEmpIds.has(empReport.employee.id);
                    const attPct = empReport.summary.total_days > 0
                      ? Math.round((empReport.summary.total_day_count / empReport.summary.total_days) * 100)
                      : 0;
                    return (
                      <tr 
                        key={empReport.employee.id}
                        style={{ backgroundColor: isSelected ? 'rgba(245, 124, 0, 0.02)' : 'transparent' }}
                      >
                        <td style={{ paddingLeft: '1.5rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedEmpIds(prev => {
                                const next = new Set(prev);
                                if (next.has(empReport.employee.id)) {
                                  next.delete(empReport.employee.id);
                                } else {
                                  next.add(empReport.employee.id);
                                }
                                return next;
                              });
                            }}
                            style={{ cursor: 'pointer', scale: '1.1' }}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{empReport.employee.employee_code}</td>
                        <td style={{ fontWeight: 500 }}>{empReport.employee.name}</td>
                        <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{empReport.summary.present}</td>
                        <td style={{ color: 'var(--color-info)', fontWeight: 600 }}>{empReport.summary.late_free}</td>
                        <td style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{empReport.summary.half_day}</td>
                        <td style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{empReport.summary.total_day_count}</td>
                        <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{empReport.summary.absent}</td>
                        <td style={{ color: '#7C3AED', fontWeight: 600 }}>{empReport.summary.leave || 0}</td>
                        <td style={{ fontWeight: 700 }}>
                          <span style={{
                            color: attPct >= 90 ? 'var(--color-success)' : attPct >= 75 ? 'var(--color-warning)' : 'var(--color-danger)'
                          }}>
                            {attPct}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleExportSingleReport(empReport)}
                            style={{ padding: '4px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center' }}
                            title="Download CSV"
                          >
                            <FiDownload size={14} /> Export
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : report ? (
        /* ── Single Employee Report View ── */
        <>
          {/* Summary Cards */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Days',   value: report.summary.total_days,      color: 'var(--color-text-muted)' },
              { label: 'Present',      value: report.summary.present,         color: 'var(--color-success)' },
              { label: 'Late Free',    value: report.summary.late_free,       color: 'var(--color-info)'    },
              { label: 'Half Day',     value: report.summary.half_day,        color: 'var(--color-warning)' },
              { label: 'Day Count',    value: report.summary.total_day_count, color: 'var(--color-primary)' },
              { label: 'Absent',       value: report.summary.absent,          color: 'var(--color-danger)'  },
              { label: 'Leave',        value: report.summary.leave || 0,      color: '#7C3AED'              },
              {
                label: 'Attendance %',
                value: report.summary.total_days > 0
                  ? `${Math.round((report.summary.total_day_count / report.summary.total_days) * 100)}%`
                  : '—',
                color: 'var(--color-primary)',
              },
            ].map((s) => (
              <div key={s.label} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color.startsWith('var') ? s.color : 'var(--color-primary)' }} />
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color.startsWith('var') ? (s.label === 'Total Days' ? 'var(--color-text)' : s.color) : 'var(--color-text)', lineHeight: 1.2, marginTop: '0.25rem' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {viewMode === 'calendar' ? renderCalendar() : (
            /* Day-wise Table View */
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 className="card-title" style={{ margin: 0 }}>
                  {report.employee.name} — {month}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {report.employee.employee_code}
                </span>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Punch In</th>
                      <th>Punch Out</th>
                      <th>Worked (min)</th>
                      <th>Status</th>
                      <th>Day Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.days.map((d) => (
                      <tr key={d.date}>
                        <td style={{ fontWeight: 500 }}>
                          {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ color: d.punch_in ? 'var(--color-text)' : 'var(--color-text-faint)' }}>
                          {d.punch_in || '—'}
                        </td>
                        <td style={{ color: d.punch_out ? 'var(--color-text)' : 'var(--color-text-faint)' }}>
                          {d.punch_out || '—'}
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>
                          {d.worked_minutes != null ? `${Math.floor(d.worked_minutes / 60)}h ${d.worked_minutes % 60}m` : '—'}
                        </td>
                        <td><StatusBadge status={d.status} /></td>
                        <td>
                          <span style={{ fontWeight: 600, color: statusColors[d.status]?.text || 'var(--color-text)' }}>
                            {d.day_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ── Placeholder when no employee is selected ── */
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <FiCalendar size={48} style={{ color: 'var(--color-primary)', opacity: 0.6, marginBottom: '1.25rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>No Employee Selected</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
            Please select an employee from the dropdown at the top or type a search query to view their monthly attendance calendar and record history.
          </p>
        </div>
      )}
    </div>
  );
}
