import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';

// ── Type config ──────────────────────────────────────────────────
const TYPE_META = {
  appointment:   { icon: 'bi-calendar-check-fill', color: '#00a88c', bg: '#e0faf5', label: 'Appointment' },
  record:        { icon: 'bi-file-earmark-medical-fill', color: '#2A7FFF', bg: '#e8f1ff', label: 'Record' },
  blood_request: { icon: 'bi-droplet-fill',         color: '#dc2626', bg: '#fff0f0', label: 'Blood Request' },
  payment:       { icon: 'bi-currency-rupee',        color: '#7c3aed', bg: '#f3f0ff', label: 'Payment' },
  general:       { icon: 'bi-bell-fill',             color: '#6B7280', bg: '#f3f4f6', label: 'General' },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [total, setTotal]                 = useState(0);
  const [pages, setPages]                 = useState(1);
  const [page, setPage]                   = useState(1);
  const [loading, setLoading]             = useState(true);
  const [filterType, setFilterType]       = useState('');
  const [unreadOnly, setUnreadOnly]       = useState(false);
  const [clearing, setClearing]           = useState(false);

  const fetch = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 15 };
      if (filterType)  params.type = filterType;
      if (unreadOnly)  params.unreadOnly = 'true';
      const r = await api.get('/notifications', { params });
      setNotifications(r.data.notifications);
      setUnreadCount(r.data.unreadCount);
      setTotal(r.data.total);
      setPages(r.data.pages);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, [filterType, unreadOnly]);

  useEffect(() => { setPage(1); fetch(1); }, [fetch]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifications(ns => ns.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success('All marked as read');
  };

  const deleteOne = async (id, e) => {
    e.stopPropagation();
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifications(ns => ns.filter(n => n._id !== id));
    setTotal(t => t - 1);
  };

  const deleteAll = async () => {
    setClearing(true);
    try {
      await api.delete('/notifications/all');
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
      toast.success('All notifications cleared');
    } catch { toast.error('Failed to clear'); }
    finally { setClearing(false); }
  };

  const handleClick = (n) => {
    if (!n.read) markRead(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h4>Notifications</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button className="btn btn-outline-primary btn-sm" onClick={markAllRead}>
              <i className="bi bi-check2-all me-1" />Mark all read
            </button>
          )}
          {total > 0 && (
            <button className="btn btn-outline-danger btn-sm" onClick={deleteAll} disabled={clearing}>
              {clearing
                ? <span className="spinner-border spinner-border-sm me-1" />
                : <i className="bi bi-trash me-1" />}
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Type filter pills */}
            <button onClick={() => setFilterType('')}
              style={{ background: !filterType ? '#1F2937' : '#f3f4f6', color: !filterType ? '#fff' : '#6B7280', border: 'none', borderRadius: 99, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
              All ({total})
            </button>
            {Object.entries(TYPE_META).map(([key, meta]) => (
              <button key={key} onClick={() => setFilterType(key === filterType ? '' : key)}
                style={{ background: filterType === key ? meta.color : '#f3f4f6', color: filterType === key ? '#fff' : '#6B7280', border: 'none', borderRadius: 99, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                <i className={`bi ${meta.icon} me-1`} />{meta.label}
              </button>
            ))}

            {/* Unread toggle */}
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}>
              <div onClick={() => setUnreadOnly(v => !v)}
                style={{ width: 36, height: 20, borderRadius: 99, background: unreadOnly ? '#2A7FFF' : '#d1d5db', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: unreadOnly ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              Unread only
            </label>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? <Spinner /> : notifications.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5" style={{ color: 'var(--text-muted)' }}>
            <i className="bi bi-bell-slash d-block mb-2" style={{ fontSize: '2.5rem' }} />
            {filterType || unreadOnly ? 'No notifications match your filter.' : 'No notifications yet.'}
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {notifications.map((n, i) => {
            const meta = TYPE_META[n.type] || TYPE_META.general;
            return (
              <div key={n._id}
                onClick={() => handleClick(n)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '1rem 1.25rem',
                  borderBottom: i < notifications.length - 1 ? '1px solid #f3f4f6' : 'none',
                  background: n.read ? '#fff' : '#f0f7ff',
                  cursor: 'pointer', transition: 'background 0.15s',
                  borderLeft: `3px solid ${n.read ? 'transparent' : meta.color}`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = n.read ? '#f8fafc' : '#e8f3ff'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? '#fff' : '#f0f7ff'}
              >
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: '1rem' }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: n.read ? 500 : 700, color: '#1F2937', fontSize: '0.875rem', lineHeight: 1.4 }}>
                      {n.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{timeAgo(n.createdAt)}</span>
                      {!n.read && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                      )}
                      <button
                        onClick={(e) => deleteOne(n._id, e)}
                        style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, lineHeight: 1, fontSize: '0.85rem' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}
                        title="Delete"
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: 3, lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ background: meta.bg, color: meta.color, fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {meta.label}
                    </span>
                    {n.link && (
                      <span style={{ fontSize: '0.72rem', color: '#2A7FFF', fontWeight: 600 }}>
                        <i className="bi bi-arrow-right me-1" />View
                      </span>
                    )}
                    {!n.read && (
                      <button onClick={(e) => { e.stopPropagation(); markRead(n._id); }}
                        style={{ background: 'none', border: 'none', color: '#2A7FFF', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div style={{ marginTop: '1rem' }}>
          <Pagination page={page} pages={pages} onPageChange={(p) => { setPage(p); fetch(p); }} />
        </div>
      )}
    </div>
  );
}
