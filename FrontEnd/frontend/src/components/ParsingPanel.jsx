import React, { useState, useEffect } from 'react';
import {
  Wand2, Copy, Download, CheckCircle, AlertCircle,
  Clock, RefreshCw, Code, Table, List, Zap, Sparkles,
  X, ChevronDown, Brain, Hash, Type,
} from 'lucide-react';
import api from '../api';

// ============================================================
// ANTI-GENERIC UI/UX ENFORCEMENT v2.0 - PARSING PANEL
// - No nested card anti-pattern
// - Visible borders (10%+ contrast)
// - No emoji icons (Lucide only)
// - No em dashes in UI copy
// - 60-30-10 color ratio enforced
// - Subtle shadows, consistent radius scale
// - Purposeful animation layer
// ============================================================

const STYLES = `
  .pp-root {
    --color-brand:       hsl(177, 70%, 42%);
    --color-brand-light: hsla(177, 70%, 42%, 0.12);
    --color-brand-dark:  hsl(177, 70%, 32%);
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
    --shadow-modal: 0 16px 48px rgba(0, 0, 0, 0.38);
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
    --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.95); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0% { background-position: -500px 0; }
    100% { background-position: 500px 0; }
  }

  .fade-in { animation: fadeIn 0.3s ease forwards; }
  .spin { animation: spin 0.7s linear infinite; }

  /* Overlay */
  .pp-overlay {
    position: fixed; inset: 0; z-index: 10000;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    background: rgba(4, 8, 14, 0.85);
    backdrop-filter: blur(14px);
  }
  .pp-overlay.closing {
    animation: fadeOut 0.16s ease forwards;
  }

  /* Modal */
  .pp-modal {
    width: 100%; max-width: 680px; max-height: 90vh;
    display: flex; flex-direction: column;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-modal);
    overflow: hidden;
  }
  .pp-modal.closing {
    animation: fadeOut 0.16s ease forwards;
  }

  /* Header */
  .pp-header {
    padding: 20px 24px 18px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid var(--color-border);
    background: linear-gradient(180deg, rgba(32,178,170,0.04) 0%, transparent 100%);
    flex-shrink: 0;
  }
  .pp-header-left {
    display: flex; align-items: center; gap: 14px; min-width: 0;
  }
  .pp-icon {
    width: 44px; height: 44px; border-radius: var(--radius-md);
    background: rgba(32,178,170,0.12);
    border: 1px solid rgba(32,178,170,0.25);
    display: flex; align-items: center; justify-content: center;
    color: #20b2aa;
  }
  .pp-title {
    font-size: var(--text-base); font-weight: 600;
    color: var(--color-text-primary); letter-spacing: -0.02em;
  }
  .pp-sub {
    font-size: var(--text-xs); color: var(--color-text-muted);
    margin-top: 2px; font-family: monospace;
  }
  .pp-x {
    width: 32px; height: 32px; border-radius: var(--radius-sm);
    background: transparent; border: 1px solid var(--color-border);
    color: var(--color-text-muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all var(--transition-base);
  }
  .pp-x:hover {
    background: rgba(239,68,68,0.12);
    color: #ef4444;
    border-color: rgba(239,68,68,0.25);
  }

  /* Body */
  .pp-body {
    flex: 1; overflow-y: auto; padding: 24px;
    display: flex; flex-direction: column; gap: 24px;
  }
  .pp-body::-webkit-scrollbar { width: 4px; }
  .pp-body::-webkit-scrollbar-track { background: transparent; }
  .pp-body::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: var(--radius-full); }

  /* Section Header */
  .pp-section-header {
    font-size: var(--text-xs); font-weight: 700;
    color: var(--color-text-muted); text-transform: uppercase;
    letter-spacing: 0.1em; display: flex; align-items: center; gap: 8px;
    margin-bottom: 16px;
  }
  .pp-section-header::after {
    content: ''; flex: 1; height: 1px;
    background: var(--color-border);
  }

  /* Prompt Panel */
  .pp-prompt {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px;
  }
  .pp-label {
    font-size: var(--text-xs); font-weight: 600;
    color: var(--color-text-muted); margin-bottom: 10px;
    text-transform: uppercase; letter-spacing: 0.07em;
  }
  .pp-textarea {
    width: 100%; box-sizing: border-box;
    background: var(--color-canvas);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    color: var(--color-text-secondary);
    font-size: var(--text-sm); line-height: 1.6;
    font-family: inherit; resize: none; outline: none;
    transition: all var(--transition-base);
  }
  .pp-textarea:focus {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px rgba(32,178,170,0.08);
  }
  .pp-textarea::placeholder {
    color: var(--color-text-muted);
  }

  /* Chips */
  .pp-chips-wrap { margin-top: 16px; }
  .pp-chips-label {
    font-size: var(--text-xs); color: var(--color-text-muted);
    font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em;
    display: flex; align-items: center; gap: 6px; margin-bottom: 10px;
  }
  .pp-chips {
    display: flex; flex-wrap: wrap; gap: 8px;
  }
  .pp-chip {
    padding: 5px 12px; border-radius: var(--radius-full);
    background: transparent; border: 1px solid var(--color-border-strong);
    font-size: var(--text-xs); color: var(--color-text-muted);
    cursor: pointer; transition: all var(--transition-base);
  }
  .pp-chip:hover {
    background: rgba(32,178,170,0.12);
    color: #20b2aa;
    border-color: rgba(32,178,170,0.25);
  }

  /* Primary Button */
  .pp-btn-primary {
    width: 100%; margin-top: 20px; padding: 11px;
    border-radius: var(--radius-sm);
    font-size: var(--text-sm); font-weight: 600;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    cursor: pointer; border: none;
    background: linear-gradient(135deg, #1a6b66 0%, #20b2aa 100%);
    color: white; transition: all var(--transition-base);
  }
  .pp-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  .pp-btn-primary:disabled {
    opacity: 0.5; cursor: not-allowed;
  }
  .pp-hint {
    text-align: center; margin-top: 8px;
    font-size: var(--text-xs); color: var(--color-text-muted);
  }

  /* Error Alert */
  .pp-error {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 14px; border-radius: var(--radius-sm);
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.25);
    font-size: var(--text-sm); color: #f87171;
  }

  /* Result Card */
  .pp-result-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all var(--transition-base);
  }
  .pp-result-card:hover {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-sm);
  }
  .pp-result-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-surface-1);
    border-bottom: 1px solid var(--color-border);
  }
  .pp-result-title {
    display: flex; align-items: center; gap: 7px;
    font-size: var(--text-xs); font-weight: 700;
    color: #20b2aa; text-transform: uppercase; letter-spacing: 0.07em;
  }
  .pp-result-actions {
    display: flex; align-items: center; gap: 8px;
  }
  .pp-result-body {
    padding: 16px;
    background: var(--color-surface-2);
    max-height: 280px; overflow-y: auto;
  }
  .pp-pre {
    margin: 0; font-size: var(--text-xs); line-height: 1.7;
    color: var(--color-text-secondary);
    font-family: monospace; white-space: pre-wrap; word-break: break-word;
  }
  .pp-formatted {
    font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.7;
  }
  .pp-formatted h2 {
    font-size: var(--text-sm); font-weight: 600;
    color: var(--color-text-primary); margin: 14px 0 6px;
  }
  .pp-formatted h3 {
    font-size: var(--text-sm); font-weight: 600;
    color: var(--color-text-secondary); margin: 10px 0 4px;
  }
  .pp-formatted p { margin: 0 0 6px; }
  .pp-formatted li { margin: 2px 0 2px 18px; }

  /* Stats */
  .pp-stats {
    display: flex; gap: 20px;
    padding: 12px 16px;
    background: var(--color-surface-1);
    border-top: 1px solid var(--color-border);
  }
  .pp-stat {
    display: flex; align-items: center; gap: 6px;
    font-size: var(--text-xs); color: var(--color-text-muted);
  }
  .pp-stat strong {
    color: var(--color-text-secondary); font-weight: 600;
  }

  /* View Tabs */
  .pp-view-tabs {
    display: flex; gap: 2px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm); padding: 2px;
  }
  .pp-view-tab {
    padding: 4px 10px; border-radius: var(--radius-xs);
    font-size: var(--text-xs); font-weight: 600;
    color: var(--color-text-muted); cursor: pointer;
    background: transparent; border: none;
    display: flex; align-items: center; gap: 5px;
    transition: all var(--transition-base);
  }
  .pp-view-tab.active {
    background: var(--color-surface-1);
    color: var(--color-text-primary);
  }
  .pp-view-tab:hover:not(.active) {
    color: var(--color-text-secondary);
  }

  /* Action Icon Button */
  .pp-icon-btn {
    width: 28px; height: 28px; border-radius: var(--radius-sm);
    background: transparent; border: 1px solid var(--color-border);
    color: var(--color-text-muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all var(--transition-base);
  }
  .pp-icon-btn:hover {
    background: rgba(32,178,170,0.12);
    color: #20b2aa;
    border-color: rgba(32,178,170,0.25);
  }
  .pp-icon-btn.success {
    color: #10b981;
    border-color: rgba(16,185,129,0.25);
  }

  /* History Items */
  .pp-history-item {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    transition: all var(--transition-base);
    margin-bottom: 8px;
  }
  .pp-history-item:hover {
    border-color: var(--color-border-strong);
    transform: translateY(-1px);
  }
  .pp-history-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; cursor: pointer;
  }
  .pp-history-desc {
    font-size: var(--text-sm); color: var(--color-text-secondary);
    font-weight: 500; flex: 1; min-width: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .pp-history-date {
    font-size: var(--text-xs); color: var(--color-text-muted);
    flex-shrink: 0; font-family: monospace;
  }
  .pp-history-actions {
    display: flex; align-items: center; gap: 4px; flex-shrink: 0;
  }
  .pp-chevron {
    color: var(--color-text-muted);
    transition: transform var(--transition-base);
  }
  .pp-chevron.open {
    transform: rotate(180deg);
  }
  .pp-history-body {
    border-top: 1px solid var(--color-border);
    padding: 14px 16px;
    max-height: 200px; overflow-y: auto;
    background: var(--color-surface-2);
  }

  /* Skeleton */
  .pp-skeleton {
    height: 11px; border-radius: var(--radius-xs);
    background: linear-gradient(90deg, var(--color-surface-1) 25%, var(--color-border) 50%, var(--color-surface-1) 75%);
    background-size: 500px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }

  /* Empty State */
  .pp-empty {
    text-align: center; padding: 48px 24px;
    display: flex; flex-direction: column; align-items: center; gap: 14px;
  }
  .pp-empty-icon {
    width: 56px; height: 56px; border-radius: var(--radius-lg);
    background: rgba(32,178,170,0.08);
    border: 1px solid rgba(32,178,170,0.2);
    display: flex; align-items: center; justify-content: center;
    color: #20b2aa;
  }
  .pp-empty-title {
    font-size: var(--text-base); font-weight: 600;
    color: var(--color-text-secondary);
  }
  .pp-empty-sub {
    font-size: var(--text-sm); color: var(--color-text-muted);
    max-width: 280px; line-height: 1.5;
  }

  /* Footer */
  .pp-footer {
    padding: 14px 24px;
    border-top: 1px solid var(--color-border);
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0; background: var(--color-surface-1);
  }
  .pp-footer-meta {
    font-size: var(--text-xs); color: var(--color-text-muted);
    display: flex; align-items: center; gap: 8px;
  }
  .pp-close-btn {
    padding: 7px 20px; border-radius: var(--radius-sm);
    font-size: var(--text-sm); font-weight: 600; cursor: pointer;
    background: transparent; border: 1px solid var(--color-border-strong);
    color: var(--color-text-muted);
    transition: all var(--transition-base);
  }
  .pp-close-btn:hover {
    background: rgba(32,178,170,0.12);
    color: #20b2aa;
    border-color: rgba(32,178,170,0.25);
  }
`;

// Helper to inject styles
if (typeof document !== 'undefined' && !document.getElementById('pp-styles')) {
  const style = document.createElement('style');
  style.id = 'pp-styles';
  style.textContent = STYLES;
  document.head.appendChild(style);
}

// Format content based on view mode
const formatContent = (content, mode) => {
  if (mode === 'raw') return { type: 'pre', text: content };
  if (mode === 'json') {
    try {
      return { type: 'pre', text: JSON.stringify(JSON.parse(content), null, 2) };
    } catch {
      return { type: 'pre', text: content };
    }
  }
  // Formatted markdown-like rendering
  const html = content.split('\n').map(line => {
    if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
    if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
    if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
    if (/^\d+\. /.test(line)) return `<li>${line}</li>`;
    return line ? `<p>${line}</p>` : '<br/>';
  }).join('');
  return { type: 'html', html };
};

// Copy Button Component
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className={`pp-icon-btn ${copied ? 'success' : ''}`} onClick={handleCopy} title={copied ? 'Copied' : 'Copy'}>
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
    </button>
  );
}

// Download Button Component
function DownloadButton({ content, jobId }) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_${jobId}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <button className="pp-icon-btn" onClick={handleDownload} title="Download">
      <Download size={12} />
    </button>
  );
}

// View Tabs Component
function ViewTabs({ currentView, onChange }) {
  const tabs = [
    { id: 'formatted', label: 'Formatted', icon: List },
    { id: 'raw', label: 'Raw', icon: Code },
    { id: 'json', label: 'JSON', icon: Table },
  ];
  return (
    <div className="pp-view-tabs">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`pp-view-tab ${currentView === tab.id ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <Icon size={10} /> {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// Result Content Component
function ResultContent({ content, viewMode }) {
  const formatted = formatContent(content, viewMode);
  if (formatted.type === 'pre') {
    return <pre className="pp-pre">{formatted.text}</pre>;
  }
  return <div className="pp-formatted" dangerouslySetInnerHTML={{ __html: formatted.html }} />;
}

// Result Stats Component
function ResultStats({ content }) {
  const words = content.split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  const lines = content.split('\n').length;
  return (
    <div className="pp-stats">
      <div className="pp-stat"><Type size={10} /> <strong>{words.toLocaleString()}</strong> words</div>
      <div className="pp-stat"><Hash size={10} /> <strong>{chars.toLocaleString()}</strong> chars</div>
      <div className="pp-stat"><List size={10} /> <strong>{lines}</strong> lines</div>
    </div>
  );
}

// History Item Component
function HistoryItem({ result, jobId }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pp-history-item">
      <div className="pp-history-header" onClick={() => setOpen(!open)}>
        <div className="pp-history-desc">{result.parse_description || 'Extraction result'}</div>
        <div className="pp-history-date">{new Date(result.created_at).toLocaleString()}</div>
        <div className="pp-history-actions">
          <CopyButton text={result.parsed_content} />
          <DownloadButton content={result.parsed_content} jobId={jobId} />
          <ChevronDown size={13} className={`pp-chevron ${open ? 'open' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="pp-history-body">
          <pre className="pp-pre">{result.parsed_content.substring(0, 500)}{result.parsed_content.length > 500 && '...'}</pre>
        </div>
      )}
    </div>
  );
}

// Main ParsingPanel Component
const SUGGESTIONS = [
  'Extract all product names and prices',
  'Find all email addresses and phone numbers',
  'Extract article titles, authors, and dates',
  'Get all image URLs and alt text',
  'Extract technical specifications',
  'Find contact information',
  'Extract all links with anchor text',
  'Get main headings and their content',
];

export default function ParsingPanel({ jobId, jobName, onClose }) {
  const [description, setDescription] = useState('');
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('formatted');
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 180);
  };

  useEffect(() => {
    if (jobId) {
      fetchHistory();
    }
    const handleEsc = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);


  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/scraping/jobs/${jobId}/parsed-results`);
      setHistory(res.data.parsed_results || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async () => {
    if (!description.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const res = await api.post(`/api/scraping/jobs/${jobId}/parse`, {
        dom_content: '',
        parse_description: description,
      });
      setResult(res.data.parse_result);
      await fetchHistory();
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Extraction failed. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className={`pp-root pp-overlay ${closing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`pp-modal ${closing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="pp-header">
          <div className="pp-header-left">
            <div className="pp-icon"><Brain size={18} /></div>
            <div>
              <div className="pp-title">Extract Information</div>
              <div className="pp-sub">{jobName || jobId}</div>
            </div>
          </div>
          <button className="pp-x" onClick={handleClose}><X size={14} /></button>
        </div>

        {/* Body */}
        <div className="pp-body">
          {/* Error Alert */}
          {error && (
            <div className="pp-error">
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}><X size={12} /></button>
            </div>
          )}

          {/* Prompt Section */}
          <div className="pp-prompt">
            <div className="pp-label">What do you want to extract?</div>
            <textarea
              className="pp-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleParse(); }}
              placeholder="Example: Extract all product names, prices, and availability from the scraped content"
              rows={3}
            />
            <div className="pp-chips-wrap">
              <div className="pp-chips-label"><Zap size={10} /> Quick prompts</div>
              <div className="pp-chips">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="pp-chip" onClick={() => setDescription(s)}>{s}</button>
                ))}
              </div>
            </div>
            <button className="pp-btn-primary" onClick={handleParse} disabled={parsing || !description.trim()}>
              {parsing ? <><div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%' }} /> Extracting...</> : <><Wand2 size={14} /> Extract Information</>}
            </button>
            <div className="pp-hint">Press ⌘↵ to run</div>
          </div>

          {/* Latest Result */}
          {result && (
            <div>
              <div className="pp-section-header"><Sparkles size={10} /> Latest extraction</div>
              <div className="pp-result-card">
                <div className="pp-result-header">
                  <div className="pp-result-title"><Sparkles size={11} /> Extracted data</div>
                  <div className="pp-result-actions">
                    <ViewTabs currentView={viewMode} onChange={setViewMode} />
                    <CopyButton text={result} />
                    <DownloadButton content={result} jobId={jobId} />
                  </div>
                </div>
                <div className="pp-result-body">
                  <ResultContent content={result} viewMode={viewMode} />
                </div>
                <ResultStats content={result} />
              </div>
            </div>
          )}

          {/* History Section */}
          <div>
            <div className="pp-section-header" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={10} /> History {history.length > 0 && <span style={{ color: 'var(--color-text-muted)' }}>({history.length})</span>}</span>
              <button onClick={fetchHistory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><RefreshCw size={12} /></button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="pp-skeleton" style={{ height: 48 }} />
                <div className="pp-skeleton" style={{ height: 48, width: '90%' }} />
                <div className="pp-skeleton" style={{ height: 48, width: '85%' }} />
              </div>
            ) : history.length > 0 ? (
              <div>
                {history.map(item => <HistoryItem key={item.id} result={item} jobId={jobId} />)}
              </div>
            ) : !result ? (
              <div className="pp-empty">
                <div className="pp-empty-icon"><Wand2 size={24} /></div>
                <div className="pp-empty-title">No extractions yet</div>
                <div className="pp-empty-sub">Enter a description above to extract specific information from your scraped content</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="pp-footer">
          <div className="pp-footer-meta">
            <Brain size={10} /> AI-powered extraction
            <span style={{ color: 'var(--color-border-strong)' }}>·</span>
            {jobName || jobId}
          </div>
          <button className="pp-close-btn" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  );
}