import React from 'react';
import Modal from './Modal';

const InfoRow = ({ label, value }) => (
  <div className="profile-info-row">
    <span className="profile-info-label">{label}</span>
    <span className="profile-info-value">
      {value || <span style={{ color: 'var(--text-light)' }}>—</span>}
    </span>
  </div>
);

const DetailTile = ({ icon, label, value, accent = 'var(--primary)' }) => (
  <div
    className="d-flex align-items-start gap-3 p-3 rounded-3"
    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
  >
    <div
      style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent, fontSize: '1.05rem',
      }}
    >
      <i className={`bi ${icon}`} />
    </div>
    <div>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
        {value || <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>Not provided</span>}
      </div>
    </div>
  </div>
);

/**
 * Props:
 *   doctor     — doctor object
 *   canEdit    — boolean: true only when viewer is admin OR viewing their own profile
 *   onEdit     — callback to open edit modal
 */
export default function DoctorViewModal({ open, onClose, doctor, onEdit, canEdit = false }) {
  if (!doctor) return null;

  const initials = (doctor.name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Doctor Profile"
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Close
          </button>
          {canEdit && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => { onClose(); onEdit(doctor); }}
            >
              <i className="bi bi-pencil me-1" />Edit Profile
            </button>
          )}
        </div>
      }
    >
      {/* ── Banner ── */}
      <div
        className="d-flex align-items-center gap-4 p-4 rounded-3 mb-4"
        style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--secondary-light) 100%)' }}
      >
        <div
          style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '1.6rem', fontWeight: 700,
            boxShadow: '0 6px 18px rgba(42,127,255,0.3)',
          }}
        >
          {initials}
        </div>
        <div className="flex-grow-1">
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)' }}>{doctor.name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 6 }}>{doctor.email}</div>
          <div className="d-flex flex-wrap gap-2">
            {doctor.specialization && (
              <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                {doctor.specialization}
              </span>
            )}
            <span style={{ background: 'var(--secondary-light)', color: 'var(--secondary-dark)', fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
              {doctor.role === 'admin' ? 'Admin / Doctor' : 'Doctor'}
            </span>
            {doctor.experience && (
              <span style={{ background: '#fff8e6', color: '#92400e', fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                {doctor.experience} yrs exp.
              </span>
            )}
            {doctor.isActive === false && (
              <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail tiles (2-col grid) ── */}
      <div className="row g-3 mb-3">
        <div className="col-sm-6">
          <DetailTile icon="bi-telephone" label="Phone" value={doctor.phone} accent="var(--primary)" />
        </div>
        <div className="col-sm-6">
          <DetailTile icon="bi-card-text" label="License No." value={doctor.licenseNumber} accent="var(--secondary-dark)" />
        </div>
        <div className="col-sm-6">
          <DetailTile icon="bi-briefcase" label="Experience" value={doctor.experience ? `${doctor.experience} years` : null} accent="#d97706" />
        </div>
        <div className="col-sm-6">
          <DetailTile icon="bi-geo-alt" label="Address" value={doctor.address} accent="#0891b2" />
        </div>
      </div>

      {/* ── Contact section ── */}
      <div className="profile-section-card">
        <div className="profile-section-title">
          <i className="bi bi-person-badge me-2" style={{ color: 'var(--primary)' }} />
          Professional Information
        </div>
        <InfoRow label="Full Name"       value={doctor.name} />
        <InfoRow label="Email"           value={doctor.email} />
        <InfoRow label="Specialization"  value={doctor.specialization} />
        <InfoRow label="License No."     value={doctor.licenseNumber} />
        <InfoRow label="Experience"      value={doctor.experience ? `${doctor.experience} years` : null} />
        <InfoRow label="Phone"           value={doctor.phone} />
        <InfoRow label="Address"         value={doctor.address} />
      </div>
    </Modal>
  );
}
