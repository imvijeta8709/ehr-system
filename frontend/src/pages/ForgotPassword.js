import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const STEPS = ['Email', 'OTP', 'New Password'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]             = useState(0); // 0=email, 1=otp, 2=reset
  const [email, setEmail]           = useState('');
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // Countdown for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 0: Send OTP ──────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email address');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent! Check your email.');
      setStep(1);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ────────────────────────────────────────
  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Step 1: Verify OTP ────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) return toast.error('Enter the complete 6-digit OTP');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: otpStr });
      setResetToken(res.data.resetToken);
      toast.success('OTP verified!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Reset Password ────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, password });
      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('New OTP sent!');
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = (p) => {
    if (!p) return null;
    let score = 0;
    if (p.length >= 6)  score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/\d/.test(p))    score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'Weak',   color: '#ef4444', width: '25%' };
    if (score <= 3) return { label: 'Fair',   color: '#f59e0b', width: '55%' };
    return              { label: 'Strong', color: '#22c55e', width: '100%' };
  };
  const strength = pwdStrength(password);

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <div className="auth-logo"><i className="bi bi-heart-pulse-fill" /></div>
          <div className="auth-title">Reset Password</div>
          <div className="auth-subtitle">
            {step === 0 && 'Enter your email to receive an OTP'}
            {step === 1 && 'Enter the 6-digit OTP sent to your email'}
            {step === 2 && 'Create a new secure password'}
          </div>
        </div>

        {/* Step indicator */}
        <div className="d-flex align-items-center justify-content-center gap-0 mb-4">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8rem',
                  background: i < step ? 'var(--primary)' : i === step ? 'var(--primary)' : 'var(--border)',
                  color: i <= step ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}>
                  {i < step ? <i className="bi bi-check2" /> : i + 1}
                </div>
                <span style={{ fontSize: '0.68rem', color: i === step ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === step ? 700 : 400 }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < step ? 'var(--primary)' : 'var(--border)', margin: '0 6px', marginBottom: 20, transition: 'background 0.3s' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 0: Email ── */}
        {step === 0 && (
          <form onSubmit={handleSendOTP}>
            <div className="mb-4">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRight: 'none', borderRadius: '8px 0 0 8px' }}>
                  <i className="bi bi-envelope" style={{ color: 'var(--text-muted)' }} />
                </span>
                <input
                  type="email" className="form-control" placeholder="you@example.com"
                  style={{ borderLeft: 'none', borderRadius: '0 8px 8px 0' }}
                  value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                />
              </div>
            </div>
            <button className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</> : <><i className="bi bi-send me-2" />Send OTP</>}
            </button>
          </form>
        )}

        {/* ── Step 1: OTP ── */}
        {step === 1 && (
          <form onSubmit={handleVerifyOTP}>
            <div className="mb-2 text-center" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              OTP sent to <strong>{email}</strong>
            </div>
            <div className="d-flex justify-content-center gap-2 mb-4 mt-3" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text" inputMode="numeric" maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  style={{
                    width: 48, height: 56, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
                    border: `2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 10, background: 'var(--card-bg)', color: 'var(--text)',
                    outline: 'none', transition: 'border-color 0.15s',
                  }}
                />
              ))}
            </div>
            <button className="btn btn-primary w-100 py-2 mb-3" disabled={loading || otp.join('').length < 6}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Verifying...</> : <><i className="bi bi-shield-check me-2" />Verify OTP</>}
            </button>
            <div className="text-center" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Didn't receive it?{' '}
              <button type="button" className="btn btn-link btn-sm p-0" style={{ fontSize: '0.85rem', fontWeight: 600 }}
                disabled={resendTimer > 0 || loading} onClick={handleResend}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 2: New Password ── */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRight: 'none', borderRadius: '8px 0 0 8px' }}>
                  <i className="bi bi-lock" style={{ color: 'var(--text-muted)' }} />
                </span>
                <input
                  type={showPwd ? 'text' : 'password'} className="form-control" placeholder="Min. 6 characters"
                  style={{ borderLeft: 'none', borderRight: 'none' }}
                  value={password} onChange={e => setPassword(e.target.value)} required autoFocus
                />
                <button type="button" className="input-group-text" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderLeft: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer' }}
                  onClick={() => setShowPwd(v => !v)}>
                  <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div style={{ height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: 99, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="form-label">Confirm Password</label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRight: 'none', borderRadius: '8px 0 0 8px' }}>
                  <i className="bi bi-lock-fill" style={{ color: 'var(--text-muted)' }} />
                </span>
                <input
                  type={showPwd ? 'text' : 'password'} className="form-control" placeholder="Repeat password"
                  style={{ borderLeft: 'none', borderRadius: '0 8px 8px 0', borderColor: confirm && confirm !== password ? '#ef4444' : undefined }}
                  value={confirm} onChange={e => setConfirm(e.target.value)} required
                />
              </div>
              {confirm && confirm !== password && (
                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>Passwords do not match</div>
              )}
            </div>
            <button className="btn btn-primary w-100 py-2" disabled={loading || (confirm && confirm !== password)}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Resetting...</> : <><i className="bi bi-check2-circle me-2" />Reset Password</>}
            </button>
          </form>
        )}

        <div className="auth-divider" />
        <p className="text-center mb-0" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
