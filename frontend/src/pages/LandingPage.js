import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: 'bi-file-earmark-medical', color: '#2A7FFF', bg: '#e8f1ff', title: 'Electronic Health Records', desc: 'Securely manage patient records, history, and medical documents in one place.' },
    { icon: 'bi-calendar-check', color: '#00a88c', bg: '#e0faf5', title: 'Smart Appointments', desc: 'Book and manage appointments with doctors effortlessly, anytime.' },
    { icon: 'bi-droplet-half', color: '#ef4444', bg: '#fff0f0', title: 'Blood Bank', desc: 'Real-time blood inventory tracking and donor management system.' },
    { icon: 'bi-activity', color: '#d97706', bg: '#fff8e6', title: 'Vitals Monitoring', desc: 'Track patient vitals over time with visual trends and alerts.' },
    { icon: 'bi-shield-check', color: '#7c3aed', bg: '#f3f0ff', title: 'Secure & Compliant', desc: 'Role-based access control with full audit logging for compliance.' },
    { icon: 'bi-bell', color: '#0891b2', bg: '#e0f7fa', title: 'Smart Notifications', desc: 'Real-time alerts for appointments, blood requests, and updates.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(15,45,85,0.97)', backdropFilter: 'blur(12px)',
        padding: '0 2rem', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#2A7FFF,#00C9A7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-heart-pulse-fill" style={{ color: '#fff', fontSize: '1.1rem' }} />
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>MediCare EHR</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="#about" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textDecoration: 'none', padding: '0.4rem 0.75rem' }}>About</a>
          <a href="#features" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textDecoration: 'none', padding: '0.4rem 0.75rem' }}>Features</a>
          <button onClick={() => navigate('/login')} style={{
            background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 8, padding: '0.45rem 1.1rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
          }}>
            <i className="bi bi-box-arrow-in-right me-1" />Login
          </button>
          <button onClick={() => navigate('/register')} style={{
            background: '#ef4444', color: '#fff', border: 'none',
            borderRadius: 8, padding: '0.45rem 1.1rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
          }}>
            <i className="bi bi-person-plus me-1" />Register
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0f2d55 0%, #1a4a7a 55%, #1a5c6e 100%)',
        padding: 'clamp(4rem,10vw,7rem) 1.5rem',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(42,127,255,0.07)', top: -150, right: -100, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'rgba(239,68,68,0.06)', bottom: -100, left: -80, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 99, padding: '0.35rem 1rem', marginBottom: '1.5rem' }}>
            <i className="bi bi-droplet-fill" style={{ color: '#ef4444', fontSize: '0.85rem' }} />
            <span style={{ color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600 }}>Blood Donation Saves Lives</span>
          </div>

          <h1 style={{ color: '#fff', fontSize: 'clamp(2.2rem,5vw,3.8rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem' }}>
            Save Lives with<br /><span style={{ color: '#ef4444' }}>Every Drop</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 'clamp(1rem,2vw,1.15rem)', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.75 }}>
            Your blood donation can save up to 3 lives. Join thousands of donors in our community and make a real difference today.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => navigate('/donate')} style={{
              background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12,
              padding: '0.9rem 2.5rem', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 6px 24px rgba(239,68,68,0.45)',
            }}>
              <i className="bi bi-heart-fill" />Donate Blood
            </button>
            <button onClick={() => navigate('/login')} style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12,
              padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            }}>
              <i className="bi bi-box-arrow-in-right me-2" />Patient Portal
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(1.5rem,4vw,4rem)', flexWrap: 'wrap', marginTop: '4rem', position: 'relative' }}>
          {[
            { value: '10,000+', label: 'Registered Donors', icon: 'bi-people-fill' },
            { value: '50,000+', label: 'Units Donated', icon: 'bi-droplet-half' },
            { value: '3 Lives', label: 'Saved Per Donation', icon: 'bi-heart-pulse' },
            { value: '99.9%', label: 'System Uptime', icon: 'bi-shield-check' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <i className={'bi ' + s.icon} style={{ color: '#ef4444', fontSize: '1.3rem', display: 'block', marginBottom: 6 }} />
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.2rem,2.5vw,1.6rem)' }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ padding: 'clamp(3rem,8vw,6rem) 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 99, padding: '0.3rem 0.9rem', marginBottom: '1rem' }}>
              <i className="bi bi-droplet-fill" style={{ color: '#ef4444', fontSize: '0.8rem' }} />
              <span style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 700 }}>WHY DONATE?</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, color: '#0f2d55', lineHeight: 1.25, marginBottom: '1rem' }}>
              Every Donation<br />Matters
            </h2>
            <p style={{ color: '#6B7280', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Blood cannot be manufactured — it can only come from generous donors. Every 2 seconds, someone in the world needs blood. A single donation can save up to 3 lives.
            </p>
            {[
              { icon: 'bi-clock', text: 'Donation takes only 10–15 minutes' },
              { icon: 'bi-arrow-repeat', text: 'Your body replenishes blood within 24–48 hours' },
              { icon: 'bi-heart', text: 'Reduces risk of heart disease for donors' },
              { icon: 'bi-people', text: '1 in 7 hospital patients needs blood' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={'bi ' + item.icon} style={{ color: '#ef4444', fontSize: '0.9rem' }} />
                </div>
                <span style={{ color: '#374151', fontSize: '0.9rem' }}>{item.text}</span>
              </div>
            ))}
            <button onClick={() => navigate('/donate')} style={{
              marginTop: '1.5rem', background: '#ef4444', color: '#fff', border: 'none',
              borderRadius: 10, padding: '0.75rem 2rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="bi bi-heart-fill" />Become a Donor
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { bg: 'linear-gradient(135deg,#ef4444,#dc2626)', icon: 'bi-droplet-fill', title: 'A+', sub: 'Most Common' },
              { bg: 'linear-gradient(135deg,#2A7FFF,#1a6be0)', icon: 'bi-people-fill', title: 'O-', sub: 'Universal Donor' },
              { bg: 'linear-gradient(135deg,#00C9A7,#00a88c)', icon: 'bi-heart-pulse', title: '90 Days', sub: 'Donation Interval' },
              { bg: 'linear-gradient(135deg,#d97706,#b45309)', icon: 'bi-award', title: '3 Lives', sub: 'Per Donation' },
            ].map(card => (
              <div key={card.title} style={{ background: card.bg, borderRadius: 16, padding: '1.5rem', textAlign: 'center', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                <i className={'bi ' + card.icon} style={{ fontSize: '1.8rem', marginBottom: 8, display: 'block' }} />
                <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>{card.title}</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: 2 }}>{card.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: 'clamp(3rem,8vw,6rem) 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8f1ff', border: '1px solid #bfdbfe', borderRadius: 99, padding: '0.3rem 0.9rem', marginBottom: '1rem' }}>
              <i className="bi bi-stars" style={{ color: '#2A7FFF', fontSize: '0.8rem' }} />
              <span style={{ color: '#1d4ed8', fontSize: '0.78rem', fontWeight: 700 }}>PLATFORM FEATURES</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, color: '#0f2d55', marginBottom: '0.75rem' }}>Everything You Need</h2>
            <p style={{ color: '#6B7280', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
              A complete healthcare management platform built for modern hospitals and clinics.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.25rem' }}>
            {features.map(f => (
              <div key={f.title} style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 16, padding: '1.5rem', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <i className={'bi ' + f.icon} style={{ color: f.color, fontSize: '1.3rem' }} />
                </div>
                <h5 style={{ fontWeight: 700, color: '#1F2937', marginBottom: 6, fontSize: '1rem' }}>{f.title}</h5>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #0f2d55 0%, #1a4a7a 60%, #1a5c6e 100%)', padding: 'clamp(3rem,7vw,5rem) 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <i className="bi bi-heart-fill" style={{ color: '#ef4444', fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }} />
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.2rem)', marginBottom: '1rem' }}>Ready to Save a Life?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', lineHeight: 1.7 }}>
            Register as a donor today or sign in to access the full EHR platform.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/donate')} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, padding: '0.8rem 2rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              <i className="bi bi-heart-fill me-2" />Donate Blood
            </button>
            <button onClick={() => navigate('/login')} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '0.8rem 2rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
              <i className="bi bi-box-arrow-in-right me-2" />Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0a1f3d', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '0.75rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#2A7FFF,#00C9A7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-heart-pulse-fill" style={{ color: '#fff', fontSize: '0.85rem' }} />
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>MediCare EHR</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>
          {new Date().getFullYear()} MediCare EHR. Built to save lives.
        </p>
      </footer>

    </div>
  );
}
