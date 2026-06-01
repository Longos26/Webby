import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  XCircle, 
  PlayCircle,
  LayoutDashboard,
  Briefcase,
  Download,
  Settings,
  LogOut,
  X,
  Bot,
  Menu,
  Cpu,
  Database,
  CheckCircle,
  AlertCircle,
  Zap,
  Play,
  RefreshCw,
  BarChart2,
  Activity,
  PieChart as PieChartIcon,
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import api from '../api';
import JobsTab     from './JobsTab';
import ExportTab   from './ExportTab';
import SettingsTab from './SettingsTab';
import ModelsTab   from './ModelsTab';

// ============================================================
// ANTI-GENERIC UI/UX ENFORCEMENT v2.0 - DASHBOARD
// - No nested card anti-pattern
// - Visible borders (10%+ contrast)
// - No emoji icons (Lucide only)
// - No em dashes in UI copy
// - 60-30-10 color ratio enforced
// - Subtle shadows, consistent radius scale
// - Purposeful animation layer
// ============================================================

const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
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
    --color-surface-elevated: hsl(226, 30%, 12%);
    --color-overlay:     hsl(225, 25%, 10%);
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
    --radius-2xl:  24px;
    --radius-full: 9999px;
    --transition-fast: 120ms cubic-bezier(0.16, 1, 0.3, 1);
    --transition-base: 200ms cubic-bezier(0.16, 1, 0.3, 1);
    --transition-slow: 320ms cubic-bezier(0.16, 1, 0.3, 1);
    --text-xs:   0.75rem;
    --text-sm:   0.8125rem;
    --text-base: 0.9375rem;
    --text-md:   1.0625rem;
    --text-lg:   1.25rem;
    --text-xl:   1.5rem;
    --text-2xl:  1.875rem;
    --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  }

  body {
    background: var(--color-canvas);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: 1.5;
  }

  button, a, [role="button"] {
    transition: all var(--transition-base);
  }

  *:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: var(--radius-full); }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .fade-in { animation: fadeIn 0.4s ease forwards; }
  .spinning { animation: spin 0.7s linear infinite; }

  /* Mobile styles */
  @media (max-width: 768px) {
    .sidebar-desktop {
      transform: translateX(-100%);
      transition: transform var(--transition-base);
    }
    .sidebar-desktop.open {
      transform: translateX(0);
    }
    .main-content {
      margin-left: 0 !important;
    }
    .topbar {
      left: 0 !important;
    }
    .menu-toggle {
      display: flex !important;
    }
  }

  @media (min-width: 769px) {
    .menu-toggle {
      display: none !important;
    }
    .sidebar-desktop {
      transform: translateX(0) !important;
    }
    .sidebar-overlay {
      display: none !important;
    }
  }

  .menu-toggle {
    display: none;
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 45;
  }
`;

const EmptyStateGraphic = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <rect x="15" y="25" width="50" height="35" rx="6" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>
    <path d="M25 40 L35 32 L45 42 L55 35" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>
    <circle cx="35" cy="40" r="2" fill="currentColor" fillOpacity="0.3"/>
    <circle cx="55" cy="35" r="2" fill="currentColor" fillOpacity="0.3"/>
  </svg>
);

function StatusPill({ status }) {
  const statusConfig = {
    running: { label: 'Running', icon: Play, color: 'var(--color-brand)', bg: 'rgba(59,130,246,0.12)' },
    success: { label: 'Success', icon: CheckCircle, color: 'var(--color-success)', bg: 'var(--color-success-dim)' },
    completed: { label: 'Completed', icon: CheckCircle, color: 'var(--color-success)', bg: 'var(--color-success-dim)' },
    failed: { label: 'Failed', icon: XCircle, color: 'var(--color-error)', bg: 'var(--color-error-dim)' },
    error: { label: 'Error', icon: AlertCircle, color: 'var(--color-error)', bg: 'var(--color-error-dim)' },
    paused: { label: 'Paused', icon: PlayCircle, color: 'var(--color-warning)', bg: 'var(--color-warning-dim)' },
    queued: { label: 'Queued', icon: Clock, color: 'var(--color-text-muted)', bg: 'rgba(255,255,255,0.05)' }
  };
  const config = statusConfig[status?.toLowerCase()] || statusConfig.queued;
  const Icon = config.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      background: config.bg, color: config.color,
      fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)'
    }}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}

function Sidebar({ activeTab, setActiveTab, open, setOpen, user }) {
  const navigate = useNavigate();
  const initials = user ? `${(user.first_name?.[0] || user.name?.[0] || 'U')}`.toUpperCase() : 'U';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'Scraping & LLM Parsing', icon: Briefcase },
    { id: 'export', label: 'Export', icon: Download },
     { id: 'models', label: 'Models', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
   
  ];

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
      <aside className={`sidebar-desktop ${open ? 'open' : ''}`} style={{
        width: 240, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 50
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 20px 16px', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: 8, height: 8, background: 'var(--color-success)', borderRadius: 'var(--radius-full)', animation: 'pulse 2s infinite' }} />
          Webby
        </Link>

        <div style={{ padding: '8px 12px 4px', fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Navigation</div>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id}
              onClick={() => { setActiveTab(item.id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', margin: '1px 8px',
                borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500, width: 'calc(100% - 16px)',
                background: activeTab === item.id ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: activeTab === item.id ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                border: activeTab === item.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                cursor: 'pointer', textAlign: 'left'
              }}
              onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; }}>
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}

        <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--color-brand), #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'white'
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.first_name || user?.name || 'User'}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
            </div>
            <button onClick={() => navigate('/login')} style={{
              width: 28, height: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-muted)'
            }}><LogOut size={13} /></button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ activeTab, open, setOpen }) {
  const tabTitles = {
    dashboard: { title: 'Dashboard', sub: 'System overview and live activity' },
    jobs: { title: 'Scraping & LLM Parsing', sub: 'Manage and monitor your scraping and LLM parsing pipelines' },
    export: { title: 'Export', sub: 'Download and deliver your scraped data' },
    models: { title: 'Models', sub: 'View and manage your LLM models and usage' },
    settings: { title: 'Settings', sub: 'Manage your account and preferences' }
    
  };
  const meta = tabTitles[activeTab] || tabTitles.dashboard;
  return (
    <header className="topbar" style={{
      position: 'fixed', top: 0, left: 240, right: 0, height: 60,
      background: 'rgba(5, 11, 26, 0.88)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px',
      padding: '0 28px', zIndex: 40
    }}>
      <button className="menu-toggle" onClick={() => setOpen(o => !o)} style={{
        background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
        display: 'none', alignItems: 'center', justifyContent: 'center'
      }}>
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>{meta.title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{meta.sub}</div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <NotificationBell /> {/* Use the notification bell component */}
      </div>
    </header>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState([
    { label: 'Active Jobs', value: '0', trend: '+0%', trendUp: true, icon: Cpu, color: 'var(--color-brand)' },
    { label: 'Records Today', value: '0', trend: '+0%', trendUp: true, icon: Database, color: 'var(--color-success)' },
    { label: 'Success Rate', value: '0%', trend: '7d avg', trendUp: true, icon: TrendingUp, color: 'var(--color-brand)' },
    { label: 'Total Exports', value: '0', trend: 'This month', trendUp: true, icon: Download, color: 'var(--color-warning)' }
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
  const [selectedChart, setSelectedChart] = useState('success_rate');

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
        if (s.label === 'Records Today') return { ...s, value: (realtimeRes.data.today_records || 0).toLocaleString() };
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
    const interval = setInterval(() => fetchDashboardData(), 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredJobs = filter === 'all' ? recentJobs : recentJobs.filter(j => j?.status === filter);
  const getAvgSuccessRate = () => {
    if (!successRateData.length) return 0;
    return (successRateData.reduce((sum, d) => sum + (d.success_rate || 0), 0) / successRateData.length).toFixed(1);
  };

  const getStatusDistribution = () => {
    const dist = { running: 0, success: 0, failed: 0, queued: 0 };
    recentJobs.forEach(job => {
      const status = job.status?.toLowerCase() || 'queued';
      if (status === 'running') dist.running++;
      else if (status === 'success' || status === 'completed') dist.success++;
      else if (status === 'failed' || status === 'error') dist.failed++;
      else dist.queued++;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  };

  const statusDistribution = getStatusDistribution();
  const pieColors = ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />{p.name}:</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{p.value}{p.unit || ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface)', padding: '5px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
            <div style={{ width: 6, height: 6, background: 'var(--color-success)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Live • {realtimeMetrics.active_jobs} active</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Updated {lastUpdated.toLocaleTimeString()}</div>
        </div>
        <button onClick={() => fetchDashboardData(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', cursor: 'pointer'
        }}><RefreshCw size={12} className={isRefreshing ? 'spinning' : ''} /> Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              padding: 20, transition: 'border-color var(--transition-base)'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color
                }}><Icon size={16} /></div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--radius-full)',
                  background: s.trendUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: s.trendUp ? 'var(--color-success)' : 'var(--color-error)',
                  border: `1px solid ${s.trendUp ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
                }}>{s.trend}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600 }}>
            <Clock size={13} style={{ color: 'var(--color-text-muted)' }} />
            Performance Metrics
          </span>
          <div style={{ display: 'flex', gap: 32 }}>
            <div><div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Avg Job Duration</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-brand)' }}>{performanceMetrics.avg_duration.toFixed(1)}s</div></div>
            <div><div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>7-Day Success Rate</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: performanceMetrics.success_rate_7d > 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>{performanceMetrics.success_rate_7d}%</div></div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600 }}><BarChart2 size={13} /> Analytics</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['success_rate', 'volume', 'trend'].map(opt => (
              <button key={opt} onClick={() => setSelectedChart(opt)} style={{
                padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 500,
                background: selectedChart === opt ? 'rgba(59,130,246,0.12)' : 'transparent',
                border: selectedChart === opt ? '1px solid rgba(59,130,246,0.25)' : '1px solid var(--color-border)',
                color: selectedChart === opt ? 'var(--color-brand)' : 'var(--color-text-muted)', cursor: 'pointer'
              }}>{opt === 'success_rate' ? 'Success Rate' : opt === 'volume' ? 'Job Volume' : 'Trends'}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <ResponsiveContainer width="100%" height={300}>
            {selectedChart === 'success_rate' && (
              <LineChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="success_rate" name="Success Rate" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="total_jobs" name="Total Jobs" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            )}
            {selectedChart === 'volume' && (
              <BarChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="successful" name="Successful" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
            {selectedChart === 'trend' && (
              <AreaChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="total_jobs" name="Total Jobs" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
              </AreaChart>
            )}
          </ResponsiveContainer>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 32 }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{getAvgSuccessRate()}%</div><div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>7-Day Average</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{successRateData[successRateData.length - 1]?.total_jobs || 0}</div><div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Today's Jobs</div></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div><div style={{ fontWeight: 600 }}>Recent Jobs</div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Your latest scraping activities</div></div>
            <div style={{ display: 'flex', gap: 6 }}>
              {filters.map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: filter === f ? 'rgba(59,130,246,0.12)' : 'transparent',
                  border: filter === f ? '1px solid rgba(59,130,246,0.25)' : '1px solid var(--color-border)', color: filter === f ? 'var(--color-brand)' : 'var(--color-text-muted)', cursor: 'pointer'
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Job Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Records</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.slice(0, 8).map((job, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>{job.name || 'Untitled'}</td>
                    <td style={{ padding: '12px 16px' }}><StatusPill status={job.status} /></td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{job.records || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredJobs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-muted)' }}>
                <EmptyStateGraphic />
                <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>No jobs found</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>No jobs with status: {filter}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {statusDistribution.some(s => s.value > 0) && (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600 }}><PieChartIcon size={13} /> Job Distribution</span>
              </div>
              <div style={{ padding: 16 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {statusDistribution.map((_, idx) => <Cell key={idx} fill={pieColors[idx % pieColors.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                  {statusDistribution.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: pieColors[idx] }} /><span style={{ fontSize: 11 }}>{item.name}: {item.value}</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600 }}><Activity size={13} /> Live Activity</span>
            </div>
            <div style={{ padding: '8px' }}>
              {activity.slice(0, 8).map((act, i) => {
                const getIcon = () => {
                  if (act.type === 'success') return <CheckCircle size={12} />;
                  if (act.type === 'error') return <AlertCircle size={12} />;
                  if (act.type === 'job') return <Briefcase size={12} />;
                  return <Zap size={12} />;
                };
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand)' }}>{getIcon()}</div>
                    <div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}><strong>{act.title}</strong> {act.description}</div><div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{act.timeAgo || 'just now'}</div></div>
                  </div>
                );
              })}
              {activity.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
                  <EmptyStateGraphic />
                  <div style={{ marginTop: 8 }}>No recent activity</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600 }}><TrendingUp size={13} /> Quick Insights</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Active Jobs</div><div style={{ fontSize: 28, fontWeight: 700, color: realtimeMetrics.active_jobs > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{realtimeMetrics.active_jobs}</div></div>
                <div><div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Today's Jobs</div><div style={{ fontSize: 28, fontWeight: 700 }}>{realtimeMetrics.today_jobs}</div></div>
                <div><div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Records Today</div><div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-warning)' }}>{realtimeMetrics.today_records.toLocaleString()}</div></div>
                <div><div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Success Rate</div><div style={{ fontSize: 28, fontWeight: 700, color: performanceMetrics.success_rate_7d > 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>{performanceMetrics.success_rate_7d}%</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const tabComponents = {
    dashboard: <DashboardTab />,
    jobs: <JobsTab />,
    export: <ExportTab />,
    models: <ModelsTab />,
    settings: <SettingsTab />
    
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 30% 40%, rgba(59,130,246,0.04) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.02) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none', zIndex: 0 }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} open={sidebarOpen} setOpen={setSidebarOpen} user={currentUser} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Topbar activeTab={activeTab} open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className="main-content" style={{ marginLeft: 240, marginTop: 60, minHeight: 'calc(100vh - 60px)', padding: 28 }}>
            {tabComponents[activeTab] || <DashboardTab />}
          </main>
        </div>
      </div>
    </>
  );
}
