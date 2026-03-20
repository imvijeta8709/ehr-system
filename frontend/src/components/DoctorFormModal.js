import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../utils/api';
import { toast } from 'react-toastify';

const SPECIALIZATIONS = [
  'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology',
  'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics',
  'Pediatrics', 'Psychiatry', 'Pulmonology', 'Radiology',
  'Surgery', 'Urology', 'Other',
];

const emptyForm = {
  name: '', email: '', password: '', phone: '', address: '',
  specialization: '', licenseNumber: '', experience: '',
};

const validate = (form, isEdit) => {
  const errs = {};
  if (!form.name.trim()) errs.name = 'Name is required';
  if (!form.email.trim()) errs.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
  if (!isEdit && !form.password) errs.password = 'Password is required';
  if (!isEdit && form.password && form.password.length < 6) errs.password = 'Min. 6 characters';
  if (form.experience && (isNaN(form.experience) || form.experience < 0)) errs.experience = 'Enter valid years';
  return errs;
};

export default function DoctorFormModal({ open, onClose, doctor, onSaved }) {
  const isEdit = Boolean(doctor);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (doctor) {
      setForm({
        name: doctor.name || '',
        email: doctor.email || '',
        password: '',
        phone: doctor.phone || '',
        address: doctor.address || '',
        specialization: doctor.specialization || '',
        licenseNumber: doctor.licenseNumber || '',
        experience: doctor.experience || '',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [doctor, open]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form, isEdit);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        specialization: form.specialization || undefined,
        licenseNumber: form.licenseNumber.trim() || undefined,
        experience: form.experience ? Number(form.experience) : undefined,
      };

      let saved;
      if (isEdit) {
        const res = await api.put(`/users/${doctor._id}`, payload);
        saved = res.data.user;
        toast.success('Doctor profile updated');
      } else {
        const res = await api.post('/auth/register', { ...payload, password: form.password, role: 'doctor' });
        saved = res.data.user;
        toast.success('Doctor added successfully');
      }

      onSaved(saved, isEdit);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Something went wrong';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const FieldError = ({ name }) => errors[name]
    ? <div className="invalid-feedback d-block">{errors[name]}</div>
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Doctor Profile' : 'Add New Doctor'}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="doctor-form" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" />{isEdit ? 'Saving...' : 'Adding...'}</>
              : <><i className={`bi ${isEdit ? 'bi-check-lg' : 'bi-person-plus'} me-2`} />{isEdit ? 'Save Changes' : 'Add Doctor'}</>
            }
          </button>
        </div>
      }
    >
      <form id="doctor-form" onSubmit={handleSubmit} noValidate>
        <div className="modal-section-label">Basic Information</div>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input className={`form-control${errors.name ? ' is-invalid' : ''}`} placeholder="Dr. Jane Smith"
              value={form.name} onChange={set('name')} />
            <FieldError name="name" />
          </div>
          <div className="col-md-6">
            <label className="form-label">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="email" className={`form-control${errors.email ? ' is-invalid' : ''}`} placeholder="doctor@hospital.com"
              value={form.email} onChange={set('email')} />
            <FieldError name="email" />
          </div>
          {!isEdit && (
            <div className="col-md-6">
              <label className="form-label">Password <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="password" className={`form-control${errors.password ? ' is-invalid' : ''}`} placeholder="Min. 6 characters"
                value={form.password} onChange={set('password')} />
              <FieldError name="password" />
            </div>
          )}
          <div className="col-md-6">
            <label className="form-label">Phone Number</label>
            <input className="form-control" placeholder="+1 234 567 8900"
              value={form.phone} onChange={set('phone')} />
          </div>
          <div className="col-12">
            <label className="form-label">Address</label>
            <input className="form-control" placeholder="Hospital / Clinic address"
              value={form.address} onChange={set('address')} />
          </div>
        </div>

        <div className="modal-section-label">Professional Details</div>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Specialization</label>
            <select className="form-select" value={form.specialization} onChange={set('specialization')}>
              <option value="">Select specialization</option>
              {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">License No.</label>
            <input className="form-control" placeholder="LIC-XXXXXX"
              value={form.licenseNumber} onChange={set('licenseNumber')} />
          </div>
          <div className="col-md-3">
            <label className="form-label">Experience (yrs)</label>
            <input type="number" className={`form-control${errors.experience ? ' is-invalid' : ''}`}
              placeholder="5" min={0} value={form.experience} onChange={set('experience')} />
            <FieldError name="experience" />
          </div>
        </div>
      </form>
    </Modal>
  );
}
