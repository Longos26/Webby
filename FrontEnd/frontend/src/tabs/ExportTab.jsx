// frontend/src/pages/ExportTab.jsx - COMPLETE FIXED VERSION

import { useState, useEffect } from 'react';
import { 
  FileBraces, Download, RefreshCw, FileText, X, AlertCircle, Eye, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Database
} from 'lucide-react';
import api from '../api';

// ============================================================
// ANTI-GENERIC UI/UX ENFORCEMENT v2.0 - EXPORT PAGE
// ============================================================

const STYLES = `
  /* Design Tokens - Anti-Generic Compliant */
  .ex-root {
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
    --text-lg:   1.25rem;
    --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

  .page-enter { animation: fadeIn 0.3s ease forwards; }
  .spin { animation: spin 0.7s linear infinite; }

  /* Section Headers */
  .section-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .section-title-sm {
    font-size: 14px; font-weight: 600; letter-spacing: -0.02em;
    color: var(--color-text-primary);
  }
  .section-sub-sm {
    font-size: 12px; color: var(--color-text-muted); margin-top: 2px;
  }

  /* Buttons */
  .btn-sm {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: var(--radius-sm);
    font-size: var(--text-sm); font-weight: 600; cursor: pointer;
    font-family: var(--font-sans); transition: all var(--transition-base);
  }
  .btn-primary {
    background: var(--color-brand); color: white; border: none;
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--color-brand-dark); transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  .btn-ghost {
    background: rgba(255,255,255,0.04); color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  .btn-ghost:hover {
    background: rgba(255,255,255,0.08); color: var(--color-text-primary);
    border-color: var(--color-border-strong);
  }
  .btn-primary:disabled, .btn-ghost:disabled {
    opacity: 0.5; cursor: not-allowed;
  }

  /* Form Elements */
  .form-group {
    display: flex; flex-direction: column; gap: 6px;
  }
  .form-label {
    font-family: var(--font-mono); font-size: 10px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .form-input {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 9px 12px; font-size: var(--text-sm);
    color: var(--color-text-primary); outline: none;
    font-family: var(--font-sans);
    transition: all var(--transition-base);
  }
  .form-input:focus {
    border-color: var(--color-border-focus);
    background: rgba(59,130,246,0.05);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
  }
  .form-input select, .form-input option {
    background: var(--color-surface-2);
  }

  /* Error Alert */
  .error-alert {
    display: flex; align-items: center; gap: 10px;
    background: var(--color-error-dim); border: 1px solid rgba(239,68,68,0.25);
    border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 20px;
    font-size: var(--text-sm); color: #f87171;
  }
  .error-alert button {
    margin-left: auto; background: none; border: none; cursor: pointer;
  }

  /* Format Cards */
  .ex-formats {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    margin-bottom: 20px;
  }
  .ex-format-card {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px 14px;
    cursor: pointer;
    transition: all var(--transition-base);
    display: flex; flex-direction: column; gap: 8px;
  }
  .ex-format-card:hover {
    background: var(--color-surface-3);
    border-color: var(--color-border-strong);
    transform: translateY(-1px);
  }
  .ex-format-card.selected {
    border-color: rgba(59,130,246,0.25);
    background: rgba(59,130,246,0.08);
  }
  .ex-format-card.selected .ex-format-name {
    color: var(--color-brand);
  }
  .ex-format-ico {
    width: 36px; height: 36px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
  }
  .ex-format-ico.green  { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
  .ex-format-ico.blue   { background: rgba(59,130,246,0.12); color: #3b82f6; border: 1px solid rgba(59,130,246,0.25); }
  .ex-format-ico.purple { background: rgba(139,92,246,0.12); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.25); }
  .ex-format-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
  .ex-format-desc { font-size: 11px; color: var(--color-text-muted); line-height: 1.4; }

  /* Config Panel */
  .ex-config {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 20px;
    margin-bottom: 28px;
  }
  .ex-config-title {
    font-size: 10px; font-weight: 700; color: var(--color-text-muted);
    text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;
  }
  .ex-config-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }

  /* Checkbox Rows */
  .ex-check-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 0; cursor: pointer;
    transition: opacity var(--transition-fast);
  }
  .ex-check-row:hover { opacity: 0.8; }
  .ex-check-box {
    width: 16px; height: 16px; border-radius: var(--radius-xs);
    border: 1px solid var(--color-border);
    background: rgba(255,255,255,0.03);
    display: flex; align-items: center; justify-content: center;
    transition: all var(--transition-fast);
  }
  .ex-check-box.checked {
    background: rgba(59,130,246,0.12);
    border-color: rgba(59,130,246,0.25);
  }
  .ex-check-box.checked::after {
    content: ''; width: 8px; height: 8px; border-radius: 2px;
    background: var(--color-brand); display: block;
  }
  .ex-check-label { font-size: 12px; color: var(--color-text-secondary); }

  /* Parse Results List */
  .parse-results-list {
    max-height: 240px; overflow-y: auto; margin-top: 8px;
  }
  .parse-result-item {
    padding: 10px 12px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-bottom: 8px;
    cursor: pointer;
    transition: all var(--transition-base);
  }
  .parse-result-item:hover {
    background: var(--color-surface-3);
    border-color: var(--color-border-strong);
  }
  .parse-result-item.selected {
    border-color: rgba(59,130,246,0.25);
    background: rgba(59,130,246,0.08);
  }
  .parse-result-desc {
    font-size: 12px; font-weight: 600; color: var(--color-text-primary);
    margin-bottom: 4px;
  }
  .parse-result-date {
    font-size: 10px; color: var(--color-text-muted);
  }
  .parse-result-preview {
    font-size: 11px; color: var(--color-text-secondary);
    margin-top: 6px; font-family: monospace;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* History Items */
  .ex-history-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-bottom: 8px;
    transition: all var(--transition-base);
  }
  .ex-history-item:hover {
    background: var(--color-surface-3);
    border-color: var(--color-border-strong);
  }
  .ex-history-ico {
    width: 36px; height: 36px; border-radius: var(--radius-sm); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .ex-history-ico.csv  { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); color: #10b981; }
  .ex-history-ico.xlsx { background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); color: #3b82f6; }
  .ex-history-ico.json { background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); color: #8b5cf6; }
  .ex-history-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px; }
  .ex-history-meta { font-size: 10px; color: var(--color-text-muted); font-family: monospace; }
  .ex-history-dl {
    margin-left: auto; flex-shrink: 0;
    display: flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: var(--radius-sm);
    font-size: 11px; font-weight: 600; cursor: pointer;
    background: rgba(59,130,246,0.12);
    border: 1px solid rgba(59,130,246,0.25);
    color: var(--color-brand);
    transition: all var(--transition-base);
  }
  .ex-history-dl:hover {
    background: rgba(59,130,246,0.2);
    border-color: rgba(59,130,246,0.4);
  }

  /* Empty State */
  .ex-empty {
    text-align: center; padding: 48px 24px;
    background: var(--color-surface-1); border: 1px solid var(--color-border);
    border-radius: var(--radius-md); color: var(--color-text-muted);
    font-size: 13px;
  }
  .empty-icon {
    width: 48px; height: 48px; margin: 0 auto 14px;
    border-radius: var(--radius-md);
    background: rgba(255,255,255,0.04); border: 1px solid var(--color-border);
    display: flex; align-items: center; justify-content: center;
  }

  /* Dataset Name Input */
  .dataset-name-input {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 9px 12px;
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    width: 100%;
    font-family: monospace;
    transition: all var(--transition-base);
  }
  .dataset-name-input:focus {
    outline: none;
    border-color: var(--color-border-focus);
    background: rgba(59,130,246,0.05);
  }

  /* Pagination */
  .ex-pagination-container {
    margin-top: 20px; padding: 16px 0 8px;
    border-top: 1px solid var(--color-border);
  }
  .ex-pagination-wrapper {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
  }
  .ex-pagination-info {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; color: var(--color-text-muted);
    background: rgba(255,255,255,0.03);
    padding: 5px 12px; border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }
  .ex-pagination-info span {
    color: var(--color-brand); font-weight: 600;
  }
  .ex-pagination-controls {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  }
  .ex-page-nav {
    display: flex; align-items: center; gap: 4px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 6px 10px; cursor: pointer;
    color: var(--color-text-muted); font-size: 11px;
    font-weight: 500; transition: all var(--transition-base);
  }
  .ex-page-nav:hover:not(:disabled) {
    background: rgba(255,255,255,0.08);
    border-color: var(--color-border-strong);
    color: var(--color-text-primary);
  }
  .ex-page-nav:disabled {
    opacity: 0.4; cursor: not-allowed;
  }
  .ex-page-numbers {
    display: flex; align-items: center; gap: 4px;
  }
  .ex-page-number {
    min-width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all var(--transition-base);
  }
  .ex-page-number:hover {
    background: rgba(255,255,255,0.08);
    border-color: var(--color-border-strong);
    color: var(--color-text-primary);
  }
  .ex-page-number.active {
    background: rgba(59,130,246,0.12);
    border-color: rgba(59,130,246,0.25);
    color: var(--color-brand);
  }
  .ex-page-ellipsis {
    color: var(--color-text-muted); padding: 0 4px; font-size: 12px;
  }
  .ex-page-size-selector {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.03);
    padding: 4px 12px; border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }
  .ex-page-size-selector label {
    font-size: 11px; color: var(--color-text-muted);
  }
  .ex-page-size-selector select {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 4px 8px; color: var(--color-text-primary);
    font-size: 11px; font-weight: 500; cursor: pointer;
  }

  /* Preview Modal */
  .ex-overlay {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 24px;
    background: rgba(6,10,18,0.82); backdrop-filter: blur(14px);
    transition: opacity 0.16s ease;
  }
  .ex-overlay.closing { opacity: 0; }
  .ex-modal {
    width: 100%; max-width: 880px; max-height: 82vh;
    display: flex; flex-direction: column;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-modal);
    overflow: hidden;
  }
  .ex-modal-header {
    padding: 18px 22px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid var(--color-border);
    background: linear-gradient(180deg, rgba(59,130,246,0.04) 0%, transparent 100%);
    flex-shrink: 0;
  }
  .ex-modal-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
  .ex-modal-sub { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; font-family: monospace; }
  .ex-xbtn {
    width: 30px; height: 30px; border-radius: var(--radius-sm); cursor: pointer;
    background: rgba(255,255,255,0.03); border: 1px solid var(--color-border);
    color: var(--color-text-muted); display: flex; align-items: center; justify-content: center;
    transition: all var(--transition-base);
  }
  .ex-xbtn:hover { background: rgba(239,68,68,0.12); color: #ef4444; border-color: rgba(239,68,68,0.25); }
  .ex-modal-body { flex: 1; overflow: auto; }
  .ex-preview-table {
    width: 100%; border-collapse: collapse; font-size: 12px;
  }
  .ex-preview-table th {
    position: sticky; top: 0;
    background: var(--color-surface-2);
    border-bottom: 1px solid var(--color-border);
    padding: 10px 14px;
    text-align: left;
    font-size: 10px; font-weight: 700; color: var(--color-text-muted);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .ex-preview-table td {
    padding: 9px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: var(--color-text-secondary);
    max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ex-preview-table tr:hover td { background: rgba(255,255,255,0.02); }
  .ex-modal-footer {
    padding: 12px 22px; border-top: 1px solid var(--color-border);
    font-size: 11px; color: var(--color-text-muted);
    display: flex; justify-content: space-between;
    flex-shrink: 0; background: var(--color-surface-1);
  }

  @media (max-width: 768px) {
    .ex-formats { grid-template-columns: 1fr; }
    .ex-config-grid { grid-template-columns: 1fr; }
    .ex-pagination-wrapper { flex-direction: column; align-items: stretch; }
    .ex-pagination-controls { justify-content: center; }
    .ex-page-numbers { order: -1; justify-content: center; flex-wrap: wrap; }
  }
`;

function injectStyles(id, css) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id; s.textContent = css;
    document.head.appendChild(s);
  }
}

// Preview Modal Component
function PreviewModal({ data, onClose }) {
  const [closing, setClosing] = useState(false);
  const close = () => { setClosing(true); setTimeout(onClose, 160); };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const cols = data.columns?.slice(0, 12) || [];
  const rows = data.data?.slice(0, 50) || [];

  if (cols.length === 0) {
    return (
      <div className={`ex-overlay${closing ? ' closing' : ''}`} onClick={close}>
        <div className="ex-modal" onClick={e => e.stopPropagation()}>
          <div className="ex-modal-header">
            <div className="ex-modal-title">Dataset Preview</div>
            <button className="ex-xbtn" onClick={close}><X size={13} /></button>
          </div>
          <div className="ex-modal-body">
            <div className="ex-empty">
              No structured data to preview. The parsed content may be in text format.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ex-overlay${closing ? ' closing' : ''}`} onClick={close}>
      <div className="ex-modal" onClick={e => e.stopPropagation()}>
        <div className="ex-modal-header">
          <div>
            <div className="ex-modal-title">Dataset Preview</div>
            <div className="ex-modal-sub">{data.rows} rows × {cols.length} columns · {rows.length} rows shown</div>
          </div>
          <button className="ex-xbtn" onClick={close}><X size={13} /></button>
        </div>
        <div className="ex-modal-body" style={{ overflow: 'auto' }}>
          <table className="ex-preview-table">
            <thead>
              <tr>{cols.map(col => <th key={col}>{col}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {cols.map(col => {
                    let value = row[col];
                    if (value === undefined || value === null) value = '';
                    if (typeof value === 'object') value = JSON.stringify(value);
                    return <td key={col} title={String(value)}>{String(value).substring(0, 100)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ex-modal-footer">
          <span>Data will be exported in your selected format</span>
          <span>Use flatten option for nested content</span>
        </div>
      </div>
    </div>
  );
}

// Raw Download Button Component
function RawDownloadButton({ content, jobId, datasetName }) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = datasetName 
      ? `${datasetName.replace(/[^a-z0-9_-]/gi, '_')}_raw.txt`
      : `extracted_${jobId}_${Date.now()}.txt`;
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  return (
    <button onClick={handleDownload} style={{
      background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
      borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: '10px',
      fontWeight: 600, color: 'var(--color-brand)', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: '5px'
    }}><Download size={10} /> Raw</button>
  );
}

// History Item Component
function HistoryItem({ item, onDownload }) {
  const getIconClass = () => {
    const format = item.format?.toLowerCase();
    if (format === 'csv') return 'csv';
    if (format === 'xlsx') return 'xlsx';
    return 'json';
  };
  const getIcon = () => {
    const format = item.format?.toLowerCase();
    if (format === 'csv') return <FileText size={14} />;
    if (format === 'xlsx') return <Database size={14} />;
    return <FileBraces size={14} />;
  };
  return (
    <div className="ex-history-item">
      <div className={`ex-history-ico ${getIconClass()}`}>{getIcon()}</div>
      <div style={{ flex: 1 }}>
        <div className="ex-history-name">{item.name}</div>
        <div className="ex-history-meta">
          {item.format?.toUpperCase()} · {item.size || '0 KB'} · {item.rows?.toLocaleString() || '0'} rows · {new Date(item.date).toLocaleString()}
        </div>
      </div>
      <button className="ex-history-dl" onClick={() => onDownload(item.id)}>
        <Download size={11} /> Download
      </button>
    </div>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, itemsPerPage, onPageChange, onItemsPerPageChange }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...'); pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1); pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1); pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...'); pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1 && itemsPerPage >= 50) return null;

  return (
    <div className="ex-pagination-container">
      <div className="ex-pagination-wrapper">
        <div className="ex-pagination-info">
          <ChevronsLeft size={12} />
          <span>{(currentPage - 1) * itemsPerPage + 1}</span> – 
          <span>{Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)}</span> of 
          <span>{totalPages * itemsPerPage}</span> exports
        </div>
        <div className="ex-pagination-controls">
          <button className="ex-page-nav" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
            <ChevronsLeft size={14} /><span>First</span>
          </button>
          <button className="ex-page-nav" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft size={14} /><span>Prev</span>
          </button>
          <div className="ex-page-numbers">
            {getPageNumbers().map((page, idx) => (
              page === '...' ? <span key={`ellipsis-${idx}`} className="ex-page-ellipsis">…</span> :
              <button key={page} className={`ex-page-number ${currentPage === page ? 'active' : ''}`} onClick={() => onPageChange(page)}>{page}</button>
            ))}
          </div>
          <button className="ex-page-nav" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            <span>Next</span><ChevronRight size={14} />
          </button>
          <button className="ex-page-nav" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
            <span>Last</span><ChevronsRight size={14} />
          </button>
        </div>
        <div className="ex-page-size-selector">
          <label>Show</label>
          <select value={itemsPerPage} onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }}>
            <option value={5}>5 per page</option><option value={8}>8 per page</option><option value={10}>10 per page</option>
            <option value={15}>15 per page</option><option value={20}>20 per page</option><option value={50}>50 per page</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Main Export Component
export default function Export() {
  const [format, setFormat] = useState('csv');
  const [datasetName, setDatasetName] = useState('');
  const [checks, setChecks] = useState({
    headers: true, timestamps: true, nullEmpty: false, flatten: true, compress: false
  });
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [parseResults, setParseResults] = useState([]);
  const [selectedParseResult, setSelectedParseResult] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [encoding, setEncoding] = useState('utf-8');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  injectStyles('export-styles', STYLES);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/api/export/jobs');
      setJobs(response.data);
    } catch (e) { 
      console.error('Error fetching jobs:', e);
      setError('Failed to load jobs');
    }
  };

  const fetchParseResults = async (jobId) => {
    try {
      const response = await api.get(`/api/export/parse-results/${jobId}`);
      setParseResults(response.data);
    } catch (e) { 
      console.error('Error fetching parse results:', e);
      setError('Failed to load parse results');
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/export/history');
      setHistory(response.data);
    } catch (e) { 
      console.error('Error fetching history:', e);
      setError('Failed to load export history');
    }
  };

  useEffect(() => { fetchJobs(); fetchHistory(); }, []);
  useEffect(() => { setCurrentPage(1); }, [history, itemsPerPage]);
  useEffect(() => {
    if (selectedJob) {
      fetchParseResults(selectedJob);
      const job = jobs.find(j => j.id === selectedJob);
      if (job) setDatasetName(job.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase());
    } else {
      setParseResults([]);
      setSelectedParseResult('');
    }
  }, [selectedJob, jobs]);

  const totalPages = Math.max(1, Math.ceil(history.length / itemsPerPage));
  const paginatedHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleCheck = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  const handleExport = async () => {
    if (!selectedJob) { setError('Please select a job with parsed content to export'); return; }
    if (!datasetName.trim()) { setError('Please enter a dataset name'); return; }
    setLoading(true); setError(null);
    try {
      const response = await api.post('/api/export/generate', {
        format, job_id: selectedJob, parse_result_id: selectedParseResult || null,
        date_range: dateRange, filter_status: 'all', encoding,
        dataset_name: datasetName, options: checks
      }, {
        responseType: 'blob'
      });
      
      const blob = response.data;
      const cd = response.headers['content-disposition'];
      let filename = `${datasetName}_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.${format === 'xlsx' ? 'xlsx' : format}`;
      if (cd) { const m = cd.match(/filename=(.+)/); if (m) filename = m[1]; }
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
      await fetchHistory();
    } catch (e) { 
      setError('Export failed. Please try again.');
    } finally { 
      setLoading(false); 
    }
  };

  const handlePreview = async () => {
    if (!selectedJob) { setError('Please select a job to preview'); return; }
    setLoading(true); setError(null);
    try {
      const response = await api.get(`/api/export/preview/${selectedJob}`);
      setPreviewData(response.data);
    } catch (e) { 
      setError('Failed to load preview.');
    } finally { 
      setLoading(false); 
    }
  };

  const handleDownloadHistory = async (exportId) => {
    try {
      const response = await api.get(`/api/export/download/${exportId}`, {
        responseType: 'blob'
      });
      const blob = response.data;
      const cd = response.headers['content-disposition'];
      let filename = 'export.zip';
      if (cd) { const m = cd.match(/filename=(.+)/); if (m) filename = m[1]; }
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (e) { 
      setError('Failed to download export'); 
    }
  };

  const formats = [
    { id: 'csv', iconClass: 'green', name: 'CSV', desc: 'Comma-separated values. Universal compatibility.' },
    { id: 'xlsx', iconClass: 'blue', name: 'Excel', desc: 'Formatted spreadsheet with parsed content.' },
    { id: 'json', iconClass: 'purple', name: 'JSON', desc: 'Structured data for APIs and developers.' }
  ];

  const checkItems = [
    ['headers', 'Include column headers'],
    ['timestamps', 'Include creation timestamps'],
    ['nullEmpty', 'Replace null with empty string'],
    ['flatten', 'Flatten nested content fields'],
    ['compress', 'Compress output as ZIP archive']
  ];

  return (
    <div className="ex-root page-enter" style={{ fontFamily: 'var(--font-sans)' }}>
      {error && (
        <div className="error-alert">
          <AlertCircle size={15} /><span>{error}</span>
          <button onClick={() => setError(null)}><X size={13} /></button>
        </div>
      )}

      {/* Format Selection Cards */}
      <div className="ex-formats">
        {formats.map(f => {
          const Icon = f.id === 'csv' ? FileText : f.id === 'xlsx' ? Database : FileBraces;
          return (
            <div key={f.id} className={`ex-format-card${format === f.id ? ' selected' : ''}`} onClick={() => setFormat(f.id)}>
              <div className={`ex-format-ico ${f.iconClass}`}><Icon size={15} /></div>
              <div className="ex-format-name">{f.name}</div>
              <div className="ex-format-desc">{f.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Configuration Panel */}
      <div className="ex-config">
        <div className="ex-config-title">Export Configuration</div>
        <div className="ex-config-grid">
          <div className="form-group">
            <label className="form-label">Select Job</label>
            <select className="form-input" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
              <option value="">-- Select a job --</option>
              {jobs.map(job => <option key={job.id} value={job.id}>{job.name} ({job.records || 0} results)</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Dataset Name</label>
            <input type="text" className="dataset-name-input" value={datasetName} onChange={e => setDatasetName(e.target.value)} placeholder="e.g., customer_reviews_dataset" />
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>Files will be named: {datasetName || 'dataset'}_YYYY-MM-DD_HH-MM-SS.{format === 'xlsx' ? 'xlsx' : format}</div>
          </div>
        </div>
        <div className="ex-config-grid" style={{ marginTop: 16 }}>
          <div className="form-group">
            <label className="form-label">Date Range</label>
            <select className="form-input" value={dateRange} onChange={e => setDateRange(e.target.value)}>
              <option value="all">All parsed results</option>
              <option value="last_24h">Last 24 hours</option>
              <option value="last_7d">Last 7 days</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">File Encoding</label>
            <select className="form-input" value={encoding} onChange={e => setEncoding(e.target.value)}>
              <option value="utf-8">UTF-8</option>
              <option value="utf-8-sig">UTF-8 with BOM</option>
              <option value="latin-1">Latin-1</option>
            </select>
          </div>
        </div>

        {/* Parse Results Section */}
        {parseResults.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <label className="form-label">Parse Result (Optional)</label>
            <div className="parse-results-list">
              {parseResults.map(result => (
                <div key={result.id} className={`parse-result-item${selectedParseResult === result.id ? ' selected' : ''}`} onClick={() => setSelectedParseResult(selectedParseResult === result.id ? '' : result.id)}>
                  <div className="parse-result-desc">{result.parse_description}</div>
                  <div className="parse-result-date">{result.created_at ? new Date(result.created_at).toLocaleString() : 'Unknown date'}</div>
                  <div className="parse-result-preview">{result.preview || (typeof result.parsed_content === 'string' ? result.parsed_content.substring(0, 100) : JSON.stringify(result.parsed_content).substring(0, 100))}...</div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                    <RawDownloadButton content={typeof result.parsed_content === 'string' ? result.parsed_content : JSON.stringify(result.parsed_content)} jobId={selectedJob} datasetName={datasetName} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>{selectedParseResult ? 'Exporting specific parse result' : 'Exporting all parse results for this job'}</div>
          </div>
        )}

        {/* Checkbox Options */}
        <div style={{ marginTop: 20 }}>
          <div className="form-label" style={{ marginBottom: 10 }}>Export Options</div>
          {checkItems.map(([key, label]) => (
            <div className="ex-check-row" key={key} onClick={() => toggleCheck(key)}>
              <div className={`ex-check-box${checks[key] ? ' checked' : ''}`} />
              <span className="ex-check-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn-sm btn-ghost" onClick={handlePreview} disabled={loading || !selectedJob}>
            <Eye size={12} /> Preview ({parseResults.length} results)
          </button>
          <button className="btn-sm btn-primary" onClick={handleExport} disabled={loading || !selectedJob}>
            <Download size={12} /> {loading ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
          </button>
        </div>
      </div>

      {/* Export History Section */}
      <div className="section-header" style={{ marginBottom: 16, marginTop: 8 }}>
        <div className="section-title-sm">Export History</div>
        <button className="btn-sm btn-ghost" onClick={fetchHistory}><RefreshCw size={12} /> Refresh</button>
      </div>

      {history.length === 0 ? (
        <div className="ex-empty">
          <div className="empty-icon"><Download size={20} /></div>
          <div>No exports yet</div>
          <div className="section-sub-sm" style={{ marginTop: 4 }}>Export your parsed content above to see it here</div>
        </div>
      ) : (
        <>
          {paginatedHistory.map(item => <HistoryItem key={item.id} item={item} onDownload={handleDownloadHistory} />)}
          <Pagination currentPage={currentPage} totalPages={totalPages} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
        </>
      )}

      {previewData && <PreviewModal data={previewData} onClose={() => setPreviewData(null)} />}
    </div>
  );
}