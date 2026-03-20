import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import PatientFormModal from '../components/PatientFormModal';
import PatientViewModal from '../components/PatientViewModal';
import { usePermissions } from '../context/PermissionsContext';

const Avatar = ({ name, size = 32 }) => {
  const initials = (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.35, fontWeight: 700,
    }}>
      {initials}
    </div>
  );
};

export default function Patients() {
  const { canDo } = usePermissions();
  const [patients, setPatients] = useState([]);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/patients', { params: { search, page, limit: 10 } });
      setPatients(res.data.patients);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleSaved = (savedPatient, isEdit) => {
    if (isEdit) {
      setPatients((prev) => prev.map((p) => (p._id === savedPatient._id ? { ...p, ...savedPatient } : p)));
    } else {
      setPatients((prev) => [savedPatient, ...prev]);
      setTotal((t) => t + 1);
    }
  };

  const openAdd  = ()  => { setSelected(null); setFormOpen(true); };
  const openEdit = (p) => { setSelected(p);    setFormOpen(true); };
  const openView = (p) => { setSelected(p);    setViewOpen(true); };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h4>Patients</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            {total} patient{total !== 1 ? 's' : ''} registered
          </p>
        </div>
        {canDo('patients', 'create') && (
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <i className="bi bi-person-plus me-1" />Add Patient
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="input-group">
            <span className="input-group-text" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRight: 'none' }}>
              <i className="bi bi-search" style={{ color: 'var(--text-muted)' }} />
            </span>
            <input
              className="form-control"
              style={{ borderLeft: 'none' }}
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button className="btn btn-outline-secondary" onClick={() => { setSearch(''); setPage(1); }}>
                <i className="bi bi-x" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? <Spinner /> : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age / Gender</th>
                  <th>Phone</th>
                  <th>Blood Group</th>
                  <th>Conditions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5" style={{ color: 'var(--text-light)' }}>
                      <i className="bi bi-people d-block mb-2" style={{ fontSize: '2rem' }} />
                      {search ? 'No patients match your search' : 'No patients yet — add one to get started'}
                    </td>
                  </tr>
                ) : patients.map((p) => (
                  <tr key={p._id}>
                    {/* Name + email */}
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar name={p.name} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Age / gender */}
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>{p.age ? p.age + ' yrs' : '—'}</div>
                      {p.gender && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {p.gender}
                        </div>
                      )}
                    </td>

                    {/* Phone */}
                    <td style={{ fontSize: '0.875rem' }}>{p.phone || '—'}</td>

                    {/* Blood group */}
                    <td>
                      {p.bloodGroup ? (
                        <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                          {p.bloodGroup}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>—</span>
                      )}
                    </td>

                    {/* Conditions */}
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {(p.chronicDiseases || []).slice(0, 2).map((d) => (
                          <span key={d} style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.68rem', fontWeight: 600, padding: '1px 7px', borderRadius: 99 }}>
                            {d}
                          </span>
                        ))}
                        {(p.chronicDiseases || []).length > 2 && (
                          <span style={{ background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, padding: '1px 7px', borderRadius: 99, border: '1px solid var(--border)' }}>
                            +{p.chronicDiseases.length - 2}
                          </span>
                        )}
                        {!(p.chronicDiseases || []).length && (
                          <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-primary" title="View Profile" onClick={() => openView(p)}>
                          <i className="bi bi-eye" />
                        </button>
                        {canDo('patients', 'edit') && (
                          <button className="btn btn-sm btn-outline-secondary" title="Edit Profile" onClick={() => openEdit(p)}>
                            <i className="bi bi-pencil" />
                          </button>
                        )}
                        {canDo('records', 'create') && (
                          <Link to={'/records/new?patient=' + p._id} className="btn btn-sm btn-outline-secondary" title="New Record">
                            <i className="bi bi-file-earmark-plus" />
                          </Link>
                        )}
                        {canDo('timeline', 'view') && (
                          <Link to={'/timeline/' + p._id} className="btn btn-sm btn-outline-secondary" title="Timeline">
                            <i className="bi bi-clock-history" />
                          </Link>
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

      {/* Modals */}
      <PatientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        patient={selected}
        onSaved={handleSaved}
      />
      <PatientViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        patient={selected}
        onEdit={(p) => { setSelected(p); setFormOpen(true); }}
      />
    </div>
  );
}
