import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Spinner, { TableSkeleton } from '../components/Spinner';
import Pagination from '../components/Pagination';
import SearchFilterBar from '../components/SearchFilterBar';
import PatientFormModal from '../components/PatientFormModal';
import PatientViewModal from '../components/PatientViewModal';
import { usePermissions } from '../context/PermissionsContext';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const PATIENT_FILTERS = [
  {
    key: 'bloodGroup', label: 'Blood Group', type: 'select',
    options: BLOOD_GROUPS.map(g => ({ value: g, label: g })),
  },
  {
    key: 'gender', label: 'Gender', type: 'select',
    options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }],
  },
  { key: 'ageMin',    label: 'Age (min)',      type: 'number', placeholder: 'e.g. 18', min: 0, max: 120 },
  { key: 'ageMax',    label: 'Age (max)',      type: 'number', placeholder: 'e.g. 60', min: 0, max: 120 },
  { key: 'dateFrom',  label: 'Registered From', type: 'date' },
  { key: 'dateTo',    label: 'Registered To',   type: 'date' },
  {
    key: 'sortBy', label: 'Sort By', type: 'select',
    options: [
      { value: 'createdAt', label: 'Registration Date' },
      { value: 'name',      label: 'Name' },
      { value: 'age',       label: 'Age' },
    ],
  },
  {
    key: 'sortOrder', label: 'Order', type: 'select',
    options: [{ value: 'desc', label: 'Newest First' }, { value: 'asc', label: 'Oldest First' }],
  },
];

const Avatar = ({ name, size = 32 }) => {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.35, fontWeight: 700,
    }}>{initials}</div>
  );
};

const INIT_FILTERS = { bloodGroup: '', gender: '', ageMin: '', ageMax: '', dateFrom: '', dateTo: '', sortBy: 'createdAt', sortOrder: 'desc' };

export default function Patients() {
  const { canDo } = usePermissions();
  const [patients, setPatients] = useState([]);
  const [search, setSearch]     = useState('');
  const [filters, setFilters]   = useState(INIT_FILTERS);
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
      const params = { search, page, limit: 10, ...filters };
      // strip empty values
      Object.keys(params).forEach(k => { if (params[k] === '') delete params[k]; });
      const res = await api.get('/users/patients', { params });
      setPatients(res.data.patients);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [search, page, filters]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setFilters(INIT_FILTERS);
    setPage(1);
  };

  const handleSaved = (savedPatient, isEdit) => {
    if (isEdit) setPatients(prev => prev.map(p => p._id === savedPatient._id ? { ...p, ...savedPatient } : p));
    else { setPatients(prev => [savedPatient, ...prev]); setTotal(t => t + 1); }
  };

  const openAdd  = ()  => { setSelected(null); setFormOpen(true); };
  const openEdit = (p) => { setSelected(p);    setFormOpen(true); };
  const openView = (p) => { setSelected(p);    setViewOpen(true); };

  return (
    <div>
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

      <SearchFilterBar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, email or phone…"
        filters={PATIENT_FILTERS}
        values={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        resultCount={total}
        resultLabel="patient"
      />

      {loading ? <TableSkeleton rows={6} cols={7} /> : (
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
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5" style={{ color: 'var(--text-light)' }}>
                      <i className="bi bi-people d-block mb-2" style={{ fontSize: '2rem' }} />
                      {search ? 'No patients match your search' : 'No patients found'}
                    </td>
                  </tr>
                ) : patients.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar name={p.name} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>{p.age ? p.age + ' yrs' : '—'}</div>
                      {p.gender && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.gender}</div>}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{p.phone || '—'}</td>
                    <td>
                      {p.bloodGroup ? (
                        <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                          {p.bloodGroup}
                        </span>
                      ) : <span style={{ color: 'var(--text-light)' }}>—</span>}
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {(p.chronicDiseases || []).slice(0, 2).map(d => (
                          <span key={d} style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.68rem', fontWeight: 600, padding: '1px 7px', borderRadius: 99 }}>{d}</span>
                        ))}
                        {(p.chronicDiseases || []).length > 2 && (
                          <span style={{ background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, padding: '1px 7px', borderRadius: 99, border: '1px solid var(--border)' }}>
                            +{p.chronicDiseases.length - 2}
                          </span>
                        )}
                        {!(p.chronicDiseases || []).length && <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
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
                          <Link to={'/app/records/new?patient=' + p._id} className="btn btn-sm btn-outline-secondary" title="New Record">
                            <i className="bi bi-file-earmark-plus" />
                          </Link>
                        )}
                        {canDo('timeline', 'view') && (
                          <Link to={'/app/timeline/' + p._id} className="btn btn-sm btn-outline-secondary" title="Timeline">
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

      <PatientFormModal open={formOpen} onClose={() => setFormOpen(false)} patient={selected} onSaved={handleSaved} />
      <PatientViewModal open={viewOpen} onClose={() => setViewOpen(false)} patient={selected}
        onEdit={p => { setSelected(p); setFormOpen(true); }} />
    </div>
  );
}
