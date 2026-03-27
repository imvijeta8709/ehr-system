import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function AppointmentForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ doctor: '', date: '', timeSlot: '', reason: '', patient: '' });

  if (user?.role === 'doctor') {
    return (
      <div className="text-center py-5">
        <i className="bi bi-calendar-x d-block mb-3" style={{ fontSize: '3rem', color: 'var(--text-muted)' }} />
        <h5>Not Available</h5>
        <p style={{ color: 'var(--text-muted)' }}>Only patients can book appointments.</p>
        <button className="btn btn-outline-primary" onClick={() => navigate('/app/appointments')}>View Appointments</button>
      </div>
    );
  }

  useEffect(() => {
    api.get('/users/doctors').then((r) => setDoctors(r.data.doctors));
  }, []);

  const fetchSlots = useCallback(async (doctorId, date) => {
    if (!doctorId || !date) { setAvailableSlots([]); return; }
    setLoadingSlots(true);
    setForm(f => ({ ...f, timeSlot: '' }));
    try {
      const res = await api.get(`/availability/${doctorId}`, { params: { date } });
      setAvailableSlots(res.data.slots || []);
      setBookedSlots(res.data.bookedSlots || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm(f => {
      const next = { ...f, [field]: val };
      if (field === 'doctor' || field === 'date') {
        fetchSlots(field === 'doctor' ? val : f.doctor, field === 'date' ? val : f.date);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.timeSlot) return toast.error('Please select a time slot');
    setLoading(true);
    try {
      await api.post('/appointments', form);
      toast.success('Appointment booked');
      navigate('/app/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const hasDoctor = !!form.doctor;
  const hasDate   = !!form.date;

  return (
    <div>
      <h4 className="mb-4">Book Appointment</h4>
      <div className="card" style={{ maxWidth: 620 }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>

            {/* Doctor */}
            <div className="mb-3">
              <label className="form-label">Doctor *</label>
              <select className="form-select" value={form.doctor} onChange={set('doctor')} required>
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    Dr. {d.name}{d.specialization ? ` — ${d.specialization}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin: patient override */}
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <div className="mb-3">
                <label className="form-label">Patient ID (optional)</label>
                <input className="form-control" value={form.patient} onChange={set('patient')} placeholder="Leave blank to use logged-in user" />
              </div>
            )}

            {/* Date */}
            <div className="mb-3">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-control"
                value={form.date}
                onChange={set('date')}
                min={today}
                required
              />
            </div>

            {/* Time Slot */}
            <div className="mb-3">
              <label className="form-label">Available Time Slots *</label>

              {!hasDoctor || !hasDate ? (
                <div className="p-3 rounded text-center" style={{ background: 'var(--bg)', border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <i className="bi bi-calendar2-week me-2" />
                  Select a doctor and date to see available slots
                </div>
              ) : loadingSlots ? (
                <div className="p-3 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <span className="spinner-border spinner-border-sm me-2" />Loading slots...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-3 rounded text-center" style={{ background: '#fff8f0', border: '1px solid #fde8cc', color: '#b45309', fontSize: '0.85rem' }}>
                  <i className="bi bi-calendar-x me-2" />
                  No available slots for this date. Doctor may not have set availability for this day — try another date.
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 mt-1">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, timeSlot: slot }))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: form.timeSlot === slot ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: form.timeSlot === slot ? 'var(--primary)' : 'var(--card-bg)',
                        color: form.timeSlot === slot ? '#fff' : 'var(--text)',
                        fontSize: '0.82rem',
                        fontWeight: form.timeSlot === slot ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <i className="bi bi-clock me-1" style={{ fontSize: '0.75rem' }} />
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              {/* Show booked slots as disabled reference */}
              {bookedSlots.length > 0 && (
                <div className="mt-2 d-flex flex-wrap gap-2">
                  {bookedSlots.map(slot => (
                    <span key={slot} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#9ca3af', fontSize: '0.78rem', textDecoration: 'line-through' }}>
                      {slot}
                    </span>
                  ))}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>already booked</span>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="form-label">Reason *</label>
              <textarea className="form-control" rows={3} value={form.reason} onChange={set('reason')} required />
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading || !form.timeSlot}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                Book Appointment
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
