import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { usePermissions, ALL_MODULES, ALL_ACTIONS } from '../context/PermissionsContext';
import { toast } from 'react-toastify';
import api from '../utils/api';
import Spinner, { CardSkeleton } from '../components/Spinner';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

// ── Shared chart options ─────────────────────────────────────────
const BASE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 }, precision: 0 } },
  },
};

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, sub, format }) {
  const display = value == null
    ? <span style={{ color: 'var(--text-light)' }}>—</span>
    : format === 'currency'
      ? `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
      : value;

  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card" style={{ borderTop: `3px solid ${accent}`, borderRadius: 12 }}>
        <div className="card-body d-flex justify-content-between align-items-center gap-3">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{display}</div>
            {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: '1.25rem', flexShrink: 0 }}>
            <i className={`bi ${icon}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Permissions section (unchanged logic) ───────────────────────
const MODULE_LABELS = {
  dashboard:    { label: 'Dashboard',     icon: 'bi-speedometer2' },
  patients:     { label: 'Patients',      icon: 'bi-people' },
  doctors:      { label: 'Doctors',       icon: 'bi-person-badge' },
  appointments: { label: 'Appointments',  icon: 'bi-calendar-check' },
  records:      { label: 'Records',       icon: 'bi-file-earmark-text' },
  vitals:       { label: 'Vitals',        icon: 'bi-activity' },
  timeline:     { label: 'Timeline',      icon: 'bi-clock-history' },
  audit:        { label: 'Audit Logs',    icon: 'bi-shield-check' },
  profile:      { label: 'Profile',       icon: 'bi-person-circle' },
  notifications:{ label: 'Notifications', icon: 'bi-bell' },
};
const ACTION_META = {
  view:   { label: 'View',   color: '#2A7FFF', bg: '#EBF3FF' },
  create: { label: 'Create', color: '#00C9A7', bg: '#E6FAF7' },
  edit:   { label: 'Edit',   color: '#d97706', bg: '#FEF3C7' },
  delete: { label: 'Delete', color: '#dc2626', bg: '#FEE2E2' },
};
const ROLES = [
  { key: 'doctor',  label: 'Doctor',  icon: 'bi-person-badge', color: '#2A7FFF', bg: '#EBF3FF' },
  { key: 'patient', label: 'Patient', icon: 'bi-person',       color: '#00C9A7', bg: '#E6FAF7' },
];
const TEMPLATES = {
  fullAccess: Object.fromEntries(ALL_MODULES.map(m => [m, { view: true, create: true, edit: true, delete: true }])),
  readOnly:   Object.fromEntries(ALL_MODULES.map(m => [m, { view: true, create: false, edit: false, delete: false }])),
  noAccess:   Object.fromEntries(ALL_MODULES.map(m => [m, { view: false, create: false, edit: false, delete: false }])),
};
const clonePerms = (perms) => {
  const src = (perms && typeof perms === 'object') ? perms : {};
  const result = {};
  for (const mod of ALL_MODULES) {
    const actions = src[mod] || {};
    result[mod] = { view: !!actions.view, create: !!actions.create, edit: !!actions.edit, delete: !!actions.delete };
  }
  return result;
};
const Toggle = ({ on, onChange }) => (
  <div onClick={onChange} style={{ width: 36, height: 20, borderRadius: 99, cursor: 'pointer', background: on ? 'var(--primary)' : '#d1d5db', position: 'relative', transition: 'background 0.2s', display: 'inline-block' }}>
    <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
  </div>
);

// ── Main Component ───────────────────────────────────────────────
export default function SuperAdminDashboard() {
  // ── Analytics state ──────────────────────────────────────────
  const [data, setData]       = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    api.get('/users/admin-stats')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  // ── Permissions state ────────────────────────────────────────
  const { allRolePerms, updateRolePermissions } = usePermissions();
  const [localPerms, setLocalPerms] = useState({});
  const [activeRole, setActiveRole] = useState('doctor');
  const [saving, setSaving]         = useState(false);
  const [dirty, setDirty]           = useState(false);

  useEffect(() => {
    if (allRolePerms.length > 0) {
      const map = {};
      allRolePerms.forEach(r => { map[r.role] = clonePerms(r.permissions); });
      setLocalPerms(map);
      setDirty(false);
    }
  }, [allRolePerms]);

  const toggle = (module, action) => {
    setLocalPerms(prev => {
      const rolePerms = clonePerms(prev[activeRole]);
      const newVal = !rolePerms[module][action];
      rolePerms[module][action] = newVal;
      if (action === 'view' && !newVal) { rolePerms[module].create = false; rolePerms[module].edit = false; rolePerms[module].delete = false; }
      if (action !== 'view' && newVal) rolePerms[module].view = true;
      return { ...prev, [activeRole]: rolePerms };
    });
    setDirty(true);
  };
  const toggleAll = (module) => {
    const perms = localPerms[activeRole]?.[module] || {};
    const allOn = ALL_ACTIONS.every(a => perms[a]);
    setLocalPerms(prev => {
      const rolePerms = clonePerms(prev[activeRole]);
      rolePerms[module] = Object.fromEntries(ALL_ACTIONS.map(a => [a, !allOn]));
      return { ...prev, [activeRole]: rolePerms };
    });
    setDirty(true);
  };
  const toggleColumn = (action) => {
    const perms = localPerms[activeRole] || {};
    const allOn = ALL_MODULES.every(m => perms[m]?.[action]);
    setLocalPerms(prev => {
      const rolePerms = clonePerms(prev[activeRole]);
      ALL_MODULES.forEach(m => {
        rolePerms[m][action] = !allOn;
        if (action === 'view' && allOn) { rolePerms[m].create = false; rolePerms[m].edit = false; rolePerms[m].delete = false; }
        if (action !== 'view' && !allOn) rolePerms[m].view = true;
      });
      return { ...prev, [activeRole]: rolePerms };
    });
    setDirty(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      await updateRolePermissions(activeRole, localPerms[activeRole] || {});
      toast.success(`${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} permissions saved`);
      setDirty(false);
    } catch { toast.error('Failed to save permissions'); }
    finally { setSaving(false); }
  };
  const applyTemplate = (tpl) => {
    setLocalPerms(prev => ({ ...prev, [activeRole]: clonePerms(TEMPLATES[tpl]) }));
    setDirty(true);
    toast.info(`Applied "${tpl}" template — save to confirm`);
  };

  const activePerms  = localPerms[activeRole] || {};
  const roleMeta     = ROLES.find(r => r.key === activeRole);
  const enabledCount = ALL_MODULES.filter(m => activePerms[m]?.view).length;

  // ── Chart data ───────────────────────────────────────────────
  const trends = data?.trends;
  const apptChartData = trends ? {
    labels: trends.labels,
    datasets: [{
      label: 'Appointments',
      data: trends.appointmentCounts,
      backgroundColor: 'rgba(42,127,255,0.15)',
      borderColor: '#2A7FFF',
      borderWidth: 2,
      borderRadius: 6,
    }],
  } : null;

  const patientChartData = trends ? {
    labels: trends.labels,
    datasets: [{
      label: 'New Patients',
      data: trends.patientCounts,
      fill: true,
      backgroundColor: 'rgba(0,201,167,0.1)',
      borderColor: '#00C9A7',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#00C9A7',
    }],
  } : null;

  const revenueChartData = trends ? {
    labels: trends.labels,
    datasets: [{
      label: 'Revenue (₹)',
      data: trends.revenueCounts,
      fill: true,
      backgroundColor: 'rgba(124,58,237,0.1)',
      borderColor: '#7c3aed',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#7c3aed',
    }],
  } : null;

  const bloodGroupChartData = data?.bloodGroups?.labels?.length ? {
    labels: data.bloodGroups.labels,
    datasets: [{
      data: data.bloodGroups.counts,
      backgroundColor: ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'],
      borderWidth: 0,
    }],
  } : null;

  const t = data?.totals;

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h4>Admin Dashboard</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Platform-wide overview</p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {statsLoading ? <CardSkeleton count={8} /> : (
        <>
          <div className="row g-3 mb-4">
            <StatCard label="Total Patients"    value={t?.totalPatients}      icon="bi-people"          accent="var(--primary)"  sub={`${t?.totalDoctors ?? 0} doctors`} />
            <StatCard label="Total Appointments" value={t?.totalAppointments} icon="bi-calendar-check"  accent="#f59e0b"         sub={`${t?.pendingAppointments ?? 0} pending · ${t?.completedAppointments ?? 0} done`} />
            <StatCard label="Blood Requests"    value={t?.totalBloodRequests} icon="bi-droplet-half"    accent="#ef4444"         sub={`${t?.pendingBloodRequests ?? 0} pending · ${t?.fulfilledBloodRequests ?? 0} fulfilled`} />
            <StatCard label="Total Revenue"     value={t?.totalRevenue}       icon="bi-currency-rupee"  accent="#7c3aed"         sub={`Appt: ₹${(t?.apptRevenue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} · Blood: ₹${(t?.bloodRevenue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} format="currency" />
          </div>

          {/* ── Secondary Cards ── */}
          <div className="row g-3 mb-4">
            <StatCard label="Registered Donors"  value={t?.totalDonors}           icon="bi-heart-fill"     accent="#ef4444" />
            <StatCard label="Completed Appts"    value={t?.completedAppointments} icon="bi-check-circle"   accent="#00C9A7" />
            <StatCard label="Pending Requests"   value={t?.pendingBloodRequests}  icon="bi-clock-history"  accent="#f59e0b" />
            <StatCard label="Fulfilled Requests" value={t?.fulfilledBloodRequests} icon="bi-bag-check"     accent="#2A7FFF" />
          </div>

          {/* ── Charts Row 1 ── */}
          {trends && (
            <div className="row g-3 mb-4">
              <div className="col-lg-8">
                <div className="card h-100">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <span><i className="bi bi-bar-chart me-2" style={{ color: '#2A7FFF' }} />Appointments — Last 6 Months</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total: {trends.appointmentCounts.reduce((a, b) => a + b, 0)}</span>
                  </div>
                  <div className="card-body" style={{ height: 230 }}>
                    <Bar data={apptChartData} options={BASE_OPTS} />
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="card h-100">
                  <div className="card-header">
                    <i className="bi bi-droplet-half me-2" style={{ color: '#ef4444' }} />Donors by Blood Group
                  </div>
                  <div className="card-body d-flex align-items-center justify-content-center" style={{ height: 230 }}>
                    {bloodGroupChartData
                      ? <Doughnut data={bloodGroupChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12 } } } }} />
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No donor data yet</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Charts Row 2 ── */}
          {trends && (
            <div className="row g-3 mb-4">
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <span><i className="bi bi-people me-2" style={{ color: '#00C9A7' }} />New Patients — Last 6 Months</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total: {trends.patientCounts.reduce((a, b) => a + b, 0)}</span>
                  </div>
                  <div className="card-body" style={{ height: 210 }}>
                    <Line data={patientChartData} options={BASE_OPTS} />
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <span><i className="bi bi-currency-rupee me-2" style={{ color: '#7c3aed' }} />Monthly Revenue — Last 6 Months</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{trends.revenueCounts.reduce((a, b) => a + b, 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="card-body" style={{ height: 210 }}>
                    <Line data={revenueChartData} options={{ ...BASE_OPTS, scales: { ...BASE_OPTS.scales, y: { ...BASE_OPTS.scales.y, ticks: { ...BASE_OPTS.scales.y.ticks, callback: v => `₹${v}` } } } }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Permissions Section ── */}
      <div className="page-header mt-2">
        <div>
          <h4>Permissions Management</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Configure module-level access for each role</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !dirty}>
          {saving ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : <><i className="bi bi-check2-circle me-1" />Save Changes</>}
        </button>
      </div>

      <div className="d-flex gap-3 mb-3 flex-wrap">
        {ROLES.map(r => {
          const isActive = activeRole === r.key;
          const count = ALL_MODULES.filter(m => localPerms[r.key]?.[m]?.view).length;
          return (
            <div key={r.key} onClick={() => { setActiveRole(r.key); setDirty(false); }} className="card"
              style={{ cursor: 'pointer', minWidth: 160, border: isActive ? `2px solid ${r.color}` : '2px solid var(--border)', background: isActive ? r.bg : 'var(--card)', transition: 'all 0.15s' }}>
              <div className="card-body py-3 px-4">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: isActive ? r.color : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#fff' : r.color, fontSize: '1.1rem' }}>
                    <i className={`bi ${r.icon}`} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: isActive ? r.color : 'var(--text)' }}>{r.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{count} / {ALL_MODULES.length} modules</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Templates:</span>
        {[{ key: 'fullAccess', label: 'Full Access', color: 'var(--primary)' }, { key: 'readOnly', label: 'Read Only', color: '#0891b2' }, { key: 'noAccess', label: 'No Access', color: '#ef4444' }].map(t => (
          <button key={t.key} className="btn btn-sm"
            style={{ fontSize: '0.75rem', padding: '3px 12px', background: 'var(--bg)', border: `1px solid ${t.color}40`, color: t.color, fontWeight: 600, borderRadius: 99 }}
            onClick={() => applyTemplate(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        {ALL_ACTIONS.map(action => {
          const m = ACTION_META[action];
          return (
            <div key={action} className="d-flex align-items-center gap-2">
              <div style={{ width: 10, height: 10, borderRadius: 3, background: m.color }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{m.label}</span>
            </div>
          );
        })}
      </div>

      {allRolePerms.length === 0 ? (
        <div className="card"><div className="card-body text-center py-5" style={{ color: 'var(--text-light)' }}><i className="bi bi-shield-lock d-block mb-2" style={{ fontSize: '2.5rem' }} />Loading permissions...</div></div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table mb-0" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: roleMeta?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: roleMeta?.color, fontSize: '0.85rem' }}>
                        <i className={`bi ${roleMeta?.icon}`} />
                      </div>
                      Module
                    </div>
                  </th>
                  {ALL_ACTIONS.map(action => (
                    <th key={action} style={{ width: '15%', textAlign: 'center' }}>
                      <span style={{ background: ACTION_META[action].bg, color: ACTION_META[action].color, fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {ACTION_META[action].label}
                      </span>
                    </th>
                  ))}
                  <th style={{ width: '10%', textAlign: 'center' }}>All</th>
                </tr>
                <tr style={{ background: 'var(--bg)' }}>
                  <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, paddingLeft: 16 }}>TOGGLE ALL</td>
                  {ALL_ACTIONS.map(action => {
                    const allOn = ALL_MODULES.every(m => activePerms[m]?.[action]);
                    return <td key={action} style={{ textAlign: 'center' }}><Toggle on={allOn} onChange={() => toggleColumn(action)} /></td>;
                  })}
                  <td />
                </tr>
              </thead>
              <tbody>
                {ALL_MODULES.map(mod => {
                  const modPerms = activePerms[mod] || {};
                  const allOn = ALL_ACTIONS.every(a => modPerms[a]);
                  const anyOn = ALL_ACTIONS.some(a => modPerms[a]);
                  const meta  = MODULE_LABELS[mod] || { label: mod, icon: 'bi-circle' };
                  return (
                    <tr key={mod} style={{ background: anyOn ? 'transparent' : 'var(--bg)' }}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <i className={`bi ${meta.icon}`} style={{ color: anyOn ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1rem', width: 18 }} />
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: anyOn ? 'var(--text)' : 'var(--text-muted)' }}>{meta.label}</span>
                        </div>
                      </td>
                      {ALL_ACTIONS.map(action => (
                        <td key={action} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <Toggle on={!!modPerms[action]} onChange={() => toggle(mod, action)} />
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <button className="btn btn-sm"
                          style={{ fontSize: '0.7rem', padding: '2px 10px', background: allOn ? '#fee2e2' : 'var(--primary-light)', color: allOn ? '#dc2626' : 'var(--primary)', border: 'none', borderRadius: 99, fontWeight: 600 }}
                          onClick={() => toggleAll(mod)}>
                          {allOn ? 'None' : 'All'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="d-flex align-items-center justify-content-between py-2 px-4"
            style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', borderRadius: '0 0 12px 12px' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <i className="bi bi-eye me-1" />{enabledCount} of {ALL_MODULES.length} modules visible for <strong>{roleMeta?.label}</strong>
            </span>
            {dirty && <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 600 }}><i className="bi bi-exclamation-circle me-1" />Unsaved changes</span>}
          </div>
        </div>
      )}
    </div>
  );
}
