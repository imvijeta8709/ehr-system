import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../utils/api';
import { toast } from 'react-toastify';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const emptyForm = {
  name: '', email: '', password: '', phone: '', address: '',
  age: '', gender: '', bloodGroup: '', emergencyContact: '',
  allergies: '', chronicDiseases: '', currentMedications: '', familyHistory: '',
};

const validate = (form, isEdit) => {
  const errs = {};
  if (!form.name.trim()) errs.name = 'Name is required';
  if (!form.email.trim()) errs.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
  if (!isEdit && !form.password) errs.password = 'Password is required';
  if (!isEdit && form.password && form.password.length < 6) errs.password = 'Min. 6 characters';
  if (form.age && (isNaN(form.age) || form.age < 0 || form.age > 150)) errs.age = 'Enter a valid age';
  if (form.phone && !/^[\d\s\+\-\(\)]{7,15}$/.test(form.phone)) errs.phone = 'Enter a valid phone number';
  return errs;
};

export default function PatientFormModal({ open, onClose, patient, onSaved }) {
  const isEdit = Boolean(patient);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name || '',
        email: patient.email || '',
        password: '',
        phone: patient.phone || '',
        address: patient.address || '',
        age: patient.age || '',
        gender: patient.gender || '',
        bloodGroup: patient.bloodGroup || '',
        emergencyContact: patient.emergencyContact || '',
        allergies: (patient.allergies || []).join(', '),
        chronicDiseases: (patient.chronicDiseases || []).join(', '),
        currentMedications: (patient.currentMedications || []).join(', '),
        familyHistory: patient.familyHistory || '',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [patient, open]);

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
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        emergencyContact: form.emergencyContact.trim() || undefined,
        allergies: form.allergies ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean) : [],
        chronicDiseases: form.chronicDiseases ? form.chronicDiseases.split(',').map((s) => s.trim()).filter(Boolean) : [],
        currentMedications: form.currentMedications ? form.currentMedications.split(',').map((s) => s.trim()).filter(Boolean) : [],
        familyHistory: form.familyHistory.trim() || undefined,
      };

      let saved;
      if (isEdit) {
        const res = await api.put(`/users/${patient._id}`, payload);
        saved = res.data.user;
        toast.success('Patient updated successfully');
      } else {
        const res = await api.post('/auth/register', { ...payload, password: form.password, role: 'patient' });
        saved = res.data.user;
        toast.success('Patient added successfully');
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

  const Field = ({ label, name, type = 'text', placeholder, required, children }) => (
    <div>
      <label className="form-label">
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children || (
        <input
          type={type}
          className={`form-control${errors[name] ? ' is-invalid' : ''}`}
          placeholder={placeholder}
          value={form[name]}
          onChange={set(name)}
        />
      )}
      {errors[name] && <div className="invalid-feedback d-block">{errors[name]}</div>}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Patient Profile' : 'Add New Patient'}
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="patient-form" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" />{isEdit ? 'Saving...' : 'Adding...'}</>
              : <><i className={`bi ${isEdit ? 'bi-check-lg' : 'bi-person-plus'} me-2`} />{isEdit ? 'Save Changes' : 'Add Patient'}</>
            }
          </button>
        </div>
      }
    >
      <form id="patient-form" onSubmit={handleSubmit} noValidate>
        {/* Section: Basic Info */}
        <div className="modal-section-label">Basic Information</div>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <Field label="Full Name" name="name" placeholder="John Doe" required />
          </div>
          <div className="col-md-6">
            <Field label="Email Address" name="email" type="email" placeholder="john@example.com" required />
          </div>
          {!isEdit && (
            <div className="col-md-6">
              <Field label="Password" name="password" type="password" placeholder="Min. 6 characters" required />
            </div>
          )}
          <div className="col-md-6">
            <Field label="Phone Number" name="phone" placeholder="+1 234 567 8900" />
          </div>
          <div className="col-12">
            <Field label="Address" name="address" placeholder="123 Main St, City, Country" />
          </div>
        </div>

        {/* Section: Medical Info */}
        <div className="modal-section-label">Medical Details</div>
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <Field label="Age" name="age" type="number" placeholder="25">
              <input
                type="number"
                className={`form-control${errors.age ? ' is-invalid' : ''}`}
                placeholder="25"
                value={form.age}
                onChange={set('age')}
                min={0} max={150}
              />
            </Field>
            {errors.age && <div className="invalid-feedback d-block">{errors.age}</div>}
          </div>
          <div className="col-md-4">
            <label className="form-label">Gender</label>
            <select className="form-select" value={form.gender} onChange={set('gender')}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Blood Group</label>
            <select className="form-select" value={form.bloodGroup} onChange={set('bloodGroup')}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <Field label="Emergency Contact" name="emergencyContact" placeholder="+1 234 567 8900" />
          </div>
        </div>

        {/* Section: Medical History */}
        <div className="modal-section-label">Medical History <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.72rem', color: 'var(--text-light)' }}>(comma-separated)</span></div>
        <div className="row g-3">
          <div className="col-md-6">
            <Field label="Allergies" name="allergies" placeholder="Penicillin, Pollen, Dust" />
          </div>
          <div className="col-md-6">
            <Field label="Chronic Diseases" name="chronicDiseases" placeholder="Diabetes, Hypertension" />
          </div>
          <div className="col-md-6">
            <Field label="Current Medications" name="currentMedications" placeholder="Metformin, Aspirin" />
          </div>
          <div className="col-md-6">
            <label className="form-label">Family History</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Diabetes in father, heart disease in mother"
              value={form.familyHistory}
              onChange={set('familyHistory')}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
