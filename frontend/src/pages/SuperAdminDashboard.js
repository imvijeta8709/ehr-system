import React, { useState, useEffect } from 'react';
import { usePermissions, ALL_MODULES, ALL_ACTIONS } from '../context/PermissionsContext';
import { toast } from 'react-toastify';

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

// Safely deep-clone a permissions object, filling in missing modules/actions with false
const clonePerms = (perms) => {
  const src = (perms && typeof perms === 'object') ? perms : {};
  const result = {};
  for (const mod of ALL_MODULES) {
    const actions = src[mod] || {};
    result[mod] = {
      view:   !!actions.view,
      create: !!actions.create,
      edit:   !!actions.edit,
      delete: !!actions.delete,
    };
  }
  return result;
};

const Toggle = ({ on, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: 36, height: 20, borderRadius: 99, cursor: 'pointer',
      background: on ? 'var(--primary)' : '#d1d5db',
      position: 'relative', transition: 'background 0.2s',
      display: 'inline-block',
    }}
  >
    <div style={{
      position: 'absolute', top: 2,
      left: on ? 18 : 2,
      width: 16, height: 16, borderRadius: '50%',
      background: '#fff', transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    }} />
  </div>
);

export default function SuperAdminDashboard() {
  const { allRolePerms, allModules, allActions, updateRolePermissions } = usePermissions();
  const [localPerms, setLocalPerms] = useState({});
  const [activeRole, setActiveRole] = useState('doctor');
  const [saving, setSaving]         = useState(false);
  const [dirty, setDirty]           = useState(false);

  // Sync from server data whenever allRolePerms loads/changes
  useEffect(() => {
    if (allRolePerms.length > 0) {
      const map = {};
      allRolePerms.forEach((r) => { map[r.role] = clonePerms(r.permissions); });
      setLocalPerms(map);
      setDirty(false);
    }
  }, [allRolePerms]);

  const toggle = (module, action) => {
    setLocalPerms((prev) => {
      const rolePerms = clonePerms(prev[activeRole]);
      const newVal = !rolePerms[module][action];
      rolePerms[module][action] = newVal;
      // Disabling view removes all other actions
      if (action === 'view' && !newVal) {
        rolePerms[module].create = false;
        rolePerms[module].edit   = false;
        rolePerms[module].delete = false;
      }
      // Enabling create/edit/delete auto-enables view
      if (action !== 'view' && newVal) {
        rolePerms[module].view = true;
      }
      return { ...prev, [activeRole]: rolePerms };
    });
    setDirty(true);
  };

  const toggleAll = (module) => {
    const perms = localPerms[activeRole]?.[module] || {};
    const allOn = ALL_ACTIONS.every((a) => perms[a]);
    setLocalPerms((prev) => {
      const rolePerms = clonePerms(prev[activeRole]);
      rolePerms[module] = Object.fromEntries(ALL_ACTIONS.map((a) => [a, !allOn]));
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
    } catch {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const activePerms  = localPerms[activeRole] || {};
  const roleMeta     = ROLES.find((r) => r.key === activeRole);
  const enabledCount = ALL_MODULES.filter((m) => activePerms[m]?.view).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h4>Permissions Management</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Configure module-level access for each role
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !dirty}>
          {saving
            ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</>
            : <><i className="bi bi-check2-circle me-1" />Save Changes</>}
        </button>
      </div>

      {/* Role selector tabs */}
      <div className="d-flex gap-3 mb-4">
        {ROLES.map((r) => {
          const isActive = activeRole === r.key;
          const count    = ALL_MODULES.filter((m) => localPerms[r.key]?.[m]?.view).length;
          return (
            <div
              key={r.key}
              onClick={() => { setActiveRole(r.key); setDirty(false); }}
              className="card"
              style={{
                cursor: 'pointer', minWidth: 160,
                border: isActive ? `2px solid ${r.color}` : '2px solid var(--border)',
                background: isActive ? r.bg : 'var(--card)',
                transition: 'all 0.15s',
              }}
            >
              <div className="card-body py-3 px-4">
                <div className="d-flex align-items-center gap-3">
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: isActive ? r.color : 'var(--bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isActive ? '#fff' : r.color, fontSize: '1.1rem',
                  }}>
                    <i className={`bi ${r.icon}`} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: isActive ? r.color : 'var(--text)' }}>{r.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {count} / {ALL_MODULES.length} modules
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action legend */}
      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        {ALL_ACTIONS.map((action) => {
          const m = ACTION_META[action];
          return (
            <div key={action} className="d-flex align-items-center gap-2">
              <div style={{ width: 10, height: 10, borderRadius: 3, background: m.color }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{m.label}</span>
            </div>
          );
        })}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          <i className="bi bi-info-circle me-1" />
          Disabling View removes all actions. Enabling Create/Edit/Delete auto-enables View.
        </span>
      </div>

      {/* Matrix table */}
      {allRolePerms.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5" style={{ color: 'var(--text-light)' }}>
            <i className="bi bi-shield-lock d-block mb-2" style={{ fontSize: '2.5rem' }} />
            Loading permissions...
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table mb-0" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: roleMeta?.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: roleMeta?.color, fontSize: '0.85rem',
                      }}>
                        <i className={`bi ${roleMeta?.icon}`} />
                      </div>
                      Module
                    </div>
                  </th>
                  {ALL_ACTIONS.map((action) => (
                    <th key={action} style={{ width: '15%', textAlign: 'center' }}>
                      <span style={{
                        background: ACTION_META[action].bg,
                        color: ACTION_META[action].color,
                        fontSize: '0.7rem', fontWeight: 700,
                        padding: '3px 10px', borderRadius: 99,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {ACTION_META[action].label}
                      </span>
                    </th>
                  ))}
                  <th style={{ width: '10%', textAlign: 'center' }}>All</th>
                </tr>
              </thead>
              <tbody>
                {ALL_MODULES.map((mod) => {
                  const modPerms = activePerms[mod] || {};
                  const allOn    = ALL_ACTIONS.every((a) => modPerms[a]);
                  const anyOn    = ALL_ACTIONS.some((a) => modPerms[a]);
                  const meta     = MODULE_LABELS[mod] || { label: mod, icon: 'bi-circle' };
                  return (
                    <tr key={mod} style={{ background: anyOn ? 'transparent' : 'var(--bg)' }}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <i
                            className={`bi ${meta.icon}`}
                            style={{ color: anyOn ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1rem', width: 18 }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: anyOn ? 'var(--text)' : 'var(--text-muted)' }}>
                            {meta.label}
                          </span>
                        </div>
                      </td>
                      {ALL_ACTIONS.map((action) => (
                        <td key={action} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <Toggle on={!!modPerms[action]} onChange={() => toggle(mod, action)} />
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <button
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.7rem', padding: '2px 10px',
                            background: allOn ? '#fee2e2' : 'var(--primary-light)',
                            color: allOn ? '#dc2626' : 'var(--primary)',
                            border: 'none', borderRadius: 99, fontWeight: 600,
                          }}
                          onClick={() => toggleAll(mod)}
                        >
                          {allOn ? 'None' : 'All'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div
            className="d-flex align-items-center justify-content-between py-2 px-4"
            style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', borderRadius: '0 0 12px 12px' }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <i className="bi bi-eye me-1" />
              {enabledCount} of {ALL_MODULES.length} modules visible for <strong>{roleMeta?.label}</strong>
            </span>
            {dirty && (
              <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 600 }}>
                <i className="bi bi-exclamation-circle me-1" />Unsaved changes
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
