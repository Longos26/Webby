// src/pages/PlaygroundPage.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  Play,
  Brain,
  FileSpreadsheet,
  FileJson,
  Eye,
  Loader,
  CheckCircle,
  AlertCircle,
  Globe,
  Trash2,
  Sparkles,
  Briefcase,
  RefreshCw,
  X,
} from 'lucide-react';
import api from '../api';
import logo from '../newlogo.png';

// ============================================================
// STYLES
// ============================================================

const STYLES = `
  .pg-page-root {
    --green-primary: #00ED64;
    --green-dark: #00c951;
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
    --radius-xl: 16px;
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", monospace;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pg-page-root * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .pg-page-root {
    background-color: var(--bg-dark);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.5;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .pg-page-root ::-webkit-scrollbar { width: 8px; height: 8px; }
  .pg-page-root ::-webkit-scrollbar-track { background: transparent; }
  .pg-page-root ::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: var(--radius-sm);
  }
  .pg-page-root ::-webkit-scrollbar-thumb:hover { background: #484F58; }

  .pg-page-root *:focus-visible {
    outline: 2px solid var(--green-primary);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.7s linear infinite; }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* ---------- Page shell ---------- */
  .pg-page-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(13, 17, 23, 0.9);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-default);
    padding: 0 16px;
  }

  .pg-page-nav-inner {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
    gap: 16px;
  }

  .pg-page-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-default);
    transition: border-color var(--transition), color var(--transition), background var(--transition);
  }

  .pg-page-back:hover {
    border-color: #484F58;
    color: var(--text-primary);
    background: var(--bg-surface);
  }

  .pg-page-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .pg-page-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 16px 64px;
  }

  .pg-page-header {
    margin-bottom: 24px;
  }

  .pg-page-header-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--green-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 8px;
  }

  .pg-page-header-title {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 8px;
  }

  .pg-page-header-desc {
    font-size: 15px;
    color: var(--text-secondary);
    max-width: 640px;
  }

  /* ---------- Buttons ---------- */
  .home-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    border: none;
    transition: background var(--transition), border-color var(--transition), color var(--transition);
    cursor: pointer;
    font-family: inherit;
    text-decoration: none;
    white-space: nowrap;
  }

  .home-btn-primary {
    background: var(--green-primary);
    color: #0D1117;
  }
  .home-btn-primary:hover:not(:disabled) { background: var(--green-dark); }
  .home-btn-primary:disabled {
    background: var(--text-muted);
    color: var(--bg-dark);
    opacity: 0.6;
    cursor: not-allowed;
  }

  .home-btn-secondary {
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    font-weight: 500;
  }
  .home-btn-secondary:hover:not(:disabled) {
    border-color: #484F58;
    color: var(--text-primary);
  }
  .home-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

  .home-btn-ghost {
    background: var(--bg-dark);
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    font-size: 12px;
    padding: 6px 14px;
    font-weight: 500;
  }
  .home-btn-ghost:hover:not(:disabled) {
    border-color: var(--error);
    color: var(--error);
  }

  .home-btn-green {
    background: rgba(0, 237, 100, 0.1);
    border: 1px solid rgba(0, 237, 100, 0.2);
    color: var(--green-primary);
    font-size: 12px;
    padding: 6px 14px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: var(--radius-sm);
    text-decoration: none;
    transition: background var(--transition);
  }
  .home-btn-green:hover { background: rgba(0, 237, 100, 0.15); }

  /* ---------- Status Badge ---------- */
  .home-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }
  .home-badge-dot { width: 6px; height: 6px; border-radius: 50%; }

  .home-badge.running {
    background: rgba(88, 166, 255, 0.1);
    color: #79B8FF;
    border: 1px solid rgba(88, 166, 255, 0.2);
  }
  .home-badge.running .home-badge-dot {
    background: #58A6FF;
    animation: pulse-dot 1.5s ease-in-out infinite;
  }
  .home-badge.success {
    background: rgba(0, 237, 100, 0.1);
    color: #56D364;
    border: 1px solid rgba(0, 237, 100, 0.2);
  }
  .home-badge.success .home-badge-dot { background: #00ED64; }
  .home-badge.failed {
    background: rgba(248, 81, 73, 0.1);
    color: #FF7B72;
    border: 1px solid rgba(248, 81, 73, 0.2);
  }
  .home-badge.failed .home-badge-dot { background: #F85149; }
  .home-badge.paused {
    background: rgba(210, 153, 34, 0.1);
    color: #E3B341;
    border: 1px solid rgba(210, 153, 34, 0.2);
  }
  .home-badge.paused .home-badge-dot { background: #D29922; }
  .home-badge.queued {
    background: rgba(110, 118, 129, 0.1);
    color: var(--text-secondary);
    border: 1px solid var(--border-default);
  }
  .home-badge.queued .home-badge-dot { background: var(--text-muted); }

  /* ---------- Playground ---------- */
  .pg-root {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }

  .pg-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-elevated);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .pg-header-left { display: flex; align-items: center; gap: 12px; }

  .pg-header-icon {
    width: 36px;
    height: 36px;
    background: rgba(0, 237, 100, 0.1);
    border: 1px solid rgba(0, 237, 100, 0.2);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--green-primary);
  }

  .pg-header-title { font-weight: 600; font-size: 15px; color: var(--text-primary); }
  .pg-header-sub { font-size: 12px; color: var(--text-muted); }

  .pg-alert {
    margin: 16px 20px 0 20px;
    padding: 12px 14px;
    border-radius: var(--radius-md);
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pg-alert.error {
    background: rgba(248, 81, 73, 0.08);
    border: 1px solid rgba(248, 81, 73, 0.2);
    color: #FF7B72;
  }
  .pg-alert.success {
    background: rgba(0, 237, 100, 0.08);
    border: 1px solid rgba(0, 237, 100, 0.2);
    color: #56D364;
  }
  .pg-alert-close {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 2px;
    border-radius: var(--radius-sm);
  }

  .pg-body { padding: 20px; }

  .pg-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .pg-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-primary);
    display: block;
    margin-bottom: 6px;
  }
  .pg-label .pg-label-hint { font-weight: 400; color: var(--text-muted); }

  .pg-input {
    width: 100%;
    padding: 10px 14px;
    background: var(--bg-dark);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
  }
  .pg-input::placeholder { color: var(--text-muted); }
  .pg-input:focus {
    border-color: var(--green-primary);
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.08);
  }

  .pg-field { margin-bottom: 16px; }

  .pg-row { display: flex; gap: 10px; }
  .pg-row .pg-input { flex: 1; }

  .pg-quick-actions {
    padding: 12px 14px;
    background: var(--bg-dark);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    margin-bottom: 16px;
  }
  .pg-quick-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .pg-quick-btns { display: flex; gap: 8px; flex-wrap: wrap; }
  .pg-quick-btn {
    padding: 5px 12px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 9999px;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: border-color var(--transition), color var(--transition), background var(--transition);
    font-family: inherit;
    white-space: nowrap;
  }
  .pg-quick-btn:hover {
    border-color: #484F58;
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  .pg-preview-wrap {
    background: var(--bg-dark);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    overflow: hidden;
    height: 100%;
    min-height: 280px;
    display: flex;
    flex-direction: column;
  }
  .pg-preview-header {
    padding: 10px 16px;
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-elevated);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pg-preview-title { font-size: 13px; font-weight: 500; color: var(--text-primary); }
  .pg-preview-meta { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }
  .pg-preview-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    max-height: 340px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.7;
    color: var(--text-secondary);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .pg-preview-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    text-align: center;
    gap: 10px;
    padding: 24px;
  }
  .pg-preview-empty-title { font-size: 13px; color: var(--text-secondary); }
  .pg-preview-empty-sub { font-size: 12px; }

  .pg-recent { margin-top: 24px; }
  .pg-recent-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pg-recent-title { font-size: 13px; font-weight: 500; color: var(--text-primary); }
  .pg-recent-refresh {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-family: inherit;
    transition: color var(--transition);
  }
  .pg-recent-refresh:hover { color: var(--text-primary); }

  .pg-recent-table-wrap {
    background: var(--bg-dark);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  .pg-recent-empty {
    padding: 20px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
  }

  .pg-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    min-width: 400px;
  }
  .pg-table th {
    padding: 10px 14px;
    text-align: left;
    color: var(--text-muted);
    font-weight: 500;
    border-bottom: 1px solid var(--border-default);
    font-size: 12px;
  }
  .pg-table td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-secondary);
  }
  .pg-table tr:last-child td { border-bottom: none; }
  .pg-table tr:hover td { background: var(--bg-surface); }

  .pg-table-load-btn {
    padding: 5px 12px;
    background: transparent;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: border-color var(--transition), color var(--transition);
    font-family: inherit;
  }
  .pg-table-load-btn:hover {
    border-color: #484F58;
    color: var(--text-primary);
  }

  @media (max-width: 768px) {
    .pg-grid { grid-template-columns: 1fr; }
    .pg-preview-content { max-height: 280px; }
  }

  @media (max-width: 480px) {
    .pg-row { flex-direction: column; }
    .pg-row .home-btn { width: 100%; }
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

// ============================================================
// SHARED COMPONENTS
// ============================================================

const PrimaryButton = ({ children, icon, onClick, to, disabled = false, loading = false, fullWidth = false }) => {
  const cls = `home-btn home-btn-primary`;
  const content = (
    <>
      {loading ? <Loader size={16} className="spin" /> : icon}
      {children}
    </>
  );
  const style = fullWidth ? { width: '100%' } : undefined;
  if (to) {
    return (
      <Link to={to} className={cls} style={style}>
        {content}
      </Link>
    );
  }
  return (
    <button className={cls} style={style} onClick={onClick} disabled={disabled || loading}>
      {content}
    </button>
  );
};

const SecondaryButton = ({ children, onClick, disabled = false }) => (
  <button className="home-btn home-btn-secondary" onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

const StatusBadge = ({ status }) => {
  const key = (status || 'queued').toLowerCase();
  const config = {
    running: 'Running',
    success: 'Success',
    completed: 'Completed',
    failed: 'Failed',
    paused: 'Paused',
    queued: 'Queued',
  };
  const label = config[key] || 'Queued';
  const cls = ['running', 'success', 'failed', 'paused'].includes(key)
    ? key
    : (key === 'completed' ? 'success' : 'queued');
  return (
    <span className={`home-badge ${cls}`}>
      <span className="home-badge-dot" />
      {label}
    </span>
  );
};

// ============================================================
// PLAYGROUND COMPONENT
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
    if (!jobName.trim()) { setError('Please enter a job name'); return; }
    if (!url.trim()) { setError('Please enter a URL'); return; }
    if (!scrapedContent) { setError('Please scrape the URL first before creating a job'); return; }

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
    if (!parsedResult && !scrapedContent) { setError('No data to export'); return; }
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
    if (!parsedResult && !scrapedContent) { setError('No data to export'); return; }
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
    <div className="pg-root">
      {/* Header */}
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-header-icon">
            <Zap size={18} />
          </div>
          <div>
            <div className="pg-header-title">Webby Playground</div>
            <div className="pg-header-sub">Test and extract data from any website</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {createdJobId && (
            <Link to="/jobs" className="home-btn-green">
              <Briefcase size={12} /> View in Jobs
            </Link>
          )}
          <button onClick={handleClear} className="home-btn home-btn-ghost">
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="pg-alert error">
          <AlertCircle size={16} />
          <span style={{ flex: 1 }}>{error}</span>
          <button className="pg-alert-close" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="pg-alert success">
          <CheckCircle size={16} />
          <span style={{ flex: 1 }}>{success}</span>
          <button className="pg-alert-close" onClick={() => setSuccess(null)}><X size={14} /></button>
        </div>
      )}

      {/* Body */}
      <div className="pg-body">
        <div className="pg-grid">
          {/* Left Column */}
          <div>
            {/* Job Name */}
            <div className="pg-field">
              <label className="pg-label">Job Name</label>
              <input
                type="text"
                className="pg-input"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g., Product Catalog Scraper"
              />
            </div>

            {/* URL */}
            <div className="pg-field">
              <label className="pg-label">Target URL</label>
              <div className="pg-row">
                <input
                  type="text"
                  className="pg-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/page-to-scrape"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleScrape(); }}
                />
                <PrimaryButton
                  onClick={handleScrape}
                  disabled={isScraping || !url.trim()}
                  loading={isScraping}
                  icon={<Play size={16} />}
                >
                  {isScraping ? 'Scraping…' : 'Scrape'}
                </PrimaryButton>
              </div>
            </div>

            {/* Parse */}
            <div className="pg-field">
              <label className="pg-label">
                What to Extract <span className="pg-label-hint">(AI-powered)</span>
              </label>
              <div className="pg-row">
                <input
                  type="text"
                  className="pg-input"
                  value={parseDescription}
                  onChange={(e) => setParseDescription(e.target.value)}
                  placeholder="e.g., Extract all product names and prices"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleParse(); }}
                />
                <PrimaryButton
                  onClick={handleParse}
                  disabled={isParsing || !scrapedContent || !parseDescription.trim()}
                  loading={isParsing}
                  icon={<Brain size={16} />}
                >
                  {isParsing ? 'Parsing…' : 'Extract'}
                </PrimaryButton>
              </div>
              {scrapedContent && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  ✓ {scrapedContent.length.toLocaleString()} characters scraped, ready to parse
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pg-quick-actions">
              <div className="pg-quick-label">
                <Sparkles size={12} />
                Quick Extract Suggestions
              </div>
              <div className="pg-quick-btns">
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
                    className="pg-quick-btn"
                    onClick={() => setParseDescription(action.desc)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Job */}
            {(scrapedContent || parsedResult) && (
              <div className="pg-field">
                <PrimaryButton
                  onClick={handleCreateJob}
                  disabled={isCreatingJob || !jobName.trim() || !url.trim() || !scrapedContent}
                  loading={isCreatingJob}
                  icon={<Briefcase size={16} />}
                  fullWidth
                >
                  {isCreatingJob ? 'Saving…' : `Save as Job: ${jobName.trim() || 'Untitled'}`}
                </PrimaryButton>
                {!jobName.trim() && scrapedContent && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                    ⚠️ Enter a job name above to save
                  </div>
                )}
              </div>
            )}

            {/* Export Actions */}
            {(parsedResult || scrapedContent) && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <SecondaryButton onClick={handleExportCSV} disabled={isExporting}>
                  <FileSpreadsheet size={14} /> CSV
                </SecondaryButton>
                <SecondaryButton onClick={handleExportJSON} disabled={isExporting}>
                  <FileJson size={14} /> JSON
                </SecondaryButton>
                <SecondaryButton onClick={() => setShowFullContent(!showFullContent)}>
                  <Eye size={14} />
                  {showFullContent ? 'Hide Full' : 'Show Full'}
                </SecondaryButton>
              </div>
            )}
          </div>

          {/* Right Column - Preview */}
          <div>
            <div className="pg-preview-wrap">
              <div className="pg-preview-header">
                <span className="pg-preview-title">
                  {parsedResult ? 'Extracted Data' : scrapedContent ? 'Scraped Content' : 'Ready'}
                </span>
                {(parsedResult || scrapedContent) && (
                  <span className="pg-preview-meta">
                    {(parsedResult || scrapedContent).length.toLocaleString()} chars
                  </span>
                )}
              </div>
              <div className="pg-preview-content">
                {parsedResult ? (
                  showFullContent ? parsedResult : truncatedContent(parsedResult, 1000)
                ) : scrapedContent ? (
                  showFullContent ? scrapedContent : truncatedContent(scrapedContent, 1000)
                ) : (
                  <div className="pg-preview-empty">
                    <Globe size={32} opacity={0.3} />
                    <div className="pg-preview-empty-title">Enter a URL and click Scrape</div>
                    <div className="pg-preview-empty-sub">Then describe what to extract</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="pg-recent">
          <div className="pg-recent-header">
            <span className="pg-recent-title">Recent Jobs</span>
            <button className="pg-recent-refresh" onClick={loadRecentJobs}>
              <RefreshCw size={12} className={loadingJobs ? 'spin' : ''} />
              Refresh
            </button>
          </div>
          <div className="pg-recent-table-wrap">
            {loadingJobs ? (
              <div className="pg-recent-empty">
                <Loader size={20} className="spin" />
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="pg-recent-empty">No recent jobs. Start scraping above!</div>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table className="pg-table">
                  <thead>
                    <tr>
                      <th>Job Name</th>
                      <th>Status</th>
                      <th>Records</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJobs.map((job) => (
                      <tr key={job.id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{job.name}</td>
                        <td><StatusBadge status={job.status} /></td>
                        <td>{job.records?.toLocaleString() || '0'}</td>
                        <td>
                          <button className="pg-table-load-btn" onClick={() => handleLoadJob(job)}>
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
// PLAYGROUND PAGE
// ============================================================

const PlaygroundPage = () => {
  useEffect(() => {
    injectStyles('playground-page-styles', STYLES);
  }, []);

  return (
    <div className="pg-page-root">
      {/* Nav */}
      <nav className="pg-page-nav">
        <div className="pg-page-nav-inner">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src={logo}
              alt="Webby"
              style={{ height: '70px', width: 'auto', display: 'block' }}
            />
          </Link>
          <div style={{ width: 50 }} />
        </div>
      </nav>

      {/* Content */}
      <div className="pg-page-content">
        <div className="pg-page-header">
          <div className="pg-page-header-label">Try it now</div>
          <h1 className="pg-page-header-title">Webby Playground</h1>
          <p className="pg-page-header-desc">
            Enter a URL, describe what to extract, and see results instantly — then save as a job for later use.
          </p>
        </div>

        <Playground onJobCreated={() => {}} />
      </div>
    </div>
  );
};

export default PlaygroundPage;