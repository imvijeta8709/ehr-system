import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'patient',
    age: '', gender: '', phone: '', address: '', bloodGroup: '',
    specialization: '', licenseNumber: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 580 }}>
        <div className="text-center mb-4">
          <div className="auth-logo">
            <i className="bi bi-heart-pulse-fill" />
          </div>
          <div className="auth-title">Create Account</div>
          <div className="auth-subtitle">Join the EHR System today</div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div className="d-flex gap-2 mb-4">
            {['patient', 'doctor'].map((r) => (
              <button
                key={r}
                type="button"
                className="flex-fill py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
                style={{
                  border: `2px solid ${form.role === r ? 'var(--primary)' : 'var(--border)'}`,
                  background: form.role === r ? 'var(--primary-light)' : 'var(--surface)',
                  color: form.role === r ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.18s',
                }}
                onClick={() => setForm({ ...form, role: r })}
              >
                <i className={`bi ${r === 'patient' ? 'bi-person' : 'bi-person-badge'}`} />
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={set('name')} placeholder="John Doe" required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email *</label>
              <input type="email" className="form-control" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Password *</label>
              <input type="password" className="form-control" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" required minLength={6} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={set('phone')} placeholder="+1 234 567 8900" />
            </div>

            {form.role === 'patient' && (
              <>
                <div className="col-md-4">
                  <label className="form-label">Age</label>
                  <input type="number" className="form-control" value={form.age} onChange={set('age')} placeholder="25" />
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
                <div className="col-12">
                  <label className="form-label">Address</label>
                  <input className="form-control" value={form.address} onChange={set('address')} placeholder="123 Main St, City" />
                </div>
              </>
            )}

            {form.role === 'doctor' && (
              <>
                <div className="col-md-6">
                  <label className="form-label">Specialization</label>
                  <input className="form-control" value={form.specialization} onChange={set('specialization')} placeholder="e.g. Cardiology" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">License Number</label>
                  <input className="form-control" value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="LIC-XXXXXX" />
                </div>
              </>
            )}
          </div>

          <button className="btn btn-primary w-100 py-2 mt-4" disabled={loading} style={{ fontSize: '0.9375rem' }}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" />Creating account...</>
              : <><i className="bi bi-person-plus me-2" />Create Account</>
            }
          </button>
        </form>

        <div className="auth-divider" />

        <p className="text-center mb-0" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
