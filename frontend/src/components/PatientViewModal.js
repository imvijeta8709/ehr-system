import React from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';

const InfoRow = ({ label, value }) => (
  <div className="profile-info-row">
    <span className="profile-info-label">{label}</span>
    <span className="profile-info-value">{value || <span style={{ color: 'var(--text-light)' }}>—</span>}</span>
  </div>
);

const TagList = ({ items, color = 'primary' }) => {
  if (!items?.length) return <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>None recorded</span>;
  const colorMap = {
    primary: { bg: 'var(--primary-light)', color: 'var(--primary-dark)' },
    danger:  { bg: '#fee2e2', color: '#991b1b' },
    warning: { bg: '#fef3c7', color: '#92400e' },
    teal:    { bg: 'var(--secondary-light)', color: 'var(--secondary-dark)' },
  };
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="d-flex flex-wrap gap-1 mt-1">
      {items.map((item) => (
        <span key={item} style={{ background: c.bg, color: c.color, fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 99 }}>
          {item}
        </span>
      ))}
    </div>
  );
};

export default function PatientViewModal({ open, onClose, patient, onEdit }) {
  if (!patient) return null;

  const initials = patient.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Patient Profile"
      size="lg"
      footer={
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="d-flex gap-2">
            <Link to={`/timeline/${patient._id}`} className="btn btn-sm btn-outline-primary" onClick={onClose}>
              <i className="bi bi-clock-history me-1" />Timeline
            </Link>
            <Link to={`/records/new?patient=${patient._id}`} className="btn btn-sm btn-outline-secondary" onClick={onClose}>
              <i className="bi bi-file-earmark-plus me-1" />New Record
            </Link>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
            <button className="btn btn-sm btn-primary" onClick={() => { onClose(); onEdit(patient); }}>
              <i className="bi bi-pencil me-1" />Edit Profile
            </button>
          </div>
        </div>
      }
    >
      {/* Avatar + name banner */}
      <div
        className="d-flex align-items-center gap-3 p-3 rounded-3 mb-4"
        style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))' }}
      >
        <div
          style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '1.4rem', fontWeight: 700,
            boxShadow: '0 4px 12px rgba(42,127,255,0.3)',
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{patient.name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{patient.email}</div>
          <div className="d-flex gap-2 mt-1">
            {patient.bloodGroup && (
              <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.72rem', fontWeight: 700, padding: '1px 8px', borderRadius: 99 }}>
                {patient.bloodGroup}
              </span>
            )}
            {patient.gender && (
              <span style={{ background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, padding: '1px 8px', borderRadius: 99, border: '1px solid var(--border)' }}>
                {patient.gender}
              </span>
            )}
            <span style={{ background: 'var(--secondary-light)', color: 'var(--secondary-dark)', fontSize: '0.72rem', fontWeight: 600, padding: '1px 8px', borderRadius: 99 }}>
              Patient
            </span>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {/* Contact */}
        <div className="col-md-6">
          <div className="profile-section-card">
            <div className="profile-section-title">
              <i className="bi bi-person-lines-fill me-2" style={{ color: 'var(--primary)' }} />Contact Info
            </div>
            <InfoRow label="Age" value={patient.age ? `${patient.age} years` : null} />
            <InfoRow label="Phone" value={patient.phone} />
            <InfoRow label="Address" value={patient.address} />
            <InfoRow label="Emergency" value={patient.emergencyContact} />
          </div>
        </div>

        {/* Medical */}
        <div className="col-md-6">
          <div className="profile-section-card">
            <div className="profile-section-title">
              <i className="bi bi-heart-pulse me-2" style={{ color: '#ef4444' }} />Medical Info
            </div>
            <InfoRow label="Blood Group" value={patient.bloodGroup} />
            <InfoRow label="Gender" value={patient.gender} />
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Allergies</div>
              <TagList items={patient.allergies} color="danger" />
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="col-12">
          <div className="profile-section-card">
            <div className="profile-section-title">
              <i className="bi bi-clipboard2-pulse me-2" style={{ color: 'var(--secondary-dark)' }} />Medical History
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Chronic Diseases</div>
                <TagList items={patient.chronicDiseases} color="warning" />
              </div>
              <div className="col-md-4">
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Current Medications</div>
                <TagList items={patient.currentMedications} color="teal" />
              </div>
              <div className="col-md-4">
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Past Surgeries</div>
                <TagList items={patient.pastSurgeries} color="primary" />
              </div>
              {patient.familyHistory && (
                <div className="col-12">
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Family History</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text)', background: 'var(--bg)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    {patient.familyHistory}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
