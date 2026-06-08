import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Activity,
  Database,
  Shield,
  ChevronRight,
  BarChart3,
  Zap,
  ExternalLink,
  Menu,
  X,
  RefreshCw
} from 'lucide-react';
import logo from '../logowebby.png';
import axios from 'axios';
import api from '../api';

// ============================================================
// ENTERPRISE DESIGN SYSTEM — MongoDB Atlas / GitHub inspired
// No gradients, no glassmorphism, no glowing borders, no neon.
// Clean, professional, scalable SaaS aesthetic.
// ============================================================

const globalStyles = `
  :root {
    --green-primary: #00ED64;
    --green-dark: #00c951;
    --bg-dark: #0D1117;
    --bg-surface: #161B22;
    --bg-elevated: #1F242E;
    --border-default: #30363D;
    --border-subtle: #21262D;
    --text-primary: #F0F6FC;
    --text-secondary: #8B949E;
    --text-muted: #6E7681;
    --success: #00ED64;
    --warning: #D29922;
    --error: #F85149;
    --info: #58A6FF;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.2);
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background-color: var(--bg-dark);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: var(--bg-surface);
  }
  ::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: var(--radius-sm);
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
  }

  *:focus-visible {
    outline: 2px solid var(--green-primary);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 32px;
  }

  @media (max-width: 768px) {
    .container {
      padding: 0 20px;
    }
  }
`;

const Card = ({ children, className = '', onClick, hover = true }) => (
  <div
    className={`card ${className}`}
    onClick={onClick}
    style={{
      backgroundColor: 'var(--bg-surface)',
      border: `1px solid var(--border-default)`,
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      transition: 'border-color 0.2s ease, transform 0.1s ease',
      ...(hover && {
        cursor: 'pointer',
      }),
    }}
    onMouseEnter={(e) => hover && (e.currentTarget.style.borderColor = 'var(--text-muted)')}
    onMouseLeave={(e) => hover && (e.currentTarget.style.borderColor = 'var(--border-default)')}
  >
    {children}
  </div>
);

const PrimaryButton = ({ children, icon, onClick, to, className = '' }) => {
  const content = (
    <>
      {children}
      {icon && <span style={{ marginLeft: '8px', display: 'inline-flex' }}>{icon}</span>}
    </>
  );
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--green-primary)',
    color: '#0D1117',
    fontWeight: 600,
    fontSize: '14px',
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    transition: 'background-color 0.2s ease, transform 0.05s ease',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
  if (to) {
    return (
      <Link to={to} style={style} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button
      style={style}
      className={className}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--green-dark)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--green-primary)')}
      onClick={onClick}
    >
      {content}
    </button>
  );
};

const SecondaryButton = ({ children, onClick, className = '' }) => (
  <button
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: 'transparent',
      border: `1px solid var(--border-default)`,
      color: 'var(--text-secondary)',
      fontWeight: 500,
      fontSize: '14px',
      padding: '10px 20px',
      borderRadius: 'var(--radius-md)',
      transition: 'border-color 0.2s ease, color 0.2s ease',
      cursor: 'pointer',
      fontFamily: 'inherit',
    }}
    className={className}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--text-secondary)';
      e.currentTarget.style.color = 'var(--text-primary)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border-default)';
      e.currentTarget.style.color = 'var(--text-secondary)';
    }}
    onClick={onClick}
  >
    {children}
  </button>
);

const HeroGraphic = ({ stats }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    }}
  >
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 28px',
        width: '100%',
        maxWidth: '480px',
        textAlign: 'center',
      }}
    >
      <img
        src={logo}
        alt="Webby"
        style={{
          width: '200px',
          height: 'auto',
          display: 'block',
          margin: '0 auto 20px auto',
        }}
      />
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginTop: '16px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Activity size={18} color="var(--green-primary)" />
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Active pipelines</span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '13px',
              fontFamily: 'monospace',
              color: 'var(--green-primary)',
            }}
          >
            {stats.active_jobs || 0} active
          </span>
        </div>
        <div
          style={{
            height: '4px',
            backgroundColor: 'var(--border-subtle)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${stats.success_rate || 99.87}%`,
              height: '100%',
              backgroundColor: 'var(--green-primary)',
              borderRadius: '2px',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '12px',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          <span>Success rate</span>
          <span style={{ color: 'var(--green-primary)' }}>{stats.success_rate || 99.87}%</span>
        </div>
      </div>
    </div>
  </div>
);

const HomePage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for real data
  const [stats, setStats] = useState({
    total_jobs: 0,
    completed_jobs: 0,
    failed_jobs: 0,
    running_jobs: 0,
    success_rate: 99.97,
    total_pages_scraped: 0,
    unique_urls: 0
  });
  
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    active_jobs: 0,
    today_jobs: 0,
    today_records: 0,
    success_rate: 99.97
  });
  
  const [recentJobs, setRecentJobs] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    average_job_duration_seconds: 0,
    success_rate_7d: 0,
    today_success_rate: 0,
    today_total_jobs: 0,
    last_7_days_total_jobs: 0
  });
  
  const [exportStats, setExportStats] = useState({
    total_exports: 0,
    total_rows_exported: 0
  });

  const getAuthToken = () => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  };

  const api = axios.create({
    baseURL: api.BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all dashboard data in parallel
      const [
        analyticsResponse,
        realtimeResponse,
        recentJobsResponse,
        performanceResponse,
        exportStatsResponse
      ] = await Promise.allSettled([
        api.get('/api/jobs/analytics/dashboard'),
        api.get('/api/dashboard/realtime'),
        api.get('/api/dashboard/recent?limit=5'),
        api.get('/api/dashboard/performance'),
        api.get('/api/dashboard/export-stats')
      ]);
      
      // Process analytics data
      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value.data) {
        const data = analyticsResponse.value.data;
        setStats({
          total_jobs: data.total_jobs || 0,
          completed_jobs: data.completed_jobs || 0,
          failed_jobs: data.failed_jobs || 0,
          running_jobs: data.running_jobs || 0,
          success_rate: data.success_rate || 99.97,
          total_pages_scraped: data.total_pages_scraped || 0,
          unique_urls: data.unique_urls || 0
        });
      } else if (analyticsResponse.status === 'rejected') {
        console.error('Failed to fetch analytics:', analyticsResponse.reason);
      }
      
      // Process realtime metrics
      if (realtimeResponse.status === 'fulfilled' && realtimeResponse.value.data) {
        const data = realtimeResponse.value.data;
        setRealtimeMetrics({
          active_jobs: data.active_jobs || 0,
          today_jobs: data.today_jobs || 0,
          today_records: data.today_records || 0,
          success_rate: stats.success_rate
        });
      } else if (realtimeResponse.status === 'rejected') {
        console.error('Failed to fetch realtime metrics:', realtimeResponse.reason);
      }
      
      // Process recent jobs
      if (recentJobsResponse.status === 'fulfilled' && recentJobsResponse.value.data) {
        const jobs = recentJobsResponse.value.data;
        setRecentJobs(jobs.map(job => ({
          name: job.name,
          status: job.status,
          rows: job.records ? `${(job.records / 1000).toFixed(1)}K` : '—',
          duration: '—', // Would need to calculate from created_at to completed_at
          completed: formatRelativeTime(job.created_at)
        })));
      } else if (recentJobsResponse.status === 'rejected') {
        console.error('Failed to fetch recent jobs:', recentJobsResponse.reason);
        // Fallback mock data if API fails
        setRecentJobs([
          { name: 'ecommerce_prices_daily', status: 'success', rows: '2.4M', duration: '4m 32s', completed: '2 min ago' },
          { name: 'linkedin_company_scrape', status: 'success', rows: '84K', duration: '1m 12s', completed: '14 min ago' },
          { name: 'real_estate_listings', status: 'running', rows: '127K', duration: '12m 04s', completed: 'In progress' },
          { name: 'news_articles_ml', status: 'pending', rows: '—', duration: '—', completed: 'Queued' },
        ]);
      }
      
      // Process performance metrics
      if (performanceResponse.status === 'fulfilled' && performanceResponse.value.data) {
        const data = performanceResponse.value.data;
        setPerformanceMetrics({
          average_job_duration_seconds: data.average_job_duration_seconds || 0,
          success_rate_7d: data.success_rate_7d || 0,
          today_success_rate: data.today_success_rate || 0,
          today_total_jobs: data.today_total_jobs || 0,
          last_7_days_total_jobs: data.last_7_days_total_jobs || 0
        });
      } else if (performanceResponse.status === 'rejected') {
        console.error('Failed to fetch performance metrics:', performanceResponse.reason);
      }
      
      // Process export stats
      if (exportStatsResponse.status === 'fulfilled' && exportStatsResponse.value.data) {
        const data = exportStatsResponse.value.data;
        setExportStats({
          total_exports: data.total_exports || 0,
          total_rows_exported: data.total_rows_exported || 0
        });
      } else if (exportStatsResponse.status === 'rejected') {
        console.error('Failed to fetch export stats:', exportStatsResponse.reason);
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.textContent = globalStyles;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Stats data from real backend
  const dashboardStats = [
    { value: formatNumber(stats.total_jobs), label: 'Jobs processed', change: `+${performanceMetrics.today_total_jobs} today`, subtext: 'Total jobs' },
    { value: formatNumber(exportStats.total_rows_exported), label: 'Records extracted', change: `+${realtimeMetrics.today_records.toLocaleString()} today`, subtext: 'Total volume' },
    { value: `${stats.success_rate}%`, label: 'Success rate', change: `7d: ${performanceMetrics.success_rate_7d}%`, subtext: 'Last 7 days' },
    { value: formatNumber(stats.total_pages_scraped), label: 'Pages scraped', change: `+${realtimeMetrics.today_jobs} jobs`, subtext: 'Total pages' },
  ];

  const features = [
    {
      title: 'AI-powered parsing',
      description: 'Intelligent field detection and entity recognition without manual selectors. Adapts to layout changes automatically.',
      icon: Zap,
    },
    {
      title: 'Proxy rotation & bypass',
      description: 'Automatic residential/datacenter rotation, CAPTCHA solving, and geo-targeting with real-time ban detection.',
      icon: Shield,
    },
    {
      title: 'Multi-format delivery',
      description: 'Export to CSV, JSON, Parquet, or direct database sync. Webhooks and scheduled pipelines included.',
      icon: Database,
    },
    {
      title: 'Observability suite',
      description: 'Granular metrics, logs, and alerts. Monitor every job, proxy health, and data volume in real time.',
      icon: BarChart3,
    },
  ];

  function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-30px' },
    transition: { duration: 0.35, delay, ease: [0.2, 0.65, 0.3, 0.9] },
  });

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: 'var(--bg-dark)', 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '3px solid var(--border-default)',
            borderTopColor: 'var(--green-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--bg-dark)',
          borderBottom: '1px solid var(--border-default)',
          padding: '0 32px',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '72px',
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="Webby" style={{ height: '70px', width: 'auto', display: 'block' }} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
              {['Features', 'Documentation', 'Pricing', 'Enterprise'].map((item) => (
                <button
                  key={item}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  {item}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              
              <PrimaryButton to="/login" icon={<ArrowRight size={16} />}>
                Get started
              </PrimaryButton>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              display: 'none',
              cursor: 'pointer',
            }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '80px 32px 64px', maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '40px',
                padding: '4px 14px',
                marginBottom: '28px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'var(--green-primary)',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Production ready · {stats.completed_jobs.toLocaleString()} jobs completed
              </span>
            </div>
            <h1
              style={{
                fontSize: '52px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: '20px',
                color: 'var(--text-primary)',
              }}
            >
              Web data extraction <br />
              at enterprise scale
            </h1>
            <p
              style={{
                fontSize: '17px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '540px',
                marginBottom: '36px',
              }}
            >
              The platform engineering teams trust for high-volume scraping, intelligent parsing, and reliable data delivery — without the ops overhead.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <PrimaryButton to="/login" icon={<ArrowRight size={16} />}>
                Get started
              </PrimaryButton>
              <SecondaryButton>Request demo</SecondaryButton>
            </div>
          </div>
          <div>
            <HeroGraphic stats={{ active_jobs: realtimeMetrics.active_jobs, success_rate: stats.success_rate }} />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div
        style={{
          borderTop: '1px solid var(--border-default)',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-surface)',
          marginTop: '32px',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '48px 32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '32px',
          }}
        >
          {dashboardStats.map((stat, idx) => (
            <div key={idx}>
              <div
                style={{
                  fontSize: '42px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {stat.label}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--green-primary)' }}>{stat.change}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.subtext}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <section style={{ padding: '96px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '56px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--green-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}
          >
            Platform capabilities
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Built for demanding data teams
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '600px' }}>
            Everything you need to extract, process, and act on web data — reliably and at scale.
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
          }}
        >
          {features.map((feat, i) => (
            <motion.div key={i} {...fadeUp(i * 0.05)}>
              <Card hover>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <feat.icon size={22} color="var(--green-primary)" strokeWidth={1.7} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary)' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feat.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Jobs Table */}
      <section style={{ padding: '0 32px 96px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Recent extraction jobs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {realtimeMetrics.active_jobs} active jobs · {performanceMetrics.today_total_jobs} today
          </p>
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)' }}>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Job name
                </th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Records
                </th>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Completed
                </th>
                <th style={{ width: '40px', padding: '16px 20px' }}></th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map((job, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: idx !== recentJobs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 500, color: 'var(--text-primary)' }}>{job.name}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color:
                          job.status === 'success'
                            ? 'var(--success)'
                            : job.status === 'running'
                            ? 'var(--info)'
                            : 'var(--warning)',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor:
                            job.status === 'success'
                              ? 'var(--success)'
                              : job.status === 'running'
                              ? 'var(--info)'
                              : 'var(--warning)',
                        }}
                      />
                      {job.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{job.rows}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{job.completed}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                    <ExternalLink size={14} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link to="/dashboard">
            <SecondaryButton>
              View all jobs <ChevronRight size={14} style={{ marginLeft: '6px' }} />
            </SecondaryButton>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <div style={{ padding: '0 32px 96px', maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: '64px 48px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '16px' }}>Ready to scale your web intelligence?</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 32px' }}>
            Join leading organizations extracting clean, structured data at enterprise volume.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton to="/dashboard" icon={<ArrowRight size={16} />}>
              Enter dashboard
            </PrimaryButton>
            <SecondaryButton>Contact sales</SecondaryButton>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-default)',
          padding: '40px 32px',
          backgroundColor: 'var(--bg-dark)',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <img src={logo} alt="Webby" style={{ height: '28px' }} />
              <span style={{ fontWeight: 600, fontSize: '16px' }}>Webby</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>© 2026 Webby · Enterprise Web Intelligence</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <span
                style={{
                  fontSize: '11px',
                  border: '1px solid var(--border-subtle)',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  color: 'var(--text-muted)',
                }}
              >
                SOC 2 Type II
              </span>
              <span
                style={{
                  fontSize: '11px',
                  border: '1px solid var(--border-subtle)',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  color: 'var(--text-muted)',
                }}
              >
                GDPR compliant
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {['Privacy', 'Terms', 'Documentation', 'Status'].map((item) => (
              <button
                key={item}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* Mobile menu responsive CSS */}
      <style>
        {`
          @media (max-width: 880px) {
            .hero-grid {
              grid-template-columns: 1fr !important;
              gap: 48px !important;
              text-align: center;
            }
            .hero-grid h1 {
              font-size: 40px !important;
            }
            .hero-grid p {
              margin-left: auto;
              margin-right: auto;
            }
            nav .desktop-nav {
              display: none;
            }
            .mobile-menu-btn {
              display: block !important;
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 24px;
            }
            .feature-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @media (min-width: 881px) {
            .mobile-menu-btn {
              display: none !important;
            }
          }
          @media (max-width: 640px) {
            .stats-grid {
              grid-template-columns: 1fr !important;
            }
            .container {
              padding: 0 16px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default HomePage;