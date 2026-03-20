import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';

const ACTION_TYPES = [
  'CREATE_RECORD', 'VIEW_RECORD', 'UPDATE_RECORD',
  'CREATE_VITALS', 'CREATE_APPOINTMENT', 'UPDATE_APPOINTMENT',
  'LOGIN', 'REGISTER',
];

const RESOURCES = ['Record', 'Vitals', 'Appointment', 'User'];

const actionColor = (action) => {
  if (!action) return 'secondary';
  if (action.startsWith('CREATE'))  return 'success';
  if (action.startsWith('VIEW'))    return 'info';
  if (action.startsWith('UPDATE'))  return 'warning';
  if (action.startsWith('DELETE'))  return 'danger';
  return 'secondary';
};

export default function AuditLogs() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [total, setTotal]     = useState(0);

  const [filters, setFilters] = useState({ action: '', resource: '', from: '', to: '' });
  const [applied, setApplied] = useState({});

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...applied };
      // remove empty keys
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const r = await api.get('/audit', { params });
      setLogs(r.data.logs);
      setPages(r.data.pages);
      setTotal(r.data.total);
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const applyFilters = () => { setApplied({ ...filters }); setPage(1); };
  const clearFilters = () => { setFilters({ action: '', resource: '', from: '', to: '' }); setApplied({}); setPage(1); };
  const hasFilters   = Object.values(applied).some(Boolean);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">Audit Logs</h4>
          <p className="mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {total} total entries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-sm-3">
              <label className="form-label">Action</label>
              <select className="form-select form-select-sm" value={filters.action}
                onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}>
                <option value="">All Actions</option>
                {ACTION_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="col-sm-2">
              <label className="form-label">Resource</label>
              <select className="form-select form-select-sm" value={filters.resource}
                onChange={(e) => setFilters((f) => ({ ...f, resource: e.target.value }))}>
                <option value="">All Resources</option>
                {RESOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-sm-2">
              <label className="form-label">From</label>
              <input type="date" className="form-control form-control-sm" value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
            </div>
            <div className="col-sm-2">
              <label className="form-label">To</label>
              <input type="date" className="form-control form-control-sm" value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
            </div>
            <div className="col-sm-3 d-flex gap-2">
              <button className="btn btn-primary btn-sm flex-fill" onClick={applyFilters}>
                <i className="bi bi-funnel me-1" />Apply
              </button>
              {hasFilters && (
                <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
                  <i className="bi bi-x" />
                </button>
              )}
            </div>
          </div>
          {hasFilters && (
            <div className="mt-2 d-flex flex-wrap gap-1">
              {applied.action   && <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>Action: {applied.action}</span>}
              {applied.resource && <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>Resource: {applied.resource}</span>}
              {applied.from     && <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>From: {applied.from}</span>}
              {applied.to       && <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>To: {applied.to}</span>}
            </div>
          )}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5" style={{ color: 'var(--text-light)' }}>
                      <i className="bi bi-shield-check d-block mb-2" style={{ fontSize: '2rem' }} />
                      No logs found
                    </td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log._id}>
                    <td className="small" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.user?.name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user?.email}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{log.user?.role || '—'}</span>
                    </td>
                    <td>
                      <span className={`badge bg-${actionColor(log.action)}`}>{log.action}</span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{log.resource || '—'}</td>
                    <td className="small text-muted">{log.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />
    </div>
  );
}
