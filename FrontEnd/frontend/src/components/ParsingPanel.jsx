// frontend/src/components/ParsingPanel.jsx - MongoDB Atlas Enterprise Edition

import React, { useState, useEffect } from 'react';
import {
  Wand2, Copy, Download, CheckCircle, AlertCircle,
  Clock, RefreshCw, Code, Table, List, Zap, Sparkles,
  X, ChevronDown, Brain, Hash, Type, FileText,
  Eye, EyeOff, Loader2
} from 'lucide-react';
import api from '../api';

// ============================================================
// MONGODB ATLAS ENTERPRISE DESIGN SYSTEM
// ============================================================

const STYLES = `
  /* Enterprise Design Tokens - MongoDB Atlas Inspired */
  .parsing-root {
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
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);
    
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Courier New", monospace;
    
    --transition: 120ms cubic-bezier(0.2, 0.8, 0.4, 1);
  }

  /* Base */
  .parsing-root * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Animations */
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.98); }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: 200px 0; }
  }

  .fade-in {
    animation: fadeSlideIn 0.2s ease-out;
  }
  
  .spin {
    animation: spin 0.6s linear infinite;
  }

  /* Overlay */
  .parsing-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(13, 17, 23, 0.92);
    backdrop-filter: blur(4px);
  }
  
  .parsing-overlay.closing {
    animation: fadeOut 0.15s ease forwards;
  }

  /* Modal */
  .parsing-modal {
    width: 100%;
    max-width: 720px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  
  .parsing-modal.closing {
    animation: fadeOut 0.15s ease forwards;
  }

  /* Header */
  .parsing-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border);
    background: rgba(255, 255, 255, 0.01);
  }
  
  .header-info {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }
  
  .header-icon {
    width: 44px;
    height: 44px;
    background: var(--color-accent-dim);
    border: 1px solid var(--color-accent-border);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-mdb-green);
  }
  
  .header-title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 2px;
  }
  
  .header-subtitle {
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
  }
  
  .close-btn:hover {
    background: rgba(248, 81, 73, 0.1);
    border-color: var(--color-error);
    color: var(--color-error);
  }

  /* Body */
  .parsing-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .parsing-body::-webkit-scrollbar {
    width: 4px;
  }
  
  .parsing-body::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .parsing-body::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 4px;
  }

  /* Section Headers */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }
  
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
    margin-left: 12px;
  }

  /* Prompt Card */
  .prompt-card {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px;
  }
  
  .prompt-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .prompt-textarea {
    width: 100%;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    color: var(--color-text-primary);
    font-size: 13px;
    font-family: var(--font-sans);
    line-height: 1.5;
    resize: none;
    outline: none;
    transition: all var(--transition);
  }
  
  .prompt-textarea:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 2px rgba(0, 237, 100, 0.1);
  }
  
  .prompt-textarea::placeholder {
    color: var(--color-text-muted);
  }

  /* Quick Prompts */
  .quick-prompts {
    margin-top: 16px;
  }
  
  .quick-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .prompt-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .prompt-chip {
    padding: 5px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    font-size: 11px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
  }
  
  .prompt-chip:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }

  /* Primary Button */
  .extract-btn {
    width: 100%;
    margin-top: 20px;
    padding: 10px 16px;
    background: var(--color-mdb-green);
    border: none;
    border-radius: var(--radius-md);
    color: #0D1117;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all var(--transition);
  }
  
  .extract-btn:hover:not(:disabled) {
    background: var(--color-mdb-green-dark);
    transform: translateY(-1px);
  }
  
  .extract-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .shortcut-hint {
    text-align: center;
    margin-top: 10px;
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
  }

  /* Error Alert */
  .error-alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.25);
    border-radius: var(--radius-md);
    font-size: 13px;
    color: var(--color-error);
  }
  
  .error-close {
    background: none;
    border: none;
    color: var(--color-error);
    cursor: pointer;
    padding: 2px;
  }

  /* Result Card */
  .result-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all var(--transition);
  }
  
  .result-card:hover {
    border-color: var(--color-border-subtle);
  }
  
  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: rgba(255, 255, 255, 0.01);
    border-bottom: 1px solid var(--color-border);
  }
  
  .result-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-mdb-green);
  }
  
  .result-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .result-body {
    padding: 18px;
    background: var(--color-canvas);
    max-height: 320px;
    overflow-y: auto;
  }
  
  .result-pre {
    margin: 0;
    font-size: 12px;
    font-family: var(--font-mono);
    line-height: 1.6;
    color: var(--color-text-secondary);
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  .result-formatted {
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-text-secondary);
  }
  
  .result-formatted h2 {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 16px 0 8px;
  }
  
  .result-formatted h3 {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin: 12px 0 6px;
  }
  
  .result-formatted p {
    margin: 0 0 8px;
  }
  
  .result-formatted ul,
  .result-formatted ol {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  .result-formatted li {
    margin: 2px 0;
  }
  
  .result-formatted code {
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 11px;
  }

  /* Stats Bar */
  .result-stats {
    display: flex;
    gap: 20px;
    padding: 10px 18px;
    background: rgba(255, 255, 255, 0.01);
    border-top: 1px solid var(--color-border);
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--color-text-muted);
  }
  
  .stat-value {
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  /* View Tabs */
  .view-tabs {
    display: flex;
    gap: 2px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 2px;
  }
  
  .view-tab {
    padding: 4px 10px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all var(--transition);
  }
  
  .view-tab:hover {
    color: var(--color-text-primary);
  }
  
  .view-tab.active {
    background: var(--color-accent-dim);
    color: var(--color-mdb-green);
  }

  /* Action Icon Buttons */
  .icon-btn {
    width: 28px;
    height: 28px;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
  }
  
  .icon-btn:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
  
  .icon-btn.success {
    color: var(--color-success);
    border-color: var(--color-success);
  }

  /* History Items */
  .history-item {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    margin-bottom: 8px;
    overflow: hidden;
    transition: all var(--transition);
  }
  
  .history-item:hover {
    border-color: var(--color-border-subtle);
  }
  
  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
  }
  
  .history-description {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .history-date {
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    flex-shrink: 0;
    margin: 0 12px;
  }
  
  .history-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  
  .chevron-icon {
    color: var(--color-text-muted);
    transition: transform var(--transition);
  }
  
  .chevron-icon.open {
    transform: rotate(180deg);
  }
  
  .history-body {
    border-top: 1px solid var(--color-border);
    padding: 14px 16px;
    max-height: 200px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.2);
  }

  /* Skeleton Loader */
  .skeleton {
    background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-border) 50%, var(--color-surface) 75%);
    background-size: 200px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: var(--radius-sm);
  }
  
  .skeleton-item {
    height: 52px;
    margin-bottom: 8px;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  
  .empty-icon {
    width: 64px;
    height: 64px;
    background: var(--color-accent-dim);
    border: 1px solid var(--color-accent-border);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-mdb-green);
  }
  
  .empty-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }
  
  .empty-description {
    font-size: 12px;
    color: var(--color-text-muted);
    max-width: 260px;
    line-height: 1.5;
  }

  /* Footer */
  .parsing-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    border-top: 1px solid var(--color-border);
    background: rgba(255, 255, 255, 0.01);
  }
  
  .footer-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 11px;
    color: var(--color-text-muted);
  }
  
  .footer-close {
    padding: 6px 16px;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
  }
  
  .footer-close:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('parsing-styles')) {
  const style = document.createElement('style');
  style.id = 'parsing-styles';
  style.textContent = STYLES;
  document.head.appendChild(style);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const formatContent = (content, mode) => {
  if (mode === 'raw') {
    return { type: 'pre', text: content };
  }
  if (mode === 'json') {
    try {
      const parsed = JSON.parse(content);
      return { type: 'pre', text: JSON.stringify(parsed, null, 2) };
    } catch {
      return { type: 'pre', text: content };
    }
  }
  // Formatted mode - simple markdown-like rendering
  const lines = content.split('\n');
  const html = lines.map(line => {
    if (line.startsWith('## ')) {
      return `<h2>${escapeHtml(line.slice(3))}</h2>`;
    }
    if (line.startsWith('### ')) {
      return `<h3>${escapeHtml(line.slice(4))}</h3>`;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return `<li>${escapeHtml(line.slice(2))}</li>`;
    }
    if (/^\d+\. /.test(line)) {
      return `<li>${escapeHtml(line)}</li>`;
    }
    if (line.trim() === '') {
      return '<br/>';
    }
    return `<p>${escapeHtml(line)}</p>`;
  }).join('');
  return { type: 'html', html };
};

const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// ============================================================
// COPY BUTTON
// ============================================================

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button className={`icon-btn ${copied ? 'success' : ''}`} onClick={handleCopy} title={copied ? 'Copied' : 'Copy'}>
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ============================================================
// DOWNLOAD BUTTON
// ============================================================

function DownloadButton({ content, jobId }) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extract_${jobId}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <button className="icon-btn" onClick={handleDownload} title="Download">
      <Download size={12} />
    </button>
  );
}

// ============================================================
// VIEW TABS
// ============================================================

function ViewTabs({ currentView, onChange }) {
  const tabs = [
    { id: 'formatted', label: 'Formatted', icon: Eye },
    { id: 'raw', label: 'Raw', icon: FileText },
    { id: 'json', label: 'JSON', icon: Code },
  ];
  
  return (
    <div className="view-tabs">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`view-tab ${currentView === tab.id ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <Icon size={10} /> {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// RESULT CONTENT
// ============================================================

function ResultContent({ content, viewMode }) {
  const formatted = formatContent(content, viewMode);
  
  if (formatted.type === 'pre') {
    return <pre className="result-pre">{formatted.text}</pre>;
  }
  
  return (
    <div className="result-formatted" dangerouslySetInnerHTML={{ __html: formatted.html }} />
  );
}

// ============================================================
// RESULT STATS
// ============================================================

function ResultStats({ content }) {
  const words = content.split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  const lines = content.split('\n').length;
  
  return (
    <div className="result-stats">
      <div className="stat-item">
        <Type size={10} /> <span className="stat-value">{words.toLocaleString()}</span> words
      </div>
      <div className="stat-item">
        <Hash size={10} /> <span className="stat-value">{chars.toLocaleString()}</span> chars
      </div>
      <div className="stat-item">
        <List size={10} /> <span className="stat-value">{lines}</span> lines
      </div>
    </div>
  );
}

// ============================================================
// HISTORY ITEM
// ============================================================

function HistoryItem({ result, jobId }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="history-item">
      <div className="history-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="history-description">
          {result.parse_description || 'Extraction result'}
        </div>
        <div className="history-date">
          {new Date(result.created_at).toLocaleString()}
        </div>
        <div className="history-actions" onClick={e => e.stopPropagation()}>
          <CopyButton text={result.parsed_content} />
          <DownloadButton content={result.parsed_content} jobId={jobId} />
          <ChevronDown size={14} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
        </div>
      </div>
      {isOpen && (
        <div className="history-body">
          <pre className="result-pre">
            {result.parsed_content.substring(0, 500)}
            {result.parsed_content.length > 500 && '...'}
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PARSING PANEL
// ============================================================

const QUICK_PROMPTS = [
  'Extract all product names and prices',
  'Find all email addresses and phone numbers',
  'Extract article titles, authors, and dates',
  'Get all image URLs with alt text',
  'Extract technical specifications',
  'Find contact information from the page',
  'Extract all links with anchor text',
  'Get main headings and their content',
];

export default function ParsingPanel({ jobId, jobName, onClose }) {
  const [description, setDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('formatted');
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState(null);
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 160);
  };
  
  useEffect(() => {
    if (jobId) {
      fetchHistory();
    }
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    
    return () => window.removeEventListener('keydown', handleEscape);
  }, [jobId]);
  
  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/scraping/jobs/${jobId}/parsed-results`);
      setHistory(res.data.parsed_results || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleParse = async () => {
    if (!description.trim()) return;
    
    setIsParsing(true);
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
      setIsParsing(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleParse();
    }
  };
  
  return (
    <div className={`parsing-root parsing-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`parsing-modal ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="parsing-header">
          <div className="header-info">
            <div className="header-icon">
              <Brain size={20} />
            </div>
            <div>
              <div className="header-title">Extract Information</div>
              <div className="header-subtitle">{jobName || jobId}</div>
            </div>
          </div>
          <button className="close-btn" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>
        
        {/* Body */}
        <div className="parsing-body">
          {/* Error Alert */}
          {error && (
            <div className="error-alert">
              <AlertCircle size={14} />
              <span style={{ flex: 1 }}>{error}</span>
              <button className="error-close" onClick={() => setError(null)}>
                <X size={12} />
              </button>
            </div>
          )}
          
          {/* Prompt Section */}
          <div className="prompt-card">
            <div className="prompt-label">
              <Zap size={10} /> Extraction Description
            </div>
            <textarea
              className="prompt-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to extract from the scraped content..."
              rows={3}
            />
            
            <div className="quick-prompts">
              <div className="quick-label">
                <Sparkles size={10} /> Quick Prompts
              </div>
              <div className="prompt-chips">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    className="prompt-chip"
                    onClick={() => setDescription(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              className="extract-btn"
              onClick={handleParse}
              disabled={isParsing || !description.trim()}
            >
              {isParsing ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <Wand2 size={30} />
              )}
              {isParsing ? 'Extracting...' : 'Extract Information'}
            </button>
            <div className="shortcut-hint">
              Press ⌘↵ to extract
            </div>
          </div>
          
          {/* Latest Result */}
          {result && (
            <div>
              <div className="section-header">
                <div className="section-title">
                  <Sparkles size={10} /> Latest Extraction
                </div>
              </div>
              <div className="result-card">
                <div className="result-header">
                  <div className="result-title">
                    <Wand2 size={12} /> Extracted Data
                  </div>
                  <div className="result-actions">
                    <ViewTabs currentView={viewMode} onChange={setViewMode} />
                    <CopyButton text={result} />
                    <DownloadButton content={result} jobId={jobId} />
                  </div>
                </div>
                <div className="result-body">
                  <ResultContent content={result} viewMode={viewMode} />
                </div>
                <ResultStats content={result} />
              </div>
            </div>
          )}
          
          {/* History Section */}
          <div>
            <div className="section-header">
              <div className="section-title">
                <Clock size={10} /> History
                {history.length > 0 && (
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>
                    ({history.length})
                  </span>
                )}
              </div>
              <button
                className="icon-btn"
                onClick={fetchHistory}
                title="Refresh history"
              >
                <RefreshCw size={12} />
              </button>
            </div>
            
            {isLoading ? (
              <div>
                <div className="skeleton skeleton-item" />
                <div className="skeleton skeleton-item" style={{ width: '90%' }} />
                <div className="skeleton skeleton-item" style={{ width: '85%' }} />
              </div>
            ) : history.length > 0 ? (
              history.map(item => (
                <HistoryItem key={item.id} result={item} jobId={jobId} />
              ))
            ) : !result ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Wand2 size={28} />
                </div>
                <div className="empty-title">No extractions yet</div>
                <div className="empty-description">
                  Enter a description above to extract specific information from your scraped content
                </div>
              </div>
            ) : null}
          </div>
        </div>
        
        {/* Footer */}
        <div className="parsing-footer">
          <div className="footer-meta">
            <Brain size={10} />
            <span>AI-powered extraction</span>
            <span>•</span>
            <span className="footer-job">{jobName || jobId}</span>
          </div>
          <button className="footer-close" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}