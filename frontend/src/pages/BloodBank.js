import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import BillingCard from '../components/BillingCard';
import BillingConfigModal from '../components/BillingConfigModal';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const urgencyColor = { normal: 'badge-status-confirmed', urgent: 'badge-status-pending', critical: 'badge-status-cancelled' };
const statusColor  = { pending: 'badge-status-pending', approved: 'badge-status-confirmed', rejected: 'badge-status-cancelled', fulfilled: 'badge-status-completed' };

function BloodGroupBadge({ group }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 99,
      background: '#fff0f0', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem',
      border: '1px solid #fecaca',
    }}>{group}</span>
  );
}

// ── Request Modal ────────────────────────────────────────────────
function RequestModal({ onClose, onSaved }) {
  const { user } = useAuth();
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
              <div className="col-6">
                <label className="form-label">Full Name *</label>
                <input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label">Phone *</label>
                <input className="form-control" required value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label">Blood Group *</label>
                <select className="form-select" required value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Location *</label>
                <input className="form-control" required value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label">Total Blood Donated (units)</label>
                <input type="number" className="form-control" min={0} value={form.totalDonatedUnits} onChange={e => set('totalDonatedUnits', +e.target.value)} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>Added to inventory automatically</div>
              </div>
              <div className="col-6">
                <label className="form-label">Last Donation Date</label>
                <input type="date" className="form-control" value={form.lastDonationDate} onChange={e => set('lastDonationDate', e.target.value)} />
              </div>
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

// ── Suggested Donors Modal ───────────────────────────────────────
function SuggestedDonorsModal({ requestId, bloodGroup, onClose }) {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/blood/requests/${requestId}/donors`)
      .then(r => setDonors(r.data.donors))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [requestId]);

  return (
    <div className="ehr-modal-overlay" onClick={onClose}>
      <div className="ehr-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="ehr-modal-header">
          <span className="ehr-modal-title"><i className="bi bi-people me-2 text-danger" />Suggested Donors for {bloodGroup}</span>
          <button className="ehr-modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <div className="ehr-modal-body">
          {loading ? (
            <div className="text-center py-4"><span className="spinner-border" /></div>
          ) : donors.length === 0 ? (
            <div className="text-center py-4 text-muted"><i className="bi bi-person-x d-block mb-2" style={{ fontSize: '2rem' }} />No eligible donors found</div>
          ) : donors.map(d => (
            <div key={d._id} className="d-flex align-items-center gap-3 p-3 mb-2 rounded" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                {d.name[0].toUpperCase()}
              </div>
              <div className="flex-grow-1">
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.name}</div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{d.phone} · {d.location}</div>
              </div>
              <BloodGroupBadge group={d.bloodGroup} />
              {d.isEligible && <span className="badge badge-status-completed">Eligible</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Requests Tab ─────────────────────────────────────────────────
function RequestsTab({ isAdmin, isSuperAdmin }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [suggestFor, setSuggestFor] = useState(null);
  const [filters, setFilters] = useState({ status: '', bloodGroup: '' });
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');

  const loadInventory = async () => {
    try {
      const r = await api.get('/blood/inventory');
      const map = {};
      r.data.inventory.forEach(i => { map[i.bloodGroup] = i.units; });
      setInventory(map);
    } catch {}
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup;
      const [reqRes] = await Promise.all([
        api.get('/blood/requests', { params }),
        loadInventory(),
      ]);
      setRequests(reqRes.data.requests);
    } catch {}
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, status) => {
    setActionLoading(id + status);
    setActionError('');
    try {
      await api.put(`/blood/requests/${id}`, { status });
      await load();
    } catch (ex) {
      setActionError(ex.response?.data?.message || 'Action failed');
    }
    setActionLoading('');
  };

  const stockColor = (units) => {
    if (units === 0) return '#ef4444';
    if (units < 5)  return '#f59e0b';
    return '#00C9A7';
  };

  return (
    <div>
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
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg me-1" />New Request
        </button>
        {isSuperAdmin && (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPricingModal(true)}>
            <i className="bi bi-gear me-1" />Pricing
          </button>
        )}
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
                  <th>Hospital</th>
                  <th>Status</th>
                  <th>Billing</th>
                  <th>Date</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const available = inventory[r.bloodGroup] ?? 0;
                  const hasStock  = available >= r.units;
                  return (
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.requestedBy?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.requestedBy?.role}</div>
                      </td>
                      <td>
                        <BloodGroupBadge group={r.bloodGroup} />
                        {isAdmin && r.status === 'pending' && (
                          <div style={{ fontSize: '0.7rem', marginTop: 3, color: stockColor(available), fontWeight: 600 }}>
                            <i className="bi bi-box-seam me-1" />{available} avail.
                            {!hasStock && <span className="ms-1 text-danger">(low)</span>}
                          </div>
                        )}
                      </td>
                      <td>{r.units}</td>
                      <td><span className={`badge ${urgencyColor[r.urgency]}`}>{r.urgency}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{r.hospital}<br /><span style={{ color: 'var(--text-muted)' }}>{r.location}</span></td>
                      <td><span className={`badge ${statusColor[r.status]}`}>{r.status}</span></td>
                      <td>
                        <BillingCard
                          type="blood"
                          item={r}
                          canPay={
                            user?.role === 'patient'
                              ? r.requestedBy?._id === user?._id || r.patient?._id === user?._id
                              : isAdmin
                          }
                          onPaid={load}
                        />
                        {r.status !== 'approved' && r.status !== 'fulfilled' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      {isAdmin && (
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-outline-info btn-sm" title="Suggested Donors" onClick={() => setSuggestFor(r)}>
                              <i className="bi bi-people" />
                            </button>
                            {r.status === 'pending' && (
                              <>
                                <button
                                  className="btn btn-outline-success btn-sm"
                                  disabled={!!actionLoading || !hasStock}
                                  title={!hasStock ? `Only ${available} unit(s) available` : 'Approve'}
                                  onClick={() => handleAction(r._id, 'approved')}
                                >
                                  {actionLoading === r._id+'approved'
                                    ? <span className="spinner-border spinner-border-sm" />
                                    : <i className="bi bi-check2" />}
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  disabled={!!actionLoading}
                                  title="Reject"
                                  onClick={() => handleAction(r._id, 'rejected')}
                                >
                                  {actionLoading === r._id+'rejected'
                                    ? <span className="spinner-border spinner-border-sm" />
                                    : <i className="bi bi-x" />}
                                </button>
                              </>
                            )}
                            {r.status === 'approved' && (
                              <>
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  disabled={!!actionLoading}
                                  title="Mark Fulfilled"
                                  onClick={() => handleAction(r._id, 'fulfilled')}
                                >
                                  {actionLoading === r._id+'fulfilled'
                                    ? <span className="spinner-border spinner-border-sm" />
                                    : <><i className="bi bi-check2-all me-1" />Fulfill</>}
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  disabled={!!actionLoading}
                                  title="Reject (restores stock)"
                                  onClick={() => handleAction(r._id, 'rejected')}
                                >
                                  {actionLoading === r._id+'rejected'
                                    ? <span className="spinner-border spinner-border-sm" />
                                    : <i className="bi bi-x" />}
                                </button>
                              </>
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
      {suggestFor && <SuggestedDonorsModal requestId={suggestFor._id} bloodGroup={suggestFor.bloodGroup} onClose={() => setSuggestFor(null)} />}
      {showPricingModal && <BillingConfigModal type="blood" onClose={() => setShowPricingModal(false)} />}
    </div>
  );
}

// ── Donors Tab ───────────────────────────────────────────────────
const LIMIT = 10;

function DonorsTab({ isAdmin }) {
  const [donors, setDonors] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDonor, setEditDonor] = useState(null);
  const [filters, setFilters] = useState({ bloodGroup: '', location: '', available: '', search: '' });

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT };
      if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup;
      if (filters.location)   params.location   = filters.location;
      if (filters.available)  params.available  = filters.available;
      if (filters.search)     params.search     = filters.search;
      const r = await api.get('/blood/donors', { params });
      setDonors(r.data.donors);
      setTotal(r.data.total);
      setPages(r.data.pages);
    } catch {}
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { setPage(1); }, [filters]);
  useEffect(() => { load(page); }, [page, filters]); // eslint-disable-line

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this donor? Their donated units will be deducted from inventory.')) return;
    try { await api.delete(`/blood/donors/${id}`); load(page); } catch {}
  };

  const handleToggle = async (donor) => {
    try { await api.put(`/blood/donors/${donor._id}`, { isAvailable: !donor.isAvailable }); load(page); } catch {}
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap">
          <div className="input-group input-group-sm" style={{ width: 200 }}>
            <span className="input-group-text"><i className="bi bi-search" /></span>
            <input className="form-control" placeholder="Search by name…" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          </div>
          <select className="form-select form-select-sm" style={{ width: 130 }} value={filters.bloodGroup} onChange={e => setFilters(f => ({ ...f, bloodGroup: e.target.value }))}>
            <option value="">All Groups</option>
            {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
          <input className="form-control form-control-sm" style={{ width: 150 }} placeholder="Location…" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} />
          <select className="form-select form-select-sm" style={{ width: 140 }} value={filters.available} onChange={e => setFilters(f => ({ ...f, available: e.target.value }))}>
            <option value="">All Donors</option>
            <option value="true">Available Only</option>
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditDonor(null); setShowModal(true); }}>
          <i className="bi bi-person-plus me-1" />Register Donor
        </button>
      </div>

      {/* Table */}
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
                  <th>#</th>
                  <th>Name</th>
                  <th>Blood Group</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Donated (units)</th>
                  <th>Last Donation</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                        <button className="btn btn-outline-secondary btn-sm" title="Toggle availability" onClick={() => handleToggle(d)}>
                          <i className={`bi bi-toggle-${d.isAvailable ? 'on text-success' : 'off'}`} />
                        </button>
                        <button className="btn btn-outline-primary btn-sm" onClick={() => { setEditDonor(d); setShowModal(true); }}>
                          <i className="bi bi-pencil" />
                        </button>
                        {isAdmin && (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(d._id)}>
                            <i className="bi bi-trash" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="d-flex align-items-center justify-content-between px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </span>
              <div className="d-flex gap-1">
                <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <i className="bi bi-chevron-left" />
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="btn btn-outline-secondary btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <DonorModal
          donor={editDonor}
          onClose={() => { setShowModal(false); setEditDonor(null); }}
          onSaved={() => { setShowModal(false); setEditDonor(null); load(page); }}
        />
      )}
    </div>
  );
}

// ── Inventory Tab ────────────────────────────────────────────────
function InventoryTab({ isAdmin }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/blood/inventory'); setInventory(r.data.inventory); }
    catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (bloodGroup) => {
    setSaving(bloodGroup);
    try {
      await api.put(`/blood/inventory/${encodeURIComponent(bloodGroup)}`, { units: editing[bloodGroup] });
      setEditing(e => { const n = { ...e }; delete n[bloodGroup]; return n; });
      load();
    } catch {}
    setSaving('');
  };

  const levelColor = (units) => {
    if (units === 0) return '#ef4444';
    if (units < 5) return '#f59e0b';
    return '#00C9A7';
  };

  if (loading) return <div className="text-center py-5"><span className="spinner-border" /></div>;

  return (
    <div className="row g-3">
      {BLOOD_GROUPS.map(group => {
        const inv = inventory.find(i => i.bloodGroup === group);
        const units = inv?.units ?? 0;
        const isEditing = editing[group] !== undefined;
        return (
          <div key={group} className="col-6 col-md-4 col-lg-3">
            <div className="card text-center" style={{ borderTop: `4px solid ${levelColor(units)}` }}>
              <div className="card-body py-3">
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>{group}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: levelColor(units), margin: '8px 0' }}>
                  {isEditing ? (
                    <input
                      type="number" min={0}
                      className="form-control text-center fw-bold"
                      style={{ fontSize: '1.4rem', color: levelColor(editing[group] ?? units) }}
                      value={editing[group]}
                      onChange={e => setEditing(ed => ({ ...ed, [group]: +e.target.value }))}
                    />
                  ) : units}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  units available
                  {units === 0 && <span className="ms-1 badge badge-status-cancelled">Out of Stock</span>}
                  {units > 0 && units < 5 && <span className="ms-1 badge badge-status-pending">Low Stock</span>}
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${Math.min(units * 5, 100)}%`, background: levelColor(units), borderRadius: 99, transition: 'width 0.4s' }} />
                </div>
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
                    <button className="btn btn-outline-primary btn-sm w-100" onClick={() => setEditing(e => ({ ...e, [group]: units }))}>
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
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function BloodBank() {
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');
  const isAdmin      = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  const tabs = [
    { key: 'requests', label: 'Requests', icon: 'bi-droplet-half' },
    { key: 'donors',   label: 'Donors',   icon: 'bi-person-heart' },
    { key: 'inventory',label: 'Inventory',icon: 'bi-box-seam' },
  ];

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

      {/* Tab bar */}
      <div className="d-flex gap-1 mb-4" style={{ borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'none', border: 'none', padding: '0.6rem 1.25rem',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              color: tab === t.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s',
            }}
          >
            <i className={`bi ${t.icon} me-2`} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'requests'  && <RequestsTab isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />}
      {tab === 'donors'    && <DonorsTab isAdmin={isAdmin} />}
      {tab === 'inventory' && <InventoryTab isAdmin={isAdmin} />}
    </div>
  );
}
