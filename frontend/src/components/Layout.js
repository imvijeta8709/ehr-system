import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import api from '../utils/api';

// Notification type → icon + color
const NOTIF_META = {
  appointment:   { icon: 'bi-calendar-check-fill',        color: '#00a88c', bg: '#e0faf5' },
  record:        { icon: 'bi-file-earmark-medical-fill',  color: '#2A7FFF', bg: '#e8f1ff' },
  blood_request: { icon: 'bi-droplet-fill',               color: '#dc2626', bg: '#fff0f0' },
  payment:       { icon: 'bi-currency-rupee',             color: '#7c3aed', bg: '#f3f0ff' },
  general:       { icon: 'bi-bell-fill',                  color: '#6B7280', bg: '#f3f4f6' },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { canDo } = usePermissions();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdminLike  = user?.role === 'admin' || isSuperAdmin;
  const isStaff      = isAdminLike || user?.role === 'doctor';

  // Close sidebar on nav (mobile)
  const NavItem = ({ to, children }) => (
    <NavLink to={to} onClick={closeSidebar}>{children}</NavLink>
  );

  const fetchNotifications = useCallback(() => {
    if (!canDo('notifications', 'view')) return;
    api.get('/notifications').then((r) => {
      setNotifications(r.data.notifications);
      setUnread(r.data.unreadCount);
    }).catch(() => {});
  }, [canDo]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = () => {
    api.put('/notifications/read-all').then(() => {
      setUnread(0);
      setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="d-flex">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* ── Sidebar ── */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-top d-flex align-items-center gap-2 mb-1">
            <div className="brand-icon">
              <i className="bi bi-heart-pulse-fill text-white" style={{ fontSize: '1.1rem' }} />
            </div>
            <h5 className="mb-0">EHR System</h5>
            <button
              onClick={closeSidebar}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', cursor: 'pointer', display: 'none' }}
              className="sidebar-close-btn"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
          <small>{user?.name}</small>
          <div>
            <span style={{
              fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em',
              background: 'rgba(0,201,167,0.2)', color: '#00C9A7',
              padding: '1px 8px', borderRadius: 99, textTransform: 'uppercase',
            }}>
              {user?.role}
            </span>
          </div>
        </div>

        <div className="sidebar-section-label">Main</div>

        {canDo('dashboard', 'view') && (
          <NavItem to="/app/dashboard"><i className="bi bi-speedometer2" />Dashboard</NavItem>
        )}

        {canDo('patients', 'view') && isStaff && (
          <NavItem to="/app/patients"><i className="bi bi-people" />Patients</NavItem>
        )}

        {canDo('doctors', 'view') && isStaff && (
          <NavItem to="/app/doctors"><i className="bi bi-person-badge" />Doctors</NavItem>
        )}

        {canDo('appointments', 'view') && (
          <NavItem to="/app/appointments"><i className="bi bi-calendar-check" />Appointments</NavItem>
        )}

        {user?.role === 'doctor' && (
          <NavItem to="/app/availability"><i className="bi bi-calendar2-week" />My Availability</NavItem>
        )}

        {canDo('vitals', 'view') && (
          <NavItem to="/app/vitals"><i className="bi bi-activity" />Vitals</NavItem>
        )}

        <NavItem to="/app/blood-bank"><i className="bi bi-droplet-half" />Blood Bank</NavItem>

        <NavItem to="/app/symptom-checker"><i className="bi bi-robot" />Symptom Checker</NavItem>

        <NavItem to="/app/documents"><i className="bi bi-folder2" />Documents</NavItem>

        <NavItem to="/app/billing"><i className="bi bi-receipt" />Billing</NavItem>

        {canDo('timeline', 'view') && user?.role === 'patient' && (
          <NavItem to="/app/timeline"><i className="bi bi-clock-history" />My Timeline</NavItem>
        )}

        {canDo('records', 'view') && isStaff && (
          <>
            <div className="sidebar-section-label">Records</div>
            <NavItem to="/app/records/new"><i className="bi bi-file-earmark-plus" />New Record</NavItem>
          </>
        )}

        {(isAdminLike) && (
          <>
            <div className="sidebar-section-label">Admin</div>
            {canDo('audit', 'view') && (
              <NavItem to="/app/audit"><i className="bi bi-shield-check" />Audit Logs</NavItem>
            )}
            {isSuperAdmin && (
              <NavItem to="/app/dashboard"><i className="bi bi-sliders" />Permissions</NavItem>
            )}
          </>
        )}

        <div className="sidebar-section-label">Account</div>
        {canDo('notifications', 'view') && (
          <NavItem to="/app/notifications">
            <i className="bi bi-bell" />Notifications
            {unread > 0 && <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{unread}</span>}
          </NavItem>
        )}
        {canDo('profile', 'view') && (
          <NavItem to="/app/profile"><i className="bi bi-person-circle" />Profile</NavItem>
        )}

        <div className="sidebar-footer">
          <button
            className="btn btn-sm w-100 text-start d-flex align-items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: 'none', borderRadius: 8 }}
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right" />Logout
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main-content flex-grow-1">
        {/* Top bar */}
        <div className="topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(v => !v)}>
            <i className="bi bi-list" />
          </button>
          <div className="position-relative">
            {canDo('notifications', 'view') && (
              <>
                <button className="notif-bell-btn" onClick={() => setShowNotif((v) => !v)}>
                  <i className="bi bi-bell" style={{ fontSize: '1.05rem' }} />
                  {unread > 0 && <span className="notif-badge">{unread}</span>}
                </button>

                {showNotif && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span>
                        Notifications
                        {unread > 0 && (
                          <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 99 }}>
                            {unread}
                          </span>
                        )}
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {unread > 0 && (
                          <button className="btn btn-link btn-sm p-0" style={{ fontSize: '0.75rem' }} onClick={handleMarkAllRead}>
                            Mark all read
                          </button>
                        )}
                        <button className="btn btn-link btn-sm p-0" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                          onClick={() => { setShowNotif(false); navigate('/app/notifications'); }}>
                          View all
                        </button>
                      </div>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-center py-4" style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                        <i className="bi bi-bell-slash d-block mb-1" style={{ fontSize: '1.5rem' }} />
                        No notifications
                      </div>
                    ) : notifications.map((n) => {
                      const meta = NOTIF_META[n.type] || NOTIF_META.general;
                      return (
                        <div
                          key={n._id}
                          className={`notif-item ${!n.read ? 'unread' : ''}`}
                          style={{ borderLeft: `3px solid ${n.read ? 'transparent' : meta.color}` }}
                          onClick={() => {
                            if (!n.read) {
                              api.put(`/notifications/${n._id}/read`).catch(() => {});
                              setUnread(c => Math.max(0, c - 1));
                              setNotifications(ns => ns.map(x => x._id === n._id ? { ...x, read: true } : x));
                            }
                            setShowNotif(false);
                            if (n.link) navigate(n.link);
                          }}
                        >
                          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: '0.85rem' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                                <div className="notif-item-title" style={{ fontWeight: n.read ? 500 : 700 }}>{n.title}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>{timeAgo(n.createdAt)}</span>
                                  {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color }} />}
                                </div>
                              </div>
                              <div className="notif-item-msg">{n.message}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {notifications.length > 0 && (
                      <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                        <button className="btn btn-link btn-sm p-0" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}
                          onClick={() => { setShowNotif(false); navigate('/app/notifications'); }}>
                          View all notifications <i className="bi bi-arrow-right ms-1" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* User chip */}
          <div
            className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.8125rem', cursor: 'pointer' }}
            onClick={() => navigate('/app/profile')}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
              style={{ width: 28, height: 28, fontSize: '0.75rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{user?.name}</span>
          </div>
        </div>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
