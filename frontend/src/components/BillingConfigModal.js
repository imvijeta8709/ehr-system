import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

/**
 * Modal for superadmin to configure billing prices.
 * Props:
 *   type    : 'blood' | 'consultation'
 *   onClose : callback
 */
export default function BillingConfigModal({ type, onClose }) {
  const [form, setForm]     = useState({ pricePerUnit: 0, emergencyCharge: 0, consultationFee: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    api.get(`/billing/config/${type}`)
      .then(r => {
        const c = r.data.config;
        setForm({
          pricePerUnit:    c.pricePerUnit    ?? 0,
          emergencyCharge: c.emergencyCharge ?? 0,
          consultationFee: c.consultationFee ?? 0,
        });
      })
      .catch(() => toast.error('Failed to load config'))
      .finally(() => setLoading(false));
  }, [type]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/billing/config/${type}`, form);
      toast.success('Billing config saved');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: parseFloat(v) || 0 }));

  return (
    <div className="ehr-modal-overlay" onClick={onClose}>
      <div className="ehr-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="ehr-modal-header">
          <span className="ehr-modal-title">
            <i className={`bi ${type === 'blood' ? 'bi-droplet-half text-danger' : 'bi-stethoscope text-primary'} me-2`} />
            {type === 'blood' ? 'Blood Bank Pricing' : 'Consultation Pricing'}
          </span>
          <button className="ehr-modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>

        {loading ? (
          <div className="ehr-modal-body text-center py-4"><span className="spinner-border" /></div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="ehr-modal-body">
              {type === 'blood' ? (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Price per Unit ($)</label>
                    <input
                      type="number" min={0} step="0.01" className="form-control"
                      value={form.pricePerUnit}
                      onChange={e => set('pricePerUnit', e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Emergency / Service Charge ($)</label>
                    <input
                      type="number" min={0} step="0.01" className="form-control"
                      value={form.emergencyCharge}
                      onChange={e => set('emergencyCharge', e.target.value)}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      Flat charge added to every approved request
                    </div>
                  </div>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Consultation Fee ($)</label>
                    <input
                      type="number" min={0} step="0.01" className="form-control"
                      value={form.consultationFee}
                      onChange={e => set('consultationFee', e.target.value)}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      Applied automatically when an appointment is marked completed
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="ehr-modal-footer d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-check2 me-1" />}
                Save Pricing
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
