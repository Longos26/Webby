// frontend/src/pages/ExportTab.jsx - MongoDB Atlas Enterprise Edition

import { useState, useEffect } from 'react';
import { 
  FileBraces, Download, RefreshCw, FileText, X, AlertCircle, Eye, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Database,
  Calendar, Hash, HardDrive, Zap, CheckCircle2, FileJson, Table
} from 'lucide-react';
import api from '../api';

// ============================================================
// MONGODB ATLAS ENTERPRISE DESIGN SYSTEM
// ============================================================

const STYLES = `
  /* Enterprise Design Tokens - MongoDB Atlas Inspired */
  .ex-root {
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
    
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Courier New", monospace;
    
    --transition: 120ms cubic-bezier(0.2, 0.8, 0.4, 1);
  }

  /* Base Reset */
  .ex-root * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Typography */
  .ex-root {
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    background: var(--color-canvas);
    line-height: 1.5;
  }

  /* Animations - Subtle Only */
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .page-enter {
    animation: fadeSlideIn 0.2s ease-out;
  }

  .spin {
    animation: spin 0.6s linear infinite;
  }

  /* Section Headers - Linear Style */
  .section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border);
  }
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--color-text-primary);
  }
  
  .section-badge {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
    background: var(--color-surface);
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid var(--color-border-subtle);
  }

  /* Buttons - Clean Enterprise */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all var(--transition);
    border: none;
    background: none;
  }
  
  .btn-primary {
    background: var(--color-mdb-green);
    color: #0D1117;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--color-mdb-green-dark);
    transform: translateY(-1px);
  }
  
  .btn-secondary {
    background: var(--color-surface);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
  
  .btn-ghost {
    color: var(--color-text-secondary);
  }
  
  .btn-ghost:hover:not(:disabled) {
    color: var(--color-text-primary);
    background: rgba(255, 255, 255, 0.04);
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-sm {
    padding: 5px 12px;
    font-size: 12px;
    gap: 6px;
  }

  /* Cards - Solid, Border Only */
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: var(--shadow-sm);
  }
  
  .card-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border-subtle);
  }
  
  .card-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }
  
  .card-description {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  /* Form Elements - Dark Inputs, Clear Labels */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .form-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    letter-spacing: -0.01em;
  }
  
  .form-input, .form-select {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 8px 12px;
    font-size: 13px;
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    outline: none;
    transition: all var(--transition);
  }
  
  .form-input:focus, .form-select:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 2px rgba(0, 237, 100, 0.1);
  }
  
  .form-input::placeholder {
    color: var(--color-text-muted);
  }

  /* Alert */
  .alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
    font-size: 13px;
  }
  
  .alert-error {
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.3);
    color: var(--color-error);
  }
  
  .alert-close {
    margin-left: auto;
    background: none;
    border: none;
    color: currentColor;
    cursor: pointer;
    opacity: 0.7;
    padding: 4px;
  }
  
  .alert-close:hover {
    opacity: 1;
  }

  /* Format Grid */
  .format-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .format-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 16px;
    cursor: pointer;
    transition: all var(--transition);
  }
  
  .format-card:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
  }
  
  .format-card.selected {
    border-color: var(--color-mdb-green);
    background: var(--color-accent-dim);
  }
  
  .format-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }
  
  .format-icon.csv { background: rgba(0, 237, 100, 0.1); color: var(--color-mdb-green); }
  .format-icon.xlsx { background: rgba(88, 166, 255, 0.1); color: var(--color-info); }
  .format-icon.json { background: rgba(210, 153, 34, 0.1); color: var(--color-warning); }
  
  .format-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .format-desc {
    font-size: 11px;
    color: var(--color-text-muted);
    line-height: 1.4;
  }

  /* Config Panel */
  .config-panel {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    margin-bottom: 24px;
    overflow: hidden;
  }
  
  .config-panel-header {
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid var(--color-border);
  }
  
  .config-panel-title {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }
  
  .config-panel-body {
    padding: 20px;
  }
  
  .config-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  /* Checkboxes */
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }
  
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 4px 0;
  }
  
  .checkbox-box {
    width: 16px;
    height: 16px;
    border: 1px solid var(--color-border);
    border-radius: 3px;
    background: var(--color-canvas);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
  }
  
  .checkbox-box.checked {
    background: var(--color-mdb-green);
    border-color: var(--color-mdb-green);
  }
  
  .checkbox-box.checked::after {
    content: '';
    width: 8px;
    height: 8px;
    background: #0D1117;
    border-radius: 1px;
  }
  
  .checkbox-label {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  /* Parse Results List - Table Style */
  .results-list {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  
  .result-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border-subtle);
    cursor: pointer;
    transition: background var(--transition);
  }
  
  .result-item:last-child {
    border-bottom: none;
  }
  
  .result-item:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .result-item.selected {
    background: var(--color-accent-dim);
    border-left: 2px solid var(--color-mdb-green);
  }
  
  .result-info {
    flex: 1;
  }
  
  .result-title {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .result-meta {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
  
  .result-preview {
    font-size: 11px;
    color: var(--color-text-secondary);
    margin-top: 6px;
    font-family: var(--font-mono);
    opacity: 0.7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 300px;
  }

  /* History Items */
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .history-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: all var(--transition);
  }
  
  .history-item:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
  }
  
  .history-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .history-icon.csv { background: rgba(0, 237, 100, 0.1); color: var(--color-mdb-green); }
  .history-icon.xlsx { background: rgba(88, 166, 255, 0.1); color: var(--color-info); }
  .history-icon.json { background: rgba(210, 153, 34, 0.1); color: var(--color-warning); }
  
  .history-details {
    flex: 1;
  }
  
  .history-name {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .history-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 11px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }
  
  .empty-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
  }

  /* Preview Modal - Clean Overlay */
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(13, 17, 23, 0.92);
    backdrop-filter: blur(4px);
  }
  
  .modal {
    width: 100%;
    max-width: 900px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
  }
  
  .modal-header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border);
  }
  
  .modal-title {
    font-size: 14px;
    font-weight: 600;
  }
  
  .modal-subtitle {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-top: 2px;
    font-family: var(--font-mono);
  }
  
  .modal-close {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
  }
  
  .modal-close:hover {
    background: rgba(248, 81, 73, 0.1);
    border-color: var(--color-error);
    color: var(--color-error);
  }
  
  .modal-body {
    flex: 1;
    overflow: auto;
    padding: 0;
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  
  .data-table th {
    position: sticky;
    top: 0;
    background: var(--color-surface-elevated);
    padding: 10px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 1px solid var(--color-border);
  }
  
  .data-table td {
    padding: 8px 14px;
    border-bottom: 1px solid var(--color-border-subtle);
    color: var(--color-text-secondary);
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .data-table tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .modal-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--color-border);
    font-size: 11px;
    color: var(--color-text-muted);
    display: flex;
    justify-content: space-between;
    background: var(--color-surface);
  }

  /* Pagination */
  .pagination-container {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }
  
  .pagination-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .pagination-info {
    font-size: 12px;
    color: var(--color-text-muted);
    background: var(--color-surface);
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid var(--color-border);
  }
  
  .pagination-info strong {
    color: var(--color-mdb-green);
    font-weight: 600;
  }
  
  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .page-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
  }
  
  .page-btn:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
  
  .page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .page-number {
    min-width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
  }
  
  .page-number:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
  
  .page-number.active {
    background: var(--color-accent-dim);
    border-color: var(--color-mdb-green);
    color: var(--color-mdb-green);
  }
  
  .page-size-select {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--color-surface);
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid var(--color-border);
  }
  
  .page-size-select label {
    font-size: 11px;
    color: var(--color-text-muted);
  }
  
  .page-size-select select {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 4px 8px;
    font-size: 11px;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .format-grid {
      grid-template-columns: 1fr;
    }
    .config-grid {
      grid-template-columns: 1fr;
    }
    .pagination-wrapper {
      flex-direction: column;
      align-items: stretch;
    }
    .pagination-controls {
      justify-content: center;
      flex-wrap: wrap;
    }
    .result-preview {
      max-width: 180px;
    }
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
// PREVIEW MODAL COMPONENT
// ============================================================

function PreviewModal({ data, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const columns = data.columns?.slice(0, 10) || [];
  const rows = data.data?.slice(0, 50) || [];

  if (columns.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <div className="modal-title">Data Preview</div>
              <div className="modal-subtitle">No structured data available</div>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
          <div className="modal-body">
            <div className="empty-state" style={{ margin: 20 }}>
              <p>The selected parse result contains unstructured or preview-unavailable content.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Dataset Preview</div>
            <div className="modal-subtitle">
              {data.rows?.toLocaleString()} rows · {columns.length} columns · Showing first {rows.length} rows
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="modal-body">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => {
                    let value = row[col];
                    if (value === undefined || value === null) value = '';
                    if (typeof value === 'object') value = JSON.stringify(value);
                    return (
                      <td key={col} title={String(value)}>
                        {String(value).substring(0, 80)}
                        {String(value).length > 80 ? '…' : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <span>Preview data only</span>
          <span>Actual export will include all data</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HISTORY ITEM COMPONENT
// ============================================================

function HistoryItem({ item, onDownload }) {
  const getFormatIcon = () => {
    const format = item.format?.toLowerCase();
    if (format === 'csv') return <Table size={16} />;
    if (format === 'xlsx') return <Database size={16} />;
    return <FileJson size={16} />;
  };
  
  const getFormatClass = () => {
    const format = item.format?.toLowerCase();
    if (format === 'csv') return 'csv';
    if (format === 'xlsx') return 'xlsx';
    return 'json';
  };
  
  return (
    <div className="history-item">
      <div className={`history-icon ${getFormatClass()}`}>
        {getFormatIcon()}
      </div>
      <div className="history-details">
        <div className="history-name">{item.name}</div>
        <div className="history-meta">
          <span>{item.format?.toUpperCase()}</span>
          <span>•</span>
          <span>{item.size || '0 KB'}</span>
          <span>•</span>
          <span>{item.rows?.toLocaleString() || 0} rows</span>
          <span>•</span>
          <span>{new Date(item.date).toLocaleDateString()}</span>
        </div>
      </div>
      <button className="btn btn-sm btn-secondary" onClick={() => onDownload(item.id)}>
        <Download size={12} /> Download
      </button>
    </div>
  );
}

// ============================================================
// PAGINATION COMPONENT
// ============================================================

function Pagination({ currentPage, totalPages, itemsPerPage, onPageChange, onItemsPerPageChange }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push(null);
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push(null);
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push(null);
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push(null);
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  if (totalPages <= 1 && itemsPerPage >= 50) return null;
  
  return (
    <div className="pagination-container">
      <div className="pagination-wrapper">
        <div className="pagination-info">
          <span>Showing </span>
          <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>
          <span> – </span>
          <strong>{Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)}</strong>
          <span> of </span>
          <strong>{totalPages * itemsPerPage}</strong>
          <span> exports</span>
        </div>
        
        <div className="pagination-controls">
          <button
            className="page-btn"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft size={12} /> First
          </button>
          <button
            className="page-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={12} /> Prev
          </button>
          
          {getPageNumbers().map((page, idx) => (
            page === null ? (
              <span key={`ellipsis-${idx}`} className="page-number" style={{ border: 'none', background: 'transparent' }}>
                …
              </span>
            ) : (
              <button
                key={page}
                className={`page-number ${currentPage === page ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            )
          ))}
          
          <button
            className="page-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight size={12} />
          </button>
          <button
            className="page-btn"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last <ChevronsRight size={12} />
          </button>
        </div>
        
        <div className="page-size-select">
          <label>Rows per page:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
          >
            <option value={5}>5</option>
            <option value={8}>8</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RAW DOWNLOAD BUTTON
// ============================================================

function RawDownloadButton({ content, jobId, datasetName }) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = datasetName
      ? `${datasetName.replace(/[^a-z0-9_-]/gi, '_')}_raw.txt`
      : `extracted_${jobId}_${Date.now()}.txt`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <button
      onClick={handleDownload}
      className="btn btn-sm btn-ghost"
      style={{ fontSize: 10, padding: '3px 8px' }}
    >
      <Download size={10} /> Raw
    </button>
  );
}

// ============================================================
// MAIN EXPORT COMPONENT
// ============================================================

export default function Export() {
  const [format, setFormat] = useState('csv');
  const [datasetName, setDatasetName] = useState('');
  const [options, setOptions] = useState({
    headers: true,
    timestamps: true,
    nullEmpty: false,
    flatten: true,
    compress: false,
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
  
  // API Calls
  const fetchJobs = async () => {
    try {
      const response = await api.get('/api/export/jobs');
      setJobs(response.data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Unable to load jobs');
    }
  };
  
  const fetchParseResults = async (jobId) => {
    try {
      const response = await api.get(`/api/export/parse-results/${jobId}`);
      setParseResults(response.data);
    } catch (err) {
      console.error('Failed to fetch parse results:', err);
      setError('Unable to load parse results');
    }
  };
  
  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/export/history');
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Unable to load export history');
    }
  };
  
  // Effects
  useEffect(() => {
    fetchJobs();
    fetchHistory();
  }, []);
  
  useEffect(() => {
    if (selectedJob) {
      fetchParseResults(selectedJob);
      const job = jobs.find(j => j.id === selectedJob);
      if (job) {
        const sanitizedName = job.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        setDatasetName(sanitizedName);
      }
    } else {
      setParseResults([]);
      setSelectedParseResult('');
    }
  }, [selectedJob, jobs]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [history, itemsPerPage]);
  
  // Computed values
  const totalPages = Math.max(1, Math.ceil(history.length / itemsPerPage));
  const paginatedHistory = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handlers
  const toggleOption = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const handleExport = async () => {
    if (!selectedJob) {
      setError('Please select a job with parsed content to export');
      return;
    }
    if (!datasetName.trim()) {
      setError('Please enter a dataset name');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(
        '/api/export/generate',
        {
          format,
          job_id: selectedJob,
          parse_result_id: selectedParseResult || null,
          date_range: dateRange,
          filter_status: 'all',
          encoding,
          dataset_name: datasetName,
          options,
        },
        { responseType: 'blob' }
      );
      
      const blob = response.data;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${datasetName}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format === 'xlsx' ? 'xlsx' : format}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/);
        if (match) filename = match[1];
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      await fetchHistory();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePreview = async () => {
    if (!selectedJob) {
      setError('Please select a job to preview');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/export/preview/${selectedJob}`);
      setPreviewData(response.data);
    } catch (err) {
      console.error('Preview failed:', err);
      setError('Failed to load preview data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadHistory = async (exportId) => {
    try {
      const response = await api.get(`/api/export/download/${exportId}`, {
        responseType: 'blob',
      });
      
      const blob = response.data;
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'export.zip';
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/);
        if (match) filename = match[1];
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download export');
    }
  };
  
  // Format options
  const formats = [
    { id: 'csv', name: 'CSV', desc: 'Comma-separated values. Universal compatibility.', icon: 'csv' },
    { id: 'xlsx', name: 'Excel', desc: 'Formatted spreadsheet with parsed content.', icon: 'xlsx' },
    { id: 'json', name: 'JSON', desc: 'Structured data for APIs and developers.', icon: 'json' },
  ];
  
  const optionItems = [
    { key: 'headers', label: 'Include column headers' },
    { key: 'timestamps', label: 'Include creation timestamps' },
    { key: 'nullEmpty', label: 'Replace null with empty string' },
    { key: 'flatten', label: 'Flatten nested content fields' },
    { key: 'compress', label: 'Compress output as ZIP archive' },
  ];
  
  return (
    <div className="ex-root page-enter">
      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}
      
      {/* Format Selection */}
      <div className="format-grid">
        {formats.map((f) => {
          const Icon = f.id === 'csv' ? Table : f.id === 'xlsx' ? Database : FileJson;
          return (
            <div
              key={f.id}
              className={`format-card ${format === f.id ? 'selected' : ''}`}
              onClick={() => setFormat(f.id)}
            >
              <div className={`format-icon ${f.icon}`}>
                <Icon size={18} />
              </div>
              <div className="format-name">{f.name}</div>
              <div className="format-desc">{f.desc}</div>
            </div>
          );
        })}
      </div>
      
      {/* Configuration Panel */}
      <div className="config-panel">
        <div className="config-panel-header">
          <div className="config-panel-title">Export Configuration</div>
        </div>
        <div className="config-panel-body">
          <div className="config-grid">
            <div className="form-group">
              <label className="form-label">Select Job</label>
              <select
                className="form-select"
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
              >
                <option value="">— Select a job —</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.name} ({job.records || 0} records)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Dataset Name</label>
              <input
                type="text"
                className="form-input"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="e.g., customer_reviews_2024"
              />
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                Filename: {datasetName || 'dataset'}_YYYY-MM-DD_HH-MM-SS.{format === 'xlsx' ? 'xlsx' : format}
              </div>
            </div>
          </div>
          
          <div className="config-grid">
            <div className="form-group">
              <label className="form-label">Date Range</label>
              <select
                className="form-select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">All parsed results</option>
                <option value="last_24h">Last 24 hours</option>
                <option value="last_7d">Last 7 days</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">File Encoding</label>
              <select
                className="form-select"
                value={encoding}
                onChange={(e) => setEncoding(e.target.value)}
              >
                <option value="utf-8">UTF-8</option>
                <option value="utf-8-sig">UTF-8 with BOM</option>
                <option value="latin-1">Latin-1 (ISO-8859-1)</option>
              </select>
            </div>
          </div>
          
          {/* Parse Results */}
          {parseResults.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ marginBottom: 8 }}>Parse Result (Optional)</label>
              <div className="results-list">
                {parseResults.map((result) => (
                  <div
                    key={result.id}
                    className={`result-item ${selectedParseResult === result.id ? 'selected' : ''}`}
                    onClick={() => setSelectedParseResult(selectedParseResult === result.id ? '' : result.id)}
                  >
                    <div className="result-info">
                      <div className="result-title">{result.parse_description}</div>
                      <div className="result-meta">
                        <span>
                          {result.created_at ? new Date(result.created_at).toLocaleString() : 'Unknown date'}
                        </span>
                      </div>
                      <div className="result-preview">
                        {result.preview ||
                          (typeof result.parsed_content === 'string'
                            ? result.parsed_content.substring(0, 100)
                            : JSON.stringify(result.parsed_content).substring(0, 100))}
                        …
                      </div>
                    </div>
                    <RawDownloadButton
                      content={
                        typeof result.parsed_content === 'string'
                          ? result.parsed_content
                          : JSON.stringify(result.parsed_content)
                      }
                      jobId={selectedJob}
                      datasetName={datasetName}
                    />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                {selectedParseResult
                  ? 'Exporting specific parse result only'
                  : 'Exporting all parse results for this job'}
              </div>
            </div>
          )}
          
          {/* Export Options */}
          <div>
            <label className="form-label" style={{ marginBottom: 8 }}>Export Options</label>
            <div className="checkbox-group">
              {optionItems.map((item) => (
                <div
                  key={item.key}
                  className="checkbox-item"
                  onClick={() => toggleOption(item.key)}
                >
                  <div className={`checkbox-box ${options[item.key] ? 'checked' : ''}`} />
                  <span className="checkbox-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePreview}
              disabled={loading || !selectedJob}
            >
              <Eye size={12} /> Preview
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleExport}
              disabled={loading || !selectedJob}
            >
              {loading ? (
                <>
                  <div className="spin">↻</div> Exporting...
                </>
              ) : (
                <>
                  <Download size={12} /> Export as {format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Export History */}
      <div className="section-header">
        <div className="section-title">Export History</div>
        <button className="btn btn-ghost btn-sm" onClick={fetchHistory}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      
      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Download size={20} />
          </div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>No exports yet</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Export your parsed content above to see it here
          </div>
        </div>
      ) : (
        <>
          <div className="history-list">
            {paginatedHistory.map((item) => (
              <HistoryItem key={item.id} item={item} onDownload={handleDownloadHistory} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}
      
      {/* Preview Modal */}
      {previewData && <PreviewModal data={previewData} onClose={() => setPreviewData(null)} />}
    </div>
  );
}