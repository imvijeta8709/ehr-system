import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import BillingCard from '../components/BillingCard';

const STATUS_COLORS = {
  pending:   'warning text-dark',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'danger',
};

// Modal for doctor to set consultation fee when completing an appointment
// Also used to set fee on already-completed appointments where fee is still 0
function CompleteModal({ appointment, onClose, onDone }) {
  const [fee, setFee] = useState('');
  const [saving, setSaving] = useState(false);

  // If already completed, we only update the fee (not the status)
  const alreadyCompleted = appointment.status === 'completed';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const feeVal = parseFloat(fee);
    if (!feeVal || feeVal <= 0) {
      toast.error('Please enter a valid consultation fee');
      return;
    }
    setSaving(true);
    try {
      const payload = alreadyCompleted
        ? { consultationFee: feeVal }
        : { status: 'completed', consultationFee: feeVal };
      await api.put(`/appointments/${appointment._id}`, payload);
      toast.success(alreadyCompleted ? 'Consultation fee updated' : 'Appointment completed');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`bi ${alreadyCompleted ? 'bi-currency-dollar' : 'bi-check2-circle'} me-2 text-success`} />
              {alreadyCompleted ? 'Set Consultation Fee' : 'Complete Appointment'}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Patient: <strong>{appointment.patient?.name}</strong><br />
                Date: <strong>{new Date(appointment.date).toLocaleDateString()} at {appointment.timeSlot}</strong>
              </p>
              <div className="mb-3">
                <label className="form-label">Consultation Fee (USD) *</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className="form-control"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 50.00"
                    value={fee}
                    onChange={e => setFee(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-text">This fee will be charged to the patient.</div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-success" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-check2 me-1" />}
                {alreadyCompleted ? 'Save Fee' : 'Complete & Set Fee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Appointments() {
  const { user } = useAuth();
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [completeTarget, setCompleteTarget] = useState(null);

  const isPatient    = user?.role === 'patient';
  const isDoctor     = user?.role === 'doctor';
  const isSuperAdmin = user?.role === 'superadmin';

  // Handle Stripe redirect callbacks
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session_id');

    if (payment === 'success' && sessionId) {
      // Verify and fulfill the payment server-side
      api.post(`/stripe/session/${sessionId}/verify`)
        .then(() => {
          toast.success('Payment successful! Your appointment is now paid.');
          fetchAppointments();
        })
        .catch(() => {
          toast.success('Payment received. Refreshing...');
          fetchAppointments();
        });
    } else if (payment === 'cancelled') {
      toast.info('Payment was cancelled.');
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments', {
        params: { status: filter || undefined, page, limit: 10 },
      });
      setAppointments(res.data.appointments);
      setPages(res.data.pages);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Appointments</h4>
        <div className="d-flex gap-2">
          {/* Only patients can book appointments */}
          {isPatient && (
            <Link to="/app/appointments/new" className="btn btn-primary btn-sm">
              <i className="bi bi-plus-lg me-1" />Book Appointment
            </Link>
          )}
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>{isPatient ? 'Doctor' : 'Patient'}</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Billing</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-3">No appointments found</td>
                  </tr>
                ) : appointments.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {isPatient ? `Dr. ${a.doctor?.name}` : a.patient?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {isPatient ? a.doctor?.specialization : a.patient?.email}
                      </div>
                    </td>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>{a.timeSlot}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.reason}
                    </td>
                    <td>
                      <span className={`badge bg-${STATUS_COLORS[a.status]}`}>{a.status}</span>
                    </td>
                    <td>
                      {/* Billing: completed appointments show charge info */}
                      {a.status === 'completed' ? (
                        <BillingCard
                          type="consultation"
                          item={a}
                          canPay={isPatient || isSuperAdmin}
                          onPaid={fetchAppointments}
                        />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {/* Confirm: non-patient on pending */}
                        {!isPatient && a.status === 'pending' && (
                          <button className="btn btn-sm btn-success" onClick={() => updateStatus(a._id, 'confirmed')}>
                            Confirm
                          </button>
                        )}

                        {/* Complete (with fee modal): doctor or admin on confirmed */}
                        {(isDoctor || isSuperAdmin || user?.role === 'admin') && a.status === 'confirmed' && (
                          <button className="btn btn-sm btn-info" onClick={() => setCompleteTarget(a)}>
                            <i className="bi bi-check2-circle me-1" />Complete
                          </button>
                        )}

                        {/* Set Fee: doctor on completed appointment where fee is still 0 / unpaid */}
                        {isDoctor && a.status === 'completed' && a.paymentStatus !== 'paid' && (!a.totalAmount || a.totalAmount === 0) && (
                          <button className="btn btn-sm btn-warning" onClick={() => setCompleteTarget(a)}>
                            <i className="bi bi-currency-dollar me-1" />Set Fee
                          </button>
                        )}

                        {/* Cancel */}
                        {a.status !== 'cancelled' && a.status !== 'completed' && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => updateStatus(a._id, 'cancelled')}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-3">
        <Pagination page={page} pages={pages} onPageChange={setPage} />
      </div>

      {completeTarget && (
        <CompleteModal
          appointment={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onDone={() => { setCompleteTarget(null); fetchAppointments(); }}
        />
      )}
    </div>
  );
}
