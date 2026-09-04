// src/pages/HomePage.jsx - COMPLETE WITH WORKING DOCUMENTATION LINK

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  RefreshCw,
  Play,
  Brain,
  Download,
  FileSpreadsheet,
  FileJson,
  Eye,
  Loader,
  CheckCircle,
  AlertCircle,
  Globe,
  Link as LinkIcon,
  Trash2,
  Clock,
  Sparkles,
  Tag,
  Briefcase,
  BookOpen
} from 'lucide-react';
import logo from '../newlogo.png';
import api from '../api';

// ============================================================
// ENTERPRISE DESIGN SYSTEM — MongoDB Atlas / GitHub inspired
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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spin {
    animation: spin 0.6s linear infinite;
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-slide-in {
    animation: fadeSlideIn 0.25s ease-out;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.95); }
  }

  @media (max-width: 768px) {
    .container {
      padding: 0 16px !important;
    }
    .hero-grid {
      grid-template-columns: 1fr !important;
      gap: 32px !important;
      text-align: center;
    }
    .hero-grid h1 {
      font-size: 32px !important;
    }
    .hero-grid p {
      margin-left: auto !important;
      margin-right: auto !important;
    }
    nav .desktop-nav {
      display: none !important;
    }
    .mobile-menu-btn {
      display: block !important;
    }
    .stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
    }
    .feature-grid {
      grid-template-columns: 1fr !important;
    }
    .card {
      padding: 16px !important;
    }
    .playground-grid {
      grid-template-columns: 1fr !important;
    }
    .playground-preview {
      max-height: 300px !important;
    }
  }
  
  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr !important;
      gap: 8px !important;
    }
    .stat-card {
      padding: 12px !important;
    }
    .stat-value {
      font-size: 20px !important;
    }
    .hero-grid h1 {
      font-size: 28px !important;
    }
    .hero-grid {
      padding: 24px 16px 32px !important;
    }
    .playground-actions {
      flex-direction: column !important;
    }
    .playground-actions button {
      width: 100% !important;
    }
  }
`;

// ============================================================
// SKELETON STYLES
// ============================================================

const skeletonStyles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .skeleton {
    background: linear-gradient(
      90deg,
      var(--bg-surface) 25%,
      var(--bg-elevated) 50%,
      var(--bg-surface) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: var(--radius-sm);
  }

  .skeleton-text {
    height: 12px;
    border-radius: var(--radius-sm);
    background: linear-gradient(
      90deg,
      var(--bg-surface) 25%,
      var(--bg-elevated) 50%,
      var(--bg-surface) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: 24px;
  }
`;

// ============================================================
// COMPONENTS
// ============================================================

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

const PrimaryButton = ({ children, icon, onClick, to, className = '', disabled = false, loading = false }) => {
  const content = (
    <>
      {loading ? <Loader size={16} className="spin" /> : icon}
      {children}
    </>
  );
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: disabled ? 'var(--text-muted)' : 'var(--green-primary)',
    color: disabled ? 'var(--bg-dark)' : '#0D1117',
    fontWeight: 600,
    fontSize: '14px',
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    transition: 'background-color 0.2s ease, transform 0.05s ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled ? 0.6 : 1,
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
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = 'var(--green-dark)')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = 'var(--green-primary)')}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
};

const SecondaryButton = ({ children, onClick, className = '', disabled = false }) => (
  <button
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: 'transparent',
      border: `1px solid ${disabled ? 'var(--border-subtle)' : 'var(--border-default)'}`,
      color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
      fontWeight: 500,
      fontSize: '14px',
      padding: '10px 20px',
      borderRadius: 'var(--radius-md)',
      transition: 'border-color 0.2s ease, color 0.2s ease',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit',
      opacity: disabled ? 0.5 : 1,
    }}
    className={className}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.borderColor = 'var(--text-secondary)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }
    }}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const StatusBadge = ({ status }) => {
  const config = {
    running: { label: 'Running', color: 'var(--info)', bg: 'rgba(88, 166, 255, 0.12)' },
    success: { label: 'Success', color: 'var(--success)', bg: 'rgba(0, 237, 100, 0.12)' },
    completed: { label: 'Completed', color: 'var(--success)', bg: 'rgba(0, 237, 100, 0.12)' },
    failed: { label: 'Failed', color: 'var(--error)', bg: 'rgba(248, 81, 73, 0.12)' },
    paused: { label: 'Paused', color: 'var(--warning)', bg: 'rgba(210, 153, 34, 0.12)' },
    queued: { label: 'Queued', color: 'var(--text-muted)', bg: 'rgba(139, 148, 158, 0.08)' },
  };
  const s = config[status?.toLowerCase()] || config.queued;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '2px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 500,
      color: s.color,
      backgroundColor: s.bg,
      border: `1px solid ${s.color}33`,
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: s.color,
        animation: status === 'running' ? 'pulse-dot 1.5s infinite' : 'none',
      }} />
      {s.label}
    </span>
  );
};

// ============================================================
// PLAYGROUND COMPONENT - Integrated Scraping & Parsing
// ============================================================

const Playground = ({ onJobCreated }) => {
  const [jobName, setJobName] = useState('');
  const [url, setUrl] = useState('');
  const [parseDescription, setParseDescription] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [scrapedContent, setScrapedContent] = useState('');
  const [parsedResult, setParsedResult] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('scrape');
  const [recentJobs, setRecentJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [createdJobId, setCreatedJobId] = useState(null);

  const loadRecentJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const response = await api.get('/api/jobs?limit=5');
      const jobs = response.data?.jobs || [];
      setRecentJobs(jobs);
    } catch (err) {
      console.error('Failed to load recent jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    loadRecentJobs();
  }, [loadRecentJobs]);

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to scrape');
      return;
    }

    setIsScraping(true);
    setError(null);
    setSuccess(null);
    setParsedResult('');
    setActiveTab('scrape');

    try {
      const response = await api.post('/api/scraping/scrape', {
        url: url.trim(),
        use_selenium: false
      });

      if (response.data?.success) {
        setScrapedContent(response.data.cleaned_content || '');
        setSuccess(`Scraped ${response.data.content_length?.toLocaleString() || '0'} characters from ${url}`);
        setActiveTab('parse');
      } else {
        setError(response.data?.message || 'Failed to scrape the URL');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to scrape the URL');
    } finally {
      setIsScraping(false);
    }
  };

  const handleParse = async () => {
    if (!scrapedContent) {
      setError('No content to parse. Please scrape a URL first.');
      return;
    }
    if (!parseDescription.trim()) {
      setError('Please describe what you want to extract');
      return;
    }

    setIsParsing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/api/scraping/parse', {
        dom_content: scrapedContent,
        parse_description: parseDescription.trim()
      });

      if (response.data?.success) {
        setParsedResult(response.data.result || '');
        setSuccess('Content parsed successfully!');
        setActiveTab('results');
      } else {
        setError(response.data?.message || 'Failed to parse content');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to parse content');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreateJob = async () => {
    if (!jobName.trim()) {
      setError('Please enter a job name');
      return;
    }
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    if (!scrapedContent) {
      setError('Please scrape the URL first before creating a job');
      return;
    }

    setIsCreatingJob(true);
    setError(null);
    setSuccess(null);

    try {
      const createResponse = await api.post('/api/jobs', {
        name: jobName.trim(),
        url: url.trim(),
        frequency: 'one-time'
      });

      const jobData = createResponse.data;
      const jobId = jobData.id || jobData._id;

      await api.put(`/api/jobs/${jobId}`, {
        scraped_content: scrapedContent,
        scraped_at: new Date().toISOString(),
        status: 'success',
        progress: 100,
        records: parsedResult ? parsedResult.split(/\s+/).length : scrapedContent.split(/\s+/).length
      });

      if (parsedResult) {
        await api.post(`/api/scraping/jobs/${jobId}/parse`, {
          dom_content: scrapedContent,
          parse_description: parseDescription.trim()
        });
      }

      setCreatedJobId(jobId);
      setSuccess(`Job "${jobName.trim()}" created and saved successfully!`);
      
      if (onJobCreated) onJobCreated();
      
      await loadRecentJobs();

      setJobName('');
      setUrl('');
      setScrapedContent('');
      setParsedResult('');
      setParseDescription('');
      setActiveTab('scrape');

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Failed to create job:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create job');
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleExportCSV = async () => {
    if (!parsedResult && !scrapedContent) {
      setError('No data to export');
      return;
    }

    setIsExporting(true);
    try {
      const dataToExport = parsedResult || scrapedContent;
      const blob = new Blob([dataToExport], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playground_export_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess('Exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    if (!parsedResult && !scrapedContent) {
      setError('No data to export');
      return;
    }

    setIsExporting(true);
    try {
      const dataToExport = parsedResult || scrapedContent;
      const jsonData = JSON.stringify({ 
        content: dataToExport,
        exported_at: new Date().toISOString(),
        url: url || 'manual',
        job_name: jobName || 'untitled'
      }, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playground_export_${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess('Exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClear = () => {
    setScrapedContent('');
    setParsedResult('');
    setParseDescription('');
    setJobName('');
    setError(null);
    setSuccess(null);
    setActiveTab('scrape');
    setCreatedJobId(null);
  };

  const handleLoadJob = (job) => {
    setSelectedJob(job);
    setJobName(job.name || '');
    setUrl(job.url || job.target || '');
    setScrapedContent(job.scraped_content || '');
    if (job.scraped_content) {
      setActiveTab('parse');
      setSuccess(`Loaded job: ${job.name}`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError('This job has no scraped content');
    }
  };

  const truncatedContent = (content, maxLength = 500) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--bg-surface)', 
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
    }}>
      {/* Playground Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'rgba(0, 237, 100, 0.1)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0, 237, 100, 0.2)',
          }}>
            <Zap size={18} color="var(--green-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>Webby Playground</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Test and extract data from any website
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {createdJobId && (
            <Link to="/jobs" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '6px 14px',
                  background: 'rgba(0, 237, 100, 0.1)',
                  border: '1px solid rgba(0, 237, 100, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--green-primary)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 237, 100, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 237, 100, 0.1)'; }}
              >
                <Briefcase size={12} /> View in Jobs
              </button>
            </Link>
          )}
          <button
            onClick={handleClear}
            style={{
              padding: '6px 14px',
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--error)'; e.currentTarget.style.color = 'var(--error)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          margin: '16px 24px 0 24px',
          padding: '10px 16px',
          backgroundColor: 'rgba(248, 81, 73, 0.1)',
          border: '1px solid rgba(248, 81, 73, 0.2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--error)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <AlertCircle size={16} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div style={{
          margin: '16px 24px 0 24px',
          padding: '10px 16px',
          backgroundColor: 'rgba(0, 237, 100, 0.08)',
          border: '1px solid rgba(0, 237, 100, 0.15)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--success)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <CheckCircle size={16} />
          <span style={{ flex: 1 }}>{success}</span>
          <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Playground Body */}
      <div style={{ padding: '24px' }}>
        <div className="playground-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}>
          {/* Left Column - Input & Controls */}
          <div>
            {/* Job Name Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
                marginBottom: '6px',
              }}>
              
                Job Name
              </label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g., Product Catalog Scraper"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-dark)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--green-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
              />
            </div>

            {/* URL Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
                marginBottom: '6px',
              }}>
                
                Target URL
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/page-to-scrape"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-dark)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--green-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleScrape();
                  }}
                />
                <PrimaryButton
                  onClick={handleScrape}
                  disabled={isScraping || !url.trim()}
                  loading={isScraping}
                  icon={<Play size={16} />}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {isScraping ? 'Scraping...' : 'Scrape'}
                </PrimaryButton>
              </div>
            </div>

            {/* Parse Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
                marginBottom: '6px',
              }}>
                
                What to Extract <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(AI-powered)</span>
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={parseDescription}
                  onChange={(e) => setParseDescription(e.target.value)}
                  placeholder="e.g., Extract all product names and prices"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-dark)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--green-primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleParse();
                  }}
                />
                <PrimaryButton
                  onClick={handleParse}
                  disabled={isParsing || !scrapedContent || !parseDescription.trim()}
                  loading={isParsing}
                  icon={<Brain size={16} />}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {isParsing ? 'Parsing...' : 'Extract'}
                </PrimaryButton>
              </div>
              {scrapedContent && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  ✓ {scrapedContent.length.toLocaleString()} characters scraped, ready to parse
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-dark)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={12} />
                Quick Extract Suggestions
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: '📧 Emails', desc: 'Extract all email addresses' },
                  { label: '📞 Phones', desc: 'Extract phone numbers' },
                  { label: '💰 Prices', desc: 'Extract all prices' },
                  { label: '🔗 Links', desc: 'Extract all URLs' },
                  { label: '📝 Summary', desc: 'Summarize the content' },
                  { label: '🏷️ Products', desc: 'Extract product names' },
                ].map((action) => (
                  <button
                    key={action.desc}
                    onClick={() => setParseDescription(action.desc)}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '20px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--green-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Job Button */}
            {(scrapedContent || parsedResult) && (
              <div style={{ marginBottom: '16px' }}>
                <PrimaryButton
                  onClick={handleCreateJob}
                  disabled={isCreatingJob || !jobName.trim() || !url.trim() || !scrapedContent}
                  loading={isCreatingJob}
                  icon={<Briefcase size={16} />}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isCreatingJob ? 'Saving...' : `Save as Job: ${jobName.trim() || 'Untitled'}`}
                </PrimaryButton>
                {!jobName.trim() && scrapedContent && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
                    ⚠️ Enter a job name above to save
                  </div>
                )}
              </div>
            )}

            {/* Export Actions */}
            {(parsedResult || scrapedContent) && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} className="playground-actions">
                <SecondaryButton onClick={handleExportCSV} disabled={isExporting}>
                  <FileSpreadsheet size={14} /> CSV
                </SecondaryButton>
                <SecondaryButton onClick={handleExportJSON} disabled={isExporting}>
                  <FileJson size={14} /> JSON
                </SecondaryButton>
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <Eye size={14} />
                  {showFullContent ? 'Hide Full' : 'Show Full'}
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Results Preview */}
          <div>
            <div style={{
              backgroundColor: 'var(--bg-dark)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              height: '100%',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-elevated)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
              }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {parsedResult ? 'Extracted Data' : scrapedContent ? 'Scraped Content' : 'Ready'}
                </span>
                {(parsedResult || scrapedContent) && (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {(parsedResult || scrapedContent).length.toLocaleString()} chars
                  </span>
                )}
              </div>
              <div className="playground-preview" style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                maxHeight: '320px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.7',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {parsedResult ? (
                  showFullContent ? parsedResult : truncatedContent(parsedResult, 1000)
                ) : scrapedContent ? (
                  showFullContent ? scrapedContent : truncatedContent(scrapedContent, 1000)
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    gap: '8px',
                  }}>
                    <Globe size={32} opacity={0.3} />
                    <div style={{ fontSize: '13px' }}>Enter a URL and click Scrape</div>
                    <div style={{ fontSize: '11px' }}>Then describe what to extract</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Jobs Section */}
        <div style={{ marginTop: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Recent Jobs
            </span>
            <button
              onClick={loadRecentJobs}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <RefreshCw size={12} className={loadingJobs ? 'spin' : ''} />
              Refresh
            </button>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-dark)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            {loadingJobs ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader size={20} className="spin" />
              </div>
            ) : recentJobs.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No recent jobs. Start scraping above!
              </div>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '400px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Job Name</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Records</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJobs.map((job) => (
                      <tr key={job.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 500 }}>{job.name}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <StatusBadge status={job.status} />
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                          {job.records?.toLocaleString() || '0'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <button
                            onClick={() => handleLoadJob(job)}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: 'transparent',
                              border: '1px solid var(--border-default)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-secondary)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--green-primary)'; e.currentTarget.style.color = 'var(--green-primary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                          >
                            Load
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// HERO GRAPHIC
// ============================================================

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
          maxWidth: '100%',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
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

// ============================================================
// SKELETON COMPONENT
// ============================================================

const HomePageSkeleton = () => (
  <div style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh' }}>
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'var(--bg-dark)',
      borderBottom: '1px solid var(--border-default)',
      padding: '0 16px',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
      }}>
        <div className="skeleton" style={{ width: '120px', height: '40px', borderRadius: 'var(--radius-md)' }} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    </nav>
    <section style={{ padding: '40px 16px 48px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }} className="hero-grid">
        <div>
          <div className="skeleton" style={{ width: '180px', height: '28px', borderRadius: '40px', marginBottom: '28px' }} />
          <div className="skeleton" style={{ width: '90%', height: '48px', marginBottom: '20px' }} />
          <div className="skeleton" style={{ width: '60%', height: '16px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '70%', height: '16px', marginBottom: '36px' }} />
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="skeleton" style={{ width: '140px', height: '44px', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ width: '140px', height: '44px', borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
        <div>
          <div className="skeleton-card" style={{ padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }}>
            <div className="skeleton" style={{ width: '200px', height: '80px', margin: '0 auto 20px auto' }} />
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div className="skeleton" style={{ width: '100%', height: '18px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ width: '100%', height: '4px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ width: '50%', height: '14px' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

// ============================================================
// MAIN HOMEPAGE
// ============================================================

const HomePage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
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

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [analyticsResponse, realtimeResponse, recentJobsResponse, performanceResponse, exportStatsResponse] = await Promise.allSettled([
        api.get('/api/jobs/analytics/dashboard'),
        api.get('/api/dashboard/realtime'),
        api.get('/api/dashboard/recent?limit=5'),
        api.get('/api/dashboard/performance'),
        api.get('/api/dashboard/export-stats')
      ]);
      
      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value?.data) {
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
      } else {
        try {
          const jobsResponse = await api.get('/api/jobs');
          const jobs = jobsResponse.data?.jobs || [];
          const completed = jobs.filter(j => j.status === 'success' || j.status === 'completed').length;
          const failed = jobs.filter(j => j.status === 'failed').length;
          const running = jobs.filter(j => j.status === 'running').length;
          const total = jobs.length;
          
          setStats({
            total_jobs: total,
            completed_jobs: completed,
            failed_jobs: failed,
            running_jobs: running,
            success_rate: total > 0 ? (completed / total * 100) : 99.97,
            total_pages_scraped: jobs.reduce((acc, j) => acc + (j.pages_scraped || 0), 0),
            unique_urls: jobs.length
          });
        } catch (e) {
          setStats({
            total_jobs: 0,
            completed_jobs: 0,
            failed_jobs: 0,
            running_jobs: 0,
            success_rate: 99.97,
            total_pages_scraped: 0,
            unique_urls: 0
          });
        }
      }
      
      if (realtimeResponse.status === 'fulfilled' && realtimeResponse.value?.data) {
        const data = realtimeResponse.value.data;
        setRealtimeMetrics({
          active_jobs: data.active_jobs || 0,
          today_jobs: data.today_jobs || 0,
          today_records: data.today_records || 0,
          success_rate: stats.success_rate
        });
      } else {
        setRealtimeMetrics({
          active_jobs: stats.running_jobs || 0,
          today_jobs: 0,
          today_records: 0,
          success_rate: stats.success_rate
        });
      }
      
      if (recentJobsResponse.status === 'fulfilled' && recentJobsResponse.value?.data) {
        const jobs = recentJobsResponse.value.data;
        setRecentJobs(jobs.map(job => ({
          id: job.id,
          name: job.name,
          status: job.status,
          records: job.records || 0,
          url: job.url || job.target,
          scraped_content: job.scraped_content || '',
          created_at: job.created_at,
          completed: formatRelativeTime(job.created_at)
        })));
      } else {
        try {
          const jobsResponse = await api.get('/api/jobs?limit=5');
          const jobs = jobsResponse.data?.jobs || [];
          setRecentJobs(jobs.map(job => ({
            id: job.id,
            name: job.name,
            status: job.status,
            records: job.records || 0,
            url: job.url || job.target,
            scraped_content: job.scraped_content || '',
            created_at: job.created_at,
            completed: formatRelativeTime(job.created_at)
          })));
        } catch (e) {
          setRecentJobs([]);
        }
      }
      
      if (performanceResponse.status === 'fulfilled' && performanceResponse.value?.data) {
        const data = performanceResponse.value.data;
        setPerformanceMetrics({
          average_job_duration_seconds: data.average_job_duration_seconds || 0,
          success_rate_7d: data.success_rate_7d || 0,
          today_success_rate: data.today_success_rate || 0,
          today_total_jobs: data.today_total_jobs || 0,
          last_7_days_total_jobs: data.last_7_days_total_jobs || 0
        });
      } else {
        setPerformanceMetrics({
          average_job_duration_seconds: 0,
          success_rate_7d: 0,
          today_success_rate: 0,
          today_total_jobs: 0,
          last_7_days_total_jobs: 0
        });
      }
      
      if (exportStatsResponse.status === 'fulfilled' && exportStatsResponse.value?.data) {
        const data = exportStatsResponse.value.data;
        setExportStats({
          total_exports: data.total_exports || 0,
          total_rows_exported: data.total_rows_exported || 0
        });
      } else {
        setExportStats({
          total_exports: 0,
          total_rows_exported: 0
        });
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
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
    } catch {
      return 'Unknown';
    }
  };

  const handleJobCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.textContent = globalStyles + skeletonStyles;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

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
    if (!num) return '0';
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

  // Navigation items with proper links
  const navItems = [
    { label: 'Features', path: '/features' },
    { label: 'Documentation', path: '/docs' },
    { label: 'Pricing', path: '/pricing' },
  ];

  const footerLinks = [
    { label: 'Privacy', path: '/privacy' },
    { label: 'Terms', path: '/terms' },
    { label: 'Documentation', path: '/docs' },
    { label: 'Status', path: '/status' },
  ];

  if (loading) {
    return <HomePageSkeleton />;
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh' }}>
      {error && (
        <div style={{
          backgroundColor: 'var(--error)',
          color: 'white',
          padding: '12px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      
      {/* Navigation */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--bg-dark)',
          borderBottom: '1px solid var(--border-default)',
          padding: '0 16px',
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

          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  {item.label}
                </Link>
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
              padding: '8px',
            }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '16px',
              backgroundColor: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-default)',
              gap: '12px',
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '16px',
                  fontWeight: 500,
                  padding: '12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  textDecoration: 'none',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <PrimaryButton to="/login" icon={<ArrowRight size={16} />} style={{ width: '100%', justifyContent: 'center' }}>
              Get started
            </PrimaryButton>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '40px 16px 48px', maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '48px',
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
                fontSize: 'clamp(32px, 5vw, 52px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: '20px',
                color: 'var(--text-primary)',
              }}
            >
              Web data extraction <br className="hide-on-mobile" />
              at enterprise scale
            </h1>
            <p
              style={{
                fontSize: 'clamp(15px, 1.5vw, 17px)',
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
              <Link to="/docs">
                <SecondaryButton>
                  <BookOpen size={14} /> Documentation
                </SecondaryButton>
              </Link>
            </div>
          </div>
          <div>
            <HeroGraphic stats={{ active_jobs: realtimeMetrics.active_jobs, success_rate: stats.success_rate }} />
          </div>
        </div>
      </section>

      {/* PLAYGROUND SECTION - Integrated Scraping & Parsing */}
      <section style={{ padding: '0 16px 48px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--green-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px',
            }}
          >
            Try it now
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 32px)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Webby Playground
          </h2>
          <p style={{ fontSize: 'clamp(15px, 1.2vw, 16px)', color: 'var(--text-secondary)' }}>
            Enter a URL, describe what to extract, and see results instantly — then save as a job for later use.
          </p>
        </div>
        <Playground onJobCreated={handleJobCreated} />
      </section>

      {/* Stats Section */}
      <div
        style={{
          borderTop: '1px solid var(--border-default)',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '32px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
          }}
          className="stats-grid"
        >
          {dashboardStats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <div
                style={{
                  fontSize: 'clamp(24px, 4vw, 42px)',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 'clamp(12px, 1vw, 14px)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {stat.label}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: 'var(--green-primary)' }}>{stat.change}</span>
                <span style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: 'var(--text-muted)' }}>{stat.subtext}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <section style={{ padding: '64px 16px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
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
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 32px)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Built for demanding data teams
          </h2>
          <p style={{ fontSize: 'clamp(15px, 1.2vw, 16px)', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Everything you need to extract, process, and act on web data — reliably and at scale.
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
          }}
          className="feature-grid"
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
                <h3 style={{ fontSize: 'clamp(18px, 1.5vw, 20px)', fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary)' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: 'clamp(13px, 1vw, 14px)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feat.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Jobs Table - REAL DATA */}
      <section style={{ padding: '0 16px 64px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(20px, 2vw, 24px)', fontWeight: 600, marginBottom: '8px' }}>Recent extraction jobs</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {realtimeMetrics.active_jobs} active jobs · {performanceMetrics.today_total_jobs} today
            </p>
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'auto',
          }}
        >
          {recentJobs.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Briefcase size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>No jobs yet</div>
              <div style={{ fontSize: '13px' }}>Start scraping in the playground above to create your first job</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
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
                    key={job.id || idx}
                    style={{
                      borderBottom: idx !== recentJobs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 500, color: 'var(--text-primary)' }}>{job.name || 'Untitled'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatusBadge status={job.status} />
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      {job.records ? job.records.toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      {job.completed || 'Unknown'}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                      <Link to={`/jobs`} style={{ color: 'var(--text-muted)' }}>
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <div style={{ padding: '0 16px 64px', maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 32px)', fontWeight: 600, marginBottom: '16px' }}>Ready to scale your web intelligence?</h2>
          <p style={{ fontSize: 'clamp(15px, 1.2vw, 16px)', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 32px' }}>
            Join leading organizations extracting clean, structured data at enterprise volume.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton to="/login" icon={<ArrowRight size={16} />}>
              Get started
            </PrimaryButton>
            <Link to="/docs">
              <SecondaryButton>
                <BookOpen size={14} /> View Docs
              </SecondaryButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-default)',
          padding: '32px 16px',
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
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
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
            {footerLinks.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <style>
        {`
          @media (max-width: 768px) {
            .hide-on-mobile { display: none; }
          }
          @media (min-width: 769px) {
            .mobile-menu-btn { display: none !important; }
          }
        `}
      </style>
    </div>
  );
};

export default HomePage;