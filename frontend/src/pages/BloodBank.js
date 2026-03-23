import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import BillingCard from '../components/BillingCard';
import BillingConfigModal from '../components/BillingConfigModal';
import SearchFilterBar from '../components/SearchFilterBar';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const URGENCY_META = {
  normal:   { cls: 'badge-status-confirmed', icon: 'bi-circle',              color: '#00a88c', rowBg: 'transparent' },
  urgent:   { cls: 'badge-status-pending',   icon: 'bi-exclamation-circle',  color: '#f59e0b', rowBg: '#fffbeb' },
  critical: { cls: 'badge-status-cancelled', icon: 'bi-exclamation-triangle-fill', color: '#dc2626', rowBg: '#fff5f5' },
};
const STATUS_COLOR = {
  pending: 'badge-status-pending', approved: 'badge-status-confirmed',
  rejected: 'badge-status-cancelled', fulfilled: 'badge-status-completed',
};

function BloodGroupBadge({ group }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 99, background: '#fff0f0', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', border: '1px solid #fecaca' }}>
      {group}
    </span>
  );
}

// ── Low Stock Alert Banner ───────────────────────────────────────
function LowStockBanner({ inventory }) {
  const lowItems = inventory.filter(i => i.isLowStock);
  if (!lowItems.length) return null;
  const outOf = lowItems.filter(i => i.isOutOfStock);
  const low   = lowItems.filter(i => !i.isOutOfStock);
  return (
    <div className="alert mb-3 d-flex align-items-start gap-3" style={{ background: '#fff8f0', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 16px' }}>
      <i className="bi bi-exclamation-triangle-fill" style={{ color: '#f59e0b', fontSize: '1.1rem', marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.875rem', marginBottom: 4 }}>
          Blood Inventory Alert
        </div>
        <div className="d-flex flex-wrap gap-2">
          {outOf.map(i => (
            <span key={i.bloodGroup} style={{ padding: '2px 10px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.78rem', border: '1px solid #fca5a5' }}>
              <i className="bi bi-x-circle me-1" />{i.bloodGroup}: Out of Stock
            </span>
          ))}
          {low.map(i => (
            <span key={i.bloodGroup} style={{ padding: '2px 10px', borderRadius: 99, background: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.78rem', border: '1px solid #fcd34d' }}>
              <i className="bi bi-exclamation-circle me-1" />{i.bloodGroup}: {i.units} unit{i.units !== 1 ? 's' : ''} left
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Request Modal ────────────────────────────────────────────────
function RequestModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ bloodGroup: '', units: 1, urgency: 'normal', hospital: '', location: '', reason: '' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      await api.post('/blood/requests', form);
      onSaved();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Failed to submit request');
    } finally { setSaving(false); }
  };

  return (
    <div className="ehr-modal-overlay" onClick={onClose}>
      <div className="ehr-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="ehr-modal-header">
          <span className="ehr-modal-title"><i className="bi bi-droplet-half me-2 text-danger" />Request Blood</span>
          <button className="ehr-modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <form onSubmit={submit}>
          <div className="ehr-modal-body">
            {err && <div className="alert alert-danger py-2 mb-3">{err}</div>}
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label">Blood Group *</label>
                <select className="form-select" required value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">Units *</label>
                <input type="number" className="form-control" min={1} required value={form.units} onChange={e => setForm(f => ({ ...f, units: +e.target.value }))} />
              </div>
              <div className="col-6">
                <label className="form-label">Urgency</label>
                <select className="form-select" value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">Hospital *</label>
                <input className="form-control" required value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label">Location *</label>
                <input className="form-control" required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label">Reason</label>
                <textarea className="form-control" rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="ehr-modal-footer d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-send me-1" />}Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Donor Modal ──────────────────────────────────────────────────
function DonorModal({ donor, onClose, onSaved }) {
  const init = donor
    ? { ...donor, lastDonationDate: donor.lastDonationDate ? donor.lastDonationDate.slice(0, 10) : '' }
    : { name: '', email: '', phone: '', bloodGroup: '', location: '', lastDonationDate: '', isAvailable: true, totalDonatedUnits: 0 };
  const [form, setForm] = useState(init);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.totalDonatedUnits < 0) { setErr('Donated units cannot be negative'); return; }
    setSaving(true); setErr('');
    try {
      const payload = { ...form };
      if (!payload.lastDonationDate) delete payload.lastDonationDate;
      if (donor?._id) await api.put(`/blood/donors/${donor._id}`, payload);
      else await api.post('/blood/donors', payload);
      onSaved();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Failed to save donor');
    } finally { setSaving(false); }
  };

  return (
    <div className="ehr-modal-overlay" onClick={onClose}>
      <div className="ehr-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="ehr-modal-header">
          <span className="ehr-modal-title"><i className="bi bi-person-heart me-2 text-danger" />{donor ? 'Edit Donor' : 'Register as Donor'}</span>
          <button className="ehr-modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <form onSubmit={submit}>
          <div className="ehr-modal-body">
            {err && <div className="alert alert-danger py-2 mb-3">{err}</div>}
            <div className="row g-3">
              <div className="col-6"><label className="form-label">Full Name *</label><input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div className="col-6"><label className="form-label">Phone *</label><input className="form-control" required value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div className="col-6"><label className="form-label">Email</label><input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div className="col-6">
                <label className="form-label">Blood Group *</label>
                <select className="form-select" required value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="col-12"><label className="form-label">Location *</label><input className="form-control" required value={form.location} onChange={e => set('location', e.target.value)} /></div>
              <div className="col-6">
                <label className="form-label">Total Blood Donated (units)</label>
                <input type="number" className="form-control" min={0} value={form.totalDonatedUnits} onChange={e => set('totalDonatedUnits', +e.target.value)} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>Added to inventory automatically</div>
              </div>
              <div className="col-6"><label className="form-label">Last Donation Date</label><input type="date" className="form-control" value={form.lastDonationDate} onChange={e => set('lastDonationDate', e.target.value)} /></div>
              <div className="col-12">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="avail" checked={form.isAvailable} onChange={e => set('isAvailable', e.target.checked)} />
                  <label className="form-check-label" htmlFor="avail" style={{ fontSize: '0.875rem' }}>Available to donate</label>
                </div>
              </div>
            </div>
          </div>
          <div className="ehr-modal-footer d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-check2 me-1" />}
              {donor ? 'Save Changes' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Donor Match Modal ────────────────────────────────────────────
function DonorMatchModal({ bloodGroup, location, onClose }) {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locFilter, setLocFilter] = useState(location || '');
  const [compatible, setCompatible] = useState(true);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/blood/donors/match', {
        params: { bloodGroup, location: locFilter, compatible: compatible ? 'true' : 'false' },
      });
      setDonors(res.data.donors);
    } catch {
      setDonors([]);
    } finally {
      setLoading(false);
    }
  }, [bloodGroup, locFilter, compatible]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  return (
    <div className="ehr-modal-overlay" onClick={onClose}>
      <div className="ehr-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="ehr-modal-header">
          <span className="ehr-modal-title">
            <i className="bi bi-people-fill me-2 text-danger" />
            Donor Matches for <BloodGroupBadge group={bloodGroup} />
          </span>
          <button className="ehr-modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <div className="ehr-modal-body">
          {/* Filters */}
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <div className="input-group input-group-sm" style={{ maxWidth: 220 }}>
              <span className="input-group-text"><i className="bi bi-geo-alt" /></span>
              <input
                className="form-control"
                placeholder="Filter by location…"
                value={locFilter}
                onChange={e => setLocFilter(e.target.value)}
              />
            </div>
            <div className="form-check form-switch d-flex align-items-center gap-2 mb-0 ms-1">
              <input className="form-check-input" type="checkbox" id="compat" checked={compatible} onChange={e => setCompatible(e.target.checked)} />
              <label className="form-check-label" htmlFor="compat" style={{ fontSize: '0.82rem' }}>Include compatible groups</label>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4"><span className="spinner-border" /></div>
          ) : donors.length === 0 ? (
            <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
              <i className="bi bi-person-x d-block mb-2" style={{ fontSize: '2rem' }} />
              No eligible donors found{locFilter ? ` in "${locFilter}"` : ''}
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {donors.map(d => (
                <div key={d._id} className="d-flex align-items-center gap-3 p-3 rounded"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                    {d.name[0].toUpperCase()}
                  </div>
                  <div className="flex-grow-1">
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.name}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      <i className="bi bi-telephone me-1" />{d.phone}
                      <span className="mx-2">·</span>
                      <i className="bi bi-geo-alt me-1" />{d.location}
                    </div>
                    {d.totalDonatedUnits > 0 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--primary)', marginTop: 2 }}>
                        <i className="bi bi-award me-1" />{d.totalDonatedUnits} unit{d.totalDonatedUnits !== 1 ? 's' : ''} donated
                      </div>
                    )}
                  </div>
                  <div className="d-flex flex-column align-items-end gap-1">
                    <BloodGroupBadge group={d.bloodGroup} />
                    {d.isEligible && (
                      <span style={{ fontSize: '0.68rem', padding: '1px 8px', borderRadius: 99, background: '#d1fae5', color: '#065f46', fontWeight: 600 }}>
                        <i className="bi bi-check-circle me-1" />Eligible
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="ehr-modal-footer">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {donors.length} eligible donor{donors.length !== 1 ? 's' : ''} found
          </span>
          <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Requests Tab ─────────────────────────────────────────────────
function RequestsTab({ isAdmin, isSuperAdmin, inventory }) {
  const { user } = useAuth();
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [matchFor, setMatchFor] = useState(null);
  const [filters, setFilters] = useState({ status: '', bloodGroup: '', urgency: '' });
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');

  const invMap = {};
  inventory.forEach(i => { invMap[i.bloodGroup] = i; });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status)     params.status     = filters.status;
      if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup;
      const res = await api.get('/blood/requests', { params });
      let reqs = res.data.requests;
      if (filters.urgency) reqs = reqs.filter(r => r.urgency === filters.urgency);
      // Sort: critical first, then urgent, then normal
      const urgOrder = { critical: 0, urgent: 1, normal: 2 };
      reqs.sort((a, b) => urgOrder[a.urgency] - urgOrder[b.urgency]);
      setRequests(reqs);
    } catch {}
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session_id');
    if (payment === 'success' && sessionId) {
      api.post(`/stripe/session/${sessionId}/verify`)
        .then(() => { toast.success('Payment successful! Blood units have been allocated.'); load(); })
        .catch(() => { toast.success('Payment received. Refreshing...'); load(); });
    } else if (payment === 'cancelled') {
      toast.info('Payment was cancelled.');
    }
  }, []); // eslint-disable-line

  const handleAction = async (id, status) => {
    setActionLoading(id + status); setActionError('');
    try {
      await api.put(`/blood/requests/${id}`, { status });
      await load();
    } catch (ex) {
      setActionError(ex.response?.data?.message || 'Action failed');
    }
    setActionLoading('');
  };

  const criticalCount = requests.filter(r => r.urgency === 'critical' && r.status === 'pending').length;
  const urgentCount   = requests.filter(r => r.urgency === 'urgent'   && r.status === 'pending').length;

  return (
    <div>
      {/* Urgent summary strip */}
      {(criticalCount > 0 || urgentCount > 0) && (
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {criticalCount > 0 && (
            <div className="d-flex align-items-center gap-2 px-3 py-2 rounded" style={{ background: '#fff5f5', border: '1px solid #fca5a5' }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ color: '#dc2626' }} />
              <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.875rem' }}>
                {criticalCount} Critical Request{criticalCount > 1 ? 's' : ''} Pending
              </span>
            </div>
          )}
          {urgentCount > 0 && (
            <div className="d-flex align-items-center gap-2 px-3 py-2 rounded" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
              <i className="bi bi-exclamation-circle-fill" style={{ color: '#f59e0b' }} />
              <span style={{ fontWeight: 700, color: '#b45309', fontSize: '0.875rem' }}>
                {urgentCount} Urgent Request{urgentCount > 1 ? 's' : ''} Pending
              </span>
            </div>
          )}
        </div>
      )}

      {actionError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
          <i className="bi bi-exclamation-triangle-fill" />
          <span>{actionError}</span>
          <button className="btn-close ms-auto" style={{ fontSize: '0.75rem' }} onClick={() => setActionError('')} />
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap">
          <select className="form-select form-select-sm" style={{ width: 140 }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            {['pending','approved','rejected','fulfilled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <select className="form-select form-select-sm" style={{ width: 120 }} value={filters.bloodGroup} onChange={e => setFilters(f => ({ ...f, bloodGroup: e.target.value }))}>
            <option value="">All Groups</option>
            {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
          <select className="form-select form-select-sm" style={{ width: 130 }} value={filters.urgency} onChange={e => setFilters(f => ({ ...f, urgency: e.target.value }))}>
            <option value="">All Urgency</option>
            <option value="critical">🔴 Critical</option>
            <option value="urgent">🟡 Urgent</option>
            <option value="normal">🟢 Normal</option>
          </select>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg me-1" />New Request
          </button>
          {isSuperAdmin && (
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPricingModal(true)}>
              <i className="bi bi-gear me-1" />Pricing
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><span className="spinner-border" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-5 text-muted"><i className="bi bi-droplet d-block mb-2" style={{ fontSize: '2.5rem' }} />No blood requests found</div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Requested By</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Urgency</th>
                  <th>Hospital / Location</th>
                  <th>Status</th>
                  <th>Billing</th>
                  <th>Date</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const meta      = URGENCY_META[r.urgency];
                  const invItem   = invMap[r.bloodGroup];
                  const available = invItem?.units ?? 0;
                  const hasStock  = available >= r.units;
                  const isLow     = invItem?.isLowStock;
                  return (
                    <tr key={r._id} style={{ background: meta.rowBg, borderLeft: r.urgency !== 'normal' ? `3px solid ${meta.color}` : undefined }}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.requestedBy?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.requestedBy?.role}</div>
                      </td>
                      <td>
                        <BloodGroupBadge group={r.bloodGroup} />
                        {isAdmin && r.status === 'pending' && (
                          <div style={{ fontSize: '0.7rem', marginTop: 3, color: isLow ? (available === 0 ? '#dc2626' : '#f59e0b') : '#00a88c', fontWeight: 600 }}>
                            <i className="bi bi-box-seam me-1" />{available} avail.
                            {!hasStock && <span className="ms-1 text-danger">(insufficient)</span>}
                            {hasStock && isLow && <span className="ms-1" style={{ color: '#f59e0b' }}>(low)</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.units}</td>
                      <td>
                        <span className={`badge ${meta.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                          <i className={`bi ${meta.icon}`} style={{ fontSize: '0.7rem' }} />
                          {r.urgency}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 500 }}>{r.hospital}</div>
                        <div style={{ color: 'var(--text-muted)' }}><i className="bi bi-geo-alt me-1" />{r.location}</div>
                      </td>
                      <td><span className={`badge ${STATUS_COLOR[r.status]}`}>{r.status}</span></td>
                      <td>
                        {(r.status === 'approved' || r.status === 'fulfilled') ? (
                          <BillingCard
                            type="blood" item={r}
                            canPay={user?.role === 'patient' ? (r.requestedBy?._id === user?._id || r.patient?._id === user?._id) : isAdmin}
                            onPaid={load}
                          />
                        ) : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      {isAdmin && (
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            {/* Donor match button */}
                            <button className="btn btn-outline-danger btn-sm" title="Find matching donors"
                              onClick={() => setMatchFor(r)}>
                              <i className="bi bi-people" />
                            </button>
                            {r.status === 'pending' && (
                              <>
                                <button className="btn btn-outline-success btn-sm" disabled={!!actionLoading || !hasStock}
                                  title={!hasStock ? `Only ${available} unit(s) available` : 'Approve'}
                                  onClick={() => handleAction(r._id, 'approved')}>
                                  {actionLoading === r._id+'approved' ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check2" />}
                                </button>
                                <button className="btn btn-outline-danger btn-sm" disabled={!!actionLoading}
                                  onClick={() => handleAction(r._id, 'rejected')}>
                                  {actionLoading === r._id+'rejected' ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-x" />}
                                </button>
                              </>
                            )}
                            {r.status === 'approved' && (
                              <button className="btn btn-outline-secondary btn-sm" disabled={!!actionLoading}
                                onClick={() => handleAction(r._id, 'fulfilled')}>
                                {actionLoading === r._id+'fulfilled' ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-check2-all me-1" />Fulfill</>}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && <RequestModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
      {matchFor && <DonorMatchModal bloodGroup={matchFor.bloodGroup} location={matchFor.location} onClose={() => setMatchFor(null)} />}
      {showPricingModal && <BillingConfigModal type="blood" onClose={() => setShowPricingModal(false)} />}
    </div>
  );
}

// ── Donors Tab ───────────────────────────────────────────────────
const LIMIT = 10;

const DONOR_FILTERS = [
  {
    key: 'bloodGroup', label: 'Blood Group', type: 'select',
    options: BLOOD_GROUPS.map(g => ({ value: g, label: g })),
  },
  { key: 'location',  label: 'Location',        type: 'text', placeholder: 'City / Area' },
  {
    key: 'available', label: 'Availability', type: 'select',
    options: [{ value: 'true', label: 'Available Only' }],
  },
  { key: 'dateFrom',  label: 'Donated From',     type: 'date' },
  { key: 'dateTo',    label: 'Donated To',       type: 'date' },
  {
    key: 'sortBy', label: 'Sort By', type: 'select',
    options: [
      { value: 'createdAt',        label: 'Registration Date' },
      { value: 'lastDonationDate', label: 'Last Donation' },
      { value: 'totalDonatedUnits',label: 'Units Donated' },
    ],
  },
  {
    key: 'sortOrder', label: 'Order', type: 'select',
    options: [{ value: 'desc', label: 'Newest First' }, { value: 'asc', label: 'Oldest First' }],
  },
];

const DONOR_FILTER_INIT = { bloodGroup: '', location: '', available: '', dateFrom: '', dateTo: '', sortBy: 'createdAt', sortOrder: 'desc' };

function DonorsTab({ isAdmin, isPatient }) {
  const [donors, setDonors] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDonor, setEditDonor] = useState(null);
  const [matchGroup, setMatchGroup] = useState('');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DONOR_FILTER_INIT);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT, search, ...filters };
      Object.keys(params).forEach(k => { if (params[k] === '') delete params[k]; });
      const r = await api.get('/blood/donors', { params });
      setDonors(r.data.donors);
      setTotal(r.data.total);
      setPages(r.data.pages);
    } catch {}
    setLoading(false);
  }, [search, filters, page]);

  useEffect(() => { setPage(1); }, [search, filters]);
  useEffect(() => { load(page); }, [page, search, filters]); // eslint-disable-line

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setFilters(DONOR_FILTER_INIT);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this donor? Their donated units will be deducted from inventory.')) return;
    try { await api.delete(`/blood/donors/${id}`); load(page); } catch {}
  };

  const handleToggle = async (donor) => {
    try { await api.put(`/blood/donors/${donor._id}`, { isAvailable: !donor.isAvailable }); load(page); } catch {}
  };

  return (
    <div>
      <div className="d-flex justify-content-end mb-2 gap-2">
        <button className="btn btn-outline-danger btn-sm" onClick={() => setShowMatchModal(true)}>
          <i className="bi bi-people me-1" />Find Donors by Blood Group
        </button>
        {!isPatient && (
          <button className="btn btn-primary btn-sm" onClick={() => { setEditDonor(null); setShowModal(true); }}>
            <i className="bi bi-person-plus me-1" />Register Donor
          </button>
        )}
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by donor name…"
        filters={DONOR_FILTERS}
        values={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        resultCount={total}
        resultLabel="donor"
      />

      {loading ? (
        <div className="text-center py-5"><span className="spinner-border" /></div>
      ) : donors.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-person-x d-block mb-2" style={{ fontSize: '2.5rem' }} />No donors found
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Blood Group</th><th>Contact</th>
                  <th>Location</th><th>Donated</th><th>Last Donation</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((d, i) => (
                  <tr key={d._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{(page - 1) * LIMIT + i + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                          {d.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.name}</div>
                          {d.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td><BloodGroupBadge group={d.bloodGroup} /></td>
                    <td style={{ fontSize: '0.8rem' }}>{d.phone}</td>
                    <td style={{ fontSize: '0.8rem' }}>{d.location}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{d.totalDonatedUnits ?? 0}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> units</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {d.lastDonationDate ? (
                        <>
                          {new Date(d.lastDonationDate).toLocaleDateString()}
                          {!d.isEligible && <div style={{ fontSize: '0.7rem' }} className="text-warning">90-day wait</div>}
                        </>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${d.isAvailable ? 'badge-status-completed' : 'badge-status-cancelled'}`}>
                        {d.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      {d.isEligible && d.isAvailable && <span className="badge badge-status-confirmed ms-1">Eligible</span>}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {!isPatient && (
                          <button className="btn btn-outline-secondary btn-sm" title="Toggle availability" onClick={() => handleToggle(d)}>
                            <i className={`bi ${d.isAvailable ? 'bi-toggle-on' : 'bi-toggle-off'}`} />
                          </button>
                        )}
                        {!isPatient && (
                          <button className="btn btn-outline-primary btn-sm" onClick={() => { setEditDonor(d); setShowModal(true); }}>
                            <i className="bi bi-pencil" />
                          </button>
                        )}
                        {isAdmin && (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(d._id)}>
                            <i className="bi bi-trash" />
                          </button>
                        )}
                        {isPatient && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="d-flex align-items-center justify-content-between px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </span>
              <div className="d-flex gap-1">
                <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><i className="bi bi-chevron-left" /></button>
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="btn btn-outline-secondary btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}><i className="bi bi-chevron-right" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <DonorModal donor={editDonor} onClose={() => { setShowModal(false); setEditDonor(null); }}
          onSaved={() => { setShowModal(false); setEditDonor(null); load(page); }} />
      )}

      {showMatchModal && (
        <div className="ehr-modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="ehr-modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="ehr-modal-header">
              <span className="ehr-modal-title"><i className="bi bi-people-fill me-2 text-danger" />Find Matching Donors</span>
              <button className="ehr-modal-close" onClick={() => setShowMatchModal(false)}><i className="bi bi-x" /></button>
            </div>
            <div className="ehr-modal-body">
              <label className="form-label">Select Blood Group *</label>
              <select className="form-select mb-3" value={matchGroup} onChange={e => setMatchGroup(e.target.value)}>
                <option value="">Select group</option>
                {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="ehr-modal-footer d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowMatchModal(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" disabled={!matchGroup}
                onClick={() => {
                  setFilters(f => ({ ...f, bloodGroup: matchGroup }));
                  setShowMatchModal(false);
                  setMatchGroup('');
                }}>
                <i className="bi bi-search me-1" />Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inventory Tab ────────────────────────────────────────────────
function InventoryTab({ isAdmin, inventory, onRefresh }) {
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState('');

  const handleSave = async (bloodGroup) => {
    setSaving(bloodGroup);
    try {
      const { units, threshold } = editing[bloodGroup];
      await api.put(`/blood/inventory/${encodeURIComponent(bloodGroup)}`, {
        units,
        lowStockThreshold: threshold,
      });
      setEditing(e => { const n = { ...e }; delete n[bloodGroup]; return n; });
      onRefresh();
    } catch {}
    setSaving('');
  };

  const levelColor = (inv) => {
    if (!inv || inv.units === 0) return '#ef4444';
    if (inv.isLowStock) return '#f59e0b';
    return '#00C9A7';
  };

  return (
    <div>
      {/* Summary strip */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Units', value: inventory.reduce((s, i) => s + i.units, 0), icon: 'bi-droplet-fill', color: '#dc2626' },
          { label: 'Blood Groups', value: inventory.length, icon: 'bi-grid-3x3-gap', color: '#2A7FFF' },
          { label: 'Low Stock', value: inventory.filter(i => i.isLowStock && !i.isOutOfStock).length, icon: 'bi-exclamation-circle', color: '#f59e0b' },
          { label: 'Out of Stock', value: inventory.filter(i => i.isOutOfStock).length, icon: 'bi-x-circle', color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <div className="card text-center py-3">
              <i className={`bi ${s.icon}`} style={{ fontSize: '1.5rem', color: s.color }} />
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        {BLOOD_GROUPS.map(group => {
          const inv = inventory.find(i => i.bloodGroup === group);
          const units = inv?.units ?? 0;
          const threshold = inv?.lowStockThreshold ?? 5;
          const isEditing = editing[group] !== undefined;
          const color = levelColor(inv);
          const pct = Math.min(units * 5, 100);

          return (
            <div key={group} className="col-6 col-md-4 col-lg-3">
              <div className="card text-center" style={{ borderTop: `4px solid ${color}`, position: 'relative' }}>
                {inv?.isOutOfStock && (
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>OUT</span>
                  </div>
                )}
                {inv?.isLowStock && !inv?.isOutOfStock && (
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 99, background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>LOW</span>
                  </div>
                )}
                <div className="card-body py-3">
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>{group}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color, margin: '8px 0' }}>
                    {isEditing ? (
                      <input type="number" min={0} className="form-control text-center fw-bold"
                        style={{ fontSize: '1.4rem', color }}
                        value={editing[group].units}
                        onChange={e => setEditing(ed => ({ ...ed, [group]: { ...ed[group], units: +e.target.value } }))}
                      />
                    ) : units}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>units available</div>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                  {isEditing && (
                    <div className="mb-2">
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Low stock alert at</label>
                      <input type="number" min={1} className="form-control form-control-sm text-center"
                        value={editing[group].threshold}
                        onChange={e => setEditing(ed => ({ ...ed, [group]: { ...ed[group], threshold: +e.target.value } }))}
                      />
                    </div>
                  )}
                  {!isEditing && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Alert threshold: {threshold} units
                    </div>
                  )}
                  {isAdmin && (
                    isEditing ? (
                      <div className="d-flex gap-1 justify-content-center">
                        <button className="btn btn-success btn-sm" disabled={saving === group} onClick={() => handleSave(group)}>
                          {saving === group ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check2" />}
                        </button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(e => { const n = { ...e }; delete n[group]; return n; })}>
                          <i className="bi bi-x" />
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-outline-primary btn-sm w-100"
                        onClick={() => setEditing(e => ({ ...e, [group]: { units, threshold } }))}>
                        <i className="bi bi-pencil me-1" />Update
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function BloodBank() {
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');
  const [inventory, setInventory] = useState([]);

  const isAdmin      = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const isPatient    = user?.role === 'patient';

  const loadInventory = useCallback(async () => {
    try {
      const r = await api.get('/blood/inventory');
      setInventory(r.data.inventory);
    } catch {}
  }, []);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  const tabs = [
    { key: 'requests',  label: 'Requests',  icon: 'bi-droplet-half' },
    { key: 'donors',    label: 'Donors',    icon: 'bi-person-heart' },
    { key: 'inventory', label: 'Inventory', icon: 'bi-box-seam' },
  ];

  const lowCount = inventory.filter(i => i.isLowStock).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#dc2626,#ef4444)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-droplet-fill text-white" />
            </span>
            Blood Bank
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Manage blood requests, donors, and inventory</p>
        </div>
      </div>

      {/* Global low stock banner — always visible */}
      <LowStockBanner inventory={inventory} />

      {/* Tab bar */}
      <div className="d-flex gap-1 mb-4" style={{ borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              background: 'none', border: 'none', padding: '0.6rem 1.25rem',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              color: tab === t.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s', position: 'relative',
            }}
          >
            <i className={`bi ${t.icon} me-2`} />{t.label}
            {t.key === 'inventory' && lowCount > 0 && (
              <span style={{ marginLeft: 6, background: '#f59e0b', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>
                {lowCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'requests'  && <RequestsTab isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} inventory={inventory} />}
      {tab === 'donors'    && <DonorsTab isAdmin={isAdmin} isPatient={isPatient} />}
      {tab === 'inventory' && <InventoryTab isAdmin={isAdmin} inventory={inventory} onRefresh={loadInventory} />}
    </div>
  );
}
