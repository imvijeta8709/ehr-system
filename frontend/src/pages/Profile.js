import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

/* ── Tag input (edit modal) ── */
function TagInput({ label, values = [], onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  const remove = (item) => onChange(values.filter((x) => x !== item));
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="d-flex gap-2 mb-1">
        <input className="form-control form-control-sm" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Type and press Enter" />
        <button type="button" className="btn btn-sm btn-outline-primary px-3" onClick={add}>Add</button>
      </div>
      <div className="d-flex flex-wrap gap-1 mt-1">
        {values.map((v) => (
          <span key={v} className="badge d-flex align-items-center gap-1"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 500, padding: '4px 8px' }}>
            {v}
            <i className="bi bi-x" style={{ cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => remove(v)} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Edit Modal ── */
function EditProfileModal({ user, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    age: user?.age || '',
    gender: user?.gender || '',
    bloodGroup: user?.bloodGroup || '',
    emergencyContact: user?.emergencyContact || '',
    specialization: user?.specialization || '',
    licenseNumber: user?.licenseNumber || '',
    experience: user?.experience || '',
    allergies: user?.allergies || [],
    chronicDiseases: user?.chronicDiseases || [],
    pastSurgeries: user?.pastSurgeries || [],
    currentMedications: user?.currentMedications || [],
    familyHistory: user?.familyHistory || '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setArr = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      const res = await api.put(`/users/${user._id || user.id}`, form);
      toast.success('Profile updated successfully');
      onSaved(res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ehr-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ehr-modal" style={{ maxWidth: 620 }}>
        <div className="ehr-modal-header">
          <h5 className="ehr-modal-title">
            <i className="bi bi-pencil-square me-2" style={{ color: 'var(--primary)' }} />
            Edit Profile
          </h5>
          <button className="ehr-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg" style={{ fontSize: '0.85rem' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="ehr-modal-body">
            <div className="modal-section-label">
              <i className="bi bi-person" /> Basic Info
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Full Name *</label>
                <input className="form-control" value={form.name} onChange={set('name')} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={set('phone')} placeholder="+1 234 567 8900" />
              </div>
              <div className="col-12">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.address} onChange={set('address')} placeholder="123 Main St, City" />
              </div>
            </div>

            {user?.role === 'patient' && (
              <>
                <div className="modal-section-label">
                  <i className="bi bi-heart-pulse" /> Health Details
                </div>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label">Age</label>
                    <input type="number" className="form-control" value={form.age} onChange={set('age')} min={0} max={150} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={form.gender} onChange={set('gender')}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Blood Group</label>
                    <select className="form-select" value={form.bloodGroup} onChange={set('bloodGroup')}>
                      <option value="">Select</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Emergency Contact</label>
                    <input className="form-control" value={form.emergencyContact} onChange={set('emergencyContact')} />
                  </div>
                </div>

                <div className="modal-section-label">
                  <i className="bi bi-clipboard2-pulse" /> Medical History
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <TagInput label="Allergies" values={form.allergies} onChange={setArr('allergies')} />
                  </div>
                  <div className="col-md-6">
                    <TagInput label="Chronic Diseases" values={form.chronicDiseases} onChange={setArr('chronicDiseases')} />
                  </div>
                  <div className="col-md-6">
                    <TagInput label="Past Surgeries" values={form.pastSurgeries} onChange={setArr('pastSurgeries')} />
                  </div>
                  <div className="col-md-6">
                    <TagInput label="Current Medications" values={form.currentMedications} onChange={setArr('currentMedications')} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Family History</label>
                    <textarea className="form-control" rows={2} value={form.familyHistory} onChange={set('familyHistory')}
                      placeholder="e.g. Diabetes in father, hypertension in mother" />
                  </div>
                </div>
              </>
            )}

            {(user?.role === 'doctor' || user?.role === 'admin') && (
              <>
                <div className="modal-section-label mt-2">
                  <i className="bi bi-award" /> Professional Info
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Specialization</label>
                    <input className="form-control" value={form.specialization} onChange={set('specialization')} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">License No.</label>
                    <input className="form-control" value={form.licenseNumber} onChange={set('licenseNumber')} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Experience (yrs)</label>
                    <input type="number" className="form-control" value={form.experience} onChange={set('experience')} min={0} />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="ehr-modal-footer d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                : <><i className="bi bi-check2 me-2" />Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Info item used in view cards ── */
function InfoItem({ icon, label, value, accent }) {
  if (!value && value !== 0) return null;
  return (
    <div className="d-flex align-items-start gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: accent ? accent + '18' : 'var(--primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={`bi ${icon}`} style={{ color: accent || 'var(--primary)', fontSize: '0.9rem' }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500, marginTop: 2, wordBreak: 'break-word' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

/* ── Tag display row ── */
function TagItem({ icon, label, values = [] }) {
  if (!values.length) return null;
  return (
    <div className="d-flex align-items-start gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={`bi ${icon}`} style={{ color: 'var(--primary)', fontSize: '0.9rem' }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div className="d-flex flex-wrap gap-1 mt-1">
          {values.map((v) => (
            <span key={v} style={{
              background: 'var(--primary-light)', color: 'var(--primary)',
              fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px',
              borderRadius: 20, border: '1px solid rgba(42,127,255,0.15)',
            }}>{v}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Section card wrapper ── */
function SectionCard({ icon, title, children, accent }) {
  return (
    <div className="card h-100" style={{ borderRadius: 14, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="card-body p-0">
        <div className="d-flex align-items-center gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', borderRadius: '14px 14px 0 0' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: accent ? accent + '18' : 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={`bi ${icon}`} style={{ color: accent || 'var(--primary)', fontSize: '0.85rem' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{title}</span>
        </div>
        <div className="px-4 py-1">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ message }) {
  return (
    <div className="text-center py-4" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      <i className="bi bi-info-circle d-block mb-1" style={{ fontSize: '1.4rem', opacity: 0.4 }} />
      {message}
    </div>
  );
}

/* ── Role config ── */
const ROLE_STYLE = {
  patient:    { color: '#0ea5e9', bg: '#e0f2fe', label: 'Patient' },
  doctor:     { color: '#8b5cf6', bg: '#ede9fe', label: 'Doctor' },
  admin:      { color: '#f59e0b', bg: '#fef3c7', label: 'Admin' },
  superadmin: { color: '#ef4444', bg: '#fee2e2', label: 'Super Admin' },
};

/* ── Main Profile Page ── */
export default function Profile() {
  const { user, setUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = React.useRef();

  const handleSaved = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
    setEditOpen(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');

    const formData = new FormData();
    formData.append('avatar', file);
    setAvatarLoading(true);
    try {
      const res = await api.post(`/users/${user._id || user.id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser((prev) => ({ ...prev, avatar: res.data.avatar }));
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const role = ROLE_STYLE[user?.role] || ROLE_STYLE.patient;
  const initial = user?.name?.[0]?.toUpperCase() || '?';

  const hasPersonalInfo = user?.phone || user?.address ||
    (user?.role === 'patient' && (user?.age || user?.gender || user?.bloodGroup || user?.emergencyContact));

  const hasMedHistory = user?.allergies?.length || user?.chronicDiseases?.length ||
    user?.pastSurgeries?.length || user?.currentMedications?.length || user?.familyHistory;

  return (
    <div>
      {/* Page header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-0" style={{ fontWeight: 700 }}>My Profile</h4>
          <p className="mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
            View and manage your personal information
          </p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setEditOpen(true)}>
          <i className="bi bi-pencil-square" />
          Edit Profile
        </button>
      </div>

      {/* Profile hero */}
      <div className="card mb-4" style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {/* Top gradient strip */}
        <div style={{ height: 6, background: 'linear-gradient(90deg, var(--primary) 0%, #6366f1 50%, var(--secondary) 100%)' }} />

        <div className="card-body px-4 py-4">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            {/* Avatar with upload */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                  background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30, fontWeight: 700, color: '#fff',
                  boxShadow: '0 4px 16px rgba(42,127,255,0.3)',
                  cursor: user?.avatar ? 'zoom-in' : 'default',
                }}
                onClick={() => user?.avatar && setPreviewOpen(true)}
              >
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initial}
              </div>
              {/* Camera overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                title="Change profile picture"
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--primary)', border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  transition: 'background 0.15s',
                }}
              >
                {avatarLoading
                  ? <span className="spinner-border" style={{ width: 10, height: 10, borderWidth: 2, color: '#fff' }} />
                  : <i className="bi bi-camera-fill" style={{ fontSize: '0.65rem', color: '#fff' }} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>

            {/* Name / email / role */}
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h5 className="mb-0" style={{ fontWeight: 700, fontSize: '1.2rem' }}>{user?.name}</h5>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: role.bg, color: role.color, letterSpacing: '0.04em',
                }}>
                  {role.label}
                </span>
              </div>
              <div className="d-flex align-items-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <i className="bi bi-envelope" style={{ fontSize: '0.8rem' }} />
                {user?.email}
              </div>
              {user?.role === 'doctor' && user?.specialization && (
                <div className="d-flex align-items-center gap-1 mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <i className="bi bi-award" style={{ fontSize: '0.8rem' }} />
                  {user.specialization}
                </div>
              )}
            </div>

            {/* Quick stats for patient */}
            {user?.role === 'patient' && (user?.age || user?.bloodGroup || user?.gender) && (
              <div className="d-flex gap-3 flex-wrap">
                {user?.age && (
                  <div className="text-center px-3 py-2" style={{ background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', minWidth: 64 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{user.age}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>AGE</div>
                  </div>
                )}
                {user?.bloodGroup && (
                  <div className="text-center px-3 py-2" style={{ background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', minWidth: 64 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>{user.bloodGroup}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>BLOOD</div>
                  </div>
                )}
                {user?.gender && (
                  <div className="text-center px-3 py-2" style={{ background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', minWidth: 64 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8b5cf6' }}>
                      <i className={`bi bi-gender-${user.gender === 'male' ? 'male' : user.gender === 'female' ? 'female' : 'ambiguous'}`} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="row g-4">
        {/* Personal / Professional info */}
        <div className={user?.role === 'patient' ? 'col-md-6' : 'col-12'}>
          <SectionCard icon="bi-person-lines-fill" title="Personal Information">
            {hasPersonalInfo ? (
              <>
                <InfoItem icon="bi-telephone" label="Phone" value={user?.phone} />
                <InfoItem icon="bi-geo-alt" label="Address" value={user?.address} />
                {user?.role === 'patient' && (
                  <>
                    <InfoItem icon="bi-telephone-plus" label="Emergency Contact" value={user?.emergencyContact} />
                  </>
                )}
                {(user?.role === 'doctor' || user?.role === 'admin') && (
                  <>
                    <InfoItem icon="bi-award" label="Specialization" value={user?.specialization} />
                    <InfoItem icon="bi-card-text" label="License No." value={user?.licenseNumber} />
                    <InfoItem icon="bi-briefcase" label="Experience"
                      value={user?.experience ? `${user.experience} year${user.experience > 1 ? 's' : ''}` : null} />
                  </>
                )}
              </>
            ) : (
              <EmptyState message="No personal details added yet" />
            )}
          </SectionCard>
        </div>

        {/* Medical history — patients only */}
        {user?.role === 'patient' && (
          <div className="col-md-6">
            <SectionCard icon="bi-clipboard2-pulse" title="Medical History" accent="#8b5cf6">
              {hasMedHistory ? (
                <>
                  <TagItem icon="bi-exclamation-triangle" label="Allergies" values={user?.allergies} />
                  <TagItem icon="bi-heart-pulse" label="Chronic Diseases" values={user?.chronicDiseases} />
                  <TagItem icon="bi-bandaid" label="Past Surgeries" values={user?.pastSurgeries} />
                  <TagItem icon="bi-capsule" label="Current Medications" values={user?.currentMedications} />
                  <InfoItem icon="bi-people" label="Family History" value={user?.familyHistory} accent="#8b5cf6" />
                </>
              ) : (
                <EmptyState message="No medical history recorded" />
              )}
            </SectionCard>
          </div>
        )}
      </div>

      {previewOpen && user?.avatar && (
        <div
          onClick={() => setPreviewOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'overlayIn 0.18s ease', cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={user.avatar}
              alt="Profile"
              style={{
                maxWidth: '90vw', maxHeight: '85vh',
                borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                display: 'block', animation: 'modalIn 0.22s cubic-bezier(0.34,1.3,0.64,1)',
              }}
            />
            <button
              onClick={() => setPreviewOpen(false)}
              style={{
                position: 'absolute', top: -14, right: -14,
                width: 32, height: 32, borderRadius: '50%',
                background: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <i className="bi bi-x-lg" style={{ fontSize: '0.85rem', color: '#333' }} />
            </button>
          </div>
        </div>
      )}

      {editOpen && (
        <EditProfileModal user={user} onClose={() => setEditOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
