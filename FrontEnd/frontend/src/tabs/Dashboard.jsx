// frontend/src/AppShell.jsx - ENTERPRISE REDESIGN - REFINED

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
// ENTERPRISE REDESIGN - REFINED MONGODB ATLAS INSPIRED
// Clean, professional, data-platform aesthetic
// ============================================================

const globalStyles = `
  /* Reset & Base */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Design System - Refined Enterprise */
  :root {
    /* Primary Colors - Maintained */
    --color-primary: #00ED64;
    --color-primary-dark: #00C950;
    --color-primary-light: #2EED7E;
    --color-primary-glow: rgba(0, 237, 100, 0.08);
    
    /* Background Colors */
    --bg-primary: #0D1117;
    --bg-secondary: #161B22;
    --bg-tertiary: #1C2128;
    --bg-hover: #252B33;
    --bg-elevated: #21262D;
    
    /* Border Colors */
    --border-default: #30363D;
    --border-muted: #21262D;
    --border-subtle: rgba(48, 54, 61, 0.4);
    --border-active: #00ED64;
    
    /* Text Colors */
    --text-primary: #F0F6FC;
    --text-secondary: #9BA4B0;
    --text-muted: #6E7681;
    --text-link: #58A6FF;
    
    /* Status Colors - Refined */
    --status-success: #00ED64;
    --status-success-bg: rgba(0, 237, 100, 0.08);
    --status-success-border: rgba(0, 237, 100, 0.15);
    --status-warning: #D29922;
    --status-warning-bg: rgba(210, 153, 34, 0.08);
    --status-warning-border: rgba(210, 153, 34, 0.15);
    --status-error: #F85149;
    --status-error-bg: rgba(248, 81, 73, 0.08);
    --status-error-border: rgba(248, 81, 73, 0.15);
    --status-info: #58A6FF;
    --status-info-bg: rgba(88, 166, 255, 0.08);
    --status-info-border: rgba(88, 166, 255, 0.15);
    
    /* Shadows - Softer */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.3);
    --shadow-glow: 0 0 30px rgba(0, 237, 100, 0.05);
    
    /* Spacing - Refined */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-7: 32px;
    --space-8: 40px;
    --space-9: 48px;
    
    /* Border Radius - Refined */
    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-xl: 12px;
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

  /* Typography - Cleaner */
  h1, .h1 {
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  h2, .h2 {
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }

  h3, .h3 {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
  }

  /* Scrollbar - Subtle */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: var(--radius-full);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--border-active);
  }

  /* Focus States - Cleaner */
  *:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Animations - Subtle */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
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
    animation: fadeIn 0.25s ease-out;
  }

  .spin {
    animation: spin 0.8s linear infinite;
  }

  /* Layout */
  .app-container {
    display: flex;
    min-height: 100vh;
  }

  /* Sidebar - Cleaner */
  .sidebar {
    width: 240px;
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
    padding: 20px 16px;
    border-bottom: 1px solid var(--border-default);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .logo img {
    height: 60px;
    width: auto;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    margin: 2px 10px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    width: calc(100% - 20px);
    text-align: left;
    cursor: pointer;
    transition: all var(--transition);
    position: relative;
  }

  .nav-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .nav-item.active {
    background: var(--status-success-bg);
    color: var(--color-primary);
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: var(--color-primary);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  .nav-item.active svg {
    color: var(--color-primary);
  }

  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 240px;
    min-height: 100vh;
  }

  /* Top Bar - Cleaner */
  .topbar {
    position: sticky;
    top: 0;
    background: rgba(13, 17, 23, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-default);
    padding: 0 32px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 40;
  }

  .page-title h1 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 1px;
    letter-spacing: -0.01em;
  }

  .page-title p {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 400;
  }

  /* Cards - Cleaner */
  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    transition: border-color var(--transition), box-shadow var(--transition);
  }

  .card:hover {
    border-color: var(--border-active);
    box-shadow: var(--shadow-glow);
  }

  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-default);
  }

  .card-body {
    padding: 20px;
  }

  /* Stats Grid - Refined */
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
    padding: 16px 20px;
    transition: all var(--transition);
    position: relative;
    overflow: hidden;
  }

  .stat-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--color-primary), transparent);
    opacity: 0;
    transition: opacity var(--transition);
  }

  .stat-card:hover::after {
    opacity: 1;
  }

  .stat-card:hover {
    border-color: var(--border-active);
    transform: translateY(-2px);
  }

  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    background: var(--status-success-bg);
    border: 1px solid var(--status-success-border);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
  }

  .stat-trend {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: var(--status-success-bg);
    color: var(--color-primary);
  }

  .stat-trend.down {
    background: var(--status-error-bg);
    color: var(--status-error);
  }

  .stat-value {
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
    font-family: var(--font-mono);
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 400;
  }

  /* Buttons - Cleaner */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
    border: none;
    font-family: var(--font-sans);
    letter-spacing: 0.01em;
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--bg-primary);
  }

  .btn-primary:hover {
    background: var(--color-primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 237, 100, 0.25);
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
  }

  .btn-secondary:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-active);
  }

  .btn-sm {
    padding: 5px 12px;
    font-size: 12px;
    gap: 6px;
  }

  /* Tables - Cleaner */
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th {
    text-align: left;
    padding: 10px 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-default);
  }

  .data-table td {
    padding: 12px 16px;
    font-size: 13px;
    border-bottom: 1px solid var(--border-muted);
    color: var(--text-secondary);
  }

  .data-table tbody tr {
    transition: background var(--transition);
  }

  .data-table tbody tr:hover td {
    background: var(--bg-hover);
  }

  /* Status Badges - Refined */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 500;
  }

  .badge-success {
    background: var(--status-success-bg);
    color: var(--color-primary);
    border: 1px solid var(--status-success-border);
  }

  .badge-warning {
    background: var(--status-warning-bg);
    color: var(--status-warning);
    border: 1px solid var(--status-warning-border);
  }

  .badge-error {
    background: var(--status-error-bg);
    color: var(--status-error);
    border: 1px solid var(--status-error-border);
  }

  .badge-info {
    background: var(--status-info-bg);
    color: var(--status-info);
    border: 1px solid var(--status-info-border);
  }

  /* Forms - Cleaner */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .form-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    letter-spacing: 0.02em;
  }

  .form-input,
  .form-select,
  .form-textarea {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 9px 14px;
    font-size: 14px;
    color: var(--text-primary);
    transition: all var(--transition);
    font-family: var(--font-sans);
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--status-success-bg);
  }

  .form-input::placeholder {
    color: var(--text-muted);
  }

  /* Filter Chips - Refined */
  .filter-chip {
    padding: 4px 14px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 500;
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition);
  }

  .filter-chip:hover {
    border-color: var(--border-active);
    color: var(--text-primary);
  }

  .filter-chip.active {
    background: var(--status-success-bg);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  /* Empty State - Refined */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
  }

  .empty-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    border: 1px solid var(--border-default);
  }

  .empty-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .empty-description {
    font-size: 13px;
    color: var(--text-muted);
  }

  /* Loading State - Refined */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    gap: 16px;
  }

  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 2px solid var(--border-default);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Sidebar Overlay */
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
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
    border-radius: var(--radius-md);
    transition: background var(--transition);
  }

  .menu-toggle:hover {
    background: var(--bg-hover);
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
      height: 52px;
    }

    .page-title h1 {
      font-size: 16px;
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
      padding: 12px 16px;
    }

    .stat-value {
      font-size: 22px;
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
      padding: 12px 16px;
    }

    .card-body {
      padding: 14px;
    }

    .data-table th,
    .data-table td {
      padding: 8px 12px;
      font-size: 12px;
    }

    main {
      padding: 16px !important;
    }

    .filter-chip {
      font-size: 11px;
      padding: 3px 10px;
    }

    .btn {
      font-size: 12px;
      padding: 6px 12px;
    }

    .btn-sm {
      font-size: 11px;
      padding: 4px 10px;
    }

    .empty-state {
      padding: 24px 16px;
    }
  }

  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .stat-card {
      padding: 10px 14px;
    }

    .stat-value {
      font-size: 20px;
    }

    .stat-icon {
      width: 28px;
      height: 28px;
    }

    .stat-trend {
      font-size: 9px;
      padding: 1px 6px;
    }

    .topbar {
      padding: 0 12px;
      height: 48px;
    }

    .page-title h1 {
      font-size: 14px;
    }

    .sidebar {
      width: 260px;
    }

    .sidebar-header {
      padding: 14px;
    }

    .nav-item {
      padding: 7px 12px;
      font-size: 12px;
      margin: 1px 8px;
    }

    .nav-item svg {
      width: 16px;
      height: 16px;
    }

    .data-table {
      font-size: 11px;
    }

    .data-table th,
    .data-table td {
      padding: 6px 8px;
      font-size: 11px;
    }

    .badge {
      font-size: 10px;
      padding: 2px 8px;
    }

    .filter-chip {
      font-size: 10px;
      padding: 2px 8px;
    }

    main {
      padding: 12px !important;
    }

    .card-header {
      padding: 10px 12px;
    }

    .card-body {
      padding: 12px;
    }

    .form-input,
    .form-select,
    .form-textarea {
      font-size: 16px;
      padding: 8px 12px;
    }

    .btn {
      font-size: 11px;
      padding: 5px 10px;
    }

    .empty-state {
      padding: 20px 12px;
    }

    .empty-icon {
      width: 40px;
      height: 40px;
    }

    .empty-title {
      font-size: 14px;
    }

    .empty-description {
      font-size: 12px;
    }

    .loading-state {
      padding: 24px;
    }

    .loading-spinner {
      width: 24px;
      height: 24px;
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
      <Icon size={11} />
      {c.label}
    </span>
  );
}

// Sidebar Component - Refined
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
            <img src={logo} alt="Webby" style={{ height: '60px', width: 'auto' }} />
          </Link>
        </div>

        <div style={{ padding: '16px 0', flex: 1 }}>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(item.id); setOpen(false); }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)'
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
      <button className="menu-toggle" onClick={() => setOpen(o => !o)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className="page-title">
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <NotificationBell />
      </div>
    </header>
  );
}

// Dashboard Tab - Refined
function DashboardTab() {
  const [stats, setStats] = useState([
    { label: 'Active Jobs', value: '0', trend: '+0%', icon: Activity },
    { label: 'Total Records', value: '0', trend: '+0%', icon: Database },
    { label: 'Success Rate', value: '0%', trend: '7d avg', icon: TrendingUp },
    { label: 'Exports', value: '0', trend: 'This month', icon: Download }
  ]);

  const [recentJobs, setRecentJobs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [successRateData, setSuccessRateData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({ avg_duration: 0, success_rate_7d: 0 });
  const [realtimeMetrics, setRealtimeMetrics] = useState({ active_jobs: 0, today_jobs: 0, today_records: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filters = ['all', 'running', 'success', 'failed', 'queued'];

  const fetchDashboardData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [successRes, realtimeRes, recentRes, activityRes, performanceRes] = await Promise.all([
        api.get('/api/dashboard/success-rate?days=7').catch(() => ({ data: { daily_stats: [] } })),
        api.get('/api/dashboard/realtime').catch(() => ({ data: { active_jobs: 0, today_jobs: 0, today_records: 0 } })),
        api.get('/api/dashboard/recent?limit=10').catch(() => ({ data: [] })),
        api.get('/api/activity/recent?limit=15').catch(() => ({ data: [] })),
        api.get('/api/dashboard/performance').catch(() => ({ data: { avg_duration: 0, success_rate_7d: 0 } }))
      ]);

      if (realtimeRes.data) {
        setRealtimeMetrics(realtimeRes.data);
        setStats(prev => prev.map(s => {
          if (s.label === 'Active Jobs') return { ...s, value: String(realtimeRes.data.active_jobs || 0) };
          if (s.label === 'Total Records') return { ...s, value: (realtimeRes.data.today_records || 0).toLocaleString() };
          return s;
        }));
      }

      if (successRes.data?.daily_stats) {
        setSuccessRateData(successRes.data.daily_stats);
        const avgRate = successRes.data.overall_success_rate || 0;
        setStats(prev => prev.map(s => s.label === 'Success Rate' ? { ...s, value: `${avgRate}%` } : s));
      }

      if (performanceRes.data) {
        setPerformanceMetrics({
          avg_duration: performanceRes.data.avg_duration || 0,
          success_rate_7d: performanceRes.data.success_rate_7d || 0
        });
      }

      if (Array.isArray(recentRes.data)) setRecentJobs(recentRes.data);
      if (Array.isArray(activityRes.data)) setActivity(activityRes.data);
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

  const filteredJobs = filter === 'all' ? recentJobs : recentJobs.filter(j => j?.status === filter);
  const getAvgSuccessRate = () => {
    if (!successRateData.length) return 0;
    return (successRateData.reduce((sum, d) => sum + (d.success_rate || 0), 0) / successRateData.length).toFixed(1);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ fontSize: 12, display: 'flex', gap: 12 }}>
              <span style={{ color: p.color }}>{p.name}:</span>
              <span style={{ fontWeight: 600 }}>{p.value}{p.unit || ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <span style={{ color: 'var(--text-muted)' }}>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Refresh Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6,
            padding: '4px 12px',
            background: 'var(--status-info-bg)',
            border: '1px solid var(--status-info-border)',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--status-info)'
          }}>
            <Activity size={10} />
            {realtimeMetrics.active_jobs} active
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fetchDashboardData(true)}
          disabled={isRefreshing}
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
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
          <div style={{ 
            display: 'flex', 
            gap: 48, 
            flexWrap: 'wrap' 
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Average Duration</div>
              <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                {performanceMetrics.avg_duration.toFixed(1)}s
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>7-Day Success Rate</div>
              <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-mono)', color: performanceMetrics.success_rate_7d > 70 ? 'var(--color-primary)' : 'var(--status-warning)' }}>
                {performanceMetrics.success_rate_7d}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Success Rate Trends</h3>
        </div>
        <div className="card-body">
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" strokeOpacity={0.5} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis stroke="var(--text-muted)" fontSize={11} unit="%" tick={{ fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="success_rate" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-primary)' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="total_jobs" name="Total Jobs" stroke="var(--status-info)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
              {getAvgSuccessRate()}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>7-Day Average Success Rate</div>
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="card">
        <div className="card-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Recent Jobs</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                <tr key={i}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{job.name || 'Untitled'}</td>
                  <td><StatusBadge status={job.status} /></td>
                  <td>{job.records?.toLocaleString() || '-'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {job.created_at ? new Date(job.created_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredJobs.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon"><Briefcase size={24} /></div>
              <div className="empty-title">No jobs found</div>
              <div className="empty-description">No jobs with status: {filter}</div>
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