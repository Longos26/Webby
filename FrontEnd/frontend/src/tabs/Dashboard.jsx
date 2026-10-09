// frontend/src/AppShell.jsx - ENTERPRISE REDESIGN - CLEAN

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  LayoutDashboard,
  Briefcase,
  Download,
  Settings,
  LogOut,
  Menu,
  Database,
  X,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Bot,
  TrendingUp,
  Activity,
  PieChart as PieChartIcon,
  RefreshCw,
  ChevronRight,
  Users,
  Zap,
  AlertCircle,
  Server,
  Globe,
  Shield,
  Bell,
  Search,
  Filter
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import api from '../api';
import JobsTab from './JobsTab';
import ExportTab from './ExportTab';
import SettingsPage from './SettingsTab';
import ModelsTab from './ModelsTab';
import React from 'react';
import logo from '../newlogo.png';

// ============================================================
// ENTERPRISE REDESIGN - CLEAN UNTITLED UI AESTHETIC
// ============================================================

const globalStyles = `
  /* Reset & Base */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    /* Primary Colors */
    --color-primary: #00ED64;
    --color-primary-dark: #00C950;
    --color-primary-light: #2EED7E;

    /* Background Colors */
    --bg-primary: #0D1117;
    --bg-secondary: #161B22;
    --bg-tertiary: #1C2128;
    --bg-hover: #21262D;
    --bg-elevated: #21262D;

    /* Border Colors */
    --border-default: #30363D;
    --border-muted: #21262D;
    --border-subtle: rgba(48, 54, 61, 0.5);
    --border-active: #484F58;

    /* Text Colors */
    --text-primary: #F0F6FC;
    --text-secondary: #9BA4B0;
    --text-muted: #6E7681;
    --text-link: #58A6FF;

    /* Status Colors */
    --status-success: #00ED64;
    --status-success-bg: rgba(0, 237, 100, 0.1);
    --status-success-border: rgba(0, 237, 100, 0.2);
    --status-warning: #D29922;
    --status-warning-bg: rgba(210, 153, 34, 0.1);
    --status-warning-border: rgba(210, 153, 34, 0.2);
    --status-error: #F85149;
    --status-error-bg: rgba(248, 81, 73, 0.1);
    --status-error-border: rgba(248, 81, 73, 0.2);
    --status-info: #58A6FF;
    --status-info-bg: rgba(88, 166, 255, 0.1);
    --status-info-border: rgba(88, 166, 255, 0.2);

    /* Shadows - Soft */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.35);

    /* Spacing */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-7: 32px;
    --space-8: 40px;

    /* Radius */
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;

    /* Typography */
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Fira Code", monospace;

    /* Transitions */
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  body {
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, .h1 {
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  h2, .h2 {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }

  h3, .h3 {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
  }

  /* Scrollbar - Subtle */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: var(--radius-full);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #484F58;
  }

  *:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.95); }
  }

  .fade-in {
    animation: fadeIn 0.2s ease-out;
  }

  .spin {
    animation: spin 0.8s linear infinite;
  }

  /* Layout */
  .app-container {
    display: flex;
    min-height: 100vh;
  }

  /* Sidebar */
  .sidebar {
    width: 248px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-default);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 50;
    transition: transform var(--transition);
  }

  .sidebar-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--border-default);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .logo img {
    height: 52px;
    width: auto;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 12px;
    margin: 2px 12px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    width: calc(100% - 24px);
    text-align: left;
    cursor: pointer;
    transition: background var(--transition), color var(--transition);
    font-family: inherit;
  }

  .nav-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .nav-item.active {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .nav-item.active svg {
    color: var(--color-primary);
  }

  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 248px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Top Bar */
  .topbar {
    position: sticky;
    top: 0;
    background: rgba(13, 17, 23, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-default);
    padding: 0 28px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 40;
  }

  .page-title h1 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 2px;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }

  .page-title p {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 400;
  }

  /* Cards */
  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
  }

  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-default);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .card-body {
    padding: 20px;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
    transition: border-color var(--transition);
  }

  .stat-card:hover {
    border-color: var(--border-active);
  }

  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
  }

  .stat-trend {
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: var(--radius-full);
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-default);
  }

  .stat-value {
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
    font-family: var(--font-mono);
    color: var(--text-primary);
    line-height: 1.2;
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 400;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background var(--transition), border-color var(--transition), color var(--transition);
    border: none;
    font-family: inherit;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  .btn-primary {
    background: var(--color-primary);
    color: #0D1117;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-active);
  }

  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
    gap: 6px;
  }

  /* Tables */
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th {
    text-align: left;
    padding: 10px 20px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-default);
    background: transparent;
    white-space: nowrap;
  }

  .data-table td {
    padding: 14px 20px;
    font-size: 13px;
    border-bottom: 1px solid var(--border-muted);
    color: var(--text-secondary);
    vertical-align: middle;
  }

  .data-table tr:last-child td {
    border-bottom: none;
  }

  .data-table tbody tr {
    transition: background var(--transition);
  }

  .data-table tbody tr:hover td {
    background: var(--bg-hover);
  }

  /* Status Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    line-height: 1.5;
  }

  .badge-success {
    background: var(--status-success-bg);
    color: #56D364;
    border: 1px solid var(--status-success-border);
  }

  .badge-warning {
    background: var(--status-warning-bg);
    color: #E3B341;
    border: 1px solid var(--status-warning-border);
  }

  .badge-error {
    background: var(--status-error-bg);
    color: #FF7B72;
    border: 1px solid var(--status-error-border);
  }

  .badge-info {
    background: var(--status-info-bg);
    color: #79B8FF;
    border: 1px solid var(--status-info-border);
  }

  .badge-default {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-default);
  }

  /* Forms */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .form-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .form-input,
  .form-select,
  .form-textarea {
    background: var(--bg-primary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 9px 12px;
    font-size: 14px;
    color: var(--text-primary);
    transition: border-color var(--transition), box-shadow var(--transition);
    font-family: inherit;
    width: 100%;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.08);
  }

  .form-input::placeholder {
    color: var(--text-muted);
  }

  /* Filter Chips */
  .filter-chip {
    padding: 5px 12px;
    border-radius: var(--radius-md);
    font-size: 12px;
    font-weight: 500;
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    font-family: inherit;
  }

  .filter-chip:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .filter-chip.active {
    background: var(--status-success-bg);
    border-color: var(--status-success-border);
    color: #56D364;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
  }

  .empty-icon {
    width: 52px;
    height: 52px;
    margin: 0 auto 14px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    border: 1px solid var(--border-default);
  }

  .empty-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--text-primary);
  }

  .empty-description {
    font-size: 13px;
    color: var(--text-muted);
  }

  /* Loading State */
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
    border: 2px solid var(--border-default);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* Sidebar Overlay */
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 45;
  }

  .menu-toggle {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 8px;
    display: none;
    border-radius: var(--radius-sm);
    transition: background var(--transition);
  }

  .menu-toggle:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  /* ============================================================ */
  /* RESPONSIVE BREAKPOINTS */
  /* ============================================================ */

  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
  }

  @media (max-width: 768px) {
    .menu-toggle {
      display: flex !important;
      align-items: center;
      justify-content: center;
    }

    .sidebar {
      transform: translateX(-100%);
      width: 280px;
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .main-content {
      margin-left: 0;
    }

    .topbar {
      padding: 0 16px;
      height: 56px;
    }

    .page-title h1 {
      font-size: 15px;
    }

    .page-title p {
      font-size: 11px;
      display: none;
    }

    .stats-grid {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }

    .stat-card {
      padding: 14px 16px;
    }

    .stat-value {
      font-size: 20px;
    }

    .stat-icon {
      width: 32px;
      height: 32px;
    }

    .stat-trend {
      font-size: 10px;
      padding: 2px 6px;
    }

    .stat-label {
      font-size: 11px;
    }

    .card-header {
      padding: 14px 16px;
    }

    .card-body {
      padding: 16px;
    }

    .data-table th,
    .data-table td {
      padding: 10px 14px;
      font-size: 12px;
    }

    main {
      padding: 16px !important;
    }

    .filter-chip {
      font-size: 11px;
      padding: 4px 10px;
    }

    .btn {
      font-size: 12px;
      padding: 7px 12px;
    }

    .btn-sm {
      font-size: 11px;
      padding: 5px 10px;
    }

    .empty-state {
      padding: 32px 16px;
    }
  }

  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .stat-card {
      padding: 12px 14px;
    }

    .stat-value {
      font-size: 20px;
    }

    .topbar {
      padding: 0 12px;
      height: 52px;
    }

    .sidebar {
      width: 260px;
    }

    .sidebar-header {
      padding: 16px;
    }

    .nav-item {
      padding: 8px 10px;
      font-size: 12px;
      margin: 1px 8px;
      width: calc(100% - 16px);
    }

    .data-table th,
    .data-table td {
      padding: 8px 10px;
      font-size: 12px;
    }

    .badge {
      font-size: 11px;
      padding: 2px 8px;
    }

    .filter-chip {
      font-size: 11px;
      padding: 3px 8px;
    }

    main {
      padding: 12px !important;
    }

    .card-header {
      padding: 12px 14px;
    }

    .card-body {
      padding: 14px;
    }

    .form-input,
    .form-select,
    .form-textarea {
      font-size: 16px;
      padding: 8px 12px;
    }

    .empty-state {
      padding: 24px 12px;
    }

    .empty-icon {
      width: 44px;
      height: 44px;
    }

    .empty-title {
      font-size: 14px;
    }

    .empty-description {
      font-size: 12px;
    }
  }
`;

// Status Badge Component
function StatusBadge({ status }) {
  const config = {
    running: { label: 'Running', icon: PlayCircle, variant: 'info' },
    success: { label: 'Success', icon: CheckCircle2, variant: 'success' },
    completed: { label: 'Completed', icon: CheckCircle2, variant: 'success' },
    failed: { label: 'Failed', icon: XCircle, variant: 'error' },
    error: { label: 'Error', icon: AlertCircle, variant: 'error' },
    paused: { label: 'Paused', icon: Clock, variant: 'warning' },
    queued: { label: 'Queued', icon: Clock, variant: 'default' }
  };

  const c = config[status?.toLowerCase()] || config.queued;
  const Icon = c.icon;

  return (
    <span className={`badge badge-${c.variant}`}>
      <Icon size={12} />
      {c.label}
    </span>
  );
}

// Sidebar Component
function Sidebar({ activeTab, setActiveTab, open, setOpen, user }) {
  const navigate = useNavigate();

  const initials = user?.first_name
    ? user.first_name.charAt(0).toUpperCase() + (user.last_name?.charAt(0).toUpperCase() || '')
    : user?.name?.charAt(0).toUpperCase() || 'U';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'models', label: 'Models', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="logo">
            <img src={logo} alt="Webby" style={{ height: '52px', width: 'auto' }} />
          </Link>
        </div>

        <div style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(item.id); setOpen(false); }}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              flexShrink: 0
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                {user?.first_name || user?.name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || ''}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('access_token');
              localStorage.removeItem('user');
              navigate('/login');
            }}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// Topbar Component
function Topbar({ activeTab, open, setOpen }) {
  const tabTitles = {
    dashboard: { title: 'Dashboard', subtitle: 'Monitor your scraping infrastructure' },
    jobs: { title: 'Jobs', subtitle: 'Manage scraping and extraction pipelines' },
    export: { title: 'Export', subtitle: 'Download and deliver your data' },
    models: { title: 'Models', subtitle: 'LLM configuration and management' },
    settings: { title: 'Settings', subtitle: 'Account and system preferences' }
  };

  const meta = tabTitles[activeTab] || tabTitles.dashboard;

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button className="menu-toggle" onClick={() => setOpen(o => !o)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="page-title" style={{ minWidth: 0 }}>
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <NotificationBell />
      </div>
    </header>
  );
}

// Dashboard Tab - 100% Real Data
function DashboardTab() {
  const [stats, setStats] = useState([
    { label: 'Active Jobs', value: '0', trend: 'Live', icon: Activity },
    { label: 'Total Records', value: '0', trend: 'All time', icon: Database },
    { label: 'Success Rate', value: '0%', trend: '7d avg', icon: TrendingUp },
    { label: 'Exports', value: '0', trend: 'This month', icon: Download }
  ]);

  const [recentJobs, setRecentJobs] = useState([]);
  const [successRateData, setSuccessRateData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avg_duration: 0,
    success_rate_7d: 0,
    today_success_rate: 0,
    today_total_jobs: 0
  });
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    active_jobs: 0,
    today_jobs: 0,
    today_records: 0
  });
  const [jobsByStatus, setJobsByStatus] = useState([]);
  const [recordsOverTime, setRecordsOverTime] = useState([]);
  const [modelUsage, setModelUsage] = useState([]);
  const [hourlyActivity, setHourlyActivity] = useState([]);
  const [topSites, setTopSites] = useState([]);
  const [exportStats, setExportStats] = useState({
    total_exports: 0,
    total_rows_exported: 0
  });

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filters = ['all', 'running', 'success', 'failed', 'queued'];

  const COLORS = {
    primary: '#00ED64',
    info: '#58A6FF',
    warning: '#D29922',
    error: '#F85149',
    purple: '#A371F7',
    pink: '#F778BA',
    cyan: '#39D2C0',
    orange: '#F0883E'
  };

  const fetchDashboardData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);

    try {
      const [
        successRes,
        realtimeRes,
        recentRes,
        performanceRes,
        jobsByStatusRes,
        recordsOverTimeRes,
        hourlyActivityRes,
        modelUsageRes,
        topSitesRes,
        exportStatsRes
      ] = await Promise.all([
        api.get('/api/dashboard/success-rate?days=7').catch(() => ({ data: { daily_stats: [], overall_success_rate: 0 } })),
        api.get('/api/dashboard/realtime').catch(() => ({ data: { active_jobs: 0, today_jobs: 0, today_records: 0 } })),
        api.get('/api/dashboard/recent?limit=10').catch(() => ({ data: [] })),
        api.get('/api/dashboard/performance').catch(() => ({ data: { average_job_duration_seconds: 0, success_rate_7d: 0, today_success_rate: 0, today_total_jobs: 0 } })),
        api.get('/api/dashboard/jobs-by-status').catch(() => ({ data: [] })),
        api.get('/api/dashboard/records-over-time?days=14').catch(() => ({ data: [] })),
        api.get('/api/dashboard/hourly-activity').catch(() => ({ data: [] })),
        api.get('/api/dashboard/model-usage').catch(() => ({ data: [] })),
        api.get('/api/dashboard/top-sites?limit=5').catch(() => ({ data: [] })),
        api.get('/api/dashboard/export-stats?days=30').catch(() => ({ data: { total_exports: 0, total_rows_exported: 0 } }))
      ]);

      const realtime = realtimeRes.data || {};
      setRealtimeMetrics(realtime);

      const successData = successRes.data || {};
      const dailyStats = successData.daily_stats || [];
      setSuccessRateData(dailyStats);

      const perf = performanceRes.data || {};
      setPerformanceMetrics({
        avg_duration: perf.average_job_duration_seconds || 0,
        success_rate_7d: perf.success_rate_7d || 0,
        today_success_rate: perf.today_success_rate || 0,
        today_total_jobs: perf.today_total_jobs || 0
      });

      const exports = exportStatsRes.data || {};
      setExportStats({
        total_exports: exports.total_exports || 0,
        total_rows_exported: exports.total_rows_exported || 0
      });

      setStats([
        {
          label: 'Active Jobs',
          value: String(realtime.active_jobs || 0),
          trend: `${realtime.today_jobs || 0} today`,
          icon: Activity
        },
        {
          label: 'Total Records',
          value: (realtime.today_records || 0).toLocaleString(),
          trend: `${realtime.today_jobs || 0} jobs today`,
          icon: Database
        },
        {
          label: 'Success Rate',
          value: `${successData.overall_success_rate || 0}%`,
          trend: '7d avg',
          icon: TrendingUp
        },
        {
          label: 'Exports',
          value: String(exports.total_exports || 0),
          trend: `${exports.total_rows_exported || 0} rows`,
          icon: Download
        }
      ]);

      if (Array.isArray(recentRes.data)) setRecentJobs(recentRes.data);
      if (Array.isArray(jobsByStatusRes.data)) setJobsByStatus(jobsByStatusRes.data);
      if (Array.isArray(recordsOverTimeRes.data)) setRecordsOverTime(recordsOverTimeRes.data);
      if (Array.isArray(hourlyActivityRes.data)) setHourlyActivity(hourlyActivityRes.data);
      if (Array.isArray(modelUsageRes.data)) setModelUsage(modelUsageRes.data);
      if (Array.isArray(topSitesRes.data)) setTopSites(topSitesRes.data);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      if (showRefresh) setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredJobs = filter === 'all'
    ? recentJobs
    : recentJobs.filter(j => j?.status === filter);

  const getAvgSuccessRate = () => {
    if (!successRateData.length) return 0;
    const validDays = successRateData.filter(d => d.total_jobs > 0);
    if (!validDays.length) return 0;
    return (
      validDays.reduce((sum, d) => sum + (d.success_rate || 0), 0) /
      validDays.length
    ).toFixed(1);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ fontSize: 12, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill }} />
              <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
                {p.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      const total = jobsByStatus.reduce((sum, d) => sum + d.value, 0);
      const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: data.color, marginBottom: 4 }}>{data.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{data.value} jobs ({percent}%)</div>
        </div>
      );
    }
    return null;
  };

  const EmptyChart = ({ icon: Icon, title, description }) => (
    <div className="empty-state" style={{ padding: '40px 16px' }}>
      <div className="empty-icon"><Icon size={22} /></div>
      <div className="empty-title">{title}</div>
      <div className="empty-description">{description}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Refresh Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px',
            background: 'var(--status-info-bg)',
            border: '1px solid var(--status-info-border)',
            borderRadius: 'var(--radius-full)',
            fontSize: 12, fontWeight: 500, color: '#79B8FF'
          }}>
            <Activity size={11} />
            {realtimeMetrics.active_jobs} active
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => fetchDashboardData(true)} disabled={isRefreshing}>
          <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card">
              <div className="stat-header">
                <div className="stat-icon"><Icon size={16} /></div>
                <span className="stat-trend">{s.trend}</span>
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Performance Overview</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Average Duration</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', lineHeight: 1.2 }}>
                {performanceMetrics.avg_duration.toFixed(1)}s
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>7-Day Success Rate</div>
              <div style={{
                fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-mono)', lineHeight: 1.2,
                color: performanceMetrics.success_rate_7d > 70 ? 'var(--color-primary)' : 'var(--status-warning)'
              }}>
                {performanceMetrics.success_rate_7d}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Today's Jobs</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#79B8FF', lineHeight: 1.2 }}>
                {performanceMetrics.today_total_jobs}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Today's Success</div>
              <div style={{
                fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-mono)', lineHeight: 1.2,
                color: performanceMetrics.today_success_rate > 70 ? 'var(--color-primary)' : 'var(--status-warning)'
              }}>
                {performanceMetrics.today_success_rate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Success Rate Trends */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Success Rate Trends</h3>
          </div>
          <div className="card-body">
            {successRateData.length > 0 ? (
              <>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={successRateData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" strokeOpacity={0.5} />
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} unit="%" tick={{ fill: 'var(--text-muted)' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="success_rate" name="Success Rate" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: COLORS.primary }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="total_jobs" name="Total Jobs" stroke={COLORS.info} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                    {getAvgSuccessRate()}%
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>7-Day Average Success Rate</div>
                </div>
              </>
            ) : (
              <EmptyChart icon={TrendingUp} title="No data yet" description="Run your first job to see success rate trends" />
            )}
          </div>
        </div>

        {/* Jobs by Status Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Jobs by Status</h3>
          </div>
          <div className="card-body">
            {jobsByStatus.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ width: 180, height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={jobsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {jobsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg-secondary)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1 }}>
                  {jobsByStatus.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: i < jobsByStatus.length - 1 ? '1px solid var(--border-muted)' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChart icon={PieChartIcon} title="No jobs yet" description="Create your first scraping job to see the distribution" />
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Records Over Time */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Records Collected</h3>
          </div>
          <div className="card-body">
            {recordsOverTime.some(d => d.records > 0) ? (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recordsOverTime}>
                    <defs>
                      <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" strokeOpacity={0.5} />
                    <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="records" name="Records" stroke={COLORS.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorRecords)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart icon={Database} title="No records yet" description="Records collected will appear here" />
            )}
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Hourly Activity (Last 7 Days)</h3>
          </div>
          <div className="card-body">
            {hourlyActivity.some(d => d.jobs > 0) ? (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" strokeOpacity={0.5} />
                    <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="jobs" name="Jobs" fill={COLORS.info} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="records" name="Records" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart icon={Activity} title="No activity yet" description="Activity will appear as jobs run" />
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Model Usage */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Model Usage Distribution</h3>
          </div>
          <div className="card-body">
            {modelUsage.length > 0 ? (
              <div style={{ width: '100%', height: Math.max(180, modelUsage.length * 45) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modelUsage} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" strokeOpacity={0.5} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} unit="%" />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="usage" name="Usage" fill={COLORS.purple} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart icon={Bot} title="No model usage yet" description="Parse some jobs to see model distribution" />
            )}
          </div>
        </div>

        {/* Top Sites */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Top Performing Sites</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {topSites.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Records</th>
                    <th>Success</th>
                  </tr>
                </thead>
                <tbody>
                  {topSites.map((site, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Globe size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {site.site}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{site.records.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden', minWidth: 60 }}>
                            <div style={{
                              width: `${site.success}%`,
                              height: '100%',
                              background: site.success >= 95 ? COLORS.primary : site.success >= 90 ? COLORS.info : COLORS.warning,
                              borderRadius: 2,
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
                            color: site.success >= 95 ? COLORS.primary : site.success >= 90 ? COLORS.info : COLORS.warning,
                            minWidth: 36
                          }}>
                            {site.success}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyChart icon={Globe} title="No sites yet" description="Sites you scrape will appear here" />
            )}
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Recent Jobs</h3>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {filters.map(f => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          {filteredJobs.length > 0 ? (
            <table className="data-table" style={{ minWidth: 500 }}>
              <thead>
                <tr>
                  <th>Job Name</th>
                  <th>Status</th>
                  <th>Records</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.slice(0, 8).map((job, i) => (
                  <tr key={job.id || i}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {job.name || job.target || 'Untitled'}
                    </td>
                    <td><StatusBadge status={job.status} /></td>
                    <td>{job.records?.toLocaleString() || '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {job.created_at ? new Date(job.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Briefcase size={22} /></div>
              <div className="empty-title">No jobs found</div>
              <div className="empty-description">
                {filter === 'all' ? 'Create your first scraping job to get started' : `No jobs with status: ${filter}`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main AppShell Component
export default function AppShell() {
  const { currentUser, token } = useSelector(s => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const pathTab = location.pathname.replace('/', '') || 'dashboard';
  const [activeTab, setActiveTab] = useState(['dashboard', 'jobs', 'export', 'settings', 'models'].includes(pathTab) ? pathTab : 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!currentUser && !token) navigate('/login');
  }, [currentUser, token, navigate]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = globalStyles;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const tabComponents = {
    dashboard: <DashboardTab />,
    jobs: <JobsTab />,
    export: <ExportTab />,
    models: <ModelsTab />,
    settings: <SettingsPage />
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} open={sidebarOpen} setOpen={setSidebarOpen} user={currentUser} />
      <div className="main-content">
        <Topbar activeTab={activeTab} open={sidebarOpen} setOpen={setSidebarOpen} />
        <main style={{ padding: '28px' }}>
          {tabComponents[activeTab] || <DashboardTab />}
        </main>
      </div>
    </div>
  );
}