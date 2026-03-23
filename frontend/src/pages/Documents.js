import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const CATEGORIES = ['general', 'lab_report', 'prescription', 'imaging', 'discharge', 'insurance', 'other'];
const CAT_META = {
  general:      { label: 'General',      icon: 'bi-file-earmark',        color: '#6B7280' },
  lab_report:   { label: 'Lab Report',   icon: 'bi-clipboard2-pulse',    color: '#2A7FFF' },
  prescription: { label: 'Prescription', icon: 'bi-capsule',             color: '#00C9A7' },
  imaging:      { label: 'Imaging',      icon: 'bi-image',               color: '#7c3aed' },
  discharge:    { label: 'Discharge',    icon: 'bi-hospital',            color: '#d97706' },
  insurance:    { label: 'Insurance',    icon: 'bi-shield-check',        color: '#0891b2' },
  other:        { label: 'Other',        icon: 'bi-paperclip',           color: '#9CA3AF' },
};

function fileIcon(fileType) {
  if (!fileType) return 'bi-file-earmark';
  if (fileType.includes('pdf'))   return 'bi-file-earmark-pdf';
  if (fileType.includes('image')) return 'bi-file-earmark-image';
  return 'bi-file-earmark';
}

function fileIconColor(fileType) {
  if (!fileType) return '#6B7280';
  if (fileType.includes('pdf'))   return '#ef4444';
  if (fileType.includes('image')) return '#2A7FFF';
  return '#6B7280';
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Preview Modal ────────────────────────────────────────────────
function PreviewModal({ doc, onClose }) {
  const url = `${BASE_URL}${doc.fileUrl}`;
  const isPdf   = doc.fileType?.includes('pdf');
  const isImage = doc.fileType?.includes('image');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 16, width: '90vw', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className={`bi ${fileIcon(doc.fileType)}`} style={{ fontSize: '1.3rem', color: fileIconColor(doc.fileType) }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              {CAT_META[doc.category]?.label} · {formatSize(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString()}
            </div>
          </div>
          <a href={url} download={doc.filename}
            style={{ background: '#2A7FFF', color: '#fff', border: 'none', borderRadius: 8, padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-download" />Download
          </a>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: '1rem' }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          {isPdf && (
            <iframe src={url} title={doc.filename} style={{ width: '100%', height: '75vh', border: 'none' }} />
          )}
          {isImage && (
            <img src={url} alt={doc.filename} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8 }} />
          )}
          {!isPdf && !isImage && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
              <i className="bi bi-file-earmark" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }} />
              <p>Preview not available for this file type.</p>
              <a href={url} download={doc.filename} className="btn btn-primary btn-sm">
                <i className="bi bi-download me-1" />Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Upload Panel ─────────────────────────────────────────────────
function UploadPanel({ patients, onUploaded }) {
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  const fileRef = useRef();

  const [form, setForm] = useState({ patientId: isPatient ? user._id : '', category: 'general', description: '' });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => {
      const ok = /\.(pdf|jpg|jpeg|png|gif)$/i.test(f.name);
      if (!ok) toast.error(`${f.name} — only PDF/images allowed`);
      return ok;
    });
    setFiles(prev => [...prev, ...valid]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!files.length) return toast.error('Select at least one file');
    if (!form.patientId) return toast.error('Select a patient');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('patientId', form.patientId);
      fd.append('category', form.category);
      fd.append('description', form.description);
      files.forEach(f => fd.append('files', f));
      await api.post('/documents/upload', fd);
      toast.success(`${files.length} file(s) uploaded`);
      setFiles([]);
      fileRef.current.value = '';
      onUploaded(form.patientId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div className="card mb-4">
      <div className="card-header d-flex align-items-center gap-2">
        <i className="bi bi-cloud-upload" style={{ color: '#2A7FFF' }} />
        <span>Upload Documents</span>
      </div>
      <div className="card-body">
        <form onSubmit={submit}>
          <div className="row g-3">
            {!isPatient && (
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B7280' }}>Patient *</label>
                <select className="form-select form-select-sm" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required>
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B7280' }}>Category</label>
              <select className="form-select form-select-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c].label}</option>)}
              </select>
            </div>
            <div className="col-md-5">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B7280' }}>Description</label>
              <input className="form-control form-control-sm" placeholder="Optional note..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Drop zone */}
            <div className="col-12">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#2A7FFF' : '#E5EAF0'}`,
                  borderRadius: 12, padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? '#f0f7ff' : '#f8fafc', transition: 'all 0.18s',
                }}>
                <i className="bi bi-cloud-arrow-up" style={{ fontSize: '2rem', color: dragOver ? '#2A7FFF' : '#9CA3AF', display: 'block', marginBottom: 8 }} />
                <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Drop files here or click to browse</div>
                <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 4 }}>PDF, JPG, PNG, GIF · Max 10MB each · Up to 10 files</div>
                <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              </div>
            </div>

            {/* Selected files list */}
            {files.length > 0 && (
              <div className="col-12">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '4px 10px', fontSize: '0.8rem' }}>
                      <i className={`bi ${fileIcon(f.type)}`} style={{ color: fileIconColor(f.type) }} />
                      <span style={{ color: '#1d4ed8', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <span style={{ color: '#6B7280' }}>({formatSize(f.size)})</span>
                      <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                        <i className="bi bi-x" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="col-12">
              <button type="submit" disabled={uploading || !files.length} className="btn btn-primary btn-sm">
                {uploading
                  ? <><span className="spinner-border spinner-border-sm me-1" />Uploading...</>
                  : <><i className="bi bi-cloud-upload me-1" />Upload {files.length > 0 ? `(${files.length})` : ''}</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Document Card ────────────────────────────────────────────────
function DocCard({ doc, canDelete, onPreview, onDelete }) {
  const catMeta = CAT_META[doc.category] || CAT_META.other;
  return (
    <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 14, overflow: 'hidden', transition: 'all 0.18s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>

      {/* Thumbnail / icon area */}
      <div style={{ height: 120, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}
        onClick={() => onPreview(doc)}>
        {doc.fileType?.includes('image')
          ? <img src={`${BASE_URL}${doc.fileUrl}`} alt={doc.filename}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }} />
          : <i className={`bi ${fileIcon(doc.fileType)}`} style={{ fontSize: '2.5rem', color: fileIconColor(doc.fileType) }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}>
          <i className="bi bi-eye-fill" style={{ color: '#fff', fontSize: '1.3rem', opacity: 0, transition: 'opacity 0.18s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.filename}>
          {doc.filename}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: catMeta.color + '18', color: catMeta.color, fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <i className={`bi ${catMeta.icon} me-1`} />{catMeta.label}
          </span>
          {doc.fileSize && <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{formatSize(doc.fileSize)}</span>}
        </div>
        {doc.description && (
          <div style={{ fontSize: '0.75rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.description}</div>
        )}
        {doc.recordDiagnosis && (
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
            <i className="bi bi-link-45deg me-1" />Record: {doc.recordDiagnosis}
          </div>
        )}
        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: 'auto' }}>
          {new Date(doc.uploadedAt).toLocaleDateString()}
          {doc.doctor?.name && ` · Dr. ${doc.doctor.name}`}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 6 }}>
        <button onClick={() => onPreview(doc)} style={{ flex: 1, background: '#f0f7ff', color: '#2A7FFF', border: 'none', borderRadius: 7, padding: '0.35rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
          <i className="bi bi-eye me-1" />Preview
        </button>
        <a href={`${BASE_URL}${doc.fileUrl}`} download={doc.filename}
          style={{ flex: 1, background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: 7, padding: '0.35rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
          <i className="bi bi-download me-1" />Download
        </a>
        {canDelete && (
          <button onClick={() => onDelete(doc)} style={{ background: '#fff0f0', color: '#ef4444', border: 'none', borderRadius: 7, padding: '0.35rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer' }}>
            <i className="bi bi-trash" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function Documents() {
  const { user } = useAuth();
  const isPatient  = user?.role === 'patient';
  const isStaff    = ['doctor', 'admin', 'superadmin'].includes(user?.role);

  const [patients, setPatients]       = useState([]);
  const [selectedPatient, setSelected] = useState(isPatient ? user._id : '');
  const [filterCat, setFilterCat]     = useState('');
  const [docs, setDocs]               = useState([]);
  const [total, setTotal]             = useState(0);
  const [pages, setPages]             = useState(1);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [preview, setPreview]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);

  // Load patients list for staff
  useEffect(() => {
    if (isStaff) {
      api.get('/users/patients?limit=200').then(r => setPatients(r.data.patients)).catch(() => {});
    }
  }, [isStaff]);

  const fetchDocs = useCallback(async (pid, cat, pg) => {
    if (!pid) return;
    setLoading(true);
    try {
      const params = { patientId: pid, page: pg, limit: 12 };
      if (cat) params.category = cat;
      const r = await api.get('/documents', { params });
      setDocs(r.data.documents);
      setTotal(r.data.total);
      setPages(r.data.pages);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchDocs(selectedPatient, filterCat, page);
  }, [selectedPatient, filterCat, page, fetchDocs]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${deleteTarget._id}?patientId=${selectedPatient}`);
      toast.success('Document deleted');
      setDeleteTarget(null);
      fetchDocs(selectedPatient, filterCat, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setDeleting(false); }
  };

  // Category counts
  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c] = docs.filter(d => d.category === c).length;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <h4>Documents</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            {total} document{total !== 1 ? 's' : ''} {selectedPatient && !isPatient ? 'for selected patient' : ''}
          </p>
        </div>
      </div>

      {/* Upload panel */}
      <UploadPanel
        patients={patients}
        onUploaded={(pid) => { setSelected(pid); setPage(1); fetchDocs(pid, filterCat, 1); }}
      />

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-3 align-items-end">
            {isStaff && (
              <div className="col-md-4">
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B7280' }}>Patient</label>
                <select className="form-select form-select-sm" value={selectedPatient} onChange={e => { setSelected(e.target.value); setPage(1); }}>
                  <option value="">Select patient to view documents</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div className="col-md-4">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B7280' }}>Category</label>
              <select className="form-select form-select-sm" value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c].label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Category pills */}
      {docs.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <button onClick={() => setFilterCat('')}
            style={{ background: !filterCat ? '#1F2937' : '#f3f4f6', color: !filterCat ? '#fff' : '#6B7280', border: 'none', borderRadius: 99, padding: '4px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
            All ({total})
          </button>
          {CATEGORIES.filter(c => catCounts[c] > 0).map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              style={{ background: filterCat === c ? CAT_META[c].color : '#f3f4f6', color: filterCat === c ? '#fff' : '#6B7280', border: 'none', borderRadius: 99, padding: '4px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
              <i className={`bi ${CAT_META[c].icon} me-1`} />{CAT_META[c].label} ({catCounts[c]})
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? <Spinner /> : !selectedPatient && isStaff ? (
        <div className="card">
          <div className="card-body text-center py-5" style={{ color: 'var(--text-muted)' }}>
            <i className="bi bi-person-circle d-block mb-2" style={{ fontSize: '2.5rem' }} />
            Select a patient to view their documents
          </div>
        </div>
      ) : docs.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5" style={{ color: 'var(--text-muted)' }}>
            <i className="bi bi-folder2-open d-block mb-2" style={{ fontSize: '2.5rem' }} />
            No documents found. Upload some files above.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {docs.map(doc => (
              <DocCard
                key={doc._id}
                doc={doc}
                canDelete={isStaff}
                onPreview={setPreview}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
          {pages > 1 && <Pagination page={page} pages={pages} onPageChange={setPage} />}
        </>
      )}

      {/* Preview modal */}
      {preview && <PreviewModal doc={preview} onClose={() => setPreview(null)} />}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setDeleteTarget(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 420, width: '90%', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <i className="bi bi-trash" style={{ fontSize: '1.4rem', color: '#ef4444' }} />
            </div>
            <h5 style={{ textAlign: 'center', marginBottom: 8 }}>Delete Document?</h5>
            <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              <strong>{deleteTarget.filename}</strong> will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '0.65rem', border: '1.5px solid #E5EAF0', borderRadius: 10, background: '#fff', color: '#6B7280', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '0.65rem', border: 'none', borderRadius: 10, background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                {deleting ? <span className="spinner-border spinner-border-sm" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
