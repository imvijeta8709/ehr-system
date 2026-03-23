import React, { useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

/**
 * BillingCard — shows charge details and a Stripe "Pay Now" button.
 *
 * Props:
 *   type   : 'blood' | 'consultation'
 *   item   : BloodRequest or Appointment object
 *   canPay : boolean — whether the current user can pay
 *   onPaid : callback after successful payment verification
 */
export default function BillingCard({ type, item, canPay, onPaid }) {
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const isPaid         = item.paymentStatus === 'paid';
  const hasValidCharge = item.totalAmount && item.totalAmount > 0;

  // Visibility rules
  const showForBlood        = type === 'blood'        && item.status === 'approved';
  const showForConsultation = type === 'consultation' && item.status === 'completed';
  if (!showForBlood && !showForConsultation) return null;

  // Pay button conditions: approved/completed + charge exists + not paid + user can pay
  const isPaymentEligible = hasValidCharge && !isPaid && canPay;

  const handlePay = async () => {
    setLoading(true);
    try {
      const endpoint =
        type === 'blood'
          ? `/stripe/blood/${item._id}/checkout`
          : `/stripe/appointment/${item._id}/checkout`;

      const res = await api.post(endpoint);
      // Redirect to Stripe hosted checkout page
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        background: isPaid ? '#f0fdf4' : hasValidCharge ? '#fffbeb' : '#f3f4f6',
        border: `1px solid ${isPaid ? '#bbf7d0' : hasValidCharge ? '#fde68a' : '#d1d5db'}`,
        fontSize: '0.8rem',
        minWidth: 160,
      }}
    >
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        {/* Charge details */}
        <div>
          {hasValidCharge ? (
            <>
              {type === 'blood' && (
                <div style={{ color: 'var(--text-muted)' }}>
                  {item.units} unit(s) &times; ${item.pricePerUnit?.toFixed(2) ?? '0.00'}
                  {item.emergencyCharge > 0 && ` + $${item.emergencyCharge?.toFixed(2)} service`}
                </div>
              )}
              {type === 'consultation' && (
                <div style={{ color: 'var(--text-muted)' }}>Consultation fee</div>
              )}
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: 2 }}>
                Total: ${item.totalAmount?.toFixed(2)}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {type === 'blood' ? 'Awaiting pricing from admin' : 'Awaiting fee from doctor'}
            </span>
          )}
        </div>

        {/* Status badge + Pay button */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {isPaid ? (
            <span className="badge bg-success" style={{ fontSize: '0.72rem' }}>
              <i className="bi bi-check-circle me-1" />Paid
            </span>
          ) : hasValidCharge ? (
            <span className="badge bg-warning text-dark" style={{ fontSize: '0.72rem' }}>
              <i className="bi bi-clock me-1" />Pending
            </span>
          ) : (
            <span className="badge bg-secondary" style={{ fontSize: '0.72rem' }}>No Charge</span>
          )}

          {isPaymentEligible && (
            <button
              className="btn btn-sm btn-primary"
              style={{ fontSize: '0.72rem', padding: '3px 10px', whiteSpace: 'nowrap' }}
              disabled={loading}
              onClick={handlePay}
            >
              {loading
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
