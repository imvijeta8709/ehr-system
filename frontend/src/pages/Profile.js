import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

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
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={add}>Add</button>
      </div>
      <div className="d-flex flex-wrap gap-1">
        {values.map((v) => (
          <span key={v} className="badge bg-secondary d-flex align-items-center gap-1">
            {v}
            <button type="button" className="btn-close btn-close-white" style={{ fontSize: 8 }} onClick={() => remove(v)} />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
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

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setArr = (field) => (val) => setForm({ ...form, [field]: val });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/users/${user._id || user.id}`, form);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="mb-4">My Profile</h4>
      <div className="card" style={{ maxWidth: 700 }}>
        <div className="card-body">
          <div className="d-flex align-items-center mb-4">
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
              style={{ width: 60, height: 60, fontSize: 24 }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h5 className="mb-0">{user?.name}</h5>
              <span className="badge bg-secondary">{user?.role}</span>
              <div className="text-muted small">{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={form.name} onChange={set('name')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input className="form-control" value={user?.email} disabled />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.address} onChange={set('address')} />
              </div>

              {user?.role === 'patient' && (
                <>
                  <div className="col-md-4">
                    <label className="form-label">Age</label>
                    <input type="number" className="form-control" value={form.age} onChange={set('age')} />
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

                  <div className="col-12"><hr className="my-1" /><strong>Medical History</strong></div>

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
                </>
              )}

              {(user?.role === 'doctor' || user?.role === 'admin') && (
                <>
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
                    <input type="number" className="form-control" value={form.experience} onChange={set('experience')} />
                  </div>
                </>
              )}
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
