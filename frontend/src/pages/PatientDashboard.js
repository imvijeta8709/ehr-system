import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/records?limit=5'),
      api.get('/appointments?limit=5'),
    ]).then(([r, a]) => {
      setRecords(r.data.records);
      setAppointments(a.data.appointments);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const upcoming = appointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');

  return (
    <div>
      {/* Welcome banner */}
      <div
        className="rounded-3 mb-4 p-4 d-flex justify-content-between align-items-center"
        style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1a6be0 50%, var(--secondary-dark) 100%)', color: '#fff' }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: 4 }}>Good day,</div>
          <h4 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>{user?.name}</h4>
          <div style={{ fontSize: '0.875rem', opacity: 0.85, marginTop: 4 }}>
            {upcoming.length > 0
              ? `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}`
              : 'No upcoming appointments'}
          </div>
        </div>
        <Link to="/appointments/new" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)' }}>
          <i className="bi bi-plus-lg me-1" />Book Appointment
        </Link>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="stat-card card" style={{ borderTop: '3px solid var(--primary)' }}>
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>My Records</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{records.length}</div>
              </div>
              <div className="stat-icon stat-icon-primary"><i className="bi bi-file-medical" /></div>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="stat-card card" style={{ borderTop: '3px solid var(--secondary)' }}>
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Upcoming</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{upcoming.length}</div>
              </div>
              <div className="stat-icon stat-icon-secondary"><i className="bi bi-calendar-check" /></div>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="stat-card card" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Total Visits</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{appointments.length}</div>
              </div>
              <div className="stat-icon stat-icon-warning"><i className="bi bi-hospital" /></div>
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
              <Link to="/timeline" className="btn btn-sm btn-outline-primary">Timeline</Link>
            </div>
            <ul className="list-group list-group-flush">
              {records.length === 0 ? (
                <li className="list-group-item text-center py-4" style={{ color: 'var(--text-light)' }}>
                  <i className="bi bi-file-medical d-block mb-1" style={{ fontSize: '1.5rem' }} />
                  No records yet
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
                  <i className="bi bi-calendar-x d-block mb-1" style={{ fontSize: '1.5rem' }} />
                  No appointments
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
