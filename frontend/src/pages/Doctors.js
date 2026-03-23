import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import Spinner, { TableSkeleton } from '../components/Spinner';
import Pagination from '../components/Pagination';
import SearchFilterBar from '../components/SearchFilterBar';
import DoctorFormModal from '../components/DoctorFormModal';
import DoctorViewModal from '../components/DoctorViewModal';

const DOCTOR_FILTERS = [
  { key: 'specialization', label: 'Specialization', type: 'text', placeholder: 'e.g. Cardiology' },
  {
    key: 'sortBy', label: 'Sort By', type: 'select',
    options: [
      { value: 'name',       label: 'Name' },
      { value: 'experience', label: 'Experience' },
      { value: 'createdAt',  label: 'Date Joined' },
    ],
  },
  {
    key: 'sortOrder', label: 'Order', type: 'select',
    options: [{ value: 'asc', label: 'A → Z / Low → High' }, { value: 'desc', label: 'Z → A / High → Low' }],
  },
];

const INIT_FILTERS = { specialization: '', sortBy: 'name', sortOrder: 'asc' };

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

export default function Doctors() {
  const { user } = useAuth();
  const { canDo } = usePermissions();
  const [doctors, setDoctors]   = useState([]);
  const [search, setSearch]     = useState('');
  const [filters, setFilters]   = useState(INIT_FILTERS);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEditDoctor = (d) =>
    user?.role === 'admin' || user?.role === 'superadmin' ||
    (user?.role === 'doctor' && (user?._id === d._id || user?.id === d._id));

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search, page, limit: 12, ...filters };
      Object.keys(params).forEach(k => { if (params[k] === '') delete params[k]; });
      const res = await api.get('/users/doctors', { params });
      setDoctors(res.data.doctors);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [search, page, filters]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setFilters(INIT_FILTERS);
    setPage(1);
  };

  const handleSaved = (savedDoctor, isEdit) => {
    if (isEdit) setDoctors(prev => prev.map(d => d._id === savedDoctor._id ? { ...d, ...savedDoctor } : d));
    else setDoctors(prev => [savedDoctor, ...prev]);
  };

  const openAdd  = ()  => { setSelected(null); setFormOpen(true); };
  const openEdit = (d) => { setSelected(d);    setFormOpen(true); };
  const openView = (d) => { setSelected(d);    setViewOpen(true); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h4>Doctors</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            {total} doctor{total !== 1 ? 's' : ''} on staff
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'superadmin') && canDo('doctors', 'create') && (
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <i className="bi bi-person-plus me-1" />Add Doctor
          </button>
        )}
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, email or specialization…"
        filters={DOCTOR_FILTERS}
        values={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        resultCount={total}
        resultLabel="doctor"
      />

      {loading ? (
        <div className="row g-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="col-sm-6 col-xl-4">
              <div className="skeleton-card" style={{ height: 180 }}>
                <div className="d-flex gap-3 mb-3">
                  <div className="skeleton skeleton-circle" style={{ width: 48, height: 48 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-title mb-2" style={{ width: '70%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                  </div>
                </div>
                <div className="skeleton skeleton-text mb-2" style={{ width: '60%' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        doctors.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5" style={{ color: 'var(--text-light)' }}>
              <i className="bi bi-person-badge d-block mb-2" style={{ fontSize: '2.5rem' }} />
              {search ? 'No doctors match your search' : 'No doctors yet'}
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {doctors.map(d => {
              const isOwn   = user?._id === d._id || user?.id === d._id;
              const canEdit = canEditDoctor(d) && canDo('doctors', 'edit');
              return (
                <div key={d._id} className="col-sm-6 col-xl-4">
                  <div className="card h-100 doctor-card">
                    <div className="card-body">
                      <div className="d-flex align-items-start gap-3 mb-3">
                        <Avatar name={d.name} size={48} />
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {d.name}
                            {isOwn && (
                              <span style={{ marginLeft: 6, fontSize: '0.65rem', fontWeight: 700, background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 7px', borderRadius: 99 }}>
                                You
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.email}</div>
                          {d.specialization && (
                            <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', fontSize: '0.68rem', fontWeight: 600, padding: '1px 8px', borderRadius: 99, display: 'inline-block', marginTop: 4 }}>
                              {d.specialization}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }} className="d-flex flex-column gap-1 mb-3">
                        {d.phone && (
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-telephone" style={{ color: 'var(--primary)', width: 14 }} />{d.phone}
                          </div>
                        )}
                        {d.licenseNumber && (
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-card-text" style={{ color: 'var(--secondary-dark)', width: 14 }} />{d.licenseNumber}
                          </div>
                        )}
                        {d.experience && (
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-briefcase" style={{ color: '#d97706', width: 14 }} />{d.experience} yrs experience
                          </div>
                        )}
                      </div>

                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => openView(d)}>
                          <i className="bi bi-eye me-1" />View
                        </button>
                        {canEdit && (
                          <button className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => openEdit(d)}>
                            <i className="bi bi-pencil me-1" />Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <div className="mt-3">
        <Pagination page={page} pages={pages} onPageChange={setPage} />
      </div>

      <DoctorFormModal open={formOpen} onClose={() => setFormOpen(false)} doctor={selected} onSaved={handleSaved} />
      <DoctorViewModal open={viewOpen} onClose={() => setViewOpen(false)} doctor={selected}
        canEdit={selected ? canEditDoctor(selected) : false}
        onEdit={d => { setSelected(d); setFormOpen(true); }} />
    </div>
  );
}
