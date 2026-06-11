/**
 * pages/Dashboard.jsx
 * Monthly stats overview with Chart.js visualisations.
 */
import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { getDashboard } from '../api/dashboard';
import MonthSelector from '../components/MonthSelector';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const thisMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function Dashboard() {
  const [month, setMonth]   = useState(thisMonth);
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDashboard(month);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month]);

  const stats = data?.stats || {};

  const STAT_CARDS = [
    { label: 'Total Employees',      value: stats.total_employees      ?? '—', icon: '👥', variant: 'primary' },
    { label: 'Present Days',         value: stats.present_count        ?? '—', icon: '✅', variant: 'success' },
    { label: 'Late Free Days',       value: stats.late_free_count      ?? '—', icon: '🕐', variant: 'info' },
    { label: 'Half Days',            value: stats.half_day_count       ?? '—', icon: '⚡', variant: 'warning' },
    { label: 'Absent Days',          value: stats.absent_count         ?? '—', icon: '❌', variant: 'danger' },
    { label: 'Attendance %',         value: stats.attendance_percentage != null ? `${stats.attendance_percentage}%` : '—', icon: '📊', variant: 'primary' },
  ];

  const pieData = {
    labels: ['Present', 'Late Free', 'Half Day', 'Absent'],
    datasets: [{
      data: [
        stats.present_count   || 0,
        stats.late_free_count || 0,
        stats.half_day_count  || 0,
        stats.absent_count    || 0,
      ],
      backgroundColor: ['#22C55E', '#0EA5E9', '#F59E0B', '#EF4444'],
      borderColor:     ['#FFFFFF'],
      borderWidth:     2,
      hoverOffset:     8,
    }],
  };

  const barData = {
    labels: (data?.employees || []).map(e => e.name.split(' ')[0]),
    datasets: [
      {
        label: 'Present',
        data:  (data?.employees || []).map(e => e.present),
        backgroundColor: 'rgba(34, 197, 150, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Absent',
        data:  (data?.employees || []).map(e => e.absent),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#4B5563', font: { family: 'Inter', weight: '500' } } },
    },
  };

  const barOpts = {
    ...chartOpts,
    scales: {
      x: { ticks: { color: '#4B5563' }, grid: { color: '#E5E7EB' } },
      y: { ticks: { color: '#4B5563' }, grid: { color: '#E5E7EB' } },
    },
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Monthly attendance overview and statistics</p>
        </div>
        <MonthSelector value={month} onChange={setMonth} id="dashboard-month" />
      </div>

      <ErrorMessage message={error} onRetry={fetchData} />

      {loading ? (
        <div className="loading-page"><LoadingSpinner size={40} /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="stats-grid">
            {STAT_CARDS.map((s) => (
              <div key={s.label} className={`stat-card ${s.variant}`}>
                <div className={`stat-icon ${s.variant}`}>{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📊 Attendance Distribution</h2>
              </div>
              <div style={{ height: 260 }}>
                <Pie data={pieData} options={chartOpts} />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📈 Employee Attendance</h2>
              </div>
              <div style={{ height: 260 }}>
                <Bar data={barData} options={barOpts} />
              </div>
            </div>
          </div>

          {/* Employee Overview Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">👥 Employee Overview</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {data?.employees?.length || 0} employees
              </span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Code</th>
                    <th>Present</th>
                    <th>Late Free</th>
                    <th>Half Day</th>
                    <th>Absent</th>
                    <th>Day Count</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.employees || []).map((emp) => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 500 }}>{emp.name}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', background: 'var(--color-surface-alt)', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem' }}>
                          {emp.employee_code}
                        </span>
                      </td>
                      <td><span style={{ color: 'var(--color-success)' }}>{emp.present}</span></td>
                      <td><span style={{ color: 'var(--color-info)' }}>{emp.late_free}</span></td>
                      <td><span style={{ color: 'var(--color-warning)' }}>{emp.half_day}</span></td>
                      <td><span style={{ color: 'var(--color-danger)' }}>{emp.absent}</span></td>
                      <td><strong>{emp.total_day_count}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-bar" style={{ width: 80 }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${Math.round((emp.total_day_count / (stats.total_days || 1)) * 100)}%`,
                                animation: 'none',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {Math.round((emp.total_day_count / (stats.total_days || 1)) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!data?.employees?.length) && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                        No data available for this month
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
