/**
 * pages/Upload.jsx
 * Drag-and-drop CSV attendance upload with progress and error reporting.
 */
import { useState, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';

export default function Upload() {
  const [file, setFile]           = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are accepted.');
      return;
    }
    setFile(f);
    setResult(null);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return setError('Please select a CSV file first.');
    setUploading(true);
    setProgress(0);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/attendance/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      setResult(res.data);
      setFile(null);
    } catch (err) {
      const d = err.response?.data;
      if (d?.data?.errors?.length) {
        setResult(d);
      } else {
        setError(d?.message || 'Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Upload Attendance CSV</h1>
        <p className="page-subtitle">Upload a CSV file to import attendance records in bulk</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Upload Zone */}
        <div>
          {/* Dropzone */}
          <div
            id="csv-upload-zone"
            className={`upload-zone${dragOver ? ' drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload CSV file"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
              id="csv-file-input"
            />
            <div className="upload-icon">📤</div>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-text)', fontSize: '1rem', fontWeight: 600 }}>
              {file ? file.name : 'Drop your CSV file here'}
            </h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {file
                ? `${(file.size / 1024).toFixed(1)} KB · Click to change`
                : 'or click to browse · Max 5MB'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginTop: '1rem' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Uploading…</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Action */}
          <button
            id="upload-submit-btn"
            className="btn btn-primary"
            style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center', padding: '0.75rem' }}
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? '⏳ Uploading...' : '🚀 Upload CSV'}
          </button>

          {/* Result Summary */}
          {result && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className={`alert ${result.success ? 'alert-success' : 'alert-warning'}`}>
                {result.message}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
                {[
                  { label: 'Total Rows',  value: result.data?.total,    color: 'var(--color-text)' },
                  { label: 'Inserted',    value: result.data?.inserted, color: 'var(--color-success)' },
                  { label: 'Updated',     value: result.data?.updated,  color: 'var(--color-info)' },
                ].map((s) => (
                  <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Errors list */}
              {result.data?.errors?.length > 0 && (
                <div className="card" style={{ marginTop: '1rem', padding: 0 }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-danger)' }}>
                    ⚠️ {result.data.errors.length} Row Error{result.data.errors.length > 1 ? 's' : ''}
                  </div>
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {result.data.errors.map((e, i) => (
                      <div key={i} style={{ padding: '0.65rem 1.25rem', borderBottom: i < result.data.errors.length - 1 ? '1px solid var(--color-border)' : 'none', fontSize: '0.8rem' }}>
                        <span style={{ fontFamily: 'monospace', background: 'rgba(244,63,94,0.15)', color: 'var(--color-danger)', padding: '1px 6px', borderRadius: 4, marginRight: '0.5rem' }}>
                          Row {e.row}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{e.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Format Reference */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">📄 CSV Format</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Your CSV file must include the following columns:
            </p>
            <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)', overflowX: 'auto' }}>
              employee_code,date,punch_in,punch_out<br />
              EMP001,2026-06-01,09:05:00,18:00:00<br />
              EMP002,2026-06-01,09:40:00,18:10:00
            </div>

            <div className="divider" />

            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>Validation Rules</h3>
            {[
              ['employee_code', 'Must match an existing employee'],
              ['date',          'Format: YYYY-MM-DD'],
              ['punch_in',      'Format: HH:MM:SS'],
              ['punch_out',     'Must be after punch_in'],
            ].map(([field, rule]) => (
              <div key={field} style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <code style={{ background: 'var(--color-surface-alt)', padding: '1px 6px', borderRadius: 4, color: 'var(--color-primary)' }}>{field}</code>
                <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>{rule}</span>
              </div>
            ))}

            <div className="divider" />
            <a
              href="/sample_attendance.csv"
              download
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
            >
              ⬇️ Download Sample CSV
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
