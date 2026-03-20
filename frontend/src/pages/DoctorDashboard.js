import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import PatientFormModal from '../components/PatientFormModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 }, precision: 0 } },
  },
};

const StatCard = ({ label, value, icon, iconClass, accent, sub }) => (
  <div className="col-sm-6 col-xl-3">
    <div className="stat-card card" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="card-body d-flex justify-content-between align-items-center">
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
            {value ?? <span style={{ color: 'var(--text-light)' }}>—</span>}
          </div>
          {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
        </div>
        <div className={`stat-icon ${iconClass}`}>
          <i className={`bi ${icon}`} />
        </div>
      </div>
    </div>
  </div>
);

export default function DoctorDashboard() {
  const [stats, setStats]                   = useState(null);
  const [apptStats, setApptStats]           = useState(null);
  const [recentAppointments, setRecent]     = useState([]);
  const [analytics, setAnalytics]           = useState(null);
  const [loading, setLoading]               = useState(true);
  const [addPatientOpen, setAddPatientOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/users/stats'),
      api.get('/appointments/stats'),
      api.get('/appointments?limit=5'),
      api.get('/users/analytics'),
    ]).then(([u, a, appts, anl]) => {
      setStats(u.data.stats);
      setApptStats(a.data.stats);
      setRecent(appts.data.appointments);
      setAnalytics(anl.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const apptChartData = analytics ? {
    labels: analytics.labels,
    datasets: [{
      label: 'Appointments',
      data: analytics.appointmentCounts,
      backgroundColor: 'rgba(42,127,255,0.15)',
      borderColor: 'rgba(42,127,255,0.9)',
      borderWidth: 2,
      borderRadius: 6,
    }],
  } : null;

  const patientChartData = analytics ? {
    labels: analytics.labels,
    datasets: [{
      label: 'New Patients',
      data: analytics.patientCounts,
      fill: true,
      backgroundColor: 'rgba(0,201,167,0.1)',
      borderColor: 'rgba(0,201,167,0.9)',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: 'rgba(0,201,167,0.9)',
    }],
  } : null;

  const quickActions = [
    { to: '/records/new',  icon: 'bi-file-earmark-plus', label: 'Create Medical Record', color: 'var(--primary)',       action: null },
    { to: '/patients',     icon: 'bi-people',            label: 'View All Patients',     color: 'var(--secondary-dark)', action: null },
    { to: null,            icon: 'bi-person-plus',       label: 'Add New Patient',       color: '#7c3aed',               action: () => setAddPatientOpen(true) },
    { to: '/appointments', icon: 'bi-calendar-check',    label: 'Manage Appointments',   color: '#d97706',               action: null },
    { to: '/vitals',       icon: 'bi-activity',          label: 'Record Vitals',         color: '#0891b2',               action: null },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h4>Dashboard</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Overview of your practice</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={() => setAddPatientOpen(true)}>
            <i className="bi bi-person-plus me-1" />Add Patient
          </button>
          <Link to="/records/new" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1" />New Record
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <StatCard label="Total Patients"  value={stats?.totalPatients}  icon="bi-people"       iconClass="stat-icon-primary"   accent="var(--primary)"   />
        <StatCard label="Total Doctors"   value={stats?.totalDoctors}   icon="bi-person-badge" iconClass="stat-icon-secondary" accent="var(--secondary)" />
        <StatCard label="Pending"         value={apptStats?.pending}    icon="bi-clock"        iconClass="stat-icon-warning"   accent="#f59e0b"          />
        <StatCard label="Completed"       value={apptStats?.completed}  icon="bi-check-circle" iconClass="stat-icon-secondary" accent="var(--secondary)" sub={`${apptStats?.cancelled || 0} cancelled`} />
      </div>

      {/* Charts row */}
      {analytics && (
        <div className="row g-3 mb-4">
          <div className="col-lg-7">
            <div className="card h-100">
              <div className="card-header d-flex align-items-center justify-content-between">
                <span>Appointments — Last 6 Months</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Total: {analytics.appointmentCounts.reduce((a, b) => a + b, 0)}
                </span>
              </div>
              <div className="card-body" style={{ height: 220 }}>
                <Bar data={apptChartData} options={CHART_OPTS} />
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="card h-100">
              <div className="card-header d-flex align-items-center justify-content-between">
                <span>New Patients — Last 6 Months</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Total: {analytics.patientCounts.reduce((a, b) => a + b, 0)}
                </span>
              </div>
              <div className="card-body" style={{ height: 220 }}>
                <Line data={patientChartData} options={CHART_OPTS} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3">
        {/* Recent appointments */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Recent Appointments</span>
              <Link to="/appointments" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Patient</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4" style={{ color: 'var(--text-light)' }}>
                        <i className="bi bi-calendar-x d-block mb-1" style={{ fontSize: '1.5rem' }} />
                        No appointments yet
                      </td>
                    </tr>
                  ) : recentAppointments.map((a) => (
                    <tr key={a._id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{a.patient?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.patient?.email}</div>
                      </td>
                      <td>{new Date(a.date).toLocaleDateString()}</td>
                      <td>{a.timeSlot}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reason}</td>
                      <td><span className={`badge badge-status-${a.status}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">Quick Actions</div>
            <div className="card-body d-flex flex-column gap-2">
              {quickActions.map((item) => {
                const inner = (
                  <>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, fontSize: '1rem', flexShrink: 0 }}>
                      <i className={`bi ${item.icon}`} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.label}</span>
                    <i className="bi bi-chevron-right ms-auto" style={{ color: 'var(--text-light)', fontSize: '0.75rem' }} />
                  </>
                );
                const sharedStyle = { background: 'var(--bg)', border: '1px solid var(--border)', transition: 'all 0.18s', color: 'var(--text)' };
                const onEnter = (e) => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.background = 'var(--surface)'; };
                const onLeave = (e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; };

                return item.action ? (
                  <button key={item.label} onClick={item.action}
                    className="d-flex align-items-center gap-3 p-3 rounded-3 w-100 text-start"
                    style={sharedStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                    {inner}
                  </button>
                ) : (
                  <Link key={item.label} to={item.to}
                    className="d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none"
                    style={sharedStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <PatientFormModal
        open={addPatientOpen}
        onClose={() => setAddPatientOpen(false)}
        patient={null}
        onSaved={() => setStats((s) => s ? { ...s, totalPatients: (s.totalPatients || 0) + 1 } : s)}
      />
    </div>
  );
}
