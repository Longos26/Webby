// frontend/src/pages/SettingsPage.jsx - CLEAN ENTERPRISE DESIGN

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Shield,
  Save, Trash2,
  Activity, Loader2, CheckCircle,
  Eye, EyeOff, Smartphone,
  AlertTriangle
} from 'lucide-react';
import api from '../api';

// ============================================================
// STYLES - CLEAN UNTITLED UI AESTHETIC
// ============================================================

const styles = `
  .settings-root {
    --color-mdb-green: #00ED64;
    --color-mdb-green-dark: #00C355;
    --color-canvas: #0D1117;
    --color-surface: #161B22;
    --color-surface-elevated: #1C2128;
    --color-border: #30363D;
    --color-border-subtle: #21262D;
    --color-text-primary: #F0F6FC;
    --color-text-secondary: #9BA4B0;
    --color-text-muted: #6E7681;
    --color-success: #00ED64;
    --color-warning: #D29922;
    --color-error: #F85149;
    --color-info: #58A6FF;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.35);
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 9999px;
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Courier New", monospace;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .settings-root * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .settings-root {
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    background: var(--color-canvas);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .page-enter {
    animation: fadeSlideIn 0.2s ease-out;
  }

  .spin {
    animation: spin 0.7s linear infinite;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    gap: 14px;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-mdb-green);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .settings-container {
    max-width: 1280px;
    margin: 0 auto;
  }

  /* ---------- Layout ---------- */
  .settings-grid {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 24px;
    align-items: start;
  }

  /* ---------- Sidebar ---------- */
  .settings-sidebar {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    position: sticky;
    top: 20px;
  }

  .sidebar-header {
    padding: 14px 18px 10px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 18px;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background var(--transition), color var(--transition);
    text-align: left;
  }

  .nav-item:hover {
    background: var(--color-surface-elevated);
    color: var(--color-text-primary);
  }

  .nav-item.active {
    background: var(--color-surface-elevated);
    color: var(--color-text-primary);
  }

  .nav-item.active svg {
    color: var(--color-mdb-green);
  }

  /* ---------- Cards ---------- */
  .settings-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin-bottom: 16px;
  }

  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 2px;
    color: var(--color-text-primary);
  }

  .card-description {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .card-body {
    padding: 20px;
  }

  /* ---------- Forms ---------- */
  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 6px;
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    padding: 9px 12px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.08);
  }

  .form-input::placeholder {
    color: var(--color-text-muted);
  }

  .form-hint {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-top: 4px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  /* ---------- Toggle ---------- */
  .toggle-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    cursor: pointer;
    gap: 12px;
  }

  .toggle-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 2px;
  }

  .toggle-description {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .toggle-switch {
    width: 40px;
    height: 22px;
    background: var(--color-border);
    border-radius: var(--radius-full);
    position: relative;
    transition: background var(--transition);
    flex-shrink: 0;
    cursor: pointer;
  }

  .toggle-switch.active {
    background: var(--color-mdb-green);
  }

  .toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: left var(--transition);
  }

  .toggle-switch.active .toggle-knob {
    left: 21px;
  }

  .divider {
    height: 1px;
    background: var(--color-border-subtle);
    margin: 2px 0;
  }

  /* ---------- Alerts ---------- */
  .alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    margin-bottom: 16px;
    font-size: 13px;
  }

  .alert-success {
    background: rgba(0, 237, 100, 0.1);
    border: 1px solid rgba(0, 237, 100, 0.2);
    color: #56D364;
  }

  .alert-error {
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.2);
    color: #FF7B72;
  }

  .alert-info {
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid rgba(88, 166, 255, 0.2);
    color: #79B8FF;
  }

  /* ---------- Buttons ---------- */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background var(--transition), border-color var(--transition), color var(--transition);
    border: none;
    white-space: nowrap;
  }

  .btn-primary {
    background: var(--color-mdb-green);
    color: #0D1117;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-mdb-green-dark);
  }

  .btn-secondary {
    background: var(--color-canvas);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: #484F58;
    color: var(--color-text-primary);
  }

  .btn-danger {
    background: rgba(248, 81, 73, 0.1);
    color: #FF7B72;
    border: 1px solid rgba(248, 81, 73, 0.2);
  }

  .btn-danger:hover:not(:disabled) {
    background: rgba(248, 81, 73, 0.15);
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
    gap: 6px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ---------- Sessions ---------- */
  .session-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid var(--color-border-subtle);
    flex-wrap: wrap;
  }

  .session-item:last-child {
    border-bottom: none;
  }

  .session-icon {
    width: 36px;
    height: 36px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }

  .session-info {
    flex: 1;
    min-width: 120px;
  }

  .session-device {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .session-meta {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-top: 2px;
  }

  .session-badge {
    font-size: 11px;
    font-weight: 500;
    background: rgba(0, 237, 100, 0.1);
    color: #56D364;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    border: 1px solid rgba(0, 237, 100, 0.2);
  }

  /* ---------- Empty State ---------- */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--color-text-muted);
  }

  .empty-icon {
    width: 52px;
    height: 52px;
    margin: 0 auto 14px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ---------- QR Container ---------- */
  .qrcode-container {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 20px;
    text-align: center;
    margin-bottom: 16px;
  }

  .secret-code {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: 8px 12px;
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: 12px;
    margin-top: 14px;
    word-break: break-all;
    color: var(--color-text-secondary);
  }

  /* ---------- Modal ---------- */
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(13, 17, 23, 0.85);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  .modal {
    max-width: 440px;
    width: 100%;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  .modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .modal-body {
    padding: 16px 20px;
  }

  .modal-footer {
    padding: 14px 20px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);
    background: var(--color-canvas);
    flex-wrap: wrap;
  }

  /* ---------- Responsive ---------- */
  @media (max-width: 1024px) {
    .settings-grid {
      grid-template-columns: 220px 1fr;
      gap: 16px;
    }
  }

  @media (max-width: 768px) {
    .settings-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .settings-sidebar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      flex-wrap: nowrap;
      gap: 6px;
      padding: 8px 12px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow-x: auto;
    }

    .settings-sidebar .sidebar-header {
      display: none;
    }

    .settings-sidebar .nav-item {
      padding: 8px 14px;
      font-size: 12px;
      width: auto;
      flex-shrink: 0;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-canvas);
    }

    .settings-sidebar .nav-item.active {
      border-color: var(--color-mdb-green);
      background: rgba(0, 237, 100, 0.05);
    }

    .card-header {
      padding: 14px 16px;
    }

    .card-body {
      padding: 16px;
    }

    .form-row {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .form-input,
    .form-select {
      font-size: 16px;
    }

    .session-item {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 480px) {
    .settings-container {
      padding: 0;
    }

    .settings-sidebar {
      padding: 6px 8px;
      gap: 4px;
    }

    .settings-sidebar .nav-item {
      padding: 6px 10px;
      font-size: 11px;
    }

    .card-header {
      padding: 12px 14px;
    }

    .card-body {
      padding: 14px;
    }

    .form-input,
    .form-select {
      font-size: 16px;
    }

    .modal {
      max-width: 100%;
    }

    .secret-code {
      font-size: 11px;
    }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('settings-enterprise-styles')) {
  const style = document.createElement('style');
  style.id = 'settings-enterprise-styles';
  style.textContent = styles;
  document.head.appendChild(style);
}

// ============================================================
// CONFIRMATION MODAL
// ============================================================

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PROFILE SETTINGS
// ============================================================

function ProfileSettings() {
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
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/settings/profile');
        const data = res.data;
        setForm({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          timezone: data.timezone || 'Asia/Manila',
          language: data.language || 'English'
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading profile…</span>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put('/api/settings/profile', {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        timezone: form.timezone,
        language: form.language
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}
      {saved && (
        <div className="alert alert-success">
          <CheckCircle size={14} />
          Profile updated successfully!
        </div>
      )}

      <div className="settings-card">
        <div className="card-header">
          <div className="card-title">Personal Information</div>
          <div className="card-description">Update your name and contact details</div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                className="form-input"
                value={form.firstName}
                onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                className="form-input"
                value={form.lastName}
                onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
            <div className="form-hint">Used for notifications and account recovery</div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <div className="card-title">Preferences</div>
          <div className="card-description">Localization and display settings</div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select
                className="form-select"
                value={form.timezone}
                onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
              >
                <option>Asia/Manila</option>
                <option>UTC+0</option>
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
                <option>Asia/Tokyo</option>
                <option>Europe/London</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <select
                className="form-select"
                value={form.language}
                onChange={e => setForm(p => ({ ...p, language: e.target.value }))}
              >
                <option>English</option>
                <option>Spanish</option>
                <option>Japanese</option>
                <option>Filipino</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </>
  );
}

// ============================================================
// NOTIFICATION SETTINGS
// ============================================================

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    jobComplete: true, jobFailed: true, jobStarted: false,
    weeklyReport: true, proxyAlert: true, quotaWarning: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/settings/notifications');
        const data = res.data;
        setNotifications({
          jobComplete: data.job_complete !== undefined ? data.job_complete : true,
          jobFailed: data.job_failed !== undefined ? data.job_failed : true,
          jobStarted: data.job_started !== undefined ? data.job_started : false,
          weeklyReport: data.weekly_report !== undefined ? data.weekly_report : true,
          proxyAlert: data.proxy_alert !== undefined ? data.proxy_alert : true,
          quotaWarning: data.quota_warning !== undefined ? data.quota_warning : true
        });
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading notifications…</span>
      </div>
    );
  }

  const toggle = (key) => {
    setNotifications(p => ({ ...p, [key]: !p[key] }));
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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save notifications:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {saved && (
        <div className="alert alert-success">
          <CheckCircle size={14} />
          Preferences saved successfully!
        </div>
      )}

      <div className="settings-card">
        <div className="card-header">
          <div className="card-title">Job Events</div>
          <div className="card-description">Alerts for job lifecycle events</div>
        </div>
        <div className="card-body">
          <div className="toggle-item" onClick={() => toggle('jobComplete')}>
            <div>
              <div className="toggle-label">Job completed</div>
              <div className="toggle-description">Notify when a job finishes successfully</div>
            </div>
            <div className={`toggle-switch ${notifications.jobComplete ? 'active' : ''}`}>
              <div className="toggle-knob" />
            </div>
          </div>
          <div className="divider" />
          <div className="toggle-item" onClick={() => toggle('jobFailed')}>
            <div>
              <div className="toggle-label">Job failed</div>
              <div className="toggle-description">Immediate alert on errors or job failures</div>
            </div>
            <div className={`toggle-switch ${notifications.jobFailed ? 'active' : ''}`}>
              <div className="toggle-knob" />
            </div>
          </div>
          <div className="divider" />
          <div className="toggle-item" onClick={() => toggle('jobStarted')}>
            <div>
              <div className="toggle-label">Job started</div>
              <div className="toggle-description">Confirmation when a scheduled job starts</div>
            </div>
            <div className={`toggle-switch ${notifications.jobStarted ? 'active' : ''}`}>
              <div className="toggle-knob" />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <div className="card-title">System Alerts</div>
          <div className="card-description">Infrastructure and quota notifications</div>
        </div>
        <div className="card-body">
          <div className="toggle-item" onClick={() => toggle('proxyAlert')}>
            <div>
              <div className="toggle-label">Proxy pool degraded</div>
              <div className="toggle-description">Alert when proxy health drops below 70%</div>
            </div>
            <div className={`toggle-switch ${notifications.proxyAlert ? 'active' : ''}`}>
              <div className="toggle-knob" />
            </div>
          </div>
          <div className="divider" />
          <div className="toggle-item" onClick={() => toggle('quotaWarning')}>
            <div>
              <div className="toggle-label">Quota warnings</div>
              <div className="toggle-description">Warn at 80% and 95% of monthly limits</div>
            </div>
            <div className={`toggle-switch ${notifications.quotaWarning ? 'active' : ''}`}>
              <div className="toggle-knob" />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <div className="card-title">Reports</div>
          <div className="card-description">Periodic summaries</div>
        </div>
        <div className="card-body">
          <div className="toggle-item" onClick={() => toggle('weeklyReport')}>
            <div>
              <div className="toggle-label">Weekly summary</div>
              <div className="toggle-description">Email report of job performance every Monday</div>
            </div>
            <div className={`toggle-switch ${notifications.weeklyReport ? 'active' : ''}`}>
              <div className="toggle-knob" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </>
  );
}

// ============================================================
// SECURITY SETTINGS
// ============================================================

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', sessionId: null });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [twoFARes, sessionsRes] = await Promise.all([
        api.get('/api/settings/security/2fa'),
        api.get('/api/settings/security/sessions')
      ]);
      setTwoFA(twoFARes.data.enabled || false);
      setSessions(sessionsRes.data || []);
    } catch (err) {
      console.error('Failed to load security data:', err);
      if (err.response?.status === 404) {
        setSessions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading security settings…</span>
      </div>
    );
  }

  const updatePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.put('/api/settings/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update password:', err);
      setPasswordError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const setupTwoFactor = async () => {
    setSettingUp2FA(true);
    try {
      const res = await api.post('/api/settings/security/2fa/setup');
      setTwoFASetup(res.data);
    } catch (err) {
      console.error('Failed to setup 2FA:', err);
      alert('Failed to setup 2FA');
    } finally {
      setSettingUp2FA(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!twoFACode) {
      alert('Please enter verification code');
      return;
    }
    try {
      await api.post('/api/settings/security/2fa/verify', { code: twoFACode });
      setTwoFA(true);
      setTwoFASetup(null);
      setTwoFACode('');
      alert('2FA enabled successfully');
    } catch (err) {
      console.error('Invalid verification code:', err);
      alert(err.response?.data?.detail || 'Invalid verification code');
    }
  };

  const disableTwoFactor = () => {
    setConfirmModal({ isOpen: true, type: '2fa', sessionId: null });
  };

  const confirmDisable2FA = async () => {
    try {
      await api.post('/api/settings/security/2fa/disable');
      setTwoFA(false);
      alert('2FA disabled successfully');
    } catch (err) {
      console.error('Failed to disable 2FA:', err);
      alert('Failed to disable 2FA');
    } finally {
      setConfirmModal({ isOpen: false, type: '', sessionId: null });
    }
  };

  const revokeSession = (sessionId) => {
    setConfirmModal({ isOpen: true, type: 'session', sessionId });
  };

  const confirmRevokeSession = async () => {
    try {
      await api.delete(`/api/settings/security/sessions/${confirmModal.sessionId}`);
      const res = await api.get('/api/settings/security/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to revoke session:', err);
      if (err.response?.status === 404) {
        alert('Session already revoked');
        const res = await api.get('/api/settings/security/sessions');
        setSessions(res.data || []);
      } else {
        alert('Failed to revoke session');
      }
    } finally {
      setConfirmModal({ isOpen: false, type: '', sessionId: null });
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', sessionId: null })}
        onConfirm={confirmModal.type === '2fa' ? confirmDisable2FA : confirmRevokeSession}
        title={confirmModal.type === '2fa' ? 'Disable 2FA' : 'Revoke Session'}
        message={confirmModal.type === '2fa'
          ? 'Disable two-factor authentication? This will make your account less secure.'
          : 'Revoke this session? You will be signed out on that device.'}
      />

      <div className="settings-card">
        <div className="card-header">
          <div className="card-title">Password</div>
          <div className="card-description">Keep your account secure with a strong password</div>
        </div>
        <div className="card-body">
          {passwordError && (
            <div className="alert alert-error">
              <AlertTriangle size={14} />
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="alert alert-success">
              <CheckCircle size={14} />
              Password updated successfully!
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.current_password}
                onChange={e => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="form-hint">Minimum 8 characters</div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-input"
                type="password"
                value={passwordForm.confirm_password}
                onChange={e => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button className="btn btn-primary" onClick={updatePassword} disabled={updatingPassword}>
              {updatingPassword ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
              {updatingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <div className="card-title">Two-Factor Authentication</div>
          <div className="card-description">Add an extra layer of security to your account</div>
        </div>
        <div className="card-body">
          {twoFA ? (
            <>
              <div className="alert alert-success" style={{ marginBottom: 14 }}>
                <CheckCircle size={14} />
                2FA is enabled on your account
              </div>
              <button className="btn btn-danger" onClick={disableTwoFactor}>Disable 2FA</button>
            </>
          ) : twoFASetup ? (
            <>
              <div className="qrcode-container">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(twoFASetup.uri)}`}
                  alt="QR Code"
                  style={{ width: 140, height: 140, maxWidth: '100%' }}
                />
                <div className="secret-code">
                  Secret: {twoFASetup.secret}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Verification Code</label>
                <input
                  className="form-input"
                  placeholder="Enter 6-digit code"
                  value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={verifyTwoFactor}>Verify & Enable</button>
                <button className="btn btn-secondary" onClick={() => setTwoFASetup(null)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="toggle-item" onClick={setupTwoFactor}>
                <div>
                  <div className="toggle-label">Enable Two-Factor Authentication</div>
                  <div className="toggle-description">Use an authenticator app like Google Authenticator</div>
                </div>
                <div className="toggle-switch">
                  <div className="toggle-knob" />
                </div>
              </div>
              {settingUp2FA && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  <Loader2 size={14} className="spin" /> Setting up…
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <div className="card-title">Active Sessions</div>
          <div className="card-description">Devices currently signed in to your account</div>
        </div>
        <div className="card-body">
          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Smartphone size={22} /></div>
              <div style={{ fontSize: 13 }}>No active sessions</div>
            </div>
          ) : (
            sessions.map(s => (
              <div key={s.id} className="session-item">
                <div className="session-icon"><Activity size={15} /></div>
                <div className="session-info">
                  <div className="session-device">{s.device || 'Unknown Device'}</div>
                  <div className="session-meta">
                    {s.location || 'Unknown location'} • Last active {s.last_active ? new Date(s.last_active).toLocaleString() : 'Recently'}
                  </div>
                </div>
                {s.current ? (
                  <span className="session-badge">Current</span>
                ) : (
                  <button className="btn btn-danger btn-sm" onClick={() => revokeSession(s.id)}>
                    <Trash2 size={12} /> Revoke
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================
// MAIN SETTINGS PAGE
// ============================================================

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield }
];

const SECTION_MAP = {
  profile: ProfileSettings,
  notifications: NotificationSettings,
  security: SecuritySettings
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const ActiveSection = SECTION_MAP[activeTab];

  return (
    <div className="settings-root page-enter">
      <div className="settings-container">
        <div className="settings-grid">
          {/* Sidebar */}
          <div className="settings-sidebar">
            <div className="sidebar-header">Settings</div>
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div>
            <ActiveSection />
          </div>
        </div>
      </div>
    </div>
  );
}