import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function Timeline() {
  const { user } = useAuth();
  const { patientId } = useParams(); // optional — for doctor viewing a patient
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState(null);

  const pid = patientId || user?._id || user?.id;

  useEffect(() => {
    const endpoint = `/records/timeline/${pid}`;
    api.get(endpoint).then((r) => setData(r.data)).finally(() => setLoading(false));
    if (patientId) {
      api.get(`/users/${patientId}`).then((r) => setPatientInfo(r.data.user)).catch(() => {});
    }
  }, [pid, patientId]);

  if (loading) return <Spinner />;
  if (!data) return <div className="alert alert-danger">Could not load timeline</div>;

  // Merge all events into a single sorted timeline
  const events = [
    ...data.records.map((r) => ({ type: 'record', date: new Date(r.visitDate), data: r })),
    ...data.appointments.map((a) => ({ type: 'appointment', date: new Date(a.date), data: a })),
    ...data.vitals.map((v) => ({ type: 'vitals', date: new Date(v.recordedAt), data: v })),
  ].sort((a, b) => b.date - a.date);

  const typeConfig = {
    record: { icon: 'bi-file-medical', color: 'primary', label: 'Medical Record' },
    appointment: { icon: 'bi-calendar-check', color: 'success', label: 'Appointment' },
    vitals: { icon: 'bi-activity', color: 'warning', label: 'Vitals' },
  };

  const patient = patientInfo || user;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          {patientId ? `${patientInfo?.name || 'Patient'}'s Timeline` : 'My Medical Timeline'}
        </h4>
        {patientId && <Link to={-1} className="btn btn-sm btn-outline-secondary">Back</Link>}
      </div>

      {/* Patient summary card */}
      {patient && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="text-muted small">Name</div>
                <div className="fw-semibold">{patient.name}</div>
              </div>
              <div className="col-md-2">
                <div className="text-muted small">Age</div>
                <div className="fw-semibold">{patient.age || '—'}</div>
              </div>
              <div className="col-md-2">
                <div className="text-muted small">Blood Group</div>
                <div className="fw-semibold">{patient.bloodGroup || '—'}</div>
              </div>
              <div className="col-md-2">
                <div className="text-muted small">Gender</div>
                <div className="fw-semibold">{patient.gender || '—'}</div>
              </div>
              {patient.allergies?.length > 0 && (
                <div className="col-md-3">
                  <div className="text-muted small">Allergies</div>
                  <div>{patient.allergies.map((a) => (
                    <span key={a} className="badge bg-danger me-1">{a}</span>
                  ))}</div>
                </div>
              )}
              {patient.chronicDiseases?.length > 0 && (
                <div className="col-md-3">
                  <div className="text-muted small">Chronic Diseases</div>
                  <div>{patient.chronicDiseases.map((d) => (
                    <span key={d} className="badge bg-warning text-dark me-1">{d}</span>
                  ))}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="card border-start border-primary border-4">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small">Total Records</div>
                <div className="fs-3 fw-bold">{data.records.length}</div>
              </div>
              <i className="bi bi-file-medical fs-2 text-primary opacity-50" />
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-start border-success border-4">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small">Appointments</div>
                <div className="fs-3 fw-bold">{data.appointments.length}</div>
              </div>
              <i className="bi bi-calendar-check fs-2 text-success opacity-50" />
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-start border-warning border-4">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small">Vitals Entries</div>
                <div className="fs-3 fw-bold">{data.vitals.length}</div>
              </div>
              <i className="bi bi-activity fs-2 text-warning opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="text-center text-muted py-5">No history found</div>
      ) : (
        <div className="timeline">
          {events.map((event, idx) => {
            const cfg = typeConfig[event.type];
            return (
              <div key={idx} className="d-flex gap-3 mb-3">
                <div className="d-flex flex-column align-items-center">
                  <div className={`rounded-circle bg-${cfg.color} text-white d-flex align-items-center justify-content-center`}
                    style={{ width: 40, height: 40, flexShrink: 0 }}>
                    <i className={`bi ${cfg.icon}`} />
                  </div>
                  {idx < events.length - 1 && (
                    <div style={{ width: 2, flexGrow: 1, background: '#dee2e6', minHeight: 20 }} />
                  )}
                </div>
                <div className="card flex-grow-1 mb-0" style={{ marginBottom: 0 }}>
                  <div className="card-body py-2 px-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <span className={`badge bg-${cfg.color} me-2`}>{cfg.label}</span>
                        {event.type === 'record' && (
                          <>
                            <strong>{event.data.diagnosis}</strong>
                            <div className="text-muted small">Dr. {event.data.doctor?.name} {event.data.doctor?.specialization ? `· ${event.data.doctor.specialization}` : ''}</div>
                            {event.data.prescriptions?.length > 0 && (
                              <div className="small mt-1">
                                <i className="bi bi-capsule me-1 text-primary" />
                                {event.data.prescriptions.map((p) => p.medication).join(', ')}
                              </div>
                            )}
                          </>
                        )}
                        {event.type === 'appointment' && (
                          <>
                            <strong>{event.data.reason}</strong>
                            <div className="text-muted small">Dr. {event.data.doctor?.name} · {event.data.timeSlot}</div>
                            <span className={`badge badge-status-${event.data.status} mt-1`}>{event.data.status}</span>
                          </>
                        )}
                        {event.type === 'vitals' && (
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            {event.data.bloodPressureSystolic && (
                              <span className="badge bg-light text-dark border">
                                BP: {event.data.bloodPressureSystolic}/{event.data.bloodPressureDiastolic}
                              </span>
                            )}
                            {event.data.heartRate && (
                              <span className="badge bg-light text-dark border">HR: {event.data.heartRate} bpm</span>
                            )}
                            {event.data.bloodSugar && (
                              <span className="badge bg-light text-dark border">Sugar: {event.data.bloodSugar} mg/dL</span>
                            )}
                            {event.data.temperature && (
                              <span className="badge bg-light text-dark border">Temp: {event.data.temperature}°C</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-muted small text-nowrap ms-2">
                        {event.date.toLocaleDateString()}
                      </div>
                    </div>
                    {event.type === 'record' && (
                      <Link to={`/records/${event.data._id}`} className="btn btn-link btn-sm p-0 mt-1">
                        View Record →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
