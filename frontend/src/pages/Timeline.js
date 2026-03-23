import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

// ── Event type config ────────────────────────────────────────────
const TYPE_CONFIG = {
  record: {
    label: 'Medical Record',
    icon: 'bi-file-earmark-medical-fill',
    color: '#2A7FFF',
    bg: '#e8f1ff',
    accent: '#2A7FFF',
  },
  appointment: {
    label: 'Appointment',
    icon: 'bi-calendar-check-fill',
    color: '#00a88c',
    bg: '#e0faf5',
    accent: '#00C9A7',
  },
  vitals: {
    label: 'Vitals',
    icon: 'bi-activity',
    color: '#d97706',
    bg: '#fff8e6',
    accent: '#f59e0b',
  },
  blood_request: {
    label: 'Blood Request',
    icon: 'bi-droplet-fill',
    color: '#dc2626',
    bg: '#fff0f0',
    accent: '#ef4444',
  },
  payment: {
    label: 'Payment',
    icon: 'bi-currency-rupee',
    color: '#7c3aed',
    bg: '#f3f0ff',
    accent: '#7c3aed',
  },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

// ── Helpers ──────────────────────────────────────────────────────
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function groupByDate(events) {
  const groups = {};
  events.forEach(ev => {
    const key = new Date(ev.date).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  });
  return Object.entries(groups); // [['Mon Jan 01 2024', [...events]], ...]
}

// ── Summary stat card ────────────────────────────────────────────
function SummaryCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14, borderTop: `3px solid ${color}` }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`bi ${icon}`} style={{ color, fontSize: '1.2rem' }} />
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F2937', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Event card content ───────────────────────────────────────────
function EventContent({ event }) {
  const { type, data } = event;

  if (type === 'record') return (
    <div>
      <div style={{ fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>{data.diagnosis}</div>
      {data.doctor && (
        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: 6 }}>
          <i className="bi bi-person-badge me-1" />Dr. {data.doctor.name}
          {data.doctor.specialization && ` · ${data.doctor.specialization}`}
        </div>
      )}
      {data.symptoms && (
        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: 4 }}>
          <i className="bi bi-clipboard-pulse me-1" />Symptoms: {data.symptoms}
        </div>
      )}
      {data.prescriptions?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
          {data.prescriptions.map((p, i) => (
            <span key={i} style={{ background: '#e8f1ff', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
              <i className="bi bi-capsule me-1" />{p.medication}
            </span>
          ))}
        </div>
      )}
      {data.followUpDate && (
        <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: 4 }}>
          <i className="bi bi-calendar-event me-1" />Follow-up: {formatDate(data.followUpDate)}
        </div>
      )}
      <Link to={`/app/records/${data._id}`} style={{ fontSize: '0.78rem', color: '#2A7FFF', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
        View Record <i className="bi bi-arrow-right" />
      </Link>
    </div>
  );

  if (type === 'appointment') {
    const statusColors = {
      pending:   { bg: '#fef3c7', color: '#92400e' },
      confirmed: { bg: '#e8f1ff', color: '#1d4ed8' },
      completed: { bg: '#e0faf5', color: '#065f46' },
      cancelled: { bg: '#fee2e2', color: '#991b1b' },
    };
    const sc = statusColors[data.status] || statusColors.pending;
    return (
      <div>
        <div style={{ fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>{data.reason}</div>
        {data.doctor && (
          <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: 6 }}>
            <i className="bi bi-person-badge me-1" />Dr. {data.doctor.name}
            {data.doctor.specialization && ` · ${data.doctor.specialization}`}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {data.timeSlot && (
            <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
              <i className="bi bi-clock me-1" />{data.timeSlot}
            </span>
          )}
          <span style={{ background: sc.bg, color: sc.color, fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99, textTransform: 'capitalize' }}>
            {data.status}
          </span>
          {data.paymentStatus === 'paid' && (
            <span style={{ background: '#f3f0ff', color: '#7c3aed', fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99 }}>
              <i className="bi bi-check-circle me-1" />Paid ₹{data.totalAmount?.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {data.notes && (
          <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 6, fontStyle: 'italic' }}>{data.notes}</div>
        )}
      </div>
    );
  }

  if (type === 'vitals') return (
    <div>
      <div style={{ fontWeight: 600, color: '#1F2937', marginBottom: 8, fontSize: '0.875rem' }}>Vitals Recorded</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {data.bloodPressureSystolic && (
          <span style={{ background: '#fff0f0', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 8, border: '1px solid #fecaca' }}>
            <i className="bi bi-heart-pulse me-1" />BP {data.bloodPressureSystolic}/{data.bloodPressureDiastolic} mmHg
          </span>
        )}
        {data.heartRate && (
          <span style={{ background: '#fff8e6', color: '#d97706', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 8, border: '1px solid #fde68a' }}>
            <i className="bi bi-activity me-1" />{data.heartRate} bpm
          </span>
        )}
        {data.bloodSugar && (
          <span style={{ background: '#e8f1ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
            <i className="bi bi-droplet me-1" />{data.bloodSugar} mg/dL ({data.bloodSugarType})
          </span>
        )}
        {data.temperature && (
          <span style={{ background: '#fff0f0', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 8, border: '1px solid #fecaca' }}>
            <i className="bi bi-thermometer me-1" />{data.temperature}°C
          </span>
        )}
        {data.oxygenSaturation && (
          <span style={{ background: '#e0faf5', color: '#065f46', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
            <i className="bi bi-lungs me-1" />SpO₂ {data.oxygenSaturation}%
          </span>
        )}
        {data.weight && (
          <span style={{ background: '#f3f0ff', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 8, border: '1px solid #ddd6fe' }}>
            {data.weight} kg
          </span>
        )}
      </div>
      {data.doctor && (
        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 6 }}>
          <i className="bi bi-person-badge me-1" />Recorded by Dr. {data.doctor.name}
        </div>
      )}
      {data.notes && (
        <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 4, fontStyle: 'italic' }}>{data.notes}</div>
      )}
    </div>
  );

  if (type === 'blood_request') {
    const urgencyColors = {
      normal:   { bg: '#f3f4f6', color: '#374151' },
      urgent:   { bg: '#fff8e6', color: '#92400e' },
      critical: { bg: '#fff0f0', color: '#991b1b' },
    };
    const uc = urgencyColors[data.urgency] || urgencyColors.normal;
    const statusColors = {
      pending:   { bg: '#fef3c7', color: '#92400e' },
      approved:  { bg: '#e8f1ff', color: '#1d4ed8' },
      fulfilled: { bg: '#e0faf5', color: '#065f46' },
      rejected:  { bg: '#fee2e2', color: '#991b1b' },
    };
    const sc = statusColors[data.status] || statusColors.pending;
    return (
      <div>
        <div style={{ fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
          Blood Request — {data.units} unit(s) of{' '}
          <span style={{ background: '#fff0f0', color: '#dc2626', fontWeight: 800, padding: '1px 8px', borderRadius: 6, border: '1px solid #fecaca' }}>{data.bloodGroup}</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: 6 }}>
          <i className="bi bi-hospital me-1" />{data.hospital} · {data.location}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ background: uc.bg, color: uc.color, fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99, textTransform: 'capitalize' }}>
            <i className="bi bi-exclamation-circle me-1" />{data.urgency}
          </span>
          <span style={{ background: sc.bg, color: sc.color, fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99, textTransform: 'capitalize' }}>
            {data.status}
          </span>
          {data.paymentStatus === 'paid' && (
            <span style={{ background: '#f3f0ff', color: '#7c3aed', fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99 }}>
              <i className="bi bi-check-circle me-1" />Paid ₹{data.totalAmount?.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {data.reason && (
          <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 6 }}>{data.reason}</div>
        )}
      </div>
    );
  }

  if (type === 'payment') return (
    <div>
      <div style={{ fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
        Payment Confirmed — ₹{data.amount?.toLocaleString('en-IN')}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: 6 }}>
        {data.paymentType === 'consultation'
          ? <><i className="bi bi-calendar-check me-1" />Consultation fee</>
          : <><i className="bi bi-droplet me-1" />Blood bank payment</>
        }
      </div>
      <span style={{ background: '#e0faf5', color: '#065f46', fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99 }}>
        <i className="bi bi-check-circle-fill me-1" />Paid
      </span>
    </div>
  );

  return null;
}

// ── Main Component ───────────────────────────────────────────────
export default function Timeline() {
  const { user } = useAuth();
  const { patientId } = useParams();
  const pid = patientId || user?._id || user?.id;

  const [events, setEvents]         = useState([]);
  const [summary, setSummary]       = useState(null);
  const [patientInfo, setPatient]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setFilter]   = useState('all');
  const [search, setSearch]         = useState('');

  const fetchTimeline = useCallback(() => {
    if (!pid) return;
    setLoading(true);
    api.get(`/records/timeline/${pid}`)
      .then(r => { setEvents(r.data.events || []); setSummary(r.data.summary); })
      .finally(() => setLoading(false));
  }, [pid]);

  useEffect(() => {
    fetchTimeline();
    if (patientId) {
      api.get(`/users/${patientId}`).then(r => setPatient(r.data.user)).catch(() => {});
    }
  }, [fetchTimeline, patientId]);

  // Filter + search
  const filtered = events.filter(ev => {
    if (activeFilter !== 'all' && ev.type !== activeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const d = ev.data;
      const text = [
        d.diagnosis, d.reason, d.hospital, d.bloodGroup,
        d.doctor?.name, d.paymentType,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const grouped = groupByDate(filtered);
  const patient = patientInfo || (user?.role === 'patient' ? user : null);

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h4>{patientId ? `${patientInfo?.name || 'Patient'}'s Timeline` : 'My Activity Timeline'}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Complete medical history and activity log
          </p>
        </div>
        {patientId && (
          <Link to={-1} className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1" />Back
          </Link>
        )}
      </div>

      {/* ── Patient info strip ── */}
      {patient && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="card-body py-3">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#2A7FFF,#00C9A7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                {patient.name?.[0]?.toUpperCase()}
              </div>
              {[
                { label: 'Name',        value: patient.name },
                { label: 'Age',         value: patient.age ? `${patient.age} yrs` : '—' },
                { label: 'Blood Group', value: patient.bloodGroup || '—' },
                { label: 'Gender',      value: patient.gender || '—' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                  <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>{item.value}</div>
                </div>
              ))}
              {patient.allergies?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Allergies</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {patient.allergies.map(a => (
                      <span key={a} style={{ background: '#fff0f0', color: '#dc2626', fontSize: '0.72rem', fontWeight: 600, padding: '1px 8px', borderRadius: 99, border: '1px solid #fecaca' }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Summary cards ── */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
          <SummaryCard label="Records"      value={summary.totalRecords}       icon="bi-file-earmark-medical-fill" color="#2A7FFF" bg="#e8f1ff" />
          <SummaryCard label="Appointments" value={summary.totalAppointments}  icon="bi-calendar-check-fill"       color="#00a88c" bg="#e0faf5" />
          <SummaryCard label="Vitals"       value={summary.totalVitals}        icon="bi-activity"                  color="#d97706" bg="#fff8e6" />
          <SummaryCard label="Blood Req."   value={summary.totalBloodRequests} icon="bi-droplet-fill"              color="#dc2626" bg="#fff0f0" />
          <SummaryCard label="Payments"     value={summary.totalPayments}      icon="bi-currency-rupee"            color="#7c3aed" bg="#f3f0ff" />
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Type filters */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => setFilter('all')}
                style={{ background: activeFilter === 'all' ? '#1F2937' : '#f3f4f6', color: activeFilter === 'all' ? '#fff' : '#6B7280', border: 'none', borderRadius: 99, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                All ({events.length})
              </button>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const count = events.filter(e => e.type === key).length;
                if (!count) return null;
                return (
                  <button key={key} onClick={() => setFilter(key)}
                    style={{ background: activeFilter === key ? cfg.color : '#f3f4f6', color: activeFilter === key ? '#fff' : '#6B7280', border: 'none', borderRadius: 99, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <i className={`bi ${cfg.icon} me-1`} />{cfg.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: '0.85rem' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search activities..."
                style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 6, paddingBottom: 6, border: '1.5px solid #E5EAF0', borderRadius: 8, fontSize: '0.82rem', color: '#1F2937', outline: 'none', width: 200 }}
                onFocus={e => e.target.style.borderColor = '#2A7FFF'}
                onBlur={e => e.target.style.borderColor = '#E5EAF0'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5" style={{ color: 'var(--text-muted)' }}>
            <i className="bi bi-clock-history d-block mb-2" style={{ fontSize: '2.5rem' }} />
            {search || activeFilter !== 'all' ? 'No matching activities found.' : 'No activity recorded yet.'}
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {grouped.map(([dateKey, dayEvents], gi) => (
            <div key={dateKey}>
              {/* Date separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem', marginTop: gi > 0 ? '1.5rem' : 0 }}>
                <div style={{ height: 1, flex: 1, background: '#E5EAF0' }} />
                <div style={{ background: '#1F2937', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                  {formatDate(new Date(dateKey))}
                </div>
                <div style={{ height: 1, flex: 1, background: '#E5EAF0' }} />
              </div>

              {/* Events for this day */}
              {dayEvents.map((event, ei) => {
                const cfg = TYPE_CONFIG[event.type];
                const isLast = ei === dayEvents.length - 1 && gi === grouped.length - 1;
                return (
                  <div key={`${event.type}-${event.data._id}-${ei}`}
                    style={{ display: 'flex', gap: 16, marginBottom: 16 }}>

                    {/* Left: dot + connector */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 0 4px ${cfg.color}18` }}>
                        <i className={`bi ${cfg.icon}`} style={{ color: cfg.color, fontSize: '1rem' }} />
                      </div>
                      {!isLast && (
                        <div style={{ width: 2, flex: 1, minHeight: 20, background: `linear-gradient(to bottom, ${cfg.color}40, #E5EAF0)`, marginTop: 4 }} />
                      )}
                    </div>

                    {/* Right: card */}
                    <div style={{ flex: 1, background: '#fff', border: `1px solid #E5EAF0`, borderRadius: 12, padding: '1rem 1.25rem', borderLeft: `3px solid ${cfg.color}`, marginBottom: isLast ? 0 : 4 }}>
                      {/* Card header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <i className={`bi ${cfg.icon} me-1`} />{cfg.label}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                          {formatTime(event.date)}
                        </span>
                      </div>

                      {/* Card body */}
                      <EventContent event={event} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
