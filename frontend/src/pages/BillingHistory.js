import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Spinner, { TableSkeleton } from '../components/Spinner';
import { toast } from 'react-toastify';

const TYPE_META = {
  appointment: { icon: 'bi-calendar-check-fill', color: '#2A7FFF', label: 'Appointment' },
  blood:       { icon: 'bi-droplet-fill',         color: '#dc2626', label: 'Blood Request' },
};

const STATUS_BADGE = {
  paid:    { bg: '#dcfce7', color: '#16a34a', label: 'Paid' },
  pending: { bg: '#fef9c3', color: '#ca8a04', label: 'Pending' },
  overdue: { bg: '#fee2e2', color: '#dc2626', label: 'Overdue' },
};

export default function BillingHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    api.get('/billing/history')
      .then((r) => setRecords(r.data.records || []))
      .catch(() => toast.error('Failed to load billing history'))
      .finally(() => setLoading(false));
  }, []);

  const downloadInvoice = async (type, id) => {
    setDownloading(id);
    try {
      const url = type === 'appointment'
        ? `/billing/invoice/appointment/${id}`
        : `/billing/invoice/blood/${id}`;
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `invoice-${id}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <TableSkeleton rows={5} cols={6} />;

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <i className="bi bi-receipt" style={{ fontSize: '1.4rem', color: 'var(--primary)' }} />
        <h4 className="mb-0">Billing History</h4>
      </div>

      {records.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5" style={{ color: 'var(--text-muted)' }}>
            <i className="bi bi-receipt d-block mb-2" style={{ fontSize: '2rem' }} />
            No billing records found.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const meta   = TYPE_META[r.type]   || TYPE_META.appointment;
                    const status = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
                    return (
                      <tr key={r._id}>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className={`bi ${meta.icon}`} style={{ color: meta.color }} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{meta.label}</span>
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{r.description || '—'}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{(r.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span style={{ background: status.bg, color: status.color, fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ fontSize: '0.75rem' }}
                            disabled={downloading === r._id}
                            onClick={() => downloadInvoice(r.type, r._id)}
                          >
                            {downloading === r._id
                              ? <span className="spinner-border spinner-border-sm" />
                              : <><i className="bi bi-download me-1" />PDF</>
                            }
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
