import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const api = axios.create({ baseURL: '/api' });

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid #E5EAF0',
  borderRadius: 8, fontSize: '0.875rem', color: '#1F2937', background: '#fff',
  outline: 'none', transition: 'border-color 0.18s', boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: '0.78rem', fontWeight: 700, color: '#6B7280',
  textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4,
};

function daysAgo(dateStr) {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
}

function FocusInput({ type = 'text', style: extraStyle, ...props }) {
  return (
    <input type={type} style={{ ...inputStyle, ...extraStyle }} {...props}
      onFocus={e => e.target.style.borderColor = '#2A7FFF'}
      onBlur={e => e.target.style.borderColor = '#E5EAF0'} />
  );
}

function FocusSelect({ children, ...props }) {
  return (
    <select style={inputStyle} {...props}
      onFocus={e => e.target.style.borderColor = '#2A7FFF'}
      onBlur={e => e.target.style.borderColor = '#E5EAF0'}>
      {children}
    </select>
  );
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ background: '#fff0f0', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '0.6rem 0.875rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
      {msg}
    </div>
  );
}


// ── New Donor Form ───────────────────────────────────────────────
function NewDonorForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', bloodGroup: '',
    location: '', lastDonationDate: '', totalDonatedUnits: 0, isAvailable: true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const payload = { ...form };
      if (!payload.lastDonationDate) delete payload.lastDonationDate;
      const res = await api.post('/blood/donors/public', payload);
      onSuccess(res.data.donor);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit}>
      <ErrBox msg={err} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <FocusInput required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" />
        </div>
        <div>
          <label style={labelStyle}>Phone *</label>
          <FocusInput required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <FocusInput type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="optional" />
        </div>
        <div>
          <label style={labelStyle}>Blood Group *</label>
          <FocusSelect required value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
            <option value="">Select</option>
            {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
          </FocusSelect>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>City / Location *</label>
          <FocusInput required value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Mumbai, Maharashtra" />
        </div>
        <div>
          <label style={labelStyle}>Total Units Donated</label>
          <FocusInput type="number" min={0} value={form.totalDonatedUnits} onChange={e => set('totalDonatedUnits', +e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Last Donation Date</label>
          <FocusInput type="date" value={form.lastDonationDate} onChange={e => set('lastDonationDate', e.target.value)} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
            <input type="checkbox" checked={form.isAvailable} onChange={e => set('isAvailable', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#ef4444' }} />
            I am currently available to donate
          </label>
        </div>
      </div>
      <button type="submit" disabled={saving} style={{
        marginTop: '1.25rem', background: saving ? '#f87171' : '#ef4444', color: '#fff',
        border: 'none', borderRadius: 10, padding: '0.75rem', fontWeight: 700,
        fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer',
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {saving ? <><span className="spinner-border spinner-border-sm" />Registering...</> : <><i className="bi bi-heart-fill" />Register as Donor</>}
      </button>
    </form>
  );
}


// ── Returning Donor Flow ─────────────────────────────────────────
function ReturningDonorFlow({ onSuccess }) {
  const [step, setStep] = useState('search');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [donor, setDonor] = useState(null);
  const [err, setErr] = useState('');
  const [donateForm, setDonateForm] = useState({ lastDonationDate: '', unitsToAdd: 1 });
  const [saving, setSaving] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true); setErr(''); setDonor(null);
    try {
      const res = await api.get('/blood/donors/lookup', { params: { q: query.trim() } });
      if (res.data.donor) { setDonor(res.data.donor); setStep('profile'); }
      else setErr('No donor found with that phone or email. Please register as a new donor.');
    } catch { setErr('Search failed. Please try again.'); }
    finally { setSearching(false); }
  };

  const handleDonateAgain = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const res = await api.put(`/blood/donors/${donor._id}/donate`, donateForm);
      onSuccess(res.data.donor, true);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Failed to update donation.');
    } finally { setSaving(false); }
  };

  const eligible = donor ? daysAgo(donor.lastDonationDate) >= 90 : false;
  const daysLeft = donor?.lastDonationDate ? Math.ceil(90 - daysAgo(donor.lastDonationDate)) : 0;

  if (step === 'search') return (
    <div>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        Enter your registered phone number or email to find your donor profile.
      </p>
      <ErrBox msg={err} />
      <form onSubmit={search}>
        <label style={labelStyle}>Phone or Email</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <FocusInput required value={query} onChange={e => setQuery(e.target.value)} placeholder="9876543210 or you@email.com" />
          <button type="submit" disabled={searching} style={{
            background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8,
            padding: '0.6rem 1.1rem', cursor: 'pointer', flexShrink: 0,
          }}>
            {searching ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-search" />}
          </button>
        </div>
      </form>
    </div>
  );

  if (step === 'profile' && donor) return (
    <div>
      <div style={{ background: '#f8fafc', border: '1px solid #E5EAF0', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.875rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
            {donor.name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#1F2937' }}>{donor.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{donor.phone}{donor.email ? ` · ${donor.email}` : ''}</div>
          </div>
          <span style={{ background: '#fff0f0', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 99, padding: '2px 10px', fontWeight: 700, fontSize: '0.8rem' }}>
            {donor.bloodGroup}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
          {[
            { label: 'Location', value: donor.location },
            { label: 'Total Donated', value: `${donor.totalDonatedUnits ?? 0} units` },
            { label: 'Last Donation', value: donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : 'Never' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
              <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.85rem', marginTop: 2 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {eligible
        ? <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.7rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-check-circle-fill" style={{ color: '#16a34a' }} />
            <span style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: 600 }}>You are eligible to donate!</span>
          </div>
        : <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '0.7rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-clock-fill" style={{ color: '#d97706' }} />
            <span style={{ color: '#92400e', fontSize: '0.875rem', fontWeight: 600 }}>
              Wait {daysLeft} more day{daysLeft !== 1 ? 's' : ''} before donating again (90-day rule).
            </span>
          </div>
      }

      <ErrBox msg={err} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { setStep('search'); setDonor(null); setErr(''); }} style={{ flex: 1, padding: '0.7rem', border: '1.5px solid #E5EAF0', borderRadius: 10, background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          <i className="bi bi-arrow-left me-1" />Back
        </button>
        <button onClick={() => { setStep('donate'); setErr(''); }} disabled={!eligible} style={{
          flex: 2, background: eligible ? '#ef4444' : '#fca5a5', color: '#fff', border: 'none',
          borderRadius: 10, padding: '0.7rem', fontWeight: 700, fontSize: '0.875rem',
          cursor: eligible ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <i className="bi bi-heart-fill" />Donate Again
        </button>
      </div>
    </div>
  );

  if (step === 'donate') return (
    <form onSubmit={handleDonateAgain}>
      <div style={{ background: '#f8fafc', border: '1px solid #E5EAF0', borderRadius: 10, padding: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
          {donor.name[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1F2937' }}>{donor.name}</div>
          <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{donor.bloodGroup} · {donor.totalDonatedUnits ?? 0} units donated so far</div>
        </div>
      </div>
      <ErrBox msg={err} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
        <div>
          <label style={labelStyle}>Donation Date *</label>
          <FocusInput type="date" required value={donateForm.lastDonationDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => setDonateForm(f => ({ ...f, lastDonationDate: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>Units to Add *</label>
          <FocusInput type="number" required min={1} max={10} value={donateForm.unitsToAdd}
            onChange={e => setDonateForm(f => ({ ...f, unitsToAdd: +e.target.value }))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setStep('profile')} style={{ flex: 1, padding: '0.7rem', border: '1.5px solid #E5EAF0', borderRadius: 10, background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          <i className="bi bi-arrow-left me-1" />Back
        </button>
        <button type="submit" disabled={saving} style={{
          flex: 2, background: saving ? '#f87171' : '#ef4444', color: '#fff', border: 'none',
          borderRadius: 10, padding: '0.7rem', fontWeight: 700, fontSize: '0.875rem',
          cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {saving ? <><span className="spinner-border spinner-border-sm" />Saving...</> : <><i className="bi bi-heart-fill" />Confirm Donation</>}
        </button>
      </div>
    </form>
  );

  return null;
}

// ── Success Screen ───────────────────────────────────────────────
function SuccessScreen({ donor, isReturn, onReset }) {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
        <i className="bi bi-check-circle-fill" style={{ fontSize: '2rem', color: '#16a34a' }} />
      </div>
      <h4 style={{ color: '#1F2937', marginBottom: 6 }}>
        {isReturn ? 'Donation Recorded!' : 'Registration Successful!'}
      </h4>
      <p style={{ color: '#6B7280', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
        {isReturn
          ? `Thank you, ${donor.name}! Total donated: ${donor.totalDonatedUnits} units.`
          : `Welcome, ${donor.name}! You're now a registered blood donor.`}
      </p>
      <div style={{ background: '#f8fafc', border: '1px solid #E5EAF0', borderRadius: 10, padding: '0.75rem', margin: '1rem 0', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: '#fff0f0', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 99, padding: '2px 10px', fontWeight: 700, fontSize: '0.85rem' }}>{donor.bloodGroup}</span>
        <span style={{ fontSize: '0.85rem', color: '#374151' }}>{donor.name} · {donor.location}</span>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button onClick={() => navigate('/')} style={{ padding: '0.65rem 1.5rem', background: '#2A7FFF', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          <i className="bi bi-house me-1" />Back to Home
        </button>
        <button onClick={onReset} style={{ padding: '0.65rem 1.5rem', background: '#fff', color: '#6B7280', border: '1.5px solid #E5EAF0', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          Register Another
        </button>
      </div>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────
export default function DonorRegister() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('new');
  const [success, setSuccess] = useState(null);

  const handleSuccess = (donor, isReturn = false) => setSuccess({ donor, isReturn });
  const handleReset = () => { setSuccess(null); setMode('new'); };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f2d55 0%, #1a4a7a 55%, #1a5c6e 100%)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '0 2rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700 }}>
          <i className="bi bi-arrow-left" />MediCare EHR
        </button>
        <button onClick={() => navigate('/login')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
          <i className="bi bi-person-circle me-1" />Login
        </button>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', padding: '1.5rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <i className="bi bi-person-heart" style={{ fontSize: '1.5rem', color: '#fff' }} />
            </div>
            <h4 style={{ color: '#fff', margin: 0, fontWeight: 800, fontSize: '1.15rem' }}>Blood Donor Registration</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Your donation can save up to 3 lives</p>
          </div>

          <div style={{ padding: '1.75rem 2rem' }}>
            {success ? (
              <SuccessScreen donor={success.donor} isReturn={success.isReturn} onReset={handleReset} />
            ) : (
              <>
                <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 10, padding: 4, marginBottom: '1.5rem', border: '1px solid #E5EAF0' }}>
                  {[
                    { key: 'new', label: 'New Donor', icon: 'bi-person-plus' },
                    { key: 'returning', label: 'Already a Donor?', icon: 'bi-arrow-repeat' },
                  ].map(m => (
                    <button key={m.key} onClick={() => setMode(m.key)} style={{
                      flex: 1, padding: '0.6rem', border: 'none', borderRadius: 8, cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.18s',
                      background: mode === m.key ? '#fff' : 'transparent',
                      color: mode === m.key ? '#ef4444' : '#6B7280',
                      boxShadow: mode === m.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    }}>
                      <i className={`bi ${m.icon} me-1`} />{m.label}
                    </button>
                  ))}
                </div>
                {mode === 'new'
                  ? <NewDonorForm onSuccess={d => handleSuccess(d, false)} />
                  : <ReturningDonorFlow onSuccess={(d, r) => handleSuccess(d, r)} />
                }
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
