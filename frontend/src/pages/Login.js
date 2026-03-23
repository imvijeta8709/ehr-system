import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { BtnSpinner } from '../components/Spinner';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}`);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 420 }}>
        <div className="text-center mb-4">
          <div className="auth-logo">
            <i className="bi bi-heart-pulse-fill" />
          </div>
          <div className="auth-title">EHR System</div>
          <div className="auth-subtitle">Sign in to your account</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <span className="input-group-text" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRight: 'none', borderRadius: '8px 0 0 8px' }}>
                <i className="bi bi-envelope" style={{ color: 'var(--text-muted)' }} />
              </span>
              <input
                type="email"
                className="form-control"
                style={{ borderLeft: 'none', borderRadius: '0 8px 8px 0' }}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label mb-0">Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
            <div className="input-group">
              <span className="input-group-text" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRight: 'none', borderRadius: '8px 0 0 8px' }}>
                <i className="bi bi-lock" style={{ color: 'var(--text-muted)' }} />
              </span>
              <input
                type="password"
                className="form-control"
                style={{ borderLeft: 'none', borderRadius: '0 8px 8px 0' }}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>

          <button className="btn btn-primary w-100 py-2" disabled={loading} style={{ fontSize: '0.9375rem', justifyContent: 'center' }}>
            {loading
              ? <><BtnSpinner /><span>Signing in...</span></>
              : <><i className="bi bi-box-arrow-in-right" />Sign In</>
            }
          </button>
        </form>

        <div className="auth-divider" />

        <p className="text-center mb-0" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
