// frontend/src/components/ParsingPanel.jsx - Complete version with full content display
import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, Zap, Loader, X, CheckCircle, AlertCircle,
  Copy, Download, RefreshCw, Trash2, Eye,
  List, Grid, MessageSquare, Sparkles, Wand2
} from 'lucide-react';
import api from '../api';

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
    --shadow-sm: 0 1px 0 0 rgba(0, 0, 0, 0.2);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.25);
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Courier New", monospace;
    --transition: 120ms cubic-bezier(0.2, 0.8, 0.4, 1);
  }

  .parsing-root * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .fade-slide-in {
    animation: fadeSlideIn 0.25s ease-out;
  }

  .spin {
    animation: spin 0.6s linear infinite;
  }

  .shimmer {
    background: linear-gradient(
      90deg,
      var(--color-surface) 25%,
      var(--color-surface-elevated) 50%,
      var(--color-surface) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .parsing-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(13, 17, 23, 0.92);
    backdrop-filter: blur(8px);
  }

  .parsing-modal {
    width: 100%;
    max-width: 1200px;
    max-height: 92vh;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .parsing-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-elevated);
    flex-shrink: 0;
  }

  .parsing-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .parsing-header-icon {
    width: 40px;
    height: 40px;
    background: var(--color-accent-dim);
    border: 1px solid var(--color-accent-border);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-mdb-green);
  }

  .parsing-header-title {
    font-size: 18px;
    font-weight: 600;
  }

  .parsing-header-subtitle {
    font-size: 12px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  .parsing-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .parsing-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .job-info-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    flex-wrap: wrap;
    gap: 12px;
  }

  .job-info-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .job-info-name {
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .job-info-url {
    font-size: 11px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }

  .job-info-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    padding: 4px 12px;
    border-radius: 20px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .status-dot.has-content {
    background: var(--color-success);
  }

  .status-dot.no-content {
    background: var(--color-warning);
  }

  .parse-input-section {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px;
  }

  .parse-input-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 10px;
  }

  .parse-input-wrapper {
    display: flex;
    gap: 12px;
  }

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
    resize: vertical;
    min-height: 52px;
    font-family: var(--font-sans);
  }

  .parse-input:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 2px rgba(0, 237, 100, 0.1);
  }

  .parse-input::placeholder {
    color: var(--color-text-muted);
  }

  .parse-actions {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .parse-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: var(--color-mdb-green);
    border: none;
    border-radius: var(--radius-md);
    color: #0D1117;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
    white-space: nowrap;
  }

  .parse-btn:hover:not(:disabled) {
    background: var(--color-mdb-green-dark);
    transform: translateY(-1px);
  }

  .parse-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quick-actions-section {
    margin-top: 12px;
  }

  .quick-actions-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }

  .quick-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .quick-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    font-size: 11px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
  }

  .quick-action-btn:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }

  .quick-action-btn.recommended {
    border-color: var(--color-accent-border);
    background: var(--color-accent-dim);
    color: var(--color-mdb-green);
  }

  .quick-action-btn.recommended:hover {
    background: rgba(0, 237, 100, 0.2);
    border-color: var(--color-mdb-green);
  }

  .quick-action-btn .recommend-badge {
    font-size: 8px;
    background: var(--color-mdb-green);
    color: #0D1117;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .generate-recommendations-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    font-size: 11px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    margin-left: auto;
  }

  .generate-recommendations-btn:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-info);
    color: var(--color-info);
  }

  .recommendations-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--color-text-muted);
    padding: 4px 0;
  }

  .results-section {
    flex: 1;
    min-height: 200px;
    display: flex;
    flex-direction: column;
  }

  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 12px;
  }

  .results-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .results-title {
    font-size: 13px;
    font-weight: 600;
  }

  .results-count {
    font-size: 11px;
    color: var(--color-text-muted);
    background: var(--color-canvas);
    padding: 2px 10px;
    border-radius: 20px;
    border: 1px solid var(--color-border);
  }

  .results-header-actions {
    display: flex;
    gap: 6px;
  }

  .result-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 11px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
  }

  .result-btn:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 12px;
    flex: 1;
    overflow-y: auto;
    max-height: 500px;
  }

  .results-list.grid-view {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .result-card {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px;
    transition: all var(--transition);
  }

  .result-card:hover {
    border-color: var(--color-border-subtle);
  }

  .result-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .result-card-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .result-card-description {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .result-card-date {
    font-size: 10px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  .result-card-actions {
    display: flex;
    gap: 4px;
  }

  .result-card-content {
    font-size: 13px;
    line-height: 1.7;
    color: var(--color-text-primary);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 300px;
    overflow-y: auto;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 12px;
    transition: max-height 0.3s ease;
  }

  .result-card-content.expanded {
    max-height: none;
  }

  .result-card-content::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .result-card-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .result-card-content::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }

  .result-card-content::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-muted);
  }

  .result-card-expand {
    margin-top: 8px;
    font-size: 11px;
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: var(--color-info);
  }

  .result-card-expand:hover {
    text-decoration: underline;
  }

  .result-card-stats {
    margin-top: 8px;
    font-size: 10px;
    color: var(--color-text-muted);
    display: flex;
    gap: 12px;
    align-items: center;
    font-family: var(--font-mono);
  }

  .empty-state {
    text-align: center;
    padding: 48px 24px;
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
  }

  .empty-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .empty-description {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;
    color: var(--color-text-muted);
  }

  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2000;
    padding: 14px 20px;
    border-radius: var(--radius-md);
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 12px;
    animation: fadeSlideIn 0.25s ease-out;
    max-width: 400px;
  }

  .toast-success {
    border-left: 3px solid var(--color-success);
  }

  .toast-error {
    border-left: 3px solid var(--color-error);
  }

  /* Raw Content Modal */
  .raw-content-modal .parsing-modal {
    max-width: 900px;
    max-height: 90vh;
  }

  .raw-content-body {
    padding: 24px;
    overflow: auto;
    flex: 1;
  }

  .raw-content-text {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 20px;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.8;
    color: var(--color-text-primary);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 70vh;
    overflow: auto;
  }

  .raw-content-actions {
    margin-top: 16px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  @media (max-width: 768px) {
    .parsing-modal {
      max-height: 98vh;
      border-radius: var(--radius-md);
    }
    .parsing-body {
      padding: 16px;
    }
    .parse-input-wrapper {
      flex-direction: column;
    }
    .parsing-header-title {
      font-size: 15px;
    }
    .job-info-url {
      max-width: 150px;
    }
    .quick-actions {
      gap: 6px;
    }
    .results-list {
      max-height: 300px;
    }
    .results-list.grid-view {
      grid-template-columns: 1fr !important;
    }
    .result-card-content {
      max-height: 200px;
    }
  }
`;

// ============================================================
// INJECT STYLES
// ============================================================

function injectStyles(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }
}

// ============================================================
// TOAST COMPONENT
// ============================================================

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={16} color="#00ED64" />,
    error: <AlertCircle size={16} color="#F85149" />,
  };

  return (
    <div className={`toast toast-${type}`}>
      {icons[type] || icons.info}
      <span style={{ fontSize: 13 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginLeft: 'auto' }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ============================================================
// RAW CONTENT MODAL
// ============================================================

function RawContentModal({ content, onClose, title }) {
  return (
    <div className="parsing-overlay raw-content-modal" onClick={onClose}>
      <div className="parsing-modal" onClick={(e) => e.stopPropagation()}>
        <div className="parsing-header">
          <div className="parsing-header-left">
            <div className="parsing-header-icon" style={{ background: 'rgba(88, 166, 255, 0.1)', borderColor: 'rgba(88, 166, 255, 0.25)' }}>
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
          <div className="raw-content-text">
            {content || 'No content'}
          </div>
          <div className="raw-content-actions">
            <button
              className="result-btn"
              onClick={() => {
                navigator.clipboard.writeText(content);
              }}
            >
              <Copy size={12} /> Copy All
            </button>
            <button
              className="result-btn"
              onClick={() => {
                const blob = new Blob([content], { type: 'text/plain' });
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
            <button className="result-btn" onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PARSING PANEL COMPONENT
// ============================================================

export default function ParsingPanel({ jobId, jobName, onClose }) {
  const [job, setJob] = useState(null);
  const [parseDescription, setParseDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
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

  injectStyles('parsing-styles', STYLES);

  // Load job details
  const loadJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/scraping/jobs/${jobId}`);
      setJob(response.data);
    } catch (err) {
      console.error('Failed to load job:', err);
      setToast({ message: 'Failed to load job details', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Load parsed results
  const loadParsedResults = useCallback(async () => {
    if (!jobId) return;
    setLoadingResults(true);
    try {
      const response = await api.get(`/api/scraping/jobs/${jobId}/parsed-results`);
      if (response.data && response.data.success) {
        setParsedResults(response.data.parsed_results || []);
      } else {
        setParsedResults([]);
      }
    } catch (err) {
      console.error('Failed to load parsed results:', err);
      setParsedResults([]);
    } finally {
      setLoadingResults(false);
    }
  }, [jobId]);

  // Generate AI recommendations based on job content
  const generateRecommendations = useCallback(async () => {
    if (!job || !job.scraped_content) {
      setToast({ message: 'No content available to analyze for recommendations', type: 'error' });
      return;
    }

    setLoadingRecommendations(true);
    try {
      const contentPreview = job.scraped_content.substring(0, 3000);
      const response = await api.post('/api/scraping/generate-recommendations', {
        content: contentPreview,
        job_name: job.name || 'Unknown',
        url: job.url || job.target || 'Unknown'
      });

      if (response.data && response.data.success) {
        setRecommendations(response.data.recommendations || []);
        setHasGeneratedRecommendations(true);
      } else {
        const fallbackRecs = generateFallbackRecommendations(job);
        setRecommendations(fallbackRecs);
        setHasGeneratedRecommendations(true);
      }
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      const fallbackRecs = generateFallbackRecommendations(job);
      setRecommendations(fallbackRecs);
      setHasGeneratedRecommendations(true);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [job]);

  // Generate fallback recommendations based on content analysis (client-side)
  const generateFallbackRecommendations = (jobData) => {
    const content = (jobData.scraped_content || '').toLowerCase();
    const recs = [];

    if (content.includes('pokémon') || content.includes('pokemon') || content.includes('pokedex')) {
      recs.push(
        { label: ' Pokémon Names', desc: 'Extract all Pokémon names' },
        { label: ' Types', desc: 'Extract Pokémon types (Fire, Water, Grass, etc.)' },
        { label: ' Stats', desc: 'Extract Pokémon stats (HP, Attack, Defense, Speed)' },
        { label: ' Evolutions', desc: 'Extract evolution chains and requirements' },
        { label: ' Abilities', desc: 'Extract Pokémon abilities and descriptions' },
        { label: ' Locations', desc: 'Extract where Pokémon can be found' },
        { label: ' Move Sets', desc: 'Extract moves and their effects' },
        { label: ' Rarity', desc: 'Extract rarity or legendary status' }
      );
    } else if (content.includes('product') || content.includes('price') || content.includes('buy')) {
      recs.push(
        { label: ' Product Names', desc: 'Extract all product names' },
        { label: ' Prices', desc: 'Extract product prices' },
        { label: ' Descriptions', desc: 'Extract product descriptions' },
        { label: ' Ratings', desc: 'Extract product ratings and reviews' },
        { label: ' In Stock', desc: 'Extract availability status' }
      );
    } else if (content.includes('article') || content.includes('blog') || content.includes('post')) {
      recs.push(
        { label: ' Headlines', desc: 'Extract article headlines' },
        { label: ' Authors', desc: 'Extract author names' },
        { label: ' Dates', desc: 'Extract publication dates' },
        { label: ' Categories', desc: 'Extract categories or tags' },
        { label: ' Key Points', desc: 'Extract key points and summaries' }
      );
    } else if (content.includes('job') || content.includes('hiring') || content.includes('career')) {
      recs.push(
        { label: ' Job Titles', desc: 'Extract job titles' },
        { label: ' Companies', desc: 'Extract company names' },
        { label: ' Locations', desc: 'Extract job locations' },
        { label: ' Salaries', desc: 'Extract salary ranges' },
        { label: 'Requirements', desc: 'Extract job requirements' }
      );
    } else if (content.includes('email') || content.includes('contact')) {
      recs.push(
        { label: ' Email Addresses', desc: 'Extract all email addresses' },
        { label: ' Phone Numbers', desc: 'Extract phone numbers' },
        { label: ' URLs', desc: 'Extract all URLs and links' }
      );
    }

    recs.push(
      { label: ' Summary', desc: 'Summarize the entire content' },
      { label: ' All Links', desc: 'Extract all URLs from the content' },
      { label: 'Emails & Phones', desc: 'Extract contact information' }
    );

    const unique = recs.filter((v, i, a) => 
      a.findIndex(t => t.desc === v.desc) === i
    ).slice(0, 8);

    return unique.length > 0 ? unique : [
      { label: ' Summary', desc: 'Summarize the content' },
      { label: ' Links', desc: 'Extract all URLs' },
      { label: ' Emails', desc: 'Extract all email addresses' }
    ];
  };

  // Initial load
  useEffect(() => {
    loadJob();
    loadParsedResults();
  }, [loadJob, loadParsedResults]);

  // Auto-generate recommendations when job loads
  useEffect(() => {
    if (job && job.scraped_content && !hasGeneratedRecommendations && !loadingRecommendations) {
      generateRecommendations();
    }
  }, [job, hasGeneratedRecommendations]);

  // Handle parsing
  const handleParse = async () => {
    if (!parseDescription.trim()) {
      setToast({ message: 'Please enter a parsing description', type: 'error' });
      return;
    }

    if (!job) {
      setToast({ message: 'Job not loaded', type: 'error' });
      return;
    }

    const content = job.scraped_content || job.scraped_content_preview;
    if (!content) {
      setToast({ 
        message: 'This job has no scraped content. Please scrape the website first.', 
        type: 'error' 
      });
      return;
    }

    setIsParsing(true);
    try {
      const response = await api.post(`/api/scraping/jobs/${jobId}/parse`, {
        parse_description: parseDescription,
        dom_content: content
      });

      if (response.data && response.data.success) {
        setToast({ message: 'Content parsed successfully!', type: 'success' });
        setParseDescription('');
        await loadParsedResults();
        await loadJob();
      } else {
        setToast({ message: response.data?.message || 'Failed to parse content', type: 'error' });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to parse content';
      setToast({ message: errorMsg, type: 'error' });
      console.error('Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle quick action
  const handleQuickAction = (description) => {
    setParseDescription(description);
  };

  // Handle delete result
  const handleDeleteResult = async (resultId) => {
    try {
      await api.delete(`/api/scraping/results/${resultId}`);
      setToast({ message: 'Result deleted', type: 'success' });
      await loadParsedResults();
    } catch (err) {
      setToast({ message: 'Failed to delete result', type: 'error' });
    }
  };

  // Handle copy to clipboard
  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    setToast({ message: 'Copied to clipboard!', type: 'success' });
  };

  // Toggle expand
  const toggleExpand = (resultId) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const hasContent = !!(job?.scraped_content || job?.scraped_content_preview);

  // Get display recommendations
  const displayRecommendations = recommendations.length > 0 ? recommendations : [
    { label: '📋 Summary', desc: 'Summarize the content' },
    { label: '🔗 Links', desc: 'Extract all URLs' },
    { label: '📧 Emails', desc: 'Extract all email addresses' },
    { label: '📞 Phone', desc: 'Extract phone numbers' },
  ];

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
                  {jobName || 'Select a job to parse'}
                </div>
              </div>
            </div>
            <div className="parsing-header-actions">
              <button
                className="result-btn"
                onClick={() => setActiveView(activeView === 'list' ? 'grid' : 'list')}
              >
                {activeView === 'list' ? <Grid size={14} /> : <List size={14} />}
              </button>
              <button
                className="result-btn"
                onClick={() => { loadJob(); loadParsedResults(); }}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
              </button>
              <button
                className="result-btn"
                onClick={onClose}
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="parsing-body">
            {/* Job Info Bar */}
            {job && (
              <div className="job-info-bar">
                <div className="job-info-left">
                  <span className="job-info-name">{job.name}</span>
                  <span className="job-info-url">{job.url || job.target || 'No URL'}</span>
                </div>
                <div className="job-info-status">
                  <span className={`status-dot ${hasContent ? 'has-content' : 'no-content'}`} />
                  {hasContent ? 'Content Ready' : 'No Content'}
                  <span style={{ marginLeft: 8, color: 'var(--color-text-muted)' }}>
                    • {parsedResults.length} parsed results
                  </span>
                </div>
              </div>
            )}

            {/* Parse Input */}
            <div className="parse-input-section">
              <div className="parse-input-label">
                <MessageSquare size={14} />
                What would you like to extract?
              </div>
              <div className="parse-input-wrapper">
                <textarea
                  className="parse-input"
                  value={parseDescription}
                  onChange={(e) => setParseDescription(e.target.value)}
                  placeholder={recommendations.length > 0 ? 
                    `Try: ${recommendations[0].desc}` : 
                    "e.g., Extract all product names, prices, and descriptions..."}
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleParse();
                    }
                  }}
                />
                <div className="parse-actions">
                  <button
                    className="parse-btn"
                    onClick={handleParse}
                    disabled={isParsing || !parseDescription.trim()}
                  >
                    {isParsing ? (
                      <>
                        <Loader size={16} className="spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Parse
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 8 }}>
                ⌘ + Enter to submit • AI will extract structured data from your job content
              </div>

              {/* Quick Actions with AI Recommendations */}
              <div className="quick-actions-section">
                <div className="quick-actions-label">
                  <Sparkles size={12} />
                  <span>AI Recommendations</span>
                  <button
                    className="generate-recommendations-btn"
                    onClick={generateRecommendations}
                    disabled={loadingRecommendations}
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
                      >
                        {action.label || action.desc.split(' ').slice(0, 2).join(' ')}
                        {index < 3 && <span className="recommend-badge">TOP</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Results Section */}
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
                          const allContent = parsedResults.map(r => r.parsed_content).join('\n\n---\n\n');
                          handleCopy(allContent);
                        }}
                      >
                        <Copy size={12} />
                        Copy All
                      </button>
                      <button
                        className="result-btn"
                        onClick={() => {
                          const data = parsedResults.map(r => ({
                            description: r.parse_description,
                            content: r.parsed_content,
                            date: r.created_at
                          }));
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `parsed_results_${jobId}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download size={12} />
                        Export JSON
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Results List */}
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
                    {recommendations.length > 0 ? (
                      <>Try one of the AI-suggested actions above to extract structured data from your job content.</>
                    ) : (
                      <>Enter a parsing description above to extract structured data from your job content.</>
                    )}
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
                          </div>
                          <div className="result-card-actions">
                            <button
                              className="result-btn"
                              onClick={() => setRawContent({ content, title: result.parse_description, id: result.id })}
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
                        {/* FULL CONTENT - NO TRUNCATION */}
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
                        {/* Content Statistics */}
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

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Raw Content Modal */}
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