import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/audit?page=${page}&limit=20`).then((r) => {
      setLogs(r.data.logs);
      setPages(r.data.pages);
      setTotal(r.data.total);
    }).finally(() => setLoading(false));
  }, [page]);

  const actionColor = (action) => {
    if (action.startsWith('CREATE')) return 'success';
    if (action.startsWith('VIEW')) return 'info';
    if (action.startsWith('UPDATE')) return 'warning';
    if (action.startsWith('DELETE')) return 'danger';
    return 'secondary';
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Audit Logs</h4>
        <span className="text-muted small">{total} total entries</span>
      </div>

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
                <tr><td colSpan={6} className="text-center text-muted py-3">No logs found</td></tr>
              ) : logs.map((log) => (
                <tr key={log._id}>
                  <td className="small">{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.user?.name || '—'}</td>
                  <td><span className="badge bg-secondary">{log.user?.role || '—'}</span></td>
                  <td><span className={`badge bg-${actionColor(log.action)}`}>{log.action}</span></td>
                  <td>{log.resource || '—'}</td>
                  <td className="small text-muted">{log.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} pages={pages} onPageChange={setPage} />
    </div>
  );
}
