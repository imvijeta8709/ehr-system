import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

export const ALL_MODULES = [
  'dashboard', 'patients', 'doctors', 'appointments',
  'records', 'vitals', 'timeline', 'audit', 'profile', 'notifications',
];
export const ALL_ACTIONS = ['view', 'create', 'edit', 'delete'];

// Full access object — used for superadmin/admin
const FULL_PERMISSIONS = Object.fromEntries(
  ALL_MODULES.map((mod) => [mod, { view: true, create: true, edit: true, delete: true }])
);

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth();
  // permissions: { [module]: { view, create, edit, delete } }
  const [permissions, setPermissions]     = useState({});
  const [allRolePerms, setAllRolePerms]   = useState([]); // superadmin panel data
  const [allModules, setAllModules]       = useState(ALL_MODULES);
  const [allActions]                      = useState(ALL_ACTIONS);
  const [loading, setLoading]             = useState(true);

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin      = user?.role === 'admin';
  const isPrivileged = isSuperAdmin || isAdmin;

  const fetchMyPermissions = useCallback(async () => {
    if (!user) { setPermissions({}); setLoading(false); return; }
    if (isPrivileged) {
      setPermissions(FULL_PERMISSIONS);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/permissions/${user.role}`);
      setPermissions(res.data.permissions || {});
    } catch {
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, [user, isPrivileged]);

  const fetchAllRolePerms = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await api.get('/permissions');
      setAllRolePerms(res.data.permissions || []);
      if (res.data.allModules) setAllModules(res.data.allModules);
    } catch {
      setAllRolePerms([]);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    setLoading(true);
    fetchMyPermissions();
  }, [fetchMyPermissions]);

  useEffect(() => {
    fetchAllRolePerms();
  }, [fetchAllRolePerms]);

  /**
   * canDo(module, action)
   * action: 'view' | 'create' | 'edit' | 'delete'
   * Superadmin/admin always return true.
   */
  const canDo = (module, action = 'view') => {
    if (isPrivileged) return true;
    return permissions?.[module]?.[action] === true;
  };

  // Convenience alias — canDo(module, 'view')
  const can = (module) => canDo(module, 'view');

  // Update permissions for a role (superadmin only)
  const updateRolePermissions = async (role, newPerms) => {
    const res = await api.put(`/permissions/${role}`, { permissions: newPerms });
    setAllRolePerms((prev) =>
      prev.map((p) => (p.role === role ? { ...p, permissions: newPerms } : p))
    );
    return res.data;
  };

  return (
    <PermissionsContext.Provider value={{
      permissions,
      allRolePerms,
      allModules,
      allActions,
      loading,
      can,
      canDo,
      updateRolePermissions,
      refreshAllRolePerms: fetchAllRolePerms,
    }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
