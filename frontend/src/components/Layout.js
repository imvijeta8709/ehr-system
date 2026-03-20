import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import api from '../utils/api';

export default function Layout() {
  const { user, logout } = useAuth();
  const { canDo } = usePermissions();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdminLike  = user?.role === 'admin' || isSuperAdmin;
  const isStaff      = isAdminLike || user?.role === 'doctor';

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

  return (
    <div className="d-flex">
      {/* ── Sidebar ── */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-top d-flex align-items-center gap-2 mb-1">
            <div className="brand-icon">
              <i className="bi bi-heart-pulse-fill text-white" style={{ fontSize: '1.1rem' }} />
            </div>
            <h5 className="mb-0">EHR System</h5>
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
          <NavLink to="/dashboard"><i className="bi bi-speedometer2" />Dashboard</NavLink>
        )}

        {canDo('patients', 'view') && isStaff && (
          <NavLink to="/patients"><i className="bi bi-people" />Patients</NavLink>
        )}

        {canDo('doctors', 'view') && isStaff && (
          <NavLink to="/doctors"><i className="bi bi-person-badge" />Doctors</NavLink>
        )}

        {canDo('appointments', 'view') && (
          <NavLink to="/appointments"><i className="bi bi-calendar-check" />Appointments</NavLink>
        )}

        {canDo('vitals', 'view') && (
          <NavLink to="/vitals"><i className="bi bi-activity" />Vitals</NavLink>
        )}

        <NavLink to="/blood-bank"><i className="bi bi-droplet-half" />Blood Bank</NavLink>

        {canDo('timeline', 'view') && user?.role === 'patient' && (
          <NavLink to="/timeline"><i className="bi bi-clock-history" />My Timeline</NavLink>
        )}

        {canDo('records', 'view') && isStaff && (
          <>
            <div className="sidebar-section-label">Records</div>
            <NavLink to="/records/new"><i className="bi bi-file-earmark-plus" />New Record</NavLink>
          </>
        )}

        {(isAdminLike) && (
          <>
            <div className="sidebar-section-label">Admin</div>
            {canDo('audit', 'view') && (
              <NavLink to="/audit"><i className="bi bi-shield-check" />Audit Logs</NavLink>
            )}
            {isSuperAdmin && (
              <NavLink to="/dashboard"><i className="bi bi-sliders" />Permissions</NavLink>
            )}
          </>
        )}

        <div className="sidebar-section-label">Account</div>
        {canDo('profile', 'view') && (
          <NavLink to="/profile"><i className="bi bi-person-circle" />Profile</NavLink>
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
                      <span>Notifications</span>
                      {unread > 0 && (
                        <button className="btn btn-link btn-sm p-0" style={{ fontSize: '0.78rem' }} onClick={handleMarkAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-center py-4" style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                        <i className="bi bi-bell-slash d-block mb-1" style={{ fontSize: '1.5rem' }} />
                        No notifications
                      </div>
                    ) : notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`notif-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => {
                          api.put(`/notifications/${n._id}/read`).catch(() => {});
                          setShowNotif(false);
                          if (n.link) navigate(n.link);
                        }}
                      >
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-msg">{n.message}</div>
                        <div className="notif-item-time">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* User chip */}
          <div
            className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.8125rem', cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
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
