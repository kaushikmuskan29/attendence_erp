/**
 * pages/Reports.jsx
 * Attendance reports with month/employee selectors, Table View, and visual Calendar View.
 */
import { useState, useEffect, useCallback } from 'react';
import { getAllReports, getEmployeeReport, exportEmployeeCSV } from '../api/reports';
import { getEmployees } from '../api/employees';
import MonthSelector from '../components/MonthSelector';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const thisMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function Reports() {
  const [month, setMonth]           = useState(thisMonth);
  const [employees, setEmployees]   = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [report, setReport]         = useState(null);
  const [allReport, setAllReport]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [exporting, setExporting]   = useState(false);
  
  // View mode for single employee report: 'table' or 'calendar'
  const [viewMode, setViewMode]     = useState('table');

  // Load employee list for filter dropdown
  useEffect(() => {
    getEmployees({ limit: 200 })
      .then(r => setEmployees(r.data.data))
      .catch(() => {});
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (selectedEmp) {
        const res = await getEmployeeReport(selectedEmp, month);
        setReport(res.data.data);
        setAllReport(null);
      } else {
        const res = await getAllReports(month);
        setAllReport(res.data.data.report);
        setReport(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, [month, selectedEmp]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExportCSV = async () => {
    if (!selectedEmp) return;
    setExporting(true);
    try {
      const res = await exportEmployeeCSV(selectedEmp, month);
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `attendance_${month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export CSV.');
    } finally {
      setExporting(false);
    }
  };

  const statusColors = {
    'Present':   { text: '#15803D', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)', label: 'P' },
    'Late Free': { text: '#0369A1', bg: 'rgba(14, 165, 233, 0.1)', border: 'rgba(14, 165, 233, 0.2)', label: 'L' },
    'Half Day':  { text: '#B45309', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', label: 'H' },
    'Absent':    { text: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.15)', label: 'A' },
  };

  // Build calendar grid days
  const renderCalendar = () => {
    if (!report || !report.days) return null;

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed

    const firstDayIndex = new Date(year, monthIndex, 1).getDay(); // 0 = Sun, 1 = Mon, etc
    const totalDays = report.summary.total_days || 30;

    // Create days array
    const calendarCells = [];

    // Empty spaces before first day
    for (let i = 0; i < firstDayIndex; i++) {
      calendarCells.push(<div key={`empty-${i}`} className="calendar-cell empty" style={{ border: '1px solid var(--color-border)', backgroundColor: '#F9FAFB', height: 80 }} />);
    }

    // Days of month
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = `${month}-${String(d).padStart(2, '0')}`;
      const dayData = report.days.find(day => day.date === dayStr) || { status: 'Absent', punch_in: null, punch_out: null };
      
      const config = statusColors[dayData.status] || { text: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB', label: '?' };

      calendarCells.push(
        <div 
          key={`day-${d}`} 
          className="calendar-cell" 
          style={{ 
            border: '1px solid var(--color-border)', 
            padding: '0.5rem', 
            height: 90, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            position: 'relative',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Day number */}
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{d}</div>
          
          {/* Status block */}
          <div 
            title={`${dayData.status}${dayData.punch_in ? ` (In: ${dayData.punch_in.slice(0, 5)})` : ''}`}
            style={{ 
              backgroundColor: config.bg, 
              color: config.text, 
              border: `1px solid ${config.border}`,
              borderRadius: 6,
              padding: '0.25rem',
              textAlign: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'help'
            }}
          >
            {config.label}
          </div>
          
          {/* Subtle details */}
          {dayData.punch_in && (
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
              {dayData.punch_in.slice(0, 5)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title">{report.employee.name} — {new Date(year, monthIndex).toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
            {Object.entries(statusColors).map(([status, cfg]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: 16, height: 16, 
                  backgroundColor: cfg.bg, 
                  color: cfg.text, 
                  border: `1px solid ${cfg.border}`,
                  borderRadius: 4, 
                  textAlign: 'center', 
                  lineHeight: '14px', 
                  fontWeight: 700 
                }}>{cfg.label}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{status}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, textAlign: 'center', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
            <div key={w} style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{w}</div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', background: '#E5E7EB', padding: '1px', borderRadius: 6 }}>
          {calendarCells}
        </div>
      </div>
    );
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Attendance Reports</h1>
          <p className="page-subtitle">Monthly attendance summaries and day-wise records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <MonthSelector value={month} onChange={setMonth} id="reports-month" />
          <select
            id="reports-employee-filter"
            className="form-input form-select"
            style={{ width: 200 }}
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
          >
            <option value="">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>
            ))}
          </select>
          {selectedEmp && (
            <>
              {/* Table / Calendar Toggle */}
              <div className="flex" style={{ border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}>
                <button 
                  className="btn btn-sm" 
                  style={{ 
                    borderRadius: 0, 
                    backgroundColor: viewMode === 'table' ? 'var(--color-primary)' : '#FFFFFF',
                    color: viewMode === 'table' ? '#FFFFFF' : 'var(--color-text-muted)',
                    border: 'none'
                  }}
                  onClick={() => setViewMode('table')}
                >
                  📋 Table
                </button>
                <button 
                  className="btn btn-sm" 
                  style={{ 
                    borderRadius: 0, 
                    backgroundColor: viewMode === 'calendar' ? 'var(--color-primary)' : '#FFFFFF',
                    color: viewMode === 'calendar' ? '#FFFFFF' : 'var(--color-text-muted)',
                    border: 'none'
                  }}
                  onClick={() => setViewMode('calendar')}
                >
                  📅 Calendar
                </button>
              </div>

              <button
                id="export-csv-btn"
                className="btn btn-success"
                onClick={handleExportCSV}
                disabled={exporting}
              >
                {exporting ? '...' : '⬇️ Export CSV'}
              </button>
            </>
          )}
        </div>
      </div>

      <ErrorMessage message={error} onRetry={fetchReport} />

      {loading ? (
        <div className="loading-page"><LoadingSpinner size={40} /></div>
      ) : report ? (
        /* ── Single Employee Report ── */
        <>
          {/* Summary Cards */}
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Days',  value: report.summary.total_days,      color: 'var(--color-text)' },
              { label: 'Present',     value: report.summary.present,         color: 'var(--color-success)' },
              { label: 'Late Free',   value: report.summary.late_free,       color: 'var(--color-info)' },
              { label: 'Half Day',    value: report.summary.half_day,        color: 'var(--color-warning)' },
              { label: 'Absent',      value: report.summary.absent,          color: 'var(--color-danger)' },
              { 
                label: 'Attendance %',  
                value: report.summary.total_days > 0 
                  ? `${Math.round((report.summary.total_day_count / report.summary.total_days) * 100)}%` 
                  : '—', 
                color: 'var(--color-primary)' 
              },
            ].map((s) => (
              <div key={s.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
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
      ) : allReport ? (
        /* ── All Employees Report ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {allReport.map((empReport) => (
            <div key={empReport.employee.id} className="card" style={{ padding: 0 }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{empReport.employee.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{empReport.employee.employee_code}</div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {[
                    ['✅ Present',   empReport.summary.present,         'var(--color-success)'],
                    ['🕐 Late Free', empReport.summary.late_free,       'var(--color-info)'],
                    ['⚡ Half Day',  empReport.summary.half_day,        'var(--color-warning)'],
                    ['❌ Absent',   empReport.summary.absent,          'var(--color-danger)'],
                    ['📊 Attendance %', empReport.summary.total_days > 0 
                      ? `${Math.round((empReport.summary.total_day_count / empReport.summary.total_days) * 100)}%` 
                      : '—', 'var(--color-primary)'],
                  ].map(([lbl, val, clr]) => (
                    <div key={lbl} style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: clr }}>{val}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Compact day strip */}
              <div style={{ padding: '0.75rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {empReport.days.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.status}`}
                    style={{
                      width: 24, height: 24,
                      borderRadius: 4,
                      background: d.status === 'Present'   ? 'rgba(34, 197, 94, 0.75)'  :
                                  d.status === 'Late Free' ? 'rgba(14, 165, 233, 0.75)'  :
                                  d.status === 'Half Day'  ? 'rgba(245, 158, 11, 0.75)'  :
                                                             'rgba(239, 68, 68, 0.15)',
                      cursor: 'help',
                      fontSize: '0.55rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: d.status === 'Absent' ? 'var(--color-text-muted)' : '#FFFFFF',
                      fontWeight: 700,
                    }}
                  >
                    {new Date(d.date + 'T00:00:00').getDate()}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!allReport.length) && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              No report data available for this month.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
