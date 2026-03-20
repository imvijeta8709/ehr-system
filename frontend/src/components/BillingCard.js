import React, { useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

/**
 * Reusable billing card — shows bill details and a Pay Now button.
 *
 * Props:
 *   type        : 'blood' | 'consultation'
 *   item        : the BloodRequest or Appointment object
 *   onPaid      : callback after successful payment
 *   canPay      : boolean — whether the current user can pay
 */
export default function BillingCard({ type, item, onPaid, canPay }) {
  const [paying, setPaying] = useState(false);

  if (!item) return null;

  const isPaid   = item.paymentStatus === 'paid';
  const hasBill  = item.totalAmount > 0 || item.paymentStatus;

  // Only show billing card when there's something to show
  const showForBlood        = type === 'blood'        && (item.status === 'approved' || item.status === 'fulfilled');
  const showForConsultation = type === 'consultation' && item.status === 'completed';
  if (!showForBlood && !showForConsultation) return null;

  const handlePay = async () => {
    if (!window.confirm(`Confirm payment of $${item.totalAmount?.toFixed(2)}?`)) return;
    setPaying(true);
    try {
      const endpoint =
        type === 'blood'
          ? `/billing/blood/${item._id}/pay`
          : `/billing/appointment/${item._id}/pay`;
      await api.post(endpoint);
      toast.success('Payment successful');
      onPaid && onPaid();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 8,
        padding: '10px 14px',
        borderRadius: 8,
        background: isPaid ? '#f0fdf4' : '#fffbeb',
        border: `1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}`,
        fontSize: '0.8rem',
      }}
    >
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          {type === 'blood' ? (
            <>
              <span style={{ color: 'var(--text-muted)' }}>
                {item.units} unit(s) × ${item.pricePerUnit?.toFixed(2) ?? '0.00'}
                {item.emergencyCharge > 0 && ` + $${item.emergencyCharge?.toFixed(2)} service charge`}
              </span>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>
                Total: ${item.totalAmount?.toFixed(2) ?? '0.00'}
              </div>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--text-muted)' }}>
                Consultation fee
              </span>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>
                Total: ${item.totalAmount?.toFixed(2) ?? item.consultationFee?.toFixed(2) ?? '0.00'}
              </div>
            </>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          <span
            className={`badge ${isPaid ? 'bg-success' : 'bg-warning text-dark'}`}
            style={{ fontSize: '0.75rem' }}
          >
            {isPaid ? 'Paid' : 'Pending'}
          </span>

          {!isPaid && canPay && (
            <button
              className="btn btn-sm btn-primary"
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
              disabled={paying}
              onClick={handlePay}
            >
              {paying
                ? <span className="spinner-border spinner-border-sm me-1" />
                : <i className="bi bi-credit-card me-1" />}
              Pay Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
