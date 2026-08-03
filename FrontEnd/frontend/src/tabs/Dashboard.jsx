// frontend/src/AppShell.jsx - ENTERPRISE REDESIGN

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
import logo from '../logowebby.png';

// ============================================================
// ENTERPRISE REDESIGN - MONGODB ATLAS INSPIRED
// Professional, clean, data-platform aesthetic
// ============================================================

const globalStyles = `
  /* Reset & Base */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Design System - MongoDB Atlas Inspired */
  :root {
    /* Primary Colors */
    --color-primary: #00ED64;
    --color-primary-dark: #00C950;
    --color-primary-light: #2EED7E;
    
    /* Background Colors */
    --bg-primary: #0D1117;
    --bg-secondary: #161B22;
    --bg-tertiary: #1A1F2B;
    --bg-hover: #21262D;
    
    /* Border Colors */
    --border-default: #30363D;
    --border-muted: #21262D;
    --border-active: #00ED64;
    
    /* Text Colors */
    --text-primary: #F0F6FC;
    --text-secondary: #8B949E;
    --text-muted: #6E7681;
    --text-link: #58A6FF;
    
    /* Status Colors */
    --status-success: #00ED64;
    --status-success-bg: rgba(0, 237, 100, 0.12);
    --status-warning: #D29922;
    --status-warning-bg: rgba(210, 153, 34, 0.12);
    --status-error: #F85149;
    --status-error-bg: rgba(248, 81, 73, 0.12);
    --status-info: #58A6FF;
    --status-info-bg: rgba(88, 166, 255, 0.12);
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.2);
    
    /* Spacing - 8px system */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-7: 32px;
    --space-8: 40px;
    --space-9: 48px;
    --space-10: 56px;
    
    /* Border Radius */
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    
    /* Typography */
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Fira Code", monospace;
    
    /* Transitions */
    --transition: 150ms ease-in-out;
  }

  body {
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Typography */
  h1, .h1 {
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  h2, .h2 {
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }

  h3, .h3 {
    font-size: 22px;
    font-weight: 600;
    line-height: 1.4;
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-secondary);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: var(--radius-sm);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--border-active);
  }

  /* Focus States */
  *:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Animations - Subtle Only */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
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
    width: 260px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-default);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 50;
  }

  .sidebar-header {
    padding: 24px 20px;
    border-bottom: 1px solid var(--border-default);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    background: var(--color-primary);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-icon span {
    color: var(--bg-primary);
    font-weight: 700;
    font-size: 14px;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    margin: 4px 12px;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    width: calc(100% - 24px);
    text-align: left;
    cursor: pointer;
    transition: all var(--transition);
  }

  .nav-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .nav-item.active {
    background: var(--status-success-bg);
    color: var(--color-primary);
  }

  .nav-item.active svg {
    color: var(--color-primary);
  }

  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 260px;
    min-height: 100vh;
  }

  /* Top Bar */
  .topbar {
    position: sticky;
    top: 0;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-default);
    padding: 0 32px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 40;
  }

  .page-title h1 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .page-title p {
    font-size: 13px;
    color: var(--text-muted);
  }

  /* Cards */
  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    transition: border-color var(--transition);
  }

  .card:hover {
    border-color: var(--border-active);
  }

  .card-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-default);
  }

  .card-body {
    padding: 24px;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 28px;
  }

  .stat-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: 20px;
    transition: border-color var(--transition);
  }

  .stat-card:hover {
    border-color: var(--border-active);
  }

  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    background: rgba(0, 237, 100, 0.1);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
  }

  .stat-trend {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    background: var(--status-success-bg);
    color: var(--color-primary);
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 13px;
    color: var(--text-muted);
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
    border: none;
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--bg-primary);
  }

  .btn-primary:hover {
    background: var(--color-primary-dark);
    transform: translateY(-1px);
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
    padding: 6px 12px;
    font-size: 12px;
  }

  /* Tables */
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-default);
  }

  .data-table td {
    padding: 16px;
    font-size: 14px;
    border-bottom: 1px solid var(--border-muted);
    color: var(--text-secondary);
  }

  .data-table tbody tr:hover td {
    background: var(--bg-hover);
  }

  /* Status Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 500;
  }

  .badge-success {
    background: var(--status-success-bg);
    color: var(--color-primary);
  }

  .badge-warning {
    background: var(--status-warning-bg);
    color: var(--status-warning);
  }

  .badge-error {
    background: var(--status-error-bg);
    color: var(--status-error);
  }

  .badge-info {
    background: var(--status-info-bg);
    color: var(--status-info);
  }

  /* Forms */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
  }

  .form-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .form-input,
  .form-select,
  .form-textarea {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    font-size: 14px;
    color: var(--text-primary);
    transition: all var(--transition);
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  /* Filter Chips */
  .filter-chip {
    padding: 6px 14px;
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

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 64px 32px;
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }

  .empty-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .empty-description {
    font-size: 14px;
    color: var(--text-muted);
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px;
    gap: 16px;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid var(--border-default);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
      transition: transform var(--transition);
    }
    
    .sidebar.open {
      transform: translateX(0);
    }
    
    .main-content {
      margin-left: 0;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .topbar {
      padding: 0 20px;
    }
  }

  @media (min-width: 769px) {
    .menu-toggle {
      display: none !important;
    }
  }

  .menu-toggle {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 8px;
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
  
  // Get user initials for avatar
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
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 45
      }} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            {/* Use the imported logo image */}
            <img 
              src={logo} 
              alt="Webby" 
              style={{ height: '70px', width: 'auto' }} 
            />
            
          </Link>
        </div>

        <div style={{ padding: '20px 0', flex: 1 }}>
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

        <div style={{ padding: '20px', borderTop: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
              color: 'var(--text-primary)'
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.first_name || user?.name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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

// Dashboard Tab
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
          padding: '8px 12px'
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
        <span style={{ color: 'var(--text-muted)' }}>Plss Wait a Moment...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Refresh Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="badge badge-info" style={{ gap: 4 }}>
            <Activity size={10} />
            {realtimeMetrics.active_jobs} active jobs
          </div>
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
                <div className="stat-icon"><Icon size={18} /></div>
                <span className="stat-trend">{s.trend}</span>
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Performance Overview</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 40 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Average Job Duration</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-primary)' }}>
                {performanceMetrics.avg_duration.toFixed(1)}s
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>7-Day Success Rate</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: performanceMetrics.success_rate_7d > 70 ? 'var(--color-primary)' : 'var(--status-warning)' }}>
                {performanceMetrics.success_rate_7d}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Success Rate Trends</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={successRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="success_rate" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-primary)' }} />
              <Line type="monotone" dataKey="total_jobs" name="Total Jobs" stroke="var(--status-info)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-primary)' }}>
              {getAvgSuccessRate()}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>7-Day Average Success Rate</div>
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent Jobs</h3>
          <div style={{ display: 'flex', gap: 8 }}>
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
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
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
                  <td style={{ fontWeight: 500 }}>{job.name || 'Untitled'}</td>
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
              <div className="empty-icon"><Briefcase size={28} /></div>
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
        <main style={{ padding: '32px' }}>
          {tabComponents[activeTab] || <DashboardTab />}
        </main>
      </div>
    </div>
  );
}