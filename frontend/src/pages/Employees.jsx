/**
 * pages/Employees.jsx
 * Full CRUD employee management with search, sorting, and pagination.
 */
import { useState, useEffect, useCallback } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/employees';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const EMPTY_FORM = {
  employee_code:        '',
  name:                 '',
  office_start_time:    '09:00',
  office_end_time:      '18:00',
  grace_period_minutes: 15,
  free_lates_allowed:   2,
};

function getWorkingMinutes(start, end) {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  const sMins = sH * 60 + (sM || 0);
  const eMins = eH * 60 + (eM || 0);
  return Math.max(0, eMins - sMins);
}

function EmployeeForm({ form, setForm, error }) {
  const workingMinutes = getWorkingMinutes(form.office_start_time, form.office_end_time);

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group">
        <label className="form-label" htmlFor="emp-code">Employee Code</label>
        <input
          id="emp-code"
          className="form-input"
          value={form.employee_code}
          onChange={(e) => setForm(f => ({ ...f, employee_code: e.target.value }))}
          placeholder="EMP001"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="emp-name">Full Name</label>
        <input
          id="emp-name"
          className="form-input"
          value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="John Doe"
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="emp-start">Office Start Time</label>
          <input
            id="emp-start"
            type="time"
            className="form-input"
            value={form.office_start_time}
            onChange={(e) => setForm(f => ({ ...f, office_start_time: e.target.value }))}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="emp-end">Office End Time</label>
          <input
            id="emp-end"
            type="time"
            className="form-input"
            value={form.office_end_time}
            onChange={(e) => setForm(f => ({ ...f, office_end_time: e.target.value }))}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="emp-working">Working Minutes</label>
          <input
            id="emp-working"
            type="number"
            className="form-input"
            value={workingMinutes}
            disabled
            style={{ backgroundColor: '#F3F4F6', color: '#4B5563', cursor: 'not-allowed' }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="emp-grace">Grace Period (min)</label>
          <input
            id="emp-grace"
            type="number"
            className="form-input"
            min={0}
            max={120}
            value={form.grace_period_minutes}
            onChange={(e) => setForm(f => ({ ...f, grace_period_minutes: e.target.value }))}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="emp-lates">Free Lates Allowed</label>
          <input
            id="emp-lates"
            type="number"
            className="form-input"
            min={0}
            max={31}
            value={form.free_lates_allowed}
            onChange={(e) => setForm(f => ({ ...f, free_lates_allowed: e.target.value }))}
          />
        </div>
      </div>
    </>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, total_pages: 1 });
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmp,   setEditEmp]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]       = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

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

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // Reset page on search change
  useEffect(() => { setPage(1); }, [search]);

  const openCreate = () => {
    setEditEmp(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditEmp(emp);
    setForm({
      employee_code:        emp.employee_code,
      name:                 emp.name,
      office_start_time:    emp.office_start_time ? emp.office_start_time.slice(0, 5) : '09:00',
      office_end_time:      emp.office_end_time ? emp.office_end_time.slice(0, 5) : '18:00',
      grace_period_minutes: emp.grace_period_minutes ?? 15,
      free_lates_allowed:   emp.free_lates_allowed ?? 2,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.employee_code.trim()) return setFormError('Employee code is required.');
    if (!form.name.trim())          return setFormError('Name is required.');
    if (!form.office_start_time)    return setFormError('Office start time is required.');
    if (!form.office_end_time)      return setFormError('Office end time is required.');

    const startMins = getWorkingMinutes(form.office_start_time, form.office_end_time);
    if (startMins <= 0) return setFormError('Office end time must be after office start time.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        office_start_time: form.office_start_time.length === 5 ? `${form.office_start_time}:00` : form.office_start_time,
        office_end_time: form.office_end_time.length === 5 ? `${form.office_end_time}:00` : form.office_end_time,
        grace_period_minutes: parseInt(form.grace_period_minutes, 10),
        free_lates_allowed: parseInt(form.free_lates_allowed, 10),
      };

      if (editEmp) {
        await updateEmployee(editEmp.id, payload);
      } else {
        await createEmployee(payload);
      }
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Client-side sorting for the current paginated view
  const sortedEmployees = [...employees].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    if (typeof valA === 'string') {
      return sortConfig.direction === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    } else {
      return sortConfig.direction === 'asc'
        ? valA - valB
        : valB - valA;
    }
  });

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '🔼' : '🔽';
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{pagination.total} employees registered</p>
        </div>
        <button id="add-employee-btn" className="btn btn-primary" onClick={openCreate}>
          + Add Employee
        </button>
      </div>

      <ErrorMessage message={error} onRetry={fetchEmployees} />

      {/* Search */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            id="employee-search"
            className="form-input search-input"
            placeholder="Search by name or employee code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('employee_code')}>
                  Code {getSortIcon('employee_code')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  Name {getSortIcon('name')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('office_start_time')}>
                  Start Time {getSortIcon('office_start_time')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('office_end_time')}>
                  End Time {getSortIcon('office_end_time')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('working_minutes')}>
                  Working Mins {getSortIcon('working_minutes')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('grace_period_minutes')}>
                  Grace {getSortIcon('grace_period_minutes')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('free_lates_allowed')}>
                  Free Lates {getSortIcon('free_lates_allowed')}
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    <LoadingSpinner />
                  </td>
                </tr>
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
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{emp.office_start_time ? emp.office_start_time.slice(0, 5) : '—'}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{emp.office_end_time ? emp.office_end_time.slice(0, 5) : '—'}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{emp.working_minutes ?? 0} mins</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{emp.grace_period_minutes ?? 0} min</td>
                    <td style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{emp.free_lates_allowed ?? 0} allowed</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(emp)}
                          aria-label={`Edit ${emp.name}`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteTarget(emp)}
                          aria-label={`Delete ${emp.name}`}
                        >
                          🗑️ Delete
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
              <button
                className="pagination-btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              >
                ‹
              </button>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    className={`pagination-btn${p === page ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              <button
                className="pagination-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page === pagination.total_pages}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editEmp ? `Edit ${editEmp.name}` : 'Add New Employee'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button id="save-employee-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editEmp ? 'Save Changes' : 'Add Employee'}
            </button>
          </>
        }
      >
        <EmployeeForm form={form} setForm={setForm} error={formError} />
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All their attendance records will also be deleted.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
