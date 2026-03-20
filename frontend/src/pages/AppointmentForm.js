import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
];

export default function AppointmentForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    doctor: '',
    date: '',
    timeSlot: '',
    reason: '',
    patient: '',
  });

  useEffect(() => {
    api.get('/users/doctors').then((r) => setDoctors(r.data.doctors));
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/appointments', form);
      toast.success('Appointment booked');
      navigate('/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="mb-4">Book Appointment</h4>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Doctor *</label>
              <select className="form-select" value={form.doctor} onChange={set('doctor')} required>
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    Dr. {d.name} {d.specialization ? `— ${d.specialization}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {(user?.role === 'admin' || user?.role === 'doctor') && (
              <div className="mb-3">
                <label className="form-label">Patient ID (optional)</label>
                <input className="form-control" value={form.patient} onChange={set('patient')} placeholder="Leave blank to use logged-in user" />
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-control"
                value={form.date}
                onChange={set('date')}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Time Slot *</label>
              <select className="form-select" value={form.timeSlot} onChange={set('timeSlot')} required>
                <option value="">Select time</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Reason *</label>
              <textarea className="form-control" rows={3} value={form.reason} onChange={set('reason')} required />
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                Book Appointment
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
