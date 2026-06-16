/**
 * pages/Employees.jsx
 * Unified landing page: CRUD + monthly stats cards + attendance upload card
 * + per-employee detail drawer with exceptions list/form.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/employees';
import { getDashboard } from '../api/dashboard';
import { getActiveExceptions, getExceptions, createException, deleteException } from '../api/exceptions';
import { uploadAttendanceCSV } from '../api/attendance';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import MonthSelector from '../components/MonthSelector';
import {
  FiUsers,
  FiCalendar,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiSettings,
  FiClock,
  FiSearch,
  FiChevronUp,
  FiChevronDown,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiAlertTriangle,
  FiFileText,
  FiDownload,
  FiUpload,
} from 'react-icons/fi';

/* ── Helpers ──────────────────────────────────────────────── */

const thisMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const formatMonthName = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const EMPTY_FORM = {
  employee_code: '',
  name: '',
  office_start_time: '09:00',
  office_end_time: '18:00',
  grace_period_minutes: 15,
  free_lates_allowed: 2,
};

const EMPTY_EXC_FORM = {
  from_date: '',
  to_date: '',
  override_start_time: '',
  override_end_time: '',
  note: '',
};

function getWorkingMinutes(start, end) {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  const sMins = sH * 60 + (sM || 0);
  const eMins = eH * 60 + (eM || 0);
  return Math.max(0, eMins - sMins);
}

function fmt(dateStr) {
  // "2026-06-01" → "Jun 1, 2026"
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatLastUploaded(isoStr) {
  if (!isoStr) return 'No uploads yet';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 'No uploads yet';
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `Last uploaded: ${datePart} at ${timePart}`;
}

/* ── Sort icon helper ─────────────────────────────────────── */

function SortIcon({ columnKey, sortConfig }) {
  if (sortConfig.key !== columnKey) {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
        <polyline points="17 15 12 20 7 15" />
        <polyline points="17 9 12 4 7 9" />
      </svg>
    );
  }
  return sortConfig.direction === 'asc'
    ? <FiChevronUp size={13} />
    : <FiChevronDown size={13} />;
}

/* ── Add / Edit Employee Form (used in modal) ─────────────── */

function EmployeeForm({ form, setForm, error }) {
  const workingMinutes = getWorkingMinutes(form.office_start_time, form.office_end_time);
  return (
    <>
      {error && <div className="alert alert-error"><FiAlertCircle size={16} /> {error}</div>}
      <div className="form-group">
        <label className="form-label" htmlFor="emp-code">Employee Code</label>
        <input id="emp-code" className="form-input" value={form.employee_code}
          onChange={(e) => setForm(f => ({ ...f, employee_code: e.target.value }))} placeholder="EMP001" />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="emp-name">Full Name</label>
        <input id="emp-name" className="form-input" value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="emp-start">Office Start Time</label>
          <input id="emp-start" type="time" className="form-input" value={form.office_start_time}
            onChange={(e) => setForm(f => ({ ...f, office_start_time: e.target.value }))} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="emp-end">Office End Time</label>
          <input id="emp-end" type="time" className="form-input" value={form.office_end_time}
            onChange={(e) => setForm(f => ({ ...f, office_end_time: e.target.value }))} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="emp-working">Working Minutes</label>
          <input id="emp-working" type="number" className="form-input" value={workingMinutes}
            disabled style={{ backgroundColor: '#F3F4F6', color: '#4B5563', cursor: 'not-allowed' }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="emp-grace">Grace Period (min)</label>
          <input id="emp-grace" type="number" className="form-input" min={0} max={120} value={form.grace_period_minutes}
            onChange={(e) => setForm(f => ({ ...f, grace_period_minutes: e.target.value }))} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="emp-lates">Free Lates Allowed</label>
          <input id="emp-lates" type="number" className="form-input" min={0} max={31} value={form.free_lates_allowed}
            onChange={(e) => setForm(f => ({ ...f, free_lates_allowed: e.target.value }))} />
        </div>
      </div>
    </>
  );
}

/* ── Employee Detail Drawer ───────────────────────────────── */

function EmployeeDrawer({ emp, month, dashEmployees, totalDays, onClose, onSaved }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    office_start_time: emp.office_start_time ? emp.office_start_time.slice(0, 5) : '09:00',
    office_end_time: emp.office_end_time ? emp.office_end_time.slice(0, 5) : '18:00',
    grace_period_minutes: emp.grace_period_minutes ?? 15,
    free_lates_allowed: emp.free_lates_allowed ?? 2,
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Exceptions state
  const [exceptions, setExceptions] = useState([]);
  const [loadingExc, setLoadingExc] = useState(true);
  const [showAddExc, setShowAddExc] = useState(false);
  const [excForm, setExcForm] = useState(EMPTY_EXC_FORM);
  const [excError, setExcError] = useState('');
  const [excSaving, setExcSaving] = useState(false);
  const [deletingExcId, setDeletingExcId] = useState(null);

  // Close on ESC
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Fetch exceptions for this employee
  const fetchExceptions = useCallback(async () => {
    setLoadingExc(true);
    try {
      const res = await getExceptions(emp.id);
      setExceptions(res.data.data);
    } catch {
      setExceptions([]);
    } finally {
      setLoadingExc(false);
    }
  }, [emp.id]);

  useEffect(() => { fetchExceptions(); }, [fetchExceptions]);

  const cancelEdit = () => {
    setForm({
      office_start_time: emp.office_start_time ? emp.office_start_time.slice(0, 5) : '09:00',
      office_end_time: emp.office_end_time ? emp.office_end_time.slice(0, 5) : '18:00',
      grace_period_minutes: emp.grace_period_minutes ?? 15,
      free_lates_allowed: emp.free_lates_allowed ?? 2,
    });
    setFormError('');
    setEditMode(false);
  };

  const handleSave = async () => {
    setFormError('');
    const mins = getWorkingMinutes(form.office_start_time, form.office_end_time);
    if (mins <= 0) return setFormError('End time must be after start time.');
    setSaving(true);
    try {
      await updateEmployee(emp.id, {
        employee_code: emp.employee_code,
        name: emp.name,
        office_start_time: `${form.office_start_time}:00`,
        office_end_time: `${form.office_end_time}:00`,
        grace_period_minutes: parseInt(form.grace_period_minutes, 10),
        free_lates_allowed: parseInt(form.free_lates_allowed, 10),
      });
      setEditMode(false);
      onSaved();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddException = async () => {
    setExcError('');
    const { from_date, to_date, override_start_time, override_end_time, note } = excForm;
    if (!from_date) return setExcError('From date is required.');
    if (!to_date) return setExcError('To date is required.');
    if (!override_start_time) return setExcError('Override start time is required.');
    if (from_date > to_date) return setExcError('From date cannot be after to date.');

    setExcSaving(true);
    try {
      await createException(emp.id, {
        from_date,
        to_date,
        override_start_time,
        override_end_time: override_end_time || undefined,
        note
      });
      setExcForm(EMPTY_EXC_FORM);
      setShowAddExc(false);
      await fetchExceptions();
      onSaved();
    } catch (err) {
      setExcError(err.response?.data?.message || 'Failed to save exception.');
    } finally {
      setExcSaving(false);
    }
  };

  const handleDeleteException = async (excId) => {
    setDeletingExcId(excId);
    try {
      await deleteException(emp.id, excId);
      await fetchExceptions();
      onSaved();
    } catch {
      // ignore
    } finally {
      setDeletingExcId(null);
    }
  };

  const stats = dashEmployees?.find(e => e.id === emp.id) ?? null;
  const attendancePct = stats && totalDays
    ? Math.round((stats.total_day_count / totalDays) * 100)
    : null;

  const today = todayStr();

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div className="drawer" role="dialog" aria-modal="true" aria-label={`Details for ${emp.name}`}>

        {/* ── Drawer Header ── */}
        <div className="drawer-header">
          <div className="drawer-header-info">
            <h2 className="drawer-title">{emp.name}</h2>
            <span className="drawer-subtitle">{emp.employee_code}</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close drawer" style={{ flexShrink: 0 }}>
            <FiX size={18} />
          </button>
        </div>

        <div className="drawer-body">

          {/* ── Section 1: Employee Info ── */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <h3 className="drawer-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FiSettings size={14} /> Employee Info
              </h3>
              {!editMode ? (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(true)} id={`drawer-edit-${emp.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FiEdit2 size={14} /> Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={cancelEdit} disabled={saving}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FiCheck size={14} /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            <div className="drawer-section-body">
              {formError && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}><FiAlertCircle size={16} /> {formError}</div>}
              <div className="drawer-info-grid">
                <div className="drawer-info-item">
                  <label htmlFor={`d-start-${emp.id}`}>Start Time</label>
                  {editMode ? (
                    <input id={`d-start-${emp.id}`} type="time" className="drawer-form-input" value={form.office_start_time}
                      onChange={(e) => setForm(f => ({ ...f, office_start_time: e.target.value }))} />
                  ) : (
                    <div className="drawer-info-value">{emp.office_start_time ? emp.office_start_time.slice(0, 5) : '—'}</div>
                  )}
                </div>
                <div className="drawer-info-item">
                  <label htmlFor={`d-end-${emp.id}`}>End Time</label>
                  {editMode ? (
                    <input id={`d-end-${emp.id}`} type="time" className="drawer-form-input" value={form.office_end_time}
                      onChange={(e) => setForm(f => ({ ...f, office_end_time: e.target.value }))} />
                  ) : (
                    <div className="drawer-info-value">{emp.office_end_time ? emp.office_end_time.slice(0, 5) : '—'}</div>
                  )}
                </div>
                <div className="drawer-info-item">
                  <label htmlFor={`d-grace-${emp.id}`}>Grace Period</label>
                  {editMode ? (
                    <input id={`d-grace-${emp.id}`} type="number" className="drawer-form-input" min={0} max={120}
                      value={form.grace_period_minutes}
                      onChange={(e) => setForm(f => ({ ...f, grace_period_minutes: e.target.value }))} />
                  ) : (
                    <div className="drawer-info-value">{emp.grace_period_minutes ?? 0} min</div>
                  )}
                </div>
                <div className="drawer-info-item">
                  <label htmlFor={`d-lates-${emp.id}`}>Free Lates Allowed</label>
                  {editMode ? (
                    <input id={`d-lates-${emp.id}`} type="number" className="drawer-form-input" min={0} max={31}
                      value={form.free_lates_allowed}
                      onChange={(e) => setForm(f => ({ ...f, free_lates_allowed: e.target.value }))} />
                  ) : (
                    <div className="drawer-info-value">{emp.free_lates_allowed ?? 0} allowed</div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: 'var(--color-surface-alt)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Working Minutes</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {getWorkingMinutes(form.office_start_time, form.office_end_time)} min
                </span>
              </div>
            </div>
          </div>

          {/* ── Section 2: Monthly Attendance Summary ── */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <h3 className="drawer-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FiCalendar size={14} /> Attendance — {month}
              </h3>
            </div>
            <div className="drawer-section-body">
              {!stats ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '1rem 0', margin: 0 }}>
                  No attendance data uploaded for this month.
                </p>
              ) : (
                <>
                  <div className="summary-grid">
                    <div className="summary-item success">
                      <div className="summary-item-value">{stats.present ?? '—'}</div>
                      <div className="summary-item-label">Present</div>
                    </div>
                    <div className="summary-item info">
                      <div className="summary-item-value">{stats.late_free ?? '—'}</div>
                      <div className="summary-item-label">Late Free</div>
                    </div>
                    <div className="summary-item warning">
                      <div className="summary-item-value">{stats.half_day ?? '—'}</div>
                      <div className="summary-item-label">Half Day</div>
                    </div>
                    <div className="summary-item danger">
                      <div className="summary-item-value">{stats.absent ?? '—'}</div>
                      <div className="summary-item-label">Absent</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-item-value">{stats.total_day_count ?? '—'}</div>
                      <div className="summary-item-label">Day Count</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-item-value">{attendancePct !== null ? `${attendancePct}%` : '—'}</div>
                      <div className="summary-item-label">Attendance</div>
                    </div>
                  </div>
                  {attendancePct !== null && (
                    <div style={{ marginTop: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance Rate</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>{attendancePct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${attendancePct}%` }} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Section 3: Schedule Exceptions ── */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <h3 className="drawer-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FiClock size={14} /> Schedule Exceptions
              </h3>
              {!showAddExc && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setShowAddExc(true); setExcError(''); setExcForm(EMPTY_EXC_FORM); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  id={`add-exception-${emp.id}`}
                >
                  <FiPlus size={14} /> Add Exception
                </button>
              )}
            </div>
            <div className="drawer-section-body">

              {/* Add Exception Form */}
              {showAddExc && (
                <div style={{ background: 'var(--color-surface-alt)', borderRadius: 8, padding: '1rem', marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: '0.75rem' }}>New Schedule Exception</div>
                  {excError && (
                    <div className="alert alert-error" style={{ marginBottom: '0.6rem', fontSize: '0.8rem' }}>
                      <FiAlertCircle size={14} /> {excError}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        From Date
                      </label>
                      <input type="date" className="drawer-form-input" value={excForm.from_date}
                        onChange={(e) => setExcForm(f => ({ ...f, from_date: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        To Date
                      </label>
                      <input type="date" className="drawer-form-input" value={excForm.to_date}
                        onChange={(e) => setExcForm(f => ({ ...f, to_date: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        Override Start Time
                      </label>
                      <input type="time" className="drawer-form-input" value={excForm.override_start_time}
                        onChange={(e) => setExcForm(f => ({ ...f, override_start_time: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        Override End Time <span style={{ opacity: 0.6, fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input type="time" className="drawer-form-input" value={excForm.override_end_time}
                        onChange={(e) => setExcForm(f => ({ ...f, override_end_time: e.target.value }))} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        Note <span style={{ opacity: 0.6, fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input type="text" className="drawer-form-input" placeholder="e.g. Medical leave" value={excForm.note}
                        onChange={(e) => setExcForm(f => ({ ...f, note: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddExc(false); setExcError(''); }} disabled={excSaving}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleAddException} disabled={excSaving}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <FiCheck size={14} /> {excSaving ? 'Saving…' : 'Save Exception'}
                    </button>
                  </div>
                </div>
              )}

              {/* Exceptions list */}
              {loadingExc ? (
                <div style={{ textAlign: 'center', padding: '0.75rem 0' }}><LoadingSpinner /></div>
              ) : exceptions.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.82rem', padding: '0.5rem 0', margin: 0 }}>
                  No schedule exceptions defined.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {exceptions.map((exc) => {
                    const isActive = today >= exc.from_date && today <= exc.to_date;
                    return (
                      <div
                        key={exc.id}
                        style={{
                          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem',
                          padding: '0.65rem 0.85rem', borderRadius: 8,
                          background: isActive ? 'rgba(245, 158, 11, 0.06)' : 'var(--color-surface-alt)',
                          border: isActive ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {fmt(exc.from_date)} → {fmt(exc.to_date)}
                            {isActive && (
                              <span className="active-exception-badge">
                                <FiClock size={10} /> Active
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                            Override: <strong>{exc.override_start_time?.slice(0, 5)}</strong>
                            {exc.override_end_time && (
                              <> – <strong>{exc.override_end_time.slice(0, 5)}</strong></>
                            )}
                            {exc.note && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>· {exc.note}</span>}
                          </div>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteException(exc.id)}
                          disabled={deletingExcId === exc.id}
                          aria-label="Delete exception"
                          style={{ color: 'var(--color-danger)', flexShrink: 0, padding: '0.25rem 0.5rem' }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

/* ── Main Page ────────────────────────────────────────────── */

export default function Employees() {
  // ── Employees list state ────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Dashboard / month state ─────────────────────────────
  const [month, setMonth] = useState(thisMonth);
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  // ── Drawer state ────────────────────────────────────────
  const [drawerEmp, setDrawerEmp] = useState(null);

  // ── Active exception badges (fetched once on mount) ─────
  const [activeExcEmpIds, setActiveExcEmpIds] = useState(new Set());

  // ── Upload Card state & ref ─────────────────────────────
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [lastUploadTime, setLastUploadTime] = useState(() => localStorage.getItem('attendance_last_upload'));
  const [showFormatRef, setShowFormatRef] = useState(false);

  /* ── Data fetching ──────────────────────────────────────── */

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getEmployees({ search, page, limit: 10 });
      setEmployees(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  const fetchDashboard = useCallback(async () => {
    setDashLoading(true);
    try {
      const res = await getDashboard(month);
      setDashData(res.data.data);
    } catch {
      setDashData(null);
    } finally {
      setDashLoading(false);
    }
  }, [month]);

  const refreshActiveExceptions = useCallback(async () => {
    try {
      const res = await getActiveExceptions(todayStr());
      setActiveExcEmpIds(new Set(res.data.data.employee_ids));
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { refreshActiveExceptions(); }, [refreshActiveExceptions]);
  useEffect(() => { setPage(1); }, [search]);

  /* ── Employee CRUD handlers ─────────────────────────────── */

  const openCreate = () => {
    setEditEmp(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditEmp(emp);
    setForm({
      employee_code: emp.employee_code,
      name: emp.name,
      office_start_time: emp.office_start_time ? emp.office_start_time.slice(0, 5) : '09:00',
      office_end_time: emp.office_end_time ? emp.office_end_time.slice(0, 5) : '18:00',
      grace_period_minutes: emp.grace_period_minutes ?? 15,
      free_lates_allowed: emp.free_lates_allowed ?? 2,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.employee_code.trim()) return setFormError('Employee code is required.');
    if (!form.name.trim()) return setFormError('Name is required.');
    if (!form.office_start_time) return setFormError('Office start time is required.');
    if (!form.office_end_time) return setFormError('Office end time is required.');
    if (getWorkingMinutes(form.office_start_time, form.office_end_time) <= 0)
      return setFormError('Office end time must be after office start time.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        office_start_time: form.office_start_time.length === 5 ? `${form.office_start_time}:00` : form.office_start_time,
        office_end_time: form.office_end_time.length === 5 ? `${form.office_end_time}:00` : form.office_end_time,
        grace_period_minutes: parseInt(form.grace_period_minutes, 10),
        free_lates_allowed: parseInt(form.free_lates_allowed, 10),
      };
      if (editEmp) { await updateEmployee(editEmp.id, payload); }
      else { await createEmployee(payload); }
      setModalOpen(false);
      fetchEmployees();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save employee.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete employee.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleImmediateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Only CSV files are accepted.');
      setUploadSuccess(false);
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadAttendanceCSV(formData);
      setUploadSuccess(true);
      setUploadResult(res.data);
      const nowStr = new Date().toISOString();
      localStorage.setItem('attendance_last_upload', nowStr);
      setLastUploadTime(nowStr);
      fetchEmployees();
      fetchDashboard();
    } catch (err) {
      const d = err.response?.data;
      if (d?.data?.errors?.length) {
        setUploadResult(d);
      } else {
        setUploadError(d?.message || 'Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Sorting ────────────────────────────────────────────── */

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = a[sortConfig.key] ?? '';
    const valB = b[sortConfig.key] ?? '';
    if (typeof valA === 'string') {
      return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
  });

  /* ── Derived dashboard values ───────────────────────────── */

  const stats = dashData?.stats || {};

  const STAT_CARDS = [
    {
      label: 'Total Employees',
      value: dashLoading ? '…' : (stats.total_employees ?? '—'),
      Icon: FiUsers,
      variant: 'primary',
      subtext: 'Active registered staff',
      footerLabel: 'All staff active',
      footerValue: dashLoading ? '…' : '100%',
      progressWidth: '100%'
    },
    {
      label: 'Total Working Days',
      value: dashLoading ? '…' : (stats.total_days ?? '—'),
      Icon: FiCalendar,
      variant: 'info',
      subtext: `For ${formatMonthName(month)}`,
      footerLabel: 'Month calendar',
      footerValue: dashLoading ? '…' : (stats.total_days ? `${stats.total_days} days` : '—'),
      progressWidth: '100%'
    },
  ];

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="page-content">

      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{pagination.total} employees registered</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <MonthSelector value={month} onChange={setMonth} id="employees-month" />
          <button id="add-employee-btn" className="btn btn-primary" onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FiPlus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 200px 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {STAT_CARDS.map((s) => (
          <div
            key={s.label}
            className={`stat-card ${s.variant}`}
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '1.5rem 1.25rem',
              boxSizing: 'border-box'
            }}
          >
            {/* Top Row: Label and Icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: '1.3',
                  marginTop: '2px',
                  maxWidth: '120px'
                }}
              >
                {s.label}
              </span>
              <div
                className={`stat-icon ${s.variant}`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 0,
                  flexShrink: 0
                }}
              >
                <s.Icon size={16} />
              </div>
            </div>

            {/* Middle Section: Value & Description */}
            <div style={{ display: 'flex', flexDirection: 'column', margin: '1rem 0' }}>
              <span
                className="stat-value"
                style={{
                  fontSize: '3rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'var(--color-text)',
                  marginBottom: '0.35rem'
                }}
              >
                {s.value}
              </span>
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-text-muted)',
                  fontWeight: 500
                }}
              >
                {s.subtext}
              </span>
            </div>

            {/* Bottom Section: Progress Bar */}
            <div style={{ width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.72rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.35rem',
                  fontWeight: 600
                }}
              >
                <span>{s.footerLabel}</span>
                <span style={{ color: s.variant === 'primary' ? 'var(--color-primary)' : 'var(--color-info)' }}>
                  {s.footerValue}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'var(--color-bg)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: s.progressWidth,
                    background: s.variant === 'primary'
                      ? 'linear-gradient(90deg, var(--color-primary), #FB923C)'
                      : 'linear-gradient(90deg, var(--color-info), #38BDF8)',
                    borderRadius: 3
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* ── Upload Attendance Card ── */}
        <div className="stat-card" style={{ height: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-card)', background: 'var(--color-surface)', position: 'relative' }}>
          <div style={{ display: 'flex', gap: '1.5rem', height: '100%', alignItems: 'stretch' }}>

            {/* Left side: Upload actions and results */}
            <div style={{ flex: '1 1 50%', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Attendance Upload</span>
                  <div className="stat-icon primary" style={{ width: 32, height: 32, margin: 0, borderRadius: 8, fontSize: '0.95rem' }}><FiUpload size={14} /></div>
                </div>

                {/* Click / Drag Upload Zone */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    background: 'var(--color-bg)',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition)',
                    minHeight: '130px',
                    marginBottom: '0.5rem',
                  }}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onMouseOver={(e) => { if (!uploading) e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                  onMouseOut={(e) => { if (!uploading) e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <FiUpload size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.6rem' }} />
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', marginBottom: '0.25rem' }}>
                    {uploading ? 'Uploading CSV...' : 'Click to Upload CSV'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '0.4rem' }}>
                    Drag & drop files here
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', textAlign: 'center' }}>
                    {formatLastUploaded(lastUploadTime)}
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleImmediateUpload}
                />

                {/* Inline states */}
                {uploadError && (
                  <div className="alert alert-error" style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FiAlertCircle size={13} style={{ flexShrink: 0 }} /> {uploadError}
                  </div>
                )}

                {uploadSuccess && uploadResult && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <div className="alert alert-success" style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <FiCheck size={13} style={{ flexShrink: 0 }} /> {uploadResult.message || 'CSV parsed successfully.'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem', marginTop: '0.3rem' }}>
                      {[
                        { label: 'Total Rows', value: uploadResult.data?.total ?? 0, color: 'var(--color-text)' },
                        { label: 'Inserted', value: uploadResult.data?.inserted ?? 0, color: 'var(--color-success)' },
                        { label: 'Updated', value: uploadResult.data?.updated ?? 0, color: 'var(--color-info)' },
                      ].map((s) => (
                        <div key={s.label} style={{ textAlign: 'center', background: 'var(--color-surface-alt)', padding: '0.3rem 0.2rem', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: '0.58rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadResult?.data?.errors?.length > 0 && (
                  <div style={{ marginTop: '0.4rem', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ padding: '0.3rem 0.5rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: '0.68rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FiAlertTriangle size={11} />
                      {uploadResult.data.errors.length} Row Error{uploadResult.data.errors.length > 1 ? 's' : ''}
                    </div>
                    <div style={{ maxHeight: 75, overflowY: 'auto' }}>
                      {uploadResult.data.errors.slice(0, 50).map((e, idx) => (
                        <div key={idx} style={{ padding: '0.3rem 0.5rem', borderBottom: idx < uploadResult.data.errors.length - 1 ? '1px solid var(--color-border)' : 'none', fontSize: '0.68rem' }}>
                          <span style={{ fontFamily: 'monospace', background: 'rgba(244,63,94,0.12)', color: 'var(--color-danger)', padding: '1px 3px', borderRadius: 2, marginRight: '0.25rem' }}>
                            Row {e.row}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)' }}>{e.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vertical divider */}
            <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 0.25rem', flexShrink: 0 }} />

            {/* Right side: CSV Format Reference */}
            <div style={{ flex: '1 1 50%', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.6rem' }}>
                  <FiFileText size={18} style={{ color: 'var(--color-primary)' }} /> CSV Format Reference
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.6rem', lineHeight: '1.4' }}>
                  CSV must include: <code>employee_code</code>, <code>date</code>, <code>punch_in</code>, <code>punch_out</code>.
                </div>
                <div style={{ background: 'var(--color-bg)', borderRadius: 6, padding: '0.6rem 0.8rem', fontFamily: 'monospace', fontSize: '0.78rem', border: '1px solid var(--color-border)', marginBottom: '0.6rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  employee_code,date,punch_in,punch_out<br />
                  EMP001,2026-06-01,09:05:00,18:00:00
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                  • <strong>date</strong>: YYYY-MM-DD format<br />
                  • <strong>punch</strong>: HH:MM:SS format
                </div>
              </div>

              <a
                href="/sample_attendance.csv"
                download
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', padding: '0.45rem 1rem', textDecoration: 'none', display: 'inline-flex', marginTop: '0.6rem', height: 'auto' }}
              >
                <FiDownload size={12} /> Download Sample CSV
              </a>
            </div>

          </div>
        </div>
      </div>

      <ErrorMessage message={error} onRetry={fetchEmployees} />

      {/* ── Search ── */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
          <div className="search-wrapper" style={{ flex: 1 }}>
            <FiSearch size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--color-text-faint)', pointerEvents: 'none' }} />
            <input
              id="employee-search"
              className="form-input search-input"
              placeholder="Search by name or employee code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <button
            id="employee-search-btn"
            className="btn btn-primary"
            style={{ borderRadius: 50, padding: '0 1.75rem', height: 60, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
            onClick={fetchEmployees}
          >
            <FiSearch size={18} />
            Search
          </button>
        </div>
      </div>

      {/* ── Employee Table ── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                {[
                  { key: 'employee_code', label: 'Code' },
                  { key: 'name', label: 'Name' },
                  { key: 'office_start_time', label: 'Start Time' },
                  { key: 'office_end_time', label: 'End Time' },
                  { key: 'working_minutes', label: 'Working Mins' },
                  { key: 'grace_period_minutes', label: 'Grace' },
                  { key: 'free_lates_allowed', label: 'Free Lates' },
                ].map(({ key, label }) => (
                  <th key={key} style={{ cursor: 'pointer' }} onClick={() => handleSort(key)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      {label} <SortIcon columnKey={key} sortConfig={sortConfig} />
                    </span>
                  </th>
                ))}
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}><LoadingSpinner /></td></tr>
              ) : sortedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    {search ? 'No employees match your search.' : 'No employees yet. Click "Add Employee" to get started.'}
                  </td>
                </tr>
              ) : (
                sortedEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', background: 'var(--color-surface-alt)', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem' }}>
                        {emp.employee_code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {emp.name}
                      {activeExcEmpIds.has(emp.id) && (
                        <span className="active-exception-badge" title="Has an active schedule exception today">
                          <FiClock size={10} /> Exception Active
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{emp.office_start_time ? emp.office_start_time.slice(0, 5) : '—'}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{emp.office_end_time ? emp.office_end_time.slice(0, 5) : '—'}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{emp.working_minutes ?? 0} mins</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{emp.grace_period_minutes ?? 0} min</td>
                    <td style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{emp.free_lates_allowed ?? 0} allowed</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDrawerEmp(emp)}
                          aria-label={`View details for ${emp.name}`} id={`view-details-${emp.id}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <FiEye size={14} /> Details
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(emp)}
                          aria-label={`Edit ${emp.name}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <FiEdit2 size={14} /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(emp)}
                          aria-label={`Delete ${emp.name}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="pagination">
              <button className="pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1} aria-label="Previous page">‹</button>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button key={p} className={`pagination-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
              <button className="pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page === pagination.total_pages} aria-label="Next page">›</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editEmp ? `Edit ${editEmp.name}` : 'Add New Employee'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button id="save-employee-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FiCheck size={14} /> {saving ? 'Saving…' : editEmp ? 'Save Changes' : 'Add Employee'}
            </button>
          </>
        }
      >
        <EmployeeForm form={form} setForm={setForm} error={formError} />
      </Modal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All their attendance records will also be deleted.`}
        confirmLabel="Delete"
        loading={deleting}
      />

      {/* ── Employee Detail Drawer ── */}
      {drawerEmp && (
        <EmployeeDrawer
          key={drawerEmp.id}
          emp={drawerEmp}
          month={month}
          dashEmployees={dashData?.employees ?? []}
          totalDays={stats.total_days}
          onClose={() => setDrawerEmp(null)}
          onSaved={() => { fetchEmployees(); fetchDashboard(); refreshActiveExceptions(); }}
        />
      )}
    </div>
  );
}
