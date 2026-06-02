// frontend/src/pages/SettingsPage.jsx - MongoDB Atlas Enterprise Edition

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Globe, Shield, Key, CreditCard, Webhook,
  Save, Plus, Trash2, 
  ArrowLeft, Activity, Loader2, CheckCircle,
  Copy, Lock, Eye, EyeOff, Smartphone, Server,
  Calendar, TrendingUp, AlertTriangle, X
} from 'lucide-react';
import api from '../api';

// ============================================================
// MONGODB ATLAS ENTERPRISE DESIGN SYSTEM
// ============================================================

const styles = `
  /* Enterprise Design Tokens - MongoDB Atlas Inspired */
  .settings-root {
    --color-mdb-green: #00ED64;
    --color-mdb-green-dark: #00C355;
    --color-canvas: #0D1117;
    --color-surface: #161B22;
    --color-surface-elevated: #1F242E;
    --color-border: #30363D;
    --color-border-subtle: #21262D;
    
    --color-text-primary: #F0F6FC;
    --color-text-secondary: #8B949E;
    --color-text-muted: #6E7681;
    
    --color-success: #00ED64;
    --color-warning: #D29922;
    --color-error: #F85149;
    --color-info: #58A6FF;
    
    --color-accent-dim: rgba(0, 237, 100, 0.12);
    --color-accent-border: rgba(0, 237, 100, 0.25);
    
    --shadow-sm: 0 1px 0 0 rgba(0, 0, 0, 0.2);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
    
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Courier New", monospace;
    
    --transition: 120ms cubic-bezier(0.2, 0.8, 0.4, 1);
  }

  /* Base */
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
  }

  /* Animations */
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
    animation: spin 0.6s linear infinite;
  }

  /* Layout */
  .settings-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 24px;
  }

  /* Back Button */
  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
    margin-bottom: 28px;
  }
  
  .back-btn:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }

  /* Two Column Layout */
  .settings-grid {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 28px;
    align-items: start;
  }
  
  @media (max-width: 780px) {
    .settings-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Sidebar Navigation */
  .settings-sidebar {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    position: sticky;
    top: 24px;
  }
  
  .sidebar-header {
    padding: 16px 20px 8px;
    font-size: 10px;
    font-weight: 600;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 20px;
    background: transparent;
    border: none;
    border-left: 2px solid transparent;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
    text-align: left;
  }
  
  .nav-item:hover {
    background: rgba(255, 255, 255, 0.02);
    color: var(--color-text-primary);
  }
  
  .nav-item.active {
    background: var(--color-accent-dim);
    border-left-color: var(--color-mdb-green);
    color: var(--color-mdb-green);
  }

  /* Settings Card */
  .settings-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin-bottom: 20px;
  }
  
  .card-header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--color-border);
    background: rgba(255, 255, 255, 0.01);
  }
  
  .card-title {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }
  
  .card-description {
    font-size: 12px;
    color: var(--color-text-muted);
  }
  
  .card-body {
    padding: 24px;
  }

  /* Form Elements */
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }
  
  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    padding: 10px 14px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 13px;
    font-family: var(--font-sans);
    outline: none;
    transition: all var(--transition);
  }
  
  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 2px rgba(0, 237, 100, 0.1);
  }
  
  .form-input::placeholder {
    color: var(--color-text-muted);
  }
  
  .form-hint {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-top: 6px;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all var(--transition);
    border: none;
  }
  
  .btn-primary {
    background: var(--color-mdb-green);
    color: #0D1117;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--color-mdb-green-dark);
    transform: translateY(-1px);
  }
  
  .btn-secondary {
    background: var(--color-canvas);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
  
  .btn-danger {
    background: rgba(248, 81, 73, 0.1);
    color: var(--color-error);
    border: 1px solid rgba(248, 81, 73, 0.25);
  }
  
  .btn-danger:hover:not(:disabled) {
    background: rgba(248, 81, 73, 0.2);
  }
  
  .btn-sm {
    padding: 6px 12px;
    font-size: 11px;
    gap: 6px;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-block {
    width: 100%;
    justify-content: center;
  }

  /* Toggle Switch */
  .toggle-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    cursor: pointer;
  }
  
  .toggle-label {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .toggle-description {
    font-size: 11px;
    color: var(--color-text-muted);
  }
  
  .toggle-switch {
    width: 44px;
    height: 24px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--color-border);
    border-radius: 99px;
    position: relative;
    transition: all var(--transition);
    flex-shrink: 0;
  }
  
  .toggle-switch.active {
    background: var(--color-mdb-green);
    border-color: var(--color-mdb-green);
  }
  
  .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    transition: left var(--transition);
    box-shadow: var(--shadow-sm);
  }
  
  .toggle-switch.active .toggle-knob {
    left: 22px;
  }
  
  .divider {
    height: 1px;
    background: var(--color-border);
    margin: 8px 0;
  }

  /* Alert */
  .alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
    font-size: 13px;
  }
  
  .alert-success {
    background: rgba(0, 237, 100, 0.1);
    border: 1px solid rgba(0, 237, 100, 0.25);
    color: var(--color-success);
  }
  
  .alert-error {
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.25);
    color: var(--color-error);
  }
  
  .alert-info {
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid rgba(88, 166, 255, 0.25);
    color: var(--color-info);
  }

  /* API Key Items */
  .api-key-item {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .api-key-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .api-key-name {
    font-size: 14px;
    font-weight: 600;
  }
  
  .api-key-scopes {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }
  
  .scope-badge {
    font-size: 9px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    background: rgba(88, 166, 255, 0.1);
    color: var(--color-info);
    text-transform: uppercase;
  }
  
  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .stat-box {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 14px;
    text-align: center;
  }
  
  .stat-number {
    font-size: 24px;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--color-info);
  }
  
  .stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-top: 4px;
  }

  /* Progress Bar */
  .progress-section {
    margin-bottom: 20px;
  }
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 12px;
  }
  
  .progress-bar {
    height: 4px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--color-mdb-green);
    border-radius: 4px;
    transition: width var(--transition);
  }

  /* Plan Card */
  .plan-card {
    background: var(--color-accent-dim);
    border: 1px solid var(--color-accent-border);
    border-radius: var(--radius-md);
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .plan-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .plan-name {
    font-size: 18px;
    font-weight: 700;
  }
  
  .plan-price {
    font-size: 14px;
    color: var(--color-text-muted);
  }
  
  .plan-features {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
  }
  
  .plan-feature {
    text-align: center;
  }
  
  .plan-feature-value {
    font-weight: 700;
  }
  
  .plan-feature-label {
    font-size: 10px;
    color: var(--color-text-muted);
    margin-top: 2px;
  }
  
  .cancel-notice {
    margin-top: 16px;
    padding: 12px;
    background: rgba(248, 81, 73, 0.1);
    border-radius: var(--radius-md);
    font-size: 12px;
    color: var(--color-error);
  }

  /* Session Item */
  .session-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    margin-bottom: 10px;
  }
  
  .session-icon {
    width: 36px;
    height: 36px;
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid rgba(88, 166, 255, 0.25);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-info);
  }
  
  .session-info {
    flex: 1;
  }
  
  .session-device {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .session-meta {
    font-size: 10px;
    color: var(--color-text-muted);
  }
  
  .session-badge {
    font-size: 9px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    background: rgba(0, 237, 100, 0.1);
    color: var(--color-success);
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(13, 17, 23, 0.92);
    backdrop-filter: blur(4px);
  }
  
  .modal {
    max-width: 420px;
    width: 100%;
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
  }
  
  .modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border);
  }
  
  .modal-title {
    font-size: 16px;
    font-weight: 600;
  }
  
  .modal-body {
    padding: 20px 24px;
  }
  
  .modal-footer {
    padding: 16px 24px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  /* New Key Alert */
  .new-key-alert {
    margin-bottom: 20px;
    padding: 16px;
    background: rgba(0, 237, 100, 0.1);
    border: 1px solid rgba(0, 237, 100, 0.25);
    border-radius: var(--radius-md);
  }
  
  .new-key-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-success);
    margin-bottom: 8px;
  }
  
  .new-key-message {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-bottom: 12px;
  }
  
  .key-value {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .key-code {
    flex: 1;
    background: rgba(0, 0, 0, 0.35);
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 11px;
    word-break: break-all;
  }

  /* Loading State */
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px;
    color: var(--color-text-muted);
  }

  /* 2FA Setup */
  .qrcode-container {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 20px;
    text-align: center;
    margin-bottom: 20px;
  }
  
  .secret-code {
    background: rgba(0, 0, 0, 0.35);
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 12px;
    margin-top: 12px;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 40px;
    color: var(--color-text-muted);
  }
  
  .empty-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// Inject styles
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
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={20} className="spin" />
        <span>Loading profile...</span>
      </div>
    );
  }

  return (
    <>
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
            <div className="form-hint">Used for job notifications and billing</div>
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
          {saving ? <Loader2 size={14} className="spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
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

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/settings/notifications');
        const data = res.data;
        setNotifications({
          jobComplete: data.job_complete,
          jobFailed: data.job_failed,
          jobStarted: data.job_started,
          weeklyReport: data.weekly_report,
          proxyAlert: data.proxy_alert,
          quotaWarning: data.quota_warning
        });
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

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
    } catch (err) {
      console.error('Failed to save notifications:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={20} className="spin" />
        <span>Loading notifications...</span>
      </div>
    );
  }

  return (
    <>
      <div className="settings-card">
        <div className="card-header">
          <div className="card-title">Job Events</div>
          <div className="card-description">Alerts for scraping job lifecycle</div>
        </div>
        <div className="card-body">
          <div className="toggle-item" onClick={() => toggle('jobComplete')}>
            <div>
              <div className="toggle-label">Job completed</div>
              <div className="toggle-description">Notify when a scraping job finishes successfully</div>
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
              <div className="toggle-description">Confirmation when a scheduled job kicks off</div>
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
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </>
  );
}

// ============================================================
// API KEY SETTINGS
// ============================================================

function ApiKeySettings() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState(['read', 'write']);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [usage, setUsage] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, keyId: null, keyName: '' });

  useEffect(() => {
    fetchKeys();
    fetchUsage();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await api.get('/api/settings/api-keys');
      setKeys(res.data);
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await api.get('/api/settings/api-keys/usage');
      setUsage(res.data);
    } catch (err) {
      console.error('Failed to load usage:', err);
    }
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/api/settings/api-keys', {
        name: newKeyName,
        scopes: newKeyScopes
      });
      setNewlyCreatedKey(res.data);
      await fetchKeys();
      setNewKeyName('');
      setTimeout(() => setNewlyCreatedKey(null), 10000);
    } catch (err) {
      console.error('Failed to create key:', err);
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (keyId, keyName) => {
    setConfirmModal({ isOpen: true, keyId, keyName });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/settings/api-keys/${confirmModal.keyId}`);
      await fetchKeys();
    } catch (err) {
      console.error('Failed to delete key:', err);
    } finally {
      setConfirmModal({ isOpen: false, keyId: null, keyName: '' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={20} className="spin" />
        <span>Loading API keys...</span>
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, keyId: null, keyName: '' })}
        onConfirm={confirmDelete}
        title="Delete API Key"
        message={`Delete API key "${confirmModal.keyName}"? This action cannot be undone.`}
      />

      {newlyCreatedKey && (
        <div className="new-key-alert">
          <div className="new-key-title">New API Key Created</div>
          <div className="new-key-message">Make sure to copy your key now. You won't be able to see it again.</div>
          <div className="key-value">
            <code className="key-code">{newlyCreatedKey.key}</code>
            <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(newlyCreatedKey.key)}>
              <Copy size={12} /> Copy
            </button>
          </div>
        </div>
      )}

      {usage && (
        <div className="settings-card">
          <div className="card-header">
            <div className="card-title">API Usage</div>
            <div className="card-description">Current month consumption</div>
          </div>
          <div className="card-body">
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-number">{usage.api_requests?.toLocaleString() || 0}</div>
                <div className="stat-label">API Requests</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>limit {usage.api_limit?.toLocaleString() || 1000}</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{usage.export_calls?.toLocaleString() || 0}</div>
                <div className="stat-label">Exports</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>limit {usage.export_limit?.toLocaleString() || 100}</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{usage.concurrent_jobs || 0}</div>
                <div className="stat-label">Concurrent Jobs</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>limit {usage.concurrent_jobs_limit || 5}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="settings-card">
        <div className="card-header">
          <div className="card-title">API Keys</div>
          <div className="card-description">Manage programmatic access to the API</div>
        </div>
        <div className="card-body">
          {keys.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Key size={24} /></div>
              <div style={{ fontSize: 13 }}>No API keys created yet</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Create your first API key to get started</div>
            </div>
          ) : (
            keys.map(k => (
              <div key={k.id} className="api-key-item">
                <div className="api-key-header">
                  <div>
                    <div className="api-key-name">{k.name}</div>
                    <div className="api-key-scopes">
                      {k.scopes?.map(s => (
                        <span key={s} className="scope-badge">{s}</span>
                      ))}
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteKey(k.id, k.name)}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                  Created {k.created_at ? new Date(k.created_at).toLocaleDateString() : 'Unknown'}
                  {k.last_used && ` • Last used ${new Date(k.last_used).toLocaleDateString()}`}
                </div>
              </div>
            ))
          )}
          
          <div style={{ marginTop: 20 }}>
            <div className="form-group">
              <label className="form-label">Key Name</label>
              <input
                className="form-input"
                placeholder="e.g., Production API Key"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Scopes</label>
              <select
                className="form-select"
                value={newKeyScopes}
                onChange={e => setNewKeyScopes(Array.from(e.target.selectedOptions, opt => opt.value))}
                multiple
                style={{ minHeight: 80 }}
              >
                <option value="read">read - Read-only access</option>
                <option value="write">write - Create and modify resources</option>
                <option value="export">export - Export data</option>
              </select>
              <div className="form-hint">Hold Ctrl/Cmd to select multiple scopes</div>
            </div>
            <button className="btn btn-primary" onClick={generateKey} disabled={creating}>
              {creating ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
              {creating ? 'Creating...' : 'Generate New Key'}
            </button>
          </div>
        </div>
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
    } catch (err) {
      console.error('Failed to load security data:', err);
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
    } catch (err) {
      console.error('Failed to update password:', err);
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
    } finally {
      setSettingUp2FA(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!twoFACode) return;
    try {
      await api.post('/api/settings/security/2fa/verify', { code: twoFACode });
      setTwoFA(true);
      setTwoFASetup(null);
      setTwoFACode('');
    } catch (err) {
      console.error('Invalid verification code:', err);
    }
  };

  const disableTwoFactor = () => {
    setConfirmModal({ isOpen: true, type: '2fa', sessionId: null });
  };

  const confirmDisable2FA = async () => {
    try {
      await api.post('/api/settings/security/2fa/disable');
      setTwoFA(false);
    } catch (err) {
      console.error('Failed to disable 2FA:', err);
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
      await fetchSecurityData();
    } catch (err) {
      console.error('Failed to revoke session:', err);
    } finally {
      setConfirmModal({ isOpen: false, type: '', sessionId: null });
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={20} className="spin" />
        <span>Loading security settings...</span>
      </div>
    );
  }

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
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
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
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-primary" onClick={updatePassword} disabled={updatingPassword}>
              {updatingPassword ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
              {updatingPassword ? 'Updating...' : 'Update Password'}
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
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
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
                  style={{ width: 160, height: 160 }}
                />
                <div className="secret-code">
                  Secret: <span style={{ fontFamily: 'monospace' }}>{twoFASetup.secret}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Verification Code</label>
                <input
                  className="form-input"
                  placeholder="000000"
                  value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
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
                <div style={{ marginTop: 12 }}>
                  <Loader2 size={14} className="spin" /> Setting up...
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
              <div className="empty-icon"><Smartphone size={24} /></div>
              <div>No active sessions</div>
            </div>
          ) : (
            sessions.map(s => (
              <div key={s.id} className="session-item">
                <div className="session-icon"><Activity size={16} /></div>
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
// BILLING SETTINGS
// ============================================================

function BillingSettings() {
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

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
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async (newPlan) => {
    setUpgrading(true);
    try {
      await api.post('/api/settings/billing/plan/upgrade', { plan: newPlan });
      await fetchBillingData();
    } catch (err) {
      console.error('Failed to upgrade plan:', err);
    } finally {
      setUpgrading(false);
    }
  };

  const cancelSubscription = () => {
    setConfirmModal({ isOpen: true });
  };

  const confirmCancel = async () => {
    try {
      await api.post('/api/settings/billing/plan/cancel');
      await fetchBillingData();
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    } finally {
      setConfirmModal({ isOpen: false });
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={20} className="spin" />
        <span>Loading billing information...</span>
      </div>
    );
  }

  const recordPercent = usage?.records_limit && usage.records_limit !== 'Unlimited'
    ? ((usage.records_scraped || 0) / usage.records_limit) * 100
    : 0;

  const apiPercent = usage?.api_limit && usage.api_limit !== 'Unlimited'
    ? ((usage.api_requests || 0) / usage.api_limit) * 100
    : 0;

  const exportPercent = usage?.export_limit && usage.export_limit !== 'Unlimited'
    ? ((usage.export_downloads || 0) / usage.export_limit) * 100
    : 0;

  return (
    <>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        onConfirm={confirmCancel}
        title="Cancel Subscription"
        message="Cancel your subscription? Your plan will end at the current billing period. You will lose access to premium features."
      />

      {plan && (
        <div className="settings-card">
          <div className="card-header">
            <div className="card-title">Current Plan</div>
            <div className="card-description">Your active subscription</div>
          </div>
          <div className="card-body">
            <div className="plan-card">
              <div className="plan-header">
                <div>
                  <div className="plan-name">{plan.plan_info?.name || 'Free'} Plan</div>
                  <div className="plan-price">{plan.plan_info?.price || 'Free'} / month</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!plan.cancel_at_period_end && plan.plan !== 'enterprise' && (
                    <>
                      <button className="btn btn-primary" onClick={() => upgradePlan('pro')} disabled={upgrading}>
                        {upgrading ? <Loader2 size={14} className="spin" /> : 'Upgrade to Pro'}
                      </button>
                      <button className="btn btn-danger" onClick={cancelSubscription}>Cancel</button>
                    </>
                  )}
                </div>
              </div>
              <div className="plan-features">
                <div className="plan-feature">
                  <div className="plan-feature-value">{plan.plan_info?.records_limit?.toLocaleString() || 'Unlimited'}</div>
                  <div className="plan-feature-label">Records / month</div>
                </div>
                <div className="plan-feature">
                  <div className="plan-feature-value">{plan.plan_info?.jobs_limit || 'Unlimited'}</div>
                  <div className="plan-feature-label">Active Jobs</div>
                </div>
                <div className="plan-feature">
                  <div className="plan-feature-value">{plan.plan === 'enterprise' ? '24/7' : 'Email'}</div>
                  <div className="plan-feature-label">Support</div>
                </div>
              </div>
              {plan.cancel_at_period_end && (
                <div className="cancel-notice">
                  <AlertTriangle size={12} style={{ display: 'inline', marginRight: 8 }} />
                  Your subscription will end on {plan.current_period_end ? new Date(plan.current_period_end).toLocaleDateString() : 'N/A'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {usage && (
        <div className="settings-card">
          <div className="card-header">
            <div className="card-title">Usage This Month</div>
            <div className="card-description">Current consumption against plan limits</div>
          </div>
          <div className="card-body">
            <div className="progress-section">
              <div className="progress-header">
                <span>Records scraped</span>
                <span>{usage.records_scraped?.toLocaleString() || 0} / {usage.records_limit === 'Unlimited' ? 'Unlimited' : usage.records_limit?.toLocaleString() || 1000}</span>
              </div>
              {usage.records_limit !== 'Unlimited' && (
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(recordPercent, 100)}%` }} /></div>
              )}
            </div>
            <div className="progress-section">
              <div className="progress-header">
                <span>API requests</span>
                <span>{usage.api_requests?.toLocaleString() || 0} / {usage.api_limit === 'Unlimited' ? 'Unlimited' : usage.api_limit?.toLocaleString() || 1000}</span>
              </div>
              {usage.api_limit !== 'Unlimited' && (
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(apiPercent, 100)}%` }} /></div>
              )}
            </div>
            <div className="progress-section">
              <div className="progress-header">
                <span>Export downloads</span>
                <span>{usage.export_downloads?.toLocaleString() || 0} / {usage.export_limit === 'Unlimited' ? 'Unlimited' : usage.export_limit?.toLocaleString() || 100}</span>
              </div>
              {usage.export_limit !== 'Unlimited' && (
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(exportPercent, 100)}%` }} /></div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="settings-card">
        <div className="card-header">
          <div className="card-title">Payment Method</div>
          <div className="card-description">Manage your billing details</div>
        </div>
        <div className="card-body">
          {paymentMethod ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--color-canvas)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ width: 46, height: 32, background: 'linear-gradient(135deg, #1a1f36, #2d3748)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{paymentMethod.card_brand?.charAt(0).toUpperCase() + paymentMethod.card_brand?.slice(1) || 'Card'} ending in {paymentMethod.last4}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Expires {paymentMethod.expiry_month}/{paymentMethod.expiry_year}</div>
              </div>
              <button className="btn btn-secondary btn-sm">Update</button>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><CreditCard size={24} /></div>
              <div style={{ fontSize: 13 }}>No payment method on file</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Add Payment Method</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================
// PROXY SETTINGS (Placeholder)
// ============================================================

function ProxySettings() {
  return (
    <div className="settings-card">
      <div className="card-header">
        <div className="card-title">Proxy Pools</div>
        <div className="card-description">Manage proxy rotation and health monitoring</div>
      </div>
      <div className="card-body">
        <div className="empty-state">
          <div className="empty-icon"><Globe size={24} /></div>
          <div style={{ fontSize: 13 }}>Proxy Management</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Coming in the next release</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WEBHOOK SETTINGS (Placeholder)
// ============================================================

function WebhookSettings() {
  return (
    <div className="settings-card">
      <div className="card-header">
        <div className="card-title">Webhook Endpoints</div>
        <div className="card-description">Configure webhooks for real-time event notifications</div>
      </div>
      <div className="card-body">
        <div className="empty-state">
          <div className="empty-icon"><Webhook size={24} /></div>
          <div style={{ fontSize: 13 }}>Webhooks</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Coming in the next release</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN SETTINGS PAGE
// ============================================================

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const ActiveSection = SECTION_MAP[activeTab];

  return (
    <div className="settings-root page-enter">
      <div className="settings-container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

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