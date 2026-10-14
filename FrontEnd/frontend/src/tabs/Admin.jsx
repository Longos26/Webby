// src/tabs/Admin.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Shield, ShieldCheck, ShieldOff, Users, Search, RefreshCw,
  Loader, AlertCircle, CheckCircle, X, Trash2, Crown,
  User as UserIcon, TrendingUp, Pencil, Save, XCircle,
  Eye, Download, Globe, LogIn, Info,
} from 'lucide-react';
import api from '../api';

const STYLES = `
  .admin-root {
    --green-primary: #00ED64;
    --bg-dark: #0D1117;
    --bg-surface: #161B22;
    --bg-elevated: #1C2128;
    --border-default: #30363D;
    --border-subtle: #21262D;
    --text-primary: #F0F6FC;
    --text-secondary: #9BA4B0;
    --text-muted: #6E7681;
    --success: #00ED64;
    --warning: #D29922;
    --error: #F85149;
    --info: #58A6FF;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", monospace;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    font-family: var(--font-sans);
    color: var(--text-primary);
    font-size: 15px;
    line-height: 1.5;
  }
  .admin-root * { margin: 0; padding: 0; box-sizing: border-box; }

  .admin-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  .admin-header-title { display: flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 600; }
  .admin-header-icon { width: 40px; height: 40px; background: rgba(0, 237, 100, 0.1); border: 1px solid rgba(0, 237, 100, 0.2); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--green-primary); }
  .admin-header-sub { font-size: 13px; color: var(--text-secondary); font-weight: 400; margin-top: 2px; }

  .admin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .admin-stat { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 16px 18px; }
  .admin-stat-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .admin-stat-value { font-size: 24px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.02em; }

  .admin-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
  .admin-search { flex: 1; min-width: 220px; position: relative; }
  .admin-search input { width: 100%; padding: 9px 14px 9px 36px; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 14px; font-family: inherit; outline: none; transition: border-color var(--transition), box-shadow var(--transition); }
  .admin-search input::placeholder { color: var(--text-muted); }
  .admin-search input:focus { border-color: var(--green-primary); box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.08); }
  .admin-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }

  .admin-filter { padding: 9px 14px; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); font-size: 14px; font-family: inherit; outline: none; cursor: pointer; }
  .admin-filter:focus { border-color: var(--green-primary); }

  .admin-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 16px; border-radius: var(--radius-md); font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; border: 1px solid var(--border-default); background: var(--bg-surface); color: var(--text-secondary); transition: all var(--transition); white-space: nowrap; }
  .admin-btn:hover:not(:disabled) { border-color: #484F58; color: var(--text-primary); }
  .admin-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .admin-table-wrap { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-lg); overflow: hidden; }
  .admin-table-scroll { overflow-x: auto; }
  .admin-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 900px; }
  .admin-table th { padding: 12px 16px; text-align: left; color: var(--text-muted); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--border-default); background: var(--bg-elevated); white-space: nowrap; }
  .admin-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); vertical-align: middle; }
  .admin-table tr:last-child td { border-bottom: none; }
  .admin-table tbody tr:hover td { background: rgba(255,255,255,0.02); }

  .admin-user-cell { display: flex; align-items: center; gap: 10px; }
  .admin-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #00ED64, #00A846); display: flex; align-items: center; justify-content: center; color: #0D1117; font-weight: 600; font-size: 13px; flex-shrink: 0; }
  .admin-user-name { font-weight: 500; color: var(--text-primary); font-size: 14px; }
  .admin-user-email { font-size: 12px; color: var(--text-muted); font-family: var(--font-mono); }

  .admin-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; white-space: nowrap; }
  .admin-badge.admin { background: rgba(0, 237, 100, 0.1); color: #56D364; border: 1px solid rgba(0, 237, 100, 0.25); }
  .admin-badge.user { background: rgba(110, 118, 129, 0.1); color: var(--text-secondary); border: 1px solid var(--border-default); }

  .admin-actions { display: flex; gap: 6px; flex-wrap: wrap; }
  .admin-action { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 500; font-family: inherit; cursor: pointer; border: 1px solid var(--border-default); background: transparent; color: var(--text-secondary); transition: all var(--transition); white-space: nowrap; }
  .admin-action:hover:not(:disabled) { border-color: #484F58; color: var(--text-primary); background: var(--bg-elevated); }
  .admin-action:disabled { opacity: 0.4; cursor: not-allowed; }
  .admin-action.promote:hover:not(:disabled) { border-color: rgba(0, 237, 100, 0.4); color: #56D364; background: rgba(0, 237, 100, 0.08); }
  .admin-action.demote:hover:not(:disabled) { border-color: rgba(210, 153, 34, 0.4); color: #E3B341; background: rgba(210, 153, 34, 0.08); }
  .admin-action.danger:hover:not(:disabled) { border-color: rgba(248, 81, 73, 0.4); color: #FF7B72; background: rgba(248, 81, 73, 0.08); }
  .admin-action.edit:hover:not(:disabled) { border-color: rgba(88, 166, 255, 0.4); color: #79B8FF; background: rgba(88, 166, 255, 0.08); }
  .admin-action.view:hover:not(:disabled) { border-color: rgba(88, 166, 255, 0.4); color: #79B8FF; background: rgba(88, 166, 255, 0.08); }

  .admin-inline-input { padding: 5px 8px; background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px; font-family: inherit; width: 100%; outline: none; }
  .admin-inline-input:focus { border-color: var(--green-primary); }

  .admin-alert { padding: 12px 16px; border-radius: var(--radius-md); font-size: 13px; display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .admin-alert.error { background: rgba(248, 81, 73, 0.08); border: 1px solid rgba(248, 81, 73, 0.2); color: #FF7B72; }
  .admin-alert.success { background: rgba(0, 237, 100, 0.08); border: 1px solid rgba(0, 237, 100, 0.2); color: #56D364; }
  .admin-alert-close { margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; display: flex; padding: 2px; }

  .admin-empty { padding: 48px 24px; text-align: center; color: var(--text-muted); font-size: 14px; }
  .admin-empty svg { opacity: 0.4; margin-bottom: 12px; }

  @keyframes admin-spin { to { transform: rotate(360deg); } }
  .admin-spin { animation: admin-spin 0.7s linear infinite; }

  /* ---------- Modal ---------- */
  .admin-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.65);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
    animation: admin-fade-in 120ms ease-out;
  }
  @keyframes admin-fade-in { from { opacity: 0; } to { opacity: 1; } }
  .admin-modal {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    width: 100%; max-width: 760px;
    max-height: 85vh; display: flex; flex-direction: column;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    animation: admin-slide-up 180ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  @keyframes admin-slide-up { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .admin-modal-header {
    display: flex; align-items: center; gap: 12px;
    padding: 18px 20px; border-bottom: 1px solid var(--border-default);
  }
  .admin-modal-title { font-size: 16px; font-weight: 600; flex: 1; }
  .admin-modal-sub { font-size: 12px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px; }
  .admin-modal-close {
    background: none; border: 1px solid var(--border-default);
    color: var(--text-secondary); cursor: pointer;
    width: 32px; height: 32px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    transition: all var(--transition);
  }
  .admin-modal-close:hover { border-color: #484F58; color: var(--text-primary); background: var(--bg-elevated); }

  .admin-modal-body { padding: 16px 20px 20px; overflow-y: auto; flex: 1; }

  .admin-modal-toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }

  .admin-activity-list { display: flex; flex-direction: column; gap: 8px; }
  .admin-activity-item {
    display: flex; gap: 12px; padding: 12px 14px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    transition: border-color var(--transition);
  }
  .admin-activity-item:hover { border-color: var(--border-default); }
  .admin-activity-icon {
    width: 34px; height: 34px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .admin-activity-icon.scrape  { background: rgba(88,166,255,0.1); color: #79B8FF; }
  .admin-activity-icon.export  { background: rgba(0,237,100,0.1);  color: #56D364; }
  .admin-activity-icon.login   { background: rgba(210,153,34,0.1); color: #E3B341; }
  .admin-activity-icon.error   { background: rgba(248,81,73,0.1);  color: #FF7B72; }
  .admin-activity-icon.info    { background: rgba(110,118,129,0.1);color: var(--text-secondary); }

  .admin-activity-body { flex: 1; min-width: 0; }
  .admin-activity-title { font-size: 13px; font-weight: 500; color: var(--text-primary); }
  .admin-activity-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; word-break: break-word; }
  .admin-activity-meta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px; font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }
  .admin-activity-time { font-size: 11px; color: var(--text-muted); white-space: nowrap; }

  .admin-modal-footer {
    padding: 12px 20px; border-top: 1px solid var(--border-default);
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12px; color: var(--text-muted);
  }

  @media (max-width: 640px) {
    .admin-header { flex-direction: column; align-items: flex-start; }
    .admin-toolbar { flex-direction: column; align-items: stretch; }
    .admin-search { width: 100%; }
    .admin-modal { max-height: 92vh; }
  }
`;

function injectStyles(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }
}

// ---------- helpers ----------
const getId = (u) => u?._id ?? u?.id;           // normalize Mongo _id vs id
const getInitials = (user) => {
  if (!user) return '?';
  const f = (user.first_name || '').trim();
  const l = (user.last_name || '').trim();
  if (f || l) return `${f[0] || ''}${l[0] || ''}`.toUpperCase();
  return (user.email || user.username || '?')[0].toUpperCase();
};
const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return '—'; }
};
const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

const activityIconFor = (type) => {
  switch (type) {
    case 'scrape': return <Globe size={16} />;
    case 'export': return <Download size={16} />;
    case 'login':  return <LogIn size={16} />;
    case 'error':  return <AlertCircle size={16} />;
    default:       return <Info size={16} />;
  }
};

// ---------- component ----------
const Admin = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  // Activity modal state
  const [activityUserId, setActivityUserId] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState(null);
  const [activityFilter, setActivityFilter] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.listUsers({
        skip: 0,
        limit: 200,
        search: search.trim(),
        role: roleFilter,
      });
      const normalized = (data.users || []).map((u) => ({
        ...u,
        _id: String(getId(u)),
        role: u.role || 'user',
        plan: u.plan || 'free',
      }));
      setUsers(normalized);
      setTotal(data.total ?? normalized.length);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await api.admin.getStats();
      setStats(data);
    } catch (err) {
      console.warn('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.auth.getCurrentUser();
        setCurrentUserId(String(getId(me)));
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    injectStyles('admin-tab-styles', STYLES);
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 250);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const flashSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  // ---------- actions ----------
  const handleToggleRole = async (user) => {
    const isAdmin = user.role === 'admin';
    const newRole = isAdmin ? 'user' : 'admin';
    const verb = isAdmin ? 'Demote' : 'Promote';
    if (!window.confirm(`${verb} ${user.email} to "${newRole}"?`)) return;

    setActionLoading(user._id);
    setError(null);
    try {
      await api.admin.updateUserRole(user._id, newRole);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u)));
      flashSuccess(`${verb}d ${user.email} → ${newRole}`);
      loadStats();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || `${verb} failed`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePlanChange = async (user, plan) => {
    if (user.plan === plan) return;
    setActionLoading(user._id);
    setError(null);
    try {
      await api.admin.updateUserPlan(user._id, plan);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, plan } : u)));
      flashSuccess(`Updated ${user.email} plan → ${plan}`);
      loadStats();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Plan update failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.email}? This cannot be undone.`)) return;
    setActionLoading(user._id);
    setError(null);
    try {
      await api.admin.deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      setTotal((t) => Math.max(0, t - 1));
      flashSuccess(`Deleted ${user.email}`);
      loadStats();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditDraft({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const saveEdit = async (user) => {
    setActionLoading(user._id);
    setError(null);
    try {
      const updated = await api.admin.updateUser(user._id, editDraft);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, ...editDraft, ...(updated || {}) } : u))
      );
      flashSuccess(`Updated ${user.email}`);
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Update failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ---------- activity modal ----------
  const openActivity = async (user) => {
    setActivityUserId(user._id);
    setActivityData(null);
    setActivityError(null);
    setActivityFilter('');
    setActivityLoading(true);
    try {
      const data = await api.admin.getUserActivity(user._id, { limit: 200 });
      setActivityData(data);
    } catch (err) {
      setActivityError(err.response?.data?.detail || err.message || 'Failed to load activity');
    } finally {
      setActivityLoading(false);
    }
  };

  const refreshActivity = async () => {
    if (!activityUserId) return;
    setActivityLoading(true);
    setActivityError(null);
    try {
      const data = await api.admin.getUserActivity(activityUserId, { limit: 200 });
      setActivityData(data);
    } catch (err) {
      setActivityError(err.response?.data?.detail || err.message || 'Failed to load activity');
    } finally {
      setActivityLoading(false);
    }
  };

  const closeActivity = () => {
    setActivityUserId(null);
    setActivityData(null);
    setActivityError(null);
    setActivityFilter('');
  };

  // Close on Escape
  useEffect(() => {
    if (!activityUserId) return;
    const handler = (e) => { if (e.key === 'Escape') closeActivity(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activityUserId]);

  const filteredActivities = activityData?.activities
    ? activityData.activities.filter((a) => !activityFilter || a.type === activityFilter)
    : [];

  return (
    <div className="admin-root">
      <div className="admin-header">
        <button className="admin-btn" onClick={() => { loadUsers(); loadStats(); }}>
          <RefreshCw size={14} className={loading ? 'admin-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="admin-alert error">
          <AlertCircle size={16} />
          <span style={{ flex: 1 }}>{error}</span>
          <button className="admin-alert-close" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="admin-alert success">
          <CheckCircle size={16} />
          <span style={{ flex: 1 }}>{success}</span>
          <button className="admin-alert-close" onClick={() => setSuccess(null)}><X size={14} /></button>
        </div>
      )}

      {stats && (
        <div className="admin-stats">
          <div className="admin-stat">
            <div className="admin-stat-label"><Users size={12} /> Total Users</div>
            <div className="admin-stat-value">{stats.total_users ?? total}</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-label"><ShieldCheck size={12} /> Admins</div>
            <div className="admin-stat-value">{stats.admins ?? 0}</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-label"><UserIcon size={12} /> Regular Users</div>
            <div className="admin-stat-value">{stats.regular_users ?? 0}</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-label"><TrendingUp size={12} /> New (7d)</div>
            <div className="admin-stat-value">{stats.new_users_7d ?? 0}</div>
          </div>
        </div>
      )}

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="admin-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admins only</option>
          <option value="user">Users only</option>
        </select>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-empty">
            <Loader size={24} className="admin-spin" />
            <div style={{ marginTop: 12 }}>Loading users…</div>
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty">
            <Users size={32} />
            <div>No users found</div>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isAdmin = user.role === 'admin';
                  const isSelf = currentUserId && user._id === currentUserId;
                  const busy = actionLoading === user._id;
                  const isEditing = editingId === user._id;

                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar">{getInitials(user)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <input
                                  className="admin-inline-input"
                                  placeholder="First"
                                  value={editDraft.first_name}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, first_name: e.target.value }))}
                                />
                                <input
                                  className="admin-inline-input"
                                  placeholder="Last"
                                  value={editDraft.last_name}
                                  onChange={(e) => setEditDraft((d) => ({ ...d, last_name: e.target.value }))}
                                />
                              </div>
                            ) : (
                              <div className="admin-user-name">
                                {user.first_name || user.last_name
                                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                  : user.username || 'Unnamed'}
                                {isSelf && (
                                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                                    (you)
                                  </span>
                                )}
                              </div>
                            )}
                            {!isEditing && (
                              <div className="admin-user-email">{user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge ${isAdmin ? 'admin' : 'user'}`}>
                          {isAdmin ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>
                        <select
                          className="admin-filter"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          value={user.plan}
                          onChange={(e) => handlePlanChange(user, e.target.value)}
                          disabled={busy}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {formatDate(user.created_at)}
                      </td>
                      <td>
                        <div className="admin-actions">
                          {isEditing ? (
                            <>
                              <button
                                className="admin-action promote"
                                onClick={() => saveEdit(user)}
                                disabled={busy}
                              >
                                {busy ? <Loader size={12} className="admin-spin" /> : <Save size={12} />}
                                Save
                              </button>
                              <button className="admin-action" onClick={cancelEdit} disabled={busy}>
                                <XCircle size={12} /> Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="admin-action view"
                                onClick={() => openActivity(user)}
                                disabled={busy}
                                title="View user activity"
                              >
                                <Eye size={12} /> View
                              </button>
                              <button
                                className="admin-action edit"
                                onClick={() => startEdit(user)}
                                disabled={busy}
                                title="Edit name / username"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              {isAdmin ? (
                                <button
                                  className="admin-action demote"
                                  onClick={() => handleToggleRole(user)}
                                  disabled={busy || isSelf}
                                  title={isSelf ? 'You cannot demote yourself' : 'Demote to user'}
                                >
                                  {busy ? <Loader size={12} className="admin-spin" /> : <ShieldOff size={12} />}
                                  Demote
                                </button>
                              ) : (
                                <button
                                  className="admin-action promote"
                                  onClick={() => handleToggleRole(user)}
                                  disabled={busy}
                                  title="Promote to admin"
                                >
                                  {busy ? <Loader size={12} className="admin-spin" /> : <Crown size={12} />}
                                  Promote
                                </button>
                              )}
                              <button
                                className="admin-action danger"
                                onClick={() => handleDelete(user)}
                                disabled={busy || isSelf}
                                title={isSelf ? 'You cannot delete yourself' : 'Delete user'}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > users.length && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          Showing {users.length} of {total} users
        </div>
      )}

      {/* ---------- ACTIVITY MODAL ---------- */}
      {activityUserId && (
        <div className="admin-modal-overlay" onClick={closeActivity}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
                {activityData?.user
                  ? getInitials(activityData.user)
                  : getInitials(users.find((u) => u._id === activityUserId))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="admin-modal-title">
                  {activityData?.user
                    ? (`${activityData.user.first_name || ''} ${activityData.user.last_name || ''}`.trim()
                        || activityData.user.username
                        || 'User')
                    : 'User activity'}
                </div>
                <div className="admin-modal-sub">
                  {activityData?.user?.email || ''}
                </div>
              </div>
              <button className="admin-modal-close" onClick={closeActivity}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-body">
              {activityData?.user && (
                <div className="admin-modal-toolbar">
                  <span className={`admin-badge ${activityData.user.role === 'admin' ? 'admin' : 'user'}`}>
                    {activityData.user.role === 'admin' ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                    {activityData.user.role}
                  </span>
                  <span className="admin-badge user">
                    Plan: {activityData.user.plan}
                  </span>
                  <span className="admin-badge user">
                    Joined: {formatDate(activityData.user.created_at)}
                  </span>
                </div>
              )}

              <div className="admin-modal-toolbar">
                <select
                  className="admin-filter"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                >
                  <option value="">All activity</option>
                  <option value="scrape">Scrapes</option>
                  <option value="export">Exports</option>
                  <option value="login">Logins</option>
                  <option value="error">Errors</option>
                  <option value="info">Info</option>
                </select>
                <button
                  className="admin-btn"
                  onClick={refreshActivity}
                  disabled={activityLoading}
                >
                  <RefreshCw size={14} className={activityLoading ? 'admin-spin' : ''} />
                  Refresh
                </button>
              </div>

              {activityLoading ? (
                <div className="admin-empty">
                  <Loader size={24} className="admin-spin" />
                  <div style={{ marginTop: 12 }}>Loading activity…</div>
                </div>
              ) : activityError ? (
                <div className="admin-alert error" style={{ marginBottom: 0 }}>
                  <AlertCircle size={16} />
                  <span style={{ flex: 1 }}>{activityError}</span>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="admin-empty">
                  <Info size={32} />
                  <div>No activity recorded yet</div>
                </div>
              ) : (
                <div className="admin-activity-list">
                  {filteredActivities.map((a) => (
                    <div className="admin-activity-item" key={a.id}>
                      <div className={`admin-activity-icon ${a.type}`}>
                        {activityIconFor(a.type)}
                      </div>
                      <div className="admin-activity-body">
                        <div className="admin-activity-title">{a.title}</div>
                        {a.description && (
                          <div className="admin-activity-desc">{a.description}</div>
                        )}
                        {a.metadata && Object.keys(a.metadata).length > 0 && (
                          <div className="admin-activity-meta">
                            {Object.entries(a.metadata).map(([k, v]) =>
                              v == null || v === '' ? null : (
                                <span key={k}>{k}: {String(v)}</span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                      <div className="admin-activity-time">{formatDateTime(a.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <span>
                {activityData?.activities
                  ? `${filteredActivities.length} of ${activityData.activities.length} entries`
                  : ''}
              </span>
              <button className="admin-btn" onClick={closeActivity}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;