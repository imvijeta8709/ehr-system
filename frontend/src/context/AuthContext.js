import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

// Access token expires in 15m — refresh 2 min before expiry
const REFRESH_BEFORE_MS = 2 * 60 * 1000;

function parseTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // ms
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer          = useRef(null);

  const scheduleRefresh = (token) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const expiry = parseTokenExpiry(token);
    if (!expiry) return;
    const delay = expiry - Date.now() - REFRESH_BEFORE_MS;
    if (delay <= 0) {
      doRefresh();
      return;
    }
    refreshTimer.current = setTimeout(doRefresh, delay);
  };

  const doRefresh = async () => {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) return;
    try {
      const res = await api.post('/auth/refresh', { refreshToken: rt });
      const { token, refreshToken: newRt } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRt);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      scheduleRefresh(token);
    } catch {
      // Refresh failed — log out silently
      _clearSession();
    }
  };

  const _clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          scheduleRefresh(token);
        })
        .catch(() => {
          // Token expired — try refresh
          doRefresh().then(() => {
            const newToken = localStorage.getItem('token');
            if (newToken) {
              api.get('/auth/me').then(r => setUser(r.data.user)).catch(() => _clearSession());
            }
          });
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, []); // eslint-disable-line

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, refreshToken } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(res.data.user);
    scheduleRefresh(token);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, refreshToken } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(res.data.user);
    scheduleRefresh(token);
    return res.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    _clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
