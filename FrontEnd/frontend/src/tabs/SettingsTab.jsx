// frontend/src/pages/SettingsPage.jsx - COMPLETE FIXED VERSION

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Globe, Shield, Key, CreditCard, Webhook,
  Save, Plus, Trash2, 
  ArrowLeft, Activity, Loader2, CheckCircle,
  Copy
} from 'lucide-react';
import api from '../api';

// ============================================================
// ANTI-GENERIC UI/UX ENFORCEMENT v2.0 - SETTINGS PAGE
// ============================================================

// Inject global styles
const settingsStyles = `
  .settings-root {
    --color-brand:       hsl(217, 91%, 60%);
    --color-brand-light: hsl(217, 91%, 55%);
    --color-brand-dark:  hsl(217, 83%, 48%);
    --color-success:     hsl(142, 76%, 36%);
    --color-success-dim: hsla(142, 76%, 36%, 0.12);
    --color-warning:     hsl(38, 92%, 50%);
    --color-warning-dim: hsla(38, 92%, 50%, 0.12);
    --color-error:       hsl(0, 84%, 60%);
    --color-error-dim:   hsla(0, 84%, 60%, 0.12);
    --color-canvas:      hsl(222, 47%, 5%);
    --color-surface:     hsl(224, 35%, 8%);
    --color-surface-1:   hsl(224, 35%, 8%);
    --color-surface-2:   hsl(226, 30%, 12%);
    --color-surface-3:   hsl(228, 28%, 16%);
    --color-text-primary:   hsl(210, 20%, 98%);
    --color-text-secondary: hsl(216, 12%, 68%);
    --color-text-muted:     hsl(218, 15%, 48%);
    --color-border:        hsla(0, 0%, 100%, 0.08);
    --color-border-strong: hsla(0, 0%, 100%, 0.16);
    --color-border-focus:  var(--color-brand);
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.16);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 8px 28px rgba(0, 0, 0, 0.24);
    --radius-xs:   4px;
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   14px;
    --radius-xl:   18px;
    --radius-full: 9999px;
    --transition-fast: 120ms cubic-bezier(0.16, 1, 0.3, 1);
    --transition-base: 200ms cubic-bezier(0.16, 1, 0.3, 1);
    --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .page-enter { animation: fadeIn 0.3s ease forwards; }

  .btn-sm {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: var(--radius-sm);
    font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: var(--font-sans); transition: all var(--transition-base);
  }
  .btn-primary {
    background: var(--color-brand); color: white; border: none;
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--color-brand-dark); transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  .btn-secondary {
    background: rgba(255,255,255,0.04); color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  .btn-secondary:hover {
    background: rgba(255,255,255,0.08); color: var(--color-text-primary);
    border-color: var(--color-border-strong);
  }
  .btn-danger {
    background: var(--color-error-dim); color: #ef4444;
    border: 1px solid rgba(239,68,68,0.25);
  }
  .btn-danger:hover {
    background: rgba(239,68,68,0.2); transform: translateY(-1px);
  }

  .form-group {
    display: flex; flex-direction: column; gap: 6px;
  }
  .form-label {
    font-family: var(--font-mono); font-size: 10px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .form-input, .form-select {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 9px 12px; font-size: 13px;
    color: var(--color-text-primary); outline: none;
    font-family: var(--font-sans);
    transition: all var(--transition-base);
  }
  .form-input:focus, .form-select:focus {
    border-color: var(--color-border-focus);
    background: rgba(59,130,246,0.05);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
  }
  .form-hint {
    font-size: 11px; color: var(--color-text-muted);
  }

  .action-row {
    display: flex; gap: 4px;
  }
  .action-btn {
    width: 28px; height: 28px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--color-text-muted);
    transition: all var(--transition-base);
  }
  .action-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.08);
    color: var(--color-text-primary);
    border-color: var(--color-border-strong);
  }
  .action-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .progress-bar {
    width: 100%; height: 4px;
    background: rgba(255,255,255,0.06);
    border-radius: var(--radius-full); overflow: hidden;
  }
  .progress-fill {
    height: 100%; background: var(--color-brand);
    border-radius: var(--radius-full);
    transition: width 0.4s ease;
  }

  .nav-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; margin: 2px 8px;
    border-radius: var(--radius-sm);
    font-size: 12px; font-weight: 500; color: var(--color-text-secondary);
    background: none; width: calc(100% - 16px); text-align: left;
    border: 1px solid transparent; cursor: pointer;
    transition: all var(--transition-base);
  }
  .nav-item:hover {
    background: rgba(255,255,255,0.04);
    color: var(--color-text-primary);
  }
  .nav-item.active {
    background: rgba(59,130,246,0.12);
    color: var(--color-brand);
    border-color: rgba(59,130,246,0.25);
  }

  @media (max-width: 780px) {
    .settings-two-col {
      grid-template-columns: 1fr !important;
    }
    .settings-sidebar {
      position: relative !important;
      top: 0 !important;
      margin-bottom: 20px;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('settings-styles')) {
  const style = document.createElement('style');
  style.id = 'settings-styles';
  style.textContent = settingsStyles;
  document.head.appendChild(style);
}

/* Settings Section Component */
function SettingsSection({ title, description, children }) {
  return (
    <div style={{
      background: 'var(--color-surface-1)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: 20,
      transition: 'border-color var(--transition-base)'
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(255,255,255,0.01)'
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: description ? 4 : 0 }}>{title}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{description}</div>}
      </div>
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  );
}

/* Toggle Switch Component */
function ToggleSwitch({ enabled, onChange, label, description, disabled }) {
  return (
    <div
      style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '12px 0', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1
      }}
      onClick={() => !disabled && onChange(!enabled)}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{description}</div>}
      </div>
      <div style={{
        width: 44, height: 24, borderRadius: 99,
        background: enabled ? 'var(--color-brand)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${enabled ? 'var(--color-brand)' : 'var(--color-border)'}`,
        position: 'relative', flexShrink: 0,
        transition: 'all var(--transition-fast)'
      }}>
        <div style={{
          position: 'absolute', top: 2,
          left: enabled ? 22 : 2,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left var(--transition-fast)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </div>
    </div>
  );
}

/* Divider */
function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0' }} />;
}

/* Loading Spinner */
function LoadingSpinner() {
  return <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />;
}

/* Profile Settings */
function ProfileSettings({ user: initialUser }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    timezone: 'Asia/Manila',
    language: 'English'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/settings/profile');
      const data = response.data;
      setForm({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || '',
        timezone: data.timezone || 'Asia/Manila',
        language: data.language || 'English'
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/settings/profile', {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        timezone: form.timezone,
        language: form.language
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><LoadingSpinner /> Loading...</div>;
  }

  return (
    <>
      <SettingsSection title="Personal Information" description="Update your name and contact details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <span className="form-hint">Used for job notifications and billing</span>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Preferences" description="Localization and display settings">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Timezone</label>
            <select className="form-select" value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}>
              <option>Asia/Manila</option><option>UTC+0</option><option>America/New_York</option>
              <option>America/Los_Angeles</option><option>Asia/Tokyo</option><option>Europe/London</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Language</label>
            <select className="form-select" value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))}>
              <option>English</option><option>Spanish</option><option>Japanese</option><option>Filipino</option>
            </select>
          </div>
        </div>
      </SettingsSection>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn-sm btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><LoadingSpinner /> Saving...</> : saved ? <><CheckCircle size={12} /> Saved</> : <><Save size={12} /> Save Changes</>}
        </button>
      </div>
    </>
  );
}

/* Notification Settings */
function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    jobComplete: true, jobFailed: true, jobStarted: false,
    weeklyReport: true, proxyAlert: true, quotaWarning: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/settings/notifications');
      const data = response.data;
      setNotifications({
        jobComplete: data.job_complete,
        jobFailed: data.job_failed,
        jobStarted: data.job_started,
        weeklyReport: data.weekly_report,
        proxyAlert: data.proxy_alert,
        quotaWarning: data.quota_warning
      });
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (key) => {
    const newValue = !notifications[key];
    setNotifications(p => ({ ...p, [key]: newValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/settings/notifications', {
        job_complete: notifications.jobComplete,
        job_failed: notifications.jobFailed,
        job_started: notifications.jobStarted,
        weekly_report: notifications.weeklyReport,
        proxy_alert: notifications.proxyAlert,
        quota_warning: notifications.quotaWarning
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      fetchNotifications();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><LoadingSpinner /> Loading...</div>;
  }

  return (
    <>
      <SettingsSection title="Job Events" description="Alerts for scraping job lifecycle">
        <ToggleSwitch enabled={notifications.jobComplete} onChange={() => toggle('jobComplete')} label="Job completed" description="Notify when a scraping job finishes successfully" />
        <Divider />
        <ToggleSwitch enabled={notifications.jobFailed} onChange={() => toggle('jobFailed')} label="Job failed" description="Immediate alert on errors or job failures" />
        <Divider />
        <ToggleSwitch enabled={notifications.jobStarted} onChange={() => toggle('jobStarted')} label="Job started" description="Confirmation when a scheduled job kicks off" />
      </SettingsSection>

      <SettingsSection title="System Alerts" description="Infrastructure and quota notifications">
        <ToggleSwitch enabled={notifications.proxyAlert} onChange={() => toggle('proxyAlert')} label="Proxy pool degraded" description="Alert when proxy health drops below 70 percent" />
        <Divider />
        <ToggleSwitch enabled={notifications.quotaWarning} onChange={() => toggle('quotaWarning')} label="Quota warnings" description="Warn at 80 percent and 95 percent of monthly limits" />
      </SettingsSection>

      <SettingsSection title="Reports" description="Periodic summaries">
        <ToggleSwitch enabled={notifications.weeklyReport} onChange={() => toggle('weeklyReport')} label="Weekly summary" description="Email report of job performance every Monday" />
      </SettingsSection>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn-sm btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><LoadingSpinner /> Saving...</> : <><Save size={12} /> Save Preferences</>}
        </button>
      </div>
    </>
  );
}

/* API Key Settings */
function ApiKeySettings() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState(['read', 'write']);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [usage, setUsage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchKeys();
    fetchUsage();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await api.get('/api/settings/api-keys');
      setKeys(response.data);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await api.get('/api/settings/api-keys/usage');
      setUsage(response.data);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) {
      return;
    }
    setCreating(true);
    try {
      const response = await api.post('/api/settings/api-keys', {
        name: newKeyName,
        scopes: newKeyScopes
      });
      setNewlyCreatedKey(response.data);
      await fetchKeys();
      setNewKeyName('');
      setTimeout(() => setNewlyCreatedKey(null), 10000);
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (keyId, keyName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete API Key',
      message: `Delete API key "${keyName}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.delete(`/api/settings/api-keys/${keyId}`);
          fetchKeys();
        } catch (error) {
          console.error('Failed to delete API key:', error);
        }
      }
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><LoadingSpinner /> Loading...</div>;
  }

  return (
    <>
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
      
      {newlyCreatedKey && (
        <div style={{ marginBottom: 20, padding: 16, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>New API Key Created</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>Make sure to copy your key now. You won't be able to see it again.</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ flex: 1, background: 'rgba(0,0,0,0.35)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>{newlyCreatedKey.key}</code>
            <button className="action-btn" onClick={() => copyToClipboard(newlyCreatedKey.key)}><Copy size={12} /></button>
          </div>
        </div>
      )}

      {usage && (
        <SettingsSection title="API Usage" description="Current month consumption">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 8 }}>
            <div><div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>API Requests</div><div style={{ fontSize: 20, fontWeight: 700 }}>{usage.api_requests?.toLocaleString() || 0}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-muted)' }}> / {usage.api_limit?.toLocaleString() || 1000}</span></div></div>
            <div><div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Exports</div><div style={{ fontSize: 20, fontWeight: 700 }}>{usage.export_calls?.toLocaleString() || 0}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-muted)' }}> / {usage.export_limit?.toLocaleString() || 100}</span></div></div>
            <div><div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Concurrent Jobs</div><div style={{ fontSize: 20, fontWeight: 700 }}>{usage.concurrent_jobs || 0}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-muted)' }}> / {usage.concurrent_jobs_limit || 5}</span></div></div>
          </div>
        </SettingsSection>
      )}

      <SettingsSection title="API Keys" description="Manage programmatic access">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No API keys created yet</div>
          ) : (
            keys.map(k => (
              <div key={k.id} style={{
                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{k.name}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      {k.scopes?.map(s => <span key={s} style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', textTransform: 'uppercase' }}>{s}</span>)}
                    </div>
                  </div>
                  <div className="action-row">
                    <button className="action-btn" style={{ color: '#ef4444' }} onClick={() => deleteKey(k.id, k.name)}><Trash2 size={12} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Created {k.created_at ? new Date(k.created_at).toLocaleDateString() : 'Unknown'}</div>
                {k.last_used && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Last used {new Date(k.last_used).toLocaleDateString()}</div>}
              </div>
            ))
          )}
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ marginBottom: 12 }}>
            <input className="form-input" placeholder="Key name (e.g., Production Key)" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} style={{ marginBottom: 8 }} />
            <select 
              className="form-select" 
              value={newKeyScopes} 
              onChange={e => setNewKeyScopes(Array.from(e.target.selectedOptions, option => option.value))} 
              multiple 
              style={{ minHeight: 60 }}
            >
              <option value="read">read</option>
              <option value="write">write</option>
              <option value="export">export</option>
            </select>
          </div>
          <button className="btn-sm btn-primary" onClick={generateKey} disabled={creating}>
            {creating ? <><LoadingSpinner /> Creating...</> : <><Plus size={12} /> Generate New Key</>}
          </button>
        </div>
      </SettingsSection>
    </>
  );
}

/* Security Settings */
function SecuritySettings() {
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [twoFA, setTwoFA] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [settingUp2FA, setSettingUp2FA] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [twoFARes, sessionsRes] = await Promise.all([
        api.get('/api/settings/security/2fa'),
        api.get('/api/settings/security/sessions')
      ]);
      setTwoFA(twoFARes.data.enabled);
      setSessions(sessionsRes.data);
    } catch (error) {
      console.error('Failed to load security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return;
    }
    if (passwordForm.new_password.length < 6) {
      return;
    }
    setUpdatingPassword(true);
    try {
      await api.put('/api/settings/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Failed to update password:', error);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const setupTwoFactor = async () => {
    setSettingUp2FA(true);
    try {
      const response = await api.post('/api/settings/security/2fa/setup');
      setTwoFASetup(response.data);
    } catch (error) {
      console.error('Failed to setup 2FA:', error);
    } finally {
      setSettingUp2FA(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!twoFACode) {
      return;
    }
    try {
      await api.post('/api/settings/security/2fa/verify', { code: twoFACode });
      setTwoFA(true);
      setTwoFASetup(null);
      setTwoFACode('');
    } catch (error) {
      console.error('Invalid verification code:', error);
    }
  };

  const disableTwoFactor = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Disable Two-Factor Authentication',
      message: 'Disable two-factor authentication? This will make your account less secure.',
      onConfirm: async () => {
        try {
          await api.post('/api/settings/security/2fa/disable');
          setTwoFA(false);
        } catch (error) {
          console.error('Failed to disable 2FA:', error);
        }
      }
    });
  };

  const revokeSession = async (sessionId) => {
    try {
      await api.delete(`/api/settings/security/sessions/${sessionId}`);
      fetchSecurityData();
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><LoadingSpinner /> Loading...</div>;
  }

  return (
    <>
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
      
      <SettingsSection title="Password" description="Keep your account secure">
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" value={passwordForm.current_password} onChange={e => setPasswordForm(p => ({ ...p, current_password: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={passwordForm.new_password} onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn-sm btn-primary" onClick={updatePassword} disabled={updatingPassword}>
            {updatingPassword ? <><LoadingSpinner /> Updating...</> : <><Save size={12} /> Update Password</>}
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Two-Factor Authentication" description="Add an extra layer of security">
        {twoFA ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#10b981', marginBottom: 8 }}>2FA is enabled</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Your account is protected with two-factor authentication.</div>
            </div>
            <button className="btn-sm btn-danger" onClick={disableTwoFactor}>Disable 2FA</button>
          </>
        ) : twoFASetup ? (
          <div>
            <div style={{ marginBottom: 16, padding: 16, background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, marginBottom: 8 }}>Scan QR Code</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>Use Google Authenticator or any TOTP app to scan this code:</div>
              <div style={{ background: 'white', padding: 8, borderRadius: 8, display: 'inline-block', marginBottom: 12 }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(twoFASetup.uri)}`} alt="QR Code" />
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>Or enter this code manually: <code style={{ background: 'rgba(0,0,0,0.35)', padding: '4px 8px', borderRadius: 4 }}>{twoFASetup.secret}</code></div>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Verification Code</label>
              <input className="form-input" placeholder="000000" value={twoFACode} onChange={e => setTwoFACode(e.target.value)} />
            </div>
            <button className="btn-sm btn-primary" onClick={verifyTwoFactor}>Verify and Enable</button>
            <button className="btn-sm btn-secondary" style={{ marginLeft: 8 }} onClick={() => setTwoFASetup(null)}>Cancel</button>
          </div>
        ) : (
          <>
            <ToggleSwitch enabled={false} onChange={setupTwoFactor} label="Enable 2FA" description="Use an authenticator app to verify logins" disabled={settingUp2FA} />
            {settingUp2FA && <div style={{ marginTop: 8 }}><LoadingSpinner /> Setting up...</div>}
          </>
        )}
      </SettingsSection>

      <SettingsSection title="Active Sessions" description="Devices currently signed in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)' }}>No active sessions</div>
          ) : (
            sessions.map((s) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: s.current ? 'rgba(59,130,246,0.08)' : 'var(--color-surface-2)',
                border: `1px solid ${s.current ? 'rgba(59,130,246,0.25)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)', padding: '12px 16px'
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><Activity size={14} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.device}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{s.location} · {s.last_active ? new Date(s.last_active).toLocaleString() : 'Unknown'}</div>
                </div>
                {s.current ? <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>CURRENT</span> : <button className="action-btn" style={{ color: '#ef4444' }} onClick={() => revokeSession(s.id)}><Trash2 size={12} /></button>}
              </div>
            ))
          )}
        </div>
      </SettingsSection>
    </>
  );
}

/* Billing Settings */
function BillingSettings() {
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const [planRes, usageRes, paymentRes] = await Promise.all([
        api.get('/api/settings/billing/plan'),
        api.get('/api/settings/billing/usage'),
        api.get('/api/settings/billing/payment-method')
      ]);
      setPlan(planRes.data);
      setUsage(usageRes.data);
      setPaymentMethod(paymentRes.data);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async (newPlan) => {
    setUpgrading(true);
    try {
      await api.post('/api/settings/billing/plan/upgrade', { plan: newPlan });
      fetchBillingData();
    } catch (error) {
      console.error('Failed to upgrade plan:', error);
    } finally {
      setUpgrading(false);
    }
  };

  const cancelSubscription = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Subscription',
      message: 'Cancel your subscription? Your plan will end at the current billing period.',
      onConfirm: async () => {
        try {
          await api.post('/api/settings/billing/plan/cancel');
          fetchBillingData();
        } catch (error) {
          console.error('Failed to cancel subscription:', error);
        }
      }
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><LoadingSpinner /> Loading...</div>;
  }

  return (
    <>
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
      
      {plan && (
        <SettingsSection title="Current Plan" description={`${plan.plan_info?.name || 'Free'} Plan`}>
          <div style={{
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div><div style={{ fontSize: 18, fontWeight: 700 }}>{plan.plan_info?.name || 'Free'} Plan</div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{plan.plan_info?.price || 'Free'} per month</div></div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!plan.cancel_at_period_end && plan.plan !== 'enterprise' && (
                  <>
                    <button className="btn-sm btn-secondary" onClick={() => upgradePlan('pro')} disabled={upgrading}>
                      {upgrading ? <><LoadingSpinner /> Upgrading...</> : 'Upgrade to Pro'}
                    </button>
                    <button className="btn-sm btn-danger" onClick={cancelSubscription}>Cancel</button>
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Records</div><div style={{ fontWeight: 700 }}>{plan.plan_info?.records_limit?.toLocaleString() || 'Unlimited'} per month</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Active Jobs</div><div style={{ fontWeight: 700 }}>{plan.plan_info?.jobs_limit || 'Unlimited'} jobs</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Support</div><div style={{ fontWeight: 700 }}>{plan.plan === 'enterprise' ? '24/7 Priority' : 'Email'}</div></div>
            </div>
            {plan.cancel_at_period_end && (
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(239,68,68,0.12)', borderRadius: 'var(--radius-md)', fontSize: 12, color: '#ef4444' }}>
                Your subscription will end on {plan.current_period_end ? new Date(plan.current_period_end).toLocaleDateString() : 'N/A'}
              </div>
            )}
          </div>
        </SettingsSection>
      )}

      {usage && (
        <SettingsSection title="Usage This Month" description="Current consumption against limits">
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12 }}>Records scraped</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{usage.records_scraped?.toLocaleString() || 0} / {usage.records_limit === 'Unlimited' ? 'Unlimited' : usage.records_limit?.toLocaleString() || 1000}</span>
            </div>
            {usage.records_limit !== 'Unlimited' && (
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${((usage.records_scraped || 0) / (usage.records_limit || 1)) * 100}%` }} /></div>
            )}
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12 }}>API requests</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{usage.api_requests?.toLocaleString() || 0} / {usage.api_limit === 'Unlimited' ? 'Unlimited' : usage.api_limit?.toLocaleString() || 1000}</span>
            </div>
            {usage.api_limit !== 'Unlimited' && (
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${((usage.api_requests || 0) / (usage.api_limit || 1)) * 100}%` }} /></div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12 }}>Export downloads</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{usage.export_downloads?.toLocaleString() || 0} / {usage.export_limit === 'Unlimited' ? 'Unlimited' : usage.export_limit?.toLocaleString() || 100}</span>
            </div>
            {usage.export_limit !== 'Unlimited' && (
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${((usage.export_downloads || 0) / (usage.export_limit || 1)) * 100}%` }} /></div>
            )}
          </div>
        </SettingsSection>
      )}

      <SettingsSection title="Payment Method" description="Manage your billing details">
        {paymentMethod ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '14px 18px'
          }}>
            <div style={{ width: 46, height: 30, borderRadius: 6, background: 'linear-gradient(135deg, #1a1f36, #2d3748)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCard size={14} /></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{paymentMethod.card_brand?.charAt(0).toUpperCase() + paymentMethod.card_brand?.slice(1) || 'Card'} ending in {paymentMethod.last4}</div><div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Expires {paymentMethod.expiry_month}/{paymentMethod.expiry_year}</div></div>
            <button className="btn-sm btn-secondary">Update</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)' }}>
            No payment method on file
            <button className="btn-sm btn-primary" style={{ marginLeft: 12 }}>Add Payment Method</button>
          </div>
        )}
      </SettingsSection>
    </>
  );
}

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: 'var(--shadow-lg)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>{message}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn-sm btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-sm btn-danger" onClick={() => {
            onConfirm();
            onClose();
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

/* Proxy Settings (Placeholder) */
function ProxySettings() {
  return (
    <SettingsSection title="Proxy Pools" description="Coming soon">
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
        Proxy management features are coming soon.
      </div>
    </SettingsSection>
  );
}

/* Webhook Settings (Placeholder) */
function WebhookSettings() {
  return (
    <SettingsSection title="Webhook Endpoints" description="Coming soon">
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
        Webhook configuration features are coming soon.
      </div>
    </SettingsSection>
  );
}

/* Main Settings Page */
const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'proxies', label: 'Proxy Pools', icon: Globe },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard }
];

const SECTION_MAP = {
  profile: ProfileSettings,
  notifications: NotificationSettings,
  proxies: ProxySettings,
  api: ApiKeySettings,
  webhooks: WebhookSettings,
  security: SecuritySettings,
  billing: BillingSettings
};

export default function SettingsPage() {
  const { currentUser } = useSelector(s => s.user);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const ActiveSection = SECTION_MAP[activeTab];

  return (
    <div className="settings-root page-enter" style={{ fontFamily: 'var(--font-sans)' }}>
      <button className="btn-sm btn-secondary" style={{ marginBottom: 28, gap: 8 }} onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={12} /> Back to Dashboard
      </button>

      <div className="settings-two-col" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28, alignItems: 'start' }}>
        {/* Sidebar Navigation */}
        <div className="settings-sidebar" style={{
          background: 'var(--color-surface-1)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'sticky', top: 88
        }}>
          <div style={{ padding: '14px 16px 8px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Settings</div>
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div>
          <ActiveSection user={currentUser} />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}