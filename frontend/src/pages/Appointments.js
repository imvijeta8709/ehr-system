import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import BillingCard from '../components/BillingCard';
import BillingConfigModal from '../components/BillingConfigModal';

const STATUS_COLORS = {
  pending: 'warning text-dark',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'danger',
};

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const isSuperAdmin = user?.role === 'superadmin';

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments', { params: { status: filter || undefined, page, limit: 10 } });
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
          {isSuperAdmin && (
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPricingModal(true)}>
              <i className="bi bi-gear me-1" />Consultation Pricing
            </button>
          )}
          <Link to="/appointments/new" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1" />Book Appointment
          </Link>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <select className="form-select" style={{ maxWidth: 200 }} value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
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
                  <th>{user?.role === 'patient' ? 'Doctor' : 'Patient'}</th>
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
                  <tr><td colSpan={7} className="text-center text-muted py-3">No appointments found</td></tr>
                ) : appointments.map((a) => (
                  <tr key={a._id}>
                    <td>{user?.role === 'patient' ? a.doctor?.name : a.patient?.name}</td>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>{a.timeSlot}</td>
                    <td>{a.reason}</td>
                    <td>
                      <span className={`badge bg-${STATUS_COLORS[a.status]}`}>{a.status}</span>
                    </td>
                    <td>
                      <BillingCard
                        type="consultation"
                        item={a}
                        canPay={user?.role === 'patient' || isSuperAdmin}
                        onPaid={fetchAppointments}
                      />
                      {a.status !== 'completed' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {user?.role !== 'patient' && a.status === 'pending' && (
                        <button className="btn btn-sm btn-success me-1" onClick={() => updateStatus(a._id, 'confirmed')}>
                          Confirm
                        </button>
                      )}
                      {(user?.role === 'doctor' || user?.role === 'superadmin' || user?.role === 'admin') && a.status === 'confirmed' && (
                        <button className="btn btn-sm btn-info me-1" onClick={() => updateStatus(a._id, 'completed')}>
                          <i className="bi bi-check2-circle me-1" />Complete
                        </button>
                      )}
                      {a.status !== 'cancelled' && a.status !== 'completed' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => updateStatus(a._id, 'cancelled')}>
                          Cancel
                        </button>
                      )}
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
      {showPricingModal && (
        <BillingConfigModal type="consultation" onClose={() => setShowPricingModal(false)} />
      )}
    </div>
  );
}
