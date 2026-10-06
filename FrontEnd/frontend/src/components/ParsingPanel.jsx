// frontend/src/components/ParsingPanel.jsx - Full working version (streaming)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain, Loader, X, CheckCircle, AlertCircle,
  Copy, Download, RefreshCw, Trash2, Eye,
  List, Grid, MessageSquare, Sparkles, Wand2
} from 'lucide-react';
import api, { jobService } from '../api';

// ============================================================
// NORMALIZER
// ============================================================
function normalizeJob(raw, fallbackId) {
  if (!raw) return null;
  const pickString = (...keys) => {
    for (const k of keys) {
      const v = raw?.[k];
      if (typeof v === 'string' && v.trim().length > 0) return v;
    }
    return '';
  };
  const content = pickString(
    'scraped_content',
    'content',
    'html_content',
    'raw_content',
    'text',
    'scraped_content_preview',
    'parsed_content',
    'last_parsed_result'
  );
  return {
    id: raw.id || raw._id || fallbackId,
    _id: raw._id || raw.id || fallbackId,
    name: raw.name || raw.title || 'Untitled Job',
    url: raw.url || raw.target || raw.target_url || '',
    status: raw.status || 'unknown',
    items: Array.isArray(raw.items) ? raw.items : [],
    scraped_content: content,
    scraped_content_preview: content.slice(0, 500),
    content_length: content.length,
    has_content: content.length > 0,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

// ============================================================
// STYLES
// ============================================================
const STYLES = `
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
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.25);
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Courier New", monospace;
    --transition: 120ms cubic-bezier(0.2, 0.8, 0.4, 1);
  }
  .parsing-root * { margin: 0; padding: 0; box-sizing: border-box; }
  .parsing-root {
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    background: var(--color-canvas);
    line-height: 1.5;
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .fade-slide-in { animation: fadeSlideIn 0.25s ease-out; }
  .spin { animation: spin 0.6s linear infinite; }

  .parsing-overlay {
    position: fixed; inset: 0; z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    background: rgba(13, 17, 23, 0.92);
    backdrop-filter: blur(8px);
  }
  .parsing-modal {
    width: 100%; max-width: 1200px; max-height: 92vh;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: flex; flex-direction: column; overflow: hidden;
  }
  .parsing-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-elevated);
    flex-shrink: 0;
  }
  .parsing-header-left { display: flex; align-items: center; gap: 14px; }
  .parsing-header-icon {
    width: 40px; height: 40px;
    background: var(--color-accent-dim);
    border: 1px solid var(--color-accent-border);
    border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    color: var(--color-mdb-green);
  }
  .parsing-header-title { font-size: 18px; font-weight: 600; }
  .parsing-header-subtitle {
    font-size: 12px; color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
  .parsing-header-actions { display: flex; align-items: center; gap: 8px; }
  .parsing-body {
    flex: 1; overflow-y: auto; padding: 24px;
    display: flex; flex-direction: column; gap: 20px;
  }

  .job-info-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    flex-wrap: wrap; gap: 12px;
  }
  .job-info-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .job-info-name {
    font-weight: 600; font-size: 14px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .job-info-url {
    font-size: 11px; color: var(--color-text-muted);
    font-family: var(--font-mono);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 300px;
  }
  .job-info-status {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; padding: 4px 12px;
    border-radius: 20px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
  }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; }
  .status-dot.has-content { background: var(--color-success); }
  .status-dot.no-content { background: var(--color-warning); }

  .parse-input-section {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px;
  }
  .parse-input-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 600;
    color: var(--color-text-secondary); margin-bottom: 10px;
  }
  .parse-input-wrapper { display: flex; gap: 12px; }
  .parse-input {
    flex: 1;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    font-size: 13px;
    color: var(--color-text-primary);
    outline: none;
    transition: all var(--transition);
    resize: vertical; min-height: 52px;
    font-family: var(--font-sans);
  }
  .parse-input:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 2px rgba(0, 237, 100, 0.1);
  }
  .parse-input::placeholder { color: var(--color-text-muted); }
  .parse-input:disabled { opacity: 0.55; cursor: not-allowed; }
  .parse-actions { display: flex; gap: 8px; align-items: flex-end; }

  .parse-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px;
    background: var(--color-mdb-green);
    border: none; border-radius: var(--radius-md);
    color: #0D1117; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all var(--transition);
    white-space: nowrap;
  }
  .parse-btn:hover:not(:disabled) {
    background: var(--color-mdb-green-dark);
    transform: translateY(-1px);
  }
  .parse-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .progress-bar {
    margin-top: 10px;
    height: 6px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    background: var(--color-mdb-green);
    transition: width 0.3s ease;
  }
  .progress-text {
    margin-top: 6px;
    font-size: 11px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  .quick-actions-section { margin-top: 12px; }
  .quick-actions-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: var(--color-text-muted); margin-bottom: 8px;
  }
  .quick-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .quick-action-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    font-size: 11px; color: var(--color-text-secondary);
    cursor: pointer; transition: all var(--transition);
  }
  .quick-action-btn:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
  .quick-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .quick-action-btn.recommended {
    border-color: var(--color-accent-border);
    background: var(--color-accent-dim);
    color: var(--color-mdb-green);
  }
  .quick-action-btn.recommended:hover:not(:disabled) {
    background: rgba(0, 237, 100, 0.2);
    border-color: var(--color-mdb-green);
  }
  .quick-action-btn .recommend-badge {
    font-size: 8px; background: var(--color-mdb-green);
    color: #0D1117; padding: 1px 6px; border-radius: 10px;
    font-weight: 700; letter-spacing: 0.5px;
  }
  .generate-recommendations-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    font-size: 11px; color: var(--color-text-secondary);
    cursor: pointer; transition: all var(--transition);
    margin-left: auto;
  }
  .generate-recommendations-btn:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: var(--color-info);
    color: var(--color-info);
  }
  .generate-recommendations-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .recommendations-loading {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; color: var(--color-text-muted); padding: 4px 0;
  }

  .results-section { flex: 1; min-height: 200px; display: flex; flex-direction: column; }
  .results-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap; gap: 12px;
  }
  .results-header-left { display: flex; align-items: center; gap: 12px; }
  .results-title { font-size: 13px; font-weight: 600; }
  .results-count {
    font-size: 11px; color: var(--color-text-muted);
    background: var(--color-canvas); padding: 2px 10px;
    border-radius: 20px; border: 1px solid var(--color-border);
  }
  .results-header-actions { display: flex; gap: 6px; }
  .result-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 12px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 11px; color: var(--color-text-secondary);
    cursor: pointer; transition: all var(--transition);
  }
  .result-btn:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
  .result-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .results-list {
    display: flex; flex-direction: column; gap: 12px;
    padding-top: 12px; flex: 1; overflow-y: auto; max-height: 500px;
  }
  .results-list.grid-view {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }
  .result-card {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px;
    transition: all var(--transition);
  }
  .result-card:hover { border-color: var(--color-border-subtle); }
  .result-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;
  }
  .result-card-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .result-card-description { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); }
  .result-card-date { font-size: 10px; color: var(--color-text-muted); font-family: var(--font-mono); }
  .result-card-actions { display: flex; gap: 4px; }
  .result-card-content {
    font-size: 12px; line-height: 1.7;
    color: var(--color-text-primary);
    white-space: pre-wrap; word-break: break-word;
    max-height: 300px; overflow-y: auto;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    transition: max-height 0.3s ease;
  }
  .result-card-content.expanded { max-height: none; }
  .result-card-content::-webkit-scrollbar { width: 6px; height: 6px; }
  .result-card-content::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
  .result-card-content::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
  .result-card-expand {
    margin-top: 8px; font-size: 11px;
    background: none; border: none;
    color: var(--color-info); cursor: pointer;
    display: flex; align-items: center; gap: 4px;
  }
  .result-card-expand:hover { text-decoration: underline; }
  .result-card-stats {
    margin-top: 8px; font-size: 10px; color: var(--color-text-muted);
    display: flex; gap: 12px; align-items: center;
    font-family: var(--font-mono);
  }

  .empty-state { text-align: center; padding: 48px 24px; }
  .empty-icon {
    width: 64px; height: 64px; margin: 0 auto 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    color: var(--color-text-muted);
  }
  .empty-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
  .empty-description { font-size: 13px; color: var(--color-text-muted); }

  .loading-state {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; padding: 40px; color: var(--color-text-muted);
  }
  .error-banner {
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.35);
    color: #ffb3b1;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    font-size: 13px;
    display: flex; align-items: center; gap: 10px;
  }

  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 2000;
    padding: 14px 20px;
    border-radius: var(--radius-md);
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    display: flex; align-items: center; gap: 12px;
    animation: fadeSlideIn 0.25s ease-out;
    max-width: 400px;
  }
  .toast-success { border-left: 3px solid var(--color-success); }
  .toast-error { border-left: 3px solid var(--color-error); }

  .raw-content-modal .parsing-modal { max-width: 900px; max-height: 90vh; }
  .raw-content-body { padding: 24px; overflow: auto; flex: 1; }
  .raw-content-text {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 20px;
    font-family: var(--font-mono);
    font-size: 13px; line-height: 1.8;
    color: var(--color-text-primary);
    white-space: pre-wrap; word-break: break-word;
    max-height: 70vh; overflow: auto;
  }
  .raw-content-actions {
    margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;
  }

  @media (max-width: 768px) {
    .parsing-modal { max-height: 98vh; border-radius: var(--radius-md); }
    .parsing-body { padding: 16px; }
    .parse-input-wrapper { flex-direction: column; }
    .parsing-header-title { font-size: 15px; }
    .job-info-url { max-width: 150px; }
    .results-list { max-height: 300px; }
    .results-list.grid-view { grid-template-columns: 1fr !important; }
    .result-card-content { max-height: 200px; }
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
// UTILITY
// ============================================================
function tryParseLLMJson(text) {
  if (!text) return null;
  try {
    const cleaned = text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function countItemsInResult(resultText) {
  const data = tryParseLLMJson(resultText);
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 1 && Array.isArray(data[keys[0]])) {
      return data[keys[0]].length;
    }
    const arrays = Object.values(data).filter(a => Array.isArray(a) && a.length > 0);
    return arrays.length ? Math.min(...arrays.map(a => a.length)) : 0;
  }
  return 0;
}

// ============================================================
// TOAST
// ============================================================
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const icons = {
    success: <CheckCircle size={16} color="#00ED64" />,
    error: <AlertCircle size={16} color="#F85149" />,
  };
  return (
    <div className={`toast toast-${type}`}>
      {icons[type] || icons.error}
      <span style={{ fontSize: 13 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none',
          color: 'var(--color-text-muted)', cursor: 'pointer', marginLeft: 'auto'
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ============================================================
// RAW CONTENT MODAL
// ============================================================
function RawContentModal({ content, onClose, title }) {
  const safeContent = content || 'No content';
  return (
    <div className="parsing-overlay raw-content-modal" onClick={onClose}>
      <div className="parsing-modal" onClick={(e) => e.stopPropagation()}>
        <div className="parsing-header">
          <div className="parsing-header-left">
            <div
              className="parsing-header-icon"
              style={{
                background: 'rgba(88, 166, 255, 0.1)',
                borderColor: 'rgba(88, 166, 255, 0.25)'
              }}
            >
              <Eye size={20} color="#58A6FF" />
            </div>
            <div>
              <div className="parsing-header-title">Full Parse Result</div>
              <div className="parsing-header-subtitle">{title || 'Raw extracted content'}</div>
            </div>
          </div>
          <button className="result-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="raw-content-body">
          <div className="raw-content-text">{safeContent}</div>
          <div className="raw-content-actions">
            <button
              className="result-btn"
              onClick={() => navigator.clipboard.writeText(safeContent)}
            >
              <Copy size={12} /> Copy All
            </button>
            <button
              className="result-btn"
              onClick={() => {
                const blob = new Blob([safeContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `parsed_result_${Date.now()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download size={12} /> Download
            </button>
            <button
              className="result-btn"
              onClick={onClose}
              style={{ color: 'var(--color-text-muted)' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ParsingPanel({ jobId, jobName, onClose }) {
  const [job, setJob] = useState(null);
  const [jobError, setJobError] = useState(null);
  const [parseDescription, setParseDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(null);
  const [parsedResults, setParsedResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [expandedResults, setExpandedResults] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [activeView, setActiveView] = useState('list');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [hasGeneratedRecommendations, setHasGeneratedRecommendations] = useState(false);
  const [rawContent, setRawContent] = useState(null);

  const mountedRef = useRef(true);
  injectStyles('parsing-styles', STYLES);

  const resolvedJobId =
    typeof jobId === 'string'
      ? jobId
      : jobId?._id || jobId?.id || null;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ---------------- LOAD JOB ----------------
  const loadJob = useCallback(async () => {
    if (!resolvedJobId) {
      setJobError('No job ID provided to ParsingPanel');
      return;
    }
    setLoading(true);
    setJobError(null);
    try {
      const raw = await jobService.getJob(resolvedJobId);
      const data = normalizeJob(raw, resolvedJobId);
      if (!mountedRef.current) return;
      setJob(data);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err.message ||
        'Failed to load job details';
      if (!mountedRef.current) return;
      setJobError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [resolvedJobId]);

  // ---------------- LOAD PARSED RESULTS ----------------
  const loadParsedResults = useCallback(async () => {
    if (!resolvedJobId) return;
    setLoadingResults(true);
    try {
      const response = await api.get(`/api/scraping/jobs/${resolvedJobId}/parsed-results`);
      const list = response?.data?.parsed_results || [];
      if (mountedRef.current) setParsedResults(list);
    } catch (err) {
      if (mountedRef.current) setParsedResults([]);
    } finally {
      if (mountedRef.current) setLoadingResults(false);
    }
  }, [resolvedJobId]);

  // ---------------- RECOMMENDATIONS ----------------
  const generateFallbackRecommendations = (jobData) => {
    const content = (jobData?.scraped_content || '').toLowerCase();
    const recs = [];

    if (content.includes('pokémon') || content.includes('pokemon') || content.includes('pokedex')) {
      recs.push(
        { label: '🔍 Extract All Names', desc: 'Extract all Pokémon names from the content' },
        { label: '⚡ Extract All Types', desc: 'Extract all Pokémon types (Fire, Water, Grass, etc.)' },
        { label: '📊 Extract All Stats', desc: 'Extract all Pokémon stats (HP, Attack, Defense, Speed)' },
        { label: '🔄 Extract All Evolutions', desc: 'Extract all evolution chains and requirements' },
        { label: '🏆 Extract All Abilities', desc: 'Extract all Pokémon abilities and descriptions' },
        { label: '🎯 Extract All Moves', desc: 'Extract all moves and their effects' },
      );
    } else if (content.includes('product') || content.includes('price') || content.includes('buy') || content.includes('£') || content.includes('$')) {
      recs.push(
        { label: '📦 Extract All Products', desc: 'Extract all product names and IDs' },
        { label: '💲 Extract All Prices', desc: 'Extract all prices for every product' },
        { label: '📝 Extract All Descriptions', desc: 'Extract all product descriptions' },
        { label: '⭐ Extract All Ratings', desc: 'Extract all product ratings and review counts' },
        { label: '🛒 Extract All Stock Status', desc: 'Extract the stock/availability status for every product' },
        { label: '🏷️ Extract All Categories', desc: 'Extract all product categories' },
      );
    } else if (content.includes('article') || content.includes('blog') || content.includes('post')) {
      recs.push(
        { label: '📰 Extract All Headlines', desc: 'Extract all article headlines and titles' },
        { label: '✍️ Extract All Authors', desc: 'Extract all author names' },
        { label: '📅 Extract All Dates', desc: 'Extract all publication dates' },
        { label: '🏷️ Extract All Tags', desc: 'Extract all categories or tags' },
        { label: '📊 Extract All Summaries', desc: 'Extract key points and summaries for every article' },
      );
    } else if (content.includes('job') || content.includes('hiring') || content.includes('career')) {
      recs.push(
        { label: '💼 Extract All Job Titles', desc: 'Extract all job titles' },
        { label: '🏢 Extract All Companies', desc: 'Extract all company names' },
        { label: '📍 Extract All Locations', desc: 'Extract all job locations' },
        { label: '💰 Extract All Salaries', desc: 'Extract all salary ranges' },
        { label: '📋 Extract All Requirements', desc: 'Extract all job requirements' },
      );
    } else if (content.includes('email') || content.includes('contact')) {
      recs.push(
        { label: '📧 Extract All Emails', desc: 'Extract all email addresses' },
        { label: '📞 Extract All Phones', desc: 'Extract all phone numbers' },
        { label: '🔗 Extract All URLs', desc: 'Extract all URLs and links' },
      );
    }

    recs.push(
      { label: '📋 Extract Full Summary', desc: 'Extract a comprehensive summary of the entire content' },
      { label: '🔗 Extract All Links', desc: 'Extract all URLs from the content' },
      { label: '📧 Extract All Emails', desc: 'Extract all email addresses' },
    );

    const unique = recs.filter((v, i, a) => a.findIndex(t => t.desc === v.desc) === i).slice(0, 8);
    return unique.length > 0 ? unique : [
      { label: '📋 Extract Full Summary', desc: 'Extract a comprehensive summary of the content' },
      { label: '🔗 Extract All Links', desc: 'Extract all URLs' },
      { label: '📧 Extract All Emails', desc: 'Extract all email addresses' },
    ];
  };

  const generateRecommendations = useCallback(async () => {
    if (!job) return;
    const content = job.scraped_content || '';

    if (!content) {
      const fallbackRecs = generateFallbackRecommendations(job);
      setRecommendations(fallbackRecs);
      setHasGeneratedRecommendations(true);
      return;
    }

    setLoadingRecommendations(true);
    try {
      const response = await api.post('/api/scraping/generate-recommendations', {
        content: content.substring(0, 3000),
        job_name: job.name || 'Unknown',
        url: job.url || 'Unknown',
      });

      if (response?.data?.success && Array.isArray(response.data.recommendations)) {
        if (mountedRef.current) {
          setRecommendations(response.data.recommendations);
          setHasGeneratedRecommendations(true);
        }
      } else {
        const fallbackRecs = generateFallbackRecommendations(job);
        if (mountedRef.current) {
          setRecommendations(fallbackRecs);
          setHasGeneratedRecommendations(true);
        }
      }
    } catch (err) {
      const fallbackRecs = generateFallbackRecommendations(job);
      if (mountedRef.current) {
        setRecommendations(fallbackRecs);
        setHasGeneratedRecommendations(true);
      }
    } finally {
      if (mountedRef.current) setLoadingRecommendations(false);
    }
  }, [job]);

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    loadJob();
    loadParsedResults();
  }, [loadJob, loadParsedResults]);

  useEffect(() => {
    if (job && !hasGeneratedRecommendations && !loadingRecommendations) {
      generateRecommendations();
    }
  }, [job, hasGeneratedRecommendations, loadingRecommendations, generateRecommendations]);

  // ---------------- BUILD CONTENT FOR LLM ----------------
  const buildContentForLLM = useCallback(() => {
    if (!job) return '';

    const items = job.items || [];

    if (items.length > 0) {
      const skip = new Set(['raw_html', 'clean_text', 'source_page', '_id', '__v']);
      const lines = items.map((it, i) => {
        const parts = [`#${i + 1}`];
        for (const [k, v] of Object.entries(it)) {
          if (skip.has(k)) continue;
          if (v === null || v === undefined || v === '') continue;
          if (typeof v === 'object') continue;
          parts.push(`${k}=${String(v).slice(0, 300)}`);
        }
        return parts.join(' | ');
      });
      return lines.join('\n');
    }

    return job.scraped_content || '';
  }, [job]);

  // ---------------- EXPECTED ITEM COUNT ----------------
  const expectedItemCount = useCallback(() => {
    if (!job) return 0;
    if (job.items?.length) return job.items.length;
    const text = job.scraped_content || '';
    return (text.match(/^#\d+/gm) || []).length;
  }, [job]);

  // ---------------- PARSE ACTION (STREAMING) ----------------
  const handleParse = async () => {
    if (!parseDescription.trim()) {
      setToast({ message: 'Please enter a parsing description', type: 'error' });
      return;
    }
    if (!job) {
      setToast({ message: 'Job not loaded', type: 'error' });
      return;
    }

    const content = buildContentForLLM();
    if (!content) {
      setToast({
        message: 'This job has no scraped content. Please scrape the website first.',
        type: 'error',
      });
      return;
    }

    const expected = expectedItemCount();
    setIsParsing(true);
    setParseProgress({ done: 0, total: 0 });

    try {
      const baseURL = api.defaults?.baseURL || '';
      const response = await fetch(
        `${baseURL}/api/scraping/jobs/${resolvedJobId}/parse-stream`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parse_description: parseDescription,
            dom_content: content,
          }),
        }
      );

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const line = block.trim();
          if (!line.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim());

            if (evt.type === 'start') {
              setParseProgress({ done: 0, total: evt.total_chunks });
            } else if (evt.type === 'chunk_complete') {
              setParseProgress(p => ({
                done: (p?.done || 0) + 1,
                total: p?.total || 0,
              }));
            } else if (evt.type === 'chunk_error') {
              // non-fatal, keep going
            } else if (evt.type === 'result') {
              finalResult = evt;
            }
          } catch {
            // ignore malformed
          }
        }
      }

      if (finalResult?.success) {
        const actual = countItemsInResult(finalResult.content);
        const fields = finalResult.fields || [];
        const isShort = expected > 0 && actual > 0 && actual < expected * 0.9;

        setToast({
          message: `Parsed ${actual}/${expected} items • fields: ${fields.join(', ') || 'n/a'} • ${(
            finalResult.processing_time_ms || 0
          ).toFixed(0)}ms`,
          type: isShort ? 'error' : 'success',
        });
        setParseDescription('');
        await loadParsedResults();
        await loadJob();
      } else {
        setToast({
          message: finalResult?.error || 'Parsing failed',
          type: 'error',
        });
      }
    } catch (err) {
      setToast({
        message: err?.message || 'Failed to parse content',
        type: 'error',
      });
      console.error('[ParsingPanel] parse error:', err);
    } finally {
      if (mountedRef.current) {
        setIsParsing(false);
        setParseProgress(null);
      }
    }
  };

  const handleQuickAction = (description) => setParseDescription(description);

  const handleDeleteResult = async (resultId) => {
    try {
      await api.delete(`/api/scraping/results/${resultId}`);
      setToast({ message: 'Result deleted', type: 'success' });
      await loadParsedResults();
    } catch (err) {
      setToast({ message: 'Failed to delete result', type: 'error' });
    }
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content || '');
    setToast({ message: 'Copied to clipboard!', type: 'success' });
  };

  const toggleExpand = (resultId) => {
    setExpandedResults(prev => {
      const next = new Set(prev);
      if (next.has(resultId)) next.delete(resultId);
      else next.add(resultId);
      return next;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleString(); }
    catch { return dateString; }
  };

  // ---------------- DERIVED ----------------
  const contentString = job?.scraped_content || '';
  const hasContent = contentString.length > 0 || (job?.items?.length || 0) > 0;
  const expectedCount = expectedItemCount();

  const displayRecommendations = recommendations.length > 0
    ? recommendations
    : [
        { label: '📋 Extract Full Summary', desc: 'Extract a comprehensive summary of the content' },
        { label: '🔗 Extract All Links', desc: 'Extract all URLs' },
        { label: '📧 Extract All Emails', desc: 'Extract all email addresses' },
        { label: '📞 Extract All Phones', desc: 'Extract all phone numbers' },
      ];

  // ---------------- RENDER ----------------
  return (
    <div className="parsing-root">
      <div className="parsing-overlay" onClick={onClose}>
        <div className="parsing-modal fade-slide-in" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="parsing-header">
            <div className="parsing-header-left">
              <div className="parsing-header-icon">
                <Brain size={20} />
              </div>
              <div>
                <div className="parsing-header-title">AI Parsing Panel</div>
                <div className="parsing-header-subtitle">
                  {jobName || job?.name || 'Select a job to parse'}
                </div>
              </div>
            </div>
            <div className="parsing-header-actions">
              <button
                className="result-btn"
                onClick={() => setActiveView(activeView === 'list' ? 'grid' : 'list')}
                title="Toggle view"
              >
                {activeView === 'list' ? <Grid size={14} /> : <List size={14} />}
              </button>
              <button
                className="result-btn"
                onClick={() => { loadJob(); loadParsedResults(); }}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
              </button>
              <button
                className="result-btn"
                onClick={onClose}
                style={{ color: 'var(--color-text-muted)' }}
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="parsing-body">
            {loading && !job && (
              <div className="loading-state">
                <Loader size={20} className="spin" />
                <span>Loading job…</span>
              </div>
            )}

            {jobError && !job && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>{jobError}</span>
                <button
                  className="result-btn"
                  style={{ marginLeft: 'auto' }}
                  onClick={loadJob}
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}

            {job && (
              <div className="job-info-bar">
                <div className="job-info-left">
                  <span className="job-info-name">{job.name || jobName || 'Untitled'}</span>
                  <span className="job-info-url">{job.url || 'No URL'}</span>
                </div>
                <div className="job-info-status">
                  <span className={`status-dot ${hasContent ? 'has-content' : 'no-content'}`} />
                  {hasContent ? `Content Ready (${expectedCount} items)` : 'No Content'}
                  <span style={{ marginLeft: 8, color: 'var(--color-text-muted)' }}>
                    • {parsedResults.length} parsed results
                  </span>
                </div>
              </div>
            )}

            {job && !hasContent && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>
                  This job has no scraped content yet. Run the scrape first, then come back here.
                </span>
              </div>
            )}

            <div className="parse-input-section">
              <div className="parse-input-label">
                <MessageSquare size={14} />
                What would you like to extract?
                {expectedCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    → will extract EXACTLY {expectedCount} items
                  </span>
                )}
              </div>
              <div className="parse-input-wrapper">
                <textarea
                  className="parse-input"
                  value={parseDescription}
                  onChange={(e) => setParseDescription(e.target.value)}
                  placeholder={
                    recommendations.length > 0
                      ? `Try: ${recommendations[0].desc}`
                      : 'e.g., Extract all product names, prices, and descriptions...'
                  }
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleParse();
                    }
                  }}
                  disabled={!hasContent || isParsing}
                />
                <div className="parse-actions">
                  <button
                    className="parse-btn"
                    onClick={handleParse}
                    disabled={isParsing || !parseDescription.trim() || !hasContent}
                  >
                    {isParsing ? (
                      <>
                        <Loader size={16} className="spin" />
                        {parseProgress?.total
                          ? `Parsing ${parseProgress.done}/${parseProgress.total}…`
                          : 'Parsing…'}
                      </>
                    ) : (
                      <>
                        <Brain size={16} />
                        Parse
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isParsing && parseProgress?.total > 0 && (
                <>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.round(
                          (parseProgress.done / parseProgress.total) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="progress-text">
                    {parseProgress.done}/{parseProgress.total} chunks processed
                    {' • '}
                    {Math.round(
                      (parseProgress.done / parseProgress.total) * 100
                    )}%
                  </div>
                </>
              )}

              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 8 }}>
                ⌘ + Enter to submit • AI will extract structured data from your job content
              </div>

              <div className="quick-actions-section">
                <div className="quick-actions-label">
                  <Sparkles size={12} />
                  <span>AI Recommendations</span>
                  <button
                    className="generate-recommendations-btn"
                    onClick={generateRecommendations}
                    disabled={loadingRecommendations || !job}
                  >
                    {loadingRecommendations ? (
                      <>
                        <Loader size={12} className="spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Wand2 size={12} />
                        Regenerate
                      </>
                    )}
                  </button>
                </div>

                {loadingRecommendations ? (
                  <div className="recommendations-loading">
                    <Loader size={14} className="spin" />
                    Analyzing content to suggest relevant parsing tasks...
                  </div>
                ) : (
                  <div className="quick-actions">
                    {displayRecommendations.map((action, index) => (
                      <button
                        key={`${action.desc}-${index}`}
                        className={`quick-action-btn ${index < 3 ? 'recommended' : ''}`}
                        onClick={() => handleQuickAction(action.desc)}
                        disabled={!hasContent}
                        title={action.desc}
                      >
                        {action.label || action.desc}
                        {index < 3 && <span className="recommend-badge">TOP</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="results-section">
              <div className="results-header">
                <div className="results-header-left">
                  <span className="results-title">Parsed Results</span>
                  <span className="results-count">{parsedResults.length} results</span>
                </div>
                <div className="results-header-actions">
                  {parsedResults.length > 0 && (
                    <>
                      <button
                        className="result-btn"
                        onClick={() => {
                          const allContent = parsedResults
                            .map(r => r.parsed_content)
                            .join('\n\n---\n\n');
                          handleCopy(allContent);
                        }}
                      >
                        <Copy size={12} /> Copy All
                      </button>
                      <button
                        className="result-btn"
                        onClick={() => {
                          const data = parsedResults.map(r => ({
                            description: r.parse_description,
                            content: r.parsed_content,
                            date: r.created_at,
                          }));
                          const blob = new Blob(
                            [JSON.stringify(data, null, 2)],
                            { type: 'application/json' }
                          );
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `parsed_results_${resolvedJobId}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download size={12} /> Export JSON
                      </button>
                    </>
                  )}
                </div>
              </div>

              {loadingResults ? (
                <div className="loading-state">
                  <Loader size={20} className="spin" />
                  <span>Loading results...</span>
                </div>
              ) : parsedResults.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Brain size={28} />
                  </div>
                  <div className="empty-title">No parsed results yet</div>
                  <div className="empty-description">
                    {hasContent
                      ? 'Enter a parsing description above to extract structured data.'
                      : 'Scrape this job first to generate content, then parse it.'}
                  </div>
                </div>
              ) : (
                <div className={`results-list ${activeView === 'grid' ? 'grid-view' : ''}`}>
                  {parsedResults.map((result) => {
                    const isExpanded = expandedResults.has(result.id);
                    const content = result.parsed_content || '';
                    const isLong = content.length > 500;
                    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
                    const lineCount = content.split('\n').length;
                    const itemCount = countItemsInResult(content);
                    const short = expectedCount > 0 && itemCount > 0 && itemCount < expectedCount * 0.9;
                    const fields = result.fields || [];

                    return (
                      <div key={result.id} className="result-card">
                        <div className="result-card-header">
                          <div className="result-card-meta">
                            <span className="result-card-description">
                              {result.parse_description || 'Extracted content'}
                            </span>
                            <span className="result-card-date">
                              {formatDate(result.created_at)}
                            </span>
                            {itemCount > 0 && (
                              <span
                                className="result-card-date"
                                style={{
                                  color: short ? 'var(--color-error)' : 'var(--color-success)',
                                  fontWeight: 600,
                                }}
                              >
                                {short ? '⚠ ' : '✓ '}
                                {itemCount}
                                {expectedCount > 0 ? `/${expectedCount}` : ''} items
                              </span>
                            )}
                            {fields.length > 0 && (
                              <span className="result-card-date" style={{ opacity: 0.75 }}>
                                fields: {fields.join(', ')}
                              </span>
                            )}
                          </div>
                          <div className="result-card-actions">
                            <button
                              className="result-btn"
                              onClick={() =>
                                setRawContent({
                                  content,
                                  title: result.parse_description,
                                  id: result.id,
                                })
                              }
                              title="View raw content"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              className="result-btn"
                              onClick={() => handleCopy(content)}
                              title="Copy"
                            >
                              <Copy size={12} />
                            </button>
                            <button
                              className="result-btn"
                              onClick={() => handleDeleteResult(result.id)}
                              title="Delete"
                              style={{ color: 'var(--color-error)' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className={`result-card-content ${isExpanded ? 'expanded' : ''}`}>
                          {content || 'No content extracted'}
                        </div>
                        {isLong && (
                          <button
                            className="result-card-expand"
                            onClick={() => toggleExpand(result.id)}
                          >
                            {isExpanded ? '📤 Show less' : '📥 Show full content'}
                          </button>
                        )}
                        <div className="result-card-stats">
                          <span>{content.length.toLocaleString()} chars</span>
                          <span>•</span>
                          <span>{wordCount.toLocaleString()} words</span>
                          <span>•</span>
                          <span>{lineCount} lines</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {rawContent && (
        <RawContentModal
          content={rawContent.content}
          title={rawContent.title}
          onClose={() => setRawContent(null)}
        />
      )}
    </div>
  );
}