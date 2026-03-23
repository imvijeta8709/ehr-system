import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const MINI_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 } },
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [records, setRecords]           = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals]             = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/records?limit=5'),
      api.get('/appointments?limit=5'),
      api.get('/vitals?limit=10'),
    ]).then(([r, a, v]) => {
      setRecords(r.data.records);
      setAppointments(a.data.appointments);
      setVitals(v.data.vitals);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const upcoming = appointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');

  // Latest vitals
  const latest = vitals[0];

  // Mini chart data (reversed so oldest → newest)
  const vReversed = [...vitals].reverse();
  const bpChartData = {
    labels: vReversed.map((v) => new Date(v.recordedAt).toLocaleDateString()),
    datasets: [
      {
        label: 'Systolic',
        data: vReversed.map((v) => v.bloodPressureSystolic || null),
        borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)',
        fill: true, tension: 0.4, borderWidth: 2,
      },
      {
        label: 'Diastolic',
        data: vReversed.map((v) => v.bloodPressureDiastolic || null),
        borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)',
        fill: true, tension: 0.4, borderWidth: 2,
      },
    ],
  };

  const sugarChartData = {
    labels: vReversed.map((v) => new Date(v.recordedAt).toLocaleDateString()),
    datasets: [{
      label: 'Blood Sugar',
      data: vReversed.map((v) => v.bloodSugar || null),
      borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)',
      fill: true, tension: 0.4, borderWidth: 2,
    }],
  };

  // Medical summary
  const activeConditions = [
    ...(user?.chronicDiseases || []),
    ...(user?.allergies || []),
  ];
  const activeMeds = user?.currentMedications || [];
  const lastVisit  = records[0] ? new Date(records[0].visitDate).toLocaleDateString() : null;

  return (
    <div>
      {/* Welcome banner */}
      <div className="rounded-3 mb-4 p-4 d-flex justify-content-between align-items-center flex-wrap gap-3"
        style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1a6be0 50%, var(--secondary-dark) 100%)', color: '#fff' }}>
        <div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: 4 }}>Good day,</div>
          <h4 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>{user?.name}</h4>
          <div style={{ fontSize: '0.875rem', opacity: 0.85, marginTop: 4 }}>
            {upcoming.length > 0
              ? `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}`
              : 'No upcoming appointments'}
          </div>
        </div>
        <Link to="/appointments/new" className="btn btn-sm"
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)' }}>
          <i className="bi bi-plus-lg me-1" />Book Appointment
        </Link>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'My Records',    value: records.length,      icon: 'bi-file-medical',  accent: 'var(--primary)',   iconClass: 'stat-icon-primary' },
          { label: 'Upcoming',      value: upcoming.length,     icon: 'bi-calendar-check',accent: 'var(--secondary)', iconClass: 'stat-icon-secondary' },
          { label: 'Total Visits',  value: appointments.length, icon: 'bi-hospital',       accent: '#f59e0b',          iconClass: 'stat-icon-warning' },
          { label: 'Vitals Logged', value: vitals.length,       icon: 'bi-activity',       accent: '#8b5cf6',          iconClass: 'stat-icon-primary' },
        ].map((s) => (
          <div key={s.label} className="col-sm-6 col-xl-3">
            <div className="stat-card card" style={{ borderTop: `3px solid ${s.accent}` }}>
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                </div>
                <div className={`stat-icon ${s.iconClass}`}><i className={`bi ${s.icon}`} /></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Medical summary + vitals charts */}
      <div className="row g-3 mb-3">
        {/* Smart medical summary */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center gap-2">
              <i className="bi bi-clipboard2-pulse" style={{ color: 'var(--primary)' }} />
              Medical Summary
            </div>
            <div className="card-body d-flex flex-column gap-3">
              {/* Last visit */}
              <div className="d-flex align-items-center gap-3 p-2 rounded-3" style={{ background: 'var(--bg)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-calendar3" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Last Visit</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{lastVisit || 'No visits yet'}</div>
                </div>
              </div>

              {/* Latest vitals snapshot */}
              {latest && (
                <div className="d-flex align-items-center gap-3 p-2 rounded-3" style={{ background: 'var(--bg)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-heart-pulse" style={{ color: '#ef4444' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Latest Vitals</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {latest.bloodPressureSystolic ? `BP ${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic}` : ''}
                      {latest.heartRate ? ` · HR ${latest.heartRate}` : ''}
                    </div>
                  </div>
                </div>
              )}

              {/* Active conditions */}
              {activeConditions.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Active Conditions</div>
                  <div className="d-flex flex-wrap gap-1">
                    {activeConditions.slice(0, 5).map((c) => (
                      <span key={c} style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>{c}</span>
                    ))}
                    {activeConditions.length > 5 && (
                      <span style={{ background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)' }}>+{activeConditions.length - 5}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Current medications */}
              {activeMeds.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Current Medications</div>
                  <div className="d-flex flex-wrap gap-1">
                    {activeMeds.slice(0, 4).map((m) => (
                      <span key={m} style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>{m}</span>
                    ))}
                    {activeMeds.length > 4 && (
                      <span style={{ background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)' }}>+{activeMeds.length - 4}</span>
                    )}
                  </div>
                </div>
              )}

              {!lastVisit && !activeConditions.length && !activeMeds.length && (
                <div className="text-center py-2" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <i className="bi bi-info-circle me-1" />Complete your profile to see summary
                </div>
              )}

              <Link to="/app/profile" className="btn btn-outline-primary btn-sm mt-auto">
                <i className="bi bi-person-circle me-1" />View Full Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Vitals charts */}
        <div className="col-lg-8">
          <div className="row g-3 h-100">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-droplet-half me-2" style={{ color: '#ef4444' }} />Blood Pressure Trend</span>
                  <Link to="/app/vitals" className="btn btn-sm btn-outline-primary">Log Vitals</Link>
                </div>
                <div className="card-body" style={{ height: 130 }}>
                  {vitals.length > 1
                    ? <Line data={bpChartData} options={MINI_OPTS} />
                    : <div className="text-center py-3" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Not enough data — log at least 2 vitals entries</div>}
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <i className="bi bi-activity me-2" style={{ color: '#8b5cf6' }} />Blood Sugar Trend
                </div>
                <div className="card-body" style={{ height: 130 }}>
                  {vitals.length > 1
                    ? <Line data={sugarChartData} options={MINI_OPTS} />
                    : <div className="text-center py-3" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Not enough data — log at least 2 vitals entries</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {/* Recent records */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Recent Medical Records</span>
              <Link to="/app/timeline" className="btn btn-sm btn-outline-primary">Timeline</Link>
            </div>
            <ul className="list-group list-group-flush">
              {records.length === 0 ? (
                <li className="list-group-item text-center py-4" style={{ color: 'var(--text-light)' }}>
                  <i className="bi bi-file-medical d-block mb-1" style={{ fontSize: '1.5rem' }} />No records yet
                </li>
              ) : records.map((r) => (
                <li key={r._id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.diagnosis}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Dr. {r.doctor?.name}</div>
                    </div>
                    <div className="text-end">
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(r.visitDate).toLocaleDateString()}</div>
                      <Link to={`/records/${r._id}`} className="btn btn-link btn-sm p-0" style={{ fontSize: '0.775rem' }}>View →</Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Appointments */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Appointments</span>
              <Link to="/appointments/new" className="btn btn-sm btn-outline-primary">Book New</Link>
            </div>
            <ul className="list-group list-group-flush">
              {appointments.length === 0 ? (
                <li className="list-group-item text-center py-4" style={{ color: 'var(--text-light)' }}>
                  <i className="bi bi-calendar-x d-block mb-1" style={{ fontSize: '1.5rem' }} />No appointments
                </li>
              ) : appointments.map((a) => (
                <li key={a._id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Dr. {a.doctor?.name}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{a.reason}</div>
                    </div>
                    <div className="text-end">
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(a.date).toLocaleDateString()} · {a.timeSlot}
                      </div>
                      <span className={`badge badge-status-${a.status}`}>{a.status}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
