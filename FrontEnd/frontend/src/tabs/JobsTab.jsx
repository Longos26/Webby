// frontend/src/pages/JobsTab.jsx - REFINED ENTERPRISE DESIGN

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Briefcase, Play, Eye, AlertCircle,
  Pause, Trash2, RefreshCw, X, Loader,
  Database, Link as LinkIcon, Calendar, Activity,
  CheckCircle, Zap, Brain,
  AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock, Hash, Server, Menu
} from 'lucide-react';
import api from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import ParsingPanel from '../components/ParsingPanel';

// ============================================================
// STYLES - REFINED ENTERPRISE
// ============================================================

const STYLES = `
  /* Enterprise Design Tokens - Refined */
  .jobs-root {
    --color-mdb-green: #00ED64;
    --color-mdb-green-dark: #00C355;
    --color-canvas: #0D1117;
    --color-surface: #161B22;
    --color-surface-elevated: #1F242E;
    --color-border: #30363D;
    --color-border-subtle: #21262D;
    --color-text-primary: #F0F6FC;
    --color-text-secondary: #9BA4B0;
    --color-text-muted: #6E7681;
    --color-success: #00ED64;
    --color-warning: #D29922;
    --color-error: #F85149;
    --color-info: #58A6FF;
    --color-accent-dim: rgba(0, 237, 100, 0.06);
    --color-accent-border: rgba(0, 237, 100, 0.12);
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25);
    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-full: 9999px;
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Courier New", monospace;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .jobs-root * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .jobs-root {
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    background: var(--color-canvas);
    line-height: 1.5;
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.95); }
  }

  .page-enter {
    animation: fadeSlideIn 0.2s ease-out;
  }

  .spin {
    animation: spin 0.6s linear infinite;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    gap: 14px;
  }

  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-mdb-green);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 500;
    font-family: var(--font-mono);
  }
  
  .status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }
  
  .status-pill.running {
    background: var(--status-info-bg);
    color: var(--color-info);
    border: 1px solid var(--status-info-border);
  }
  .status-pill.running .status-dot {
    background: var(--color-info);
    animation: pulse-dot 1.5s infinite;
  }
  
  .status-pill.success {
    background: var(--status-success-bg);
    color: var(--color-success);
    border: 1px solid var(--status-success-border);
  }
  .status-pill.success .status-dot {
    background: var(--color-success);
  }
  
  .status-pill.failed {
    background: var(--status-error-bg);
    color: var(--color-error);
    border: 1px solid var(--status-error-border);
  }
  .status-pill.failed .status-dot {
    background: var(--color-error);
  }
  
  .status-pill.paused {
    background: var(--status-warning-bg);
    color: var(--color-warning);
    border: 1px solid var(--status-warning-border);
  }
  .status-pill.paused .status-dot {
    background: var(--color-warning);
  }
  
  .status-pill.queued {
    background: rgba(139, 148, 158, 0.06);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }
  .status-pill.queued .status-dot {
    background: var(--color-text-muted);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: var(--radius-md);
    font-size: 12px;
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
    box-shadow: 0 4px 16px rgba(0, 237, 100, 0.2);
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
  
  .btn-sm {
    padding: 5px 10px;
    font-size: 11px;
    gap: 5px;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .table-container {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  
  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .table-title {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  
  .job-count {
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-muted);
    background: var(--color-canvas);
    padding: 3px 10px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }
  
  .filter-group {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }
  
  .filter-chip {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    white-space: nowrap;
  }
  
  .filter-chip:hover {
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
  
  .filter-chip.active {
    background: var(--color-accent-dim);
    border-color: var(--color-mdb-green);
    color: var(--color-mdb-green);
  }
  
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .jobs-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 650px;
  }
  
  .jobs-table th {
    text-align: left;
    padding: 10px 14px;
    font-size: 10px;
    font-weight: 600;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }
  
  .jobs-table td {
    padding: 12px 14px;
    font-size: 12px;
    border-bottom: 1px solid var(--color-border-subtle);
    vertical-align: middle;
  }
  
  .jobs-table tr:last-child td {
    border-bottom: none;
  }
  
  .jobs-table tbody tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .mono-text {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
  }
  
  .url-cell {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
  }
  
  .progress-container {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 70px;
  }
  
  .progress-bar {
    flex: 1;
    height: 3px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: var(--radius-full);
    overflow: hidden;
    min-width: 30px;
  }
  
  .progress-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 0.5s ease-in-out;
  }
  
  .progress-text {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-muted);
    min-width: 32px;
  }
  
  .action-group {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition);
  }
  
  .action-btn:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
  
  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .action-btn.danger:hover:not(:disabled) {
    border-color: var(--color-error);
    color: var(--color-error);
    background: var(--status-error-bg);
  }

  .pagination-container {
    padding: 12px 18px;
    border-top: 1px solid var(--color-border);
  }
  
  .pagination-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .pagination-info {
    font-size: 11px;
    color: var(--color-text-muted);
    background: var(--color-canvas);
    padding: 4px 10px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }
  
  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-wrap: wrap;
  }
  
  .page-btn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 5px 10px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 11px;
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
    min-width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 11px;
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

  .form-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .form-group.full-width {
    grid-column: 1 / -1;
  }
  
  .form-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  
  .form-input {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 8px 12px;
    font-size: 14px;
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    outline: none;
    transition: all var(--transition);
  }
  
  .form-input:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 2px rgba(0, 237, 100, 0.06);
  }
  
  .form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
    flex-wrap: wrap;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(13, 17, 23, 0.92);
    backdrop-filter: blur(8px);
  }
  
  .modal {
    width: 100%;
    max-width: 540px;
    max-height: 90vh;
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  
  .modal-body {
    padding: 14px 18px;
    overflow-y: auto;
    flex: 1;
  }
  
  .modal-footer {
    padding: 14px 18px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .tab-btn {
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 500;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    white-space: nowrap;
  }

  .tab-btn:hover {
    color: var(--color-text-primary);
  }

  .tab-btn.active {
    color: var(--color-mdb-green);
    border-bottom-color: var(--color-mdb-green);
  }

  /* Responsive Breakpoints */
  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .pagination-wrapper {
      flex-direction: column;
      align-items: stretch;
    }
    
    .pagination-controls {
      justify-content: center;
    }
    
    .table-header {
      flex-direction: column;
      align-items: stretch;
    }
    
    .table-title {
      flex-direction: column;
      align-items: stretch;
    }
    
    .filter-group {
      justify-content: center;
    }
    
    .jobs-table th,
    .jobs-table td {
      padding: 8px 10px;
      font-size: 11px;
    }
    
    .action-group {
      gap: 2px;
    }
    
    .action-btn {
      width: 26px;
      height: 26px;
    }
    
    .action-btn svg {
      width: 12px;
      height: 12px;
    }
    
    .page-btn span {
      display: none;
    }
    
    .modal {
      max-width: 100%;
      margin: 0 8px;
      max-height: 95vh;
    }
    
    .modal-header {
      padding: 12px 14px;
    }
    
    .modal-body {
      padding: 12px 14px;
    }
    
    .modal-footer {
      padding: 12px 14px;
    }

    .form-card {
      padding: 14px;
    }

    .jobs-table {
      min-width: 450px;
    }

    .url-cell {
      max-width: 100px;
    }

    .progress-container {
      min-width: 60px;
    }

    .progress-text {
      font-size: 9px;
      min-width: 28px;
    }
  }

  @media (max-width: 480px) {
    .table-header {
      padding: 10px 12px;
    }
    
    .jobs-table th,
    .jobs-table td {
      padding: 6px 8px;
      font-size: 10px;
    }
    
    .filter-chip {
      font-size: 9px;
      padding: 3px 8px;
    }
    
    .pagination-info {
      font-size: 10px;
      padding: 3px 8px;
    }
    
    .page-number {
      min-width: 26px;
      height: 26px;
      font-size: 10px;
    }
    
    .page-btn {
      padding: 3px 6px;
      font-size: 10px;
    }

    .action-btn {
      width: 24px;
      height: 24px;
    }

    .action-btn svg {
      width: 11px;
      height: 11px;
    }

    .jobs-table {
      min-width: 350px;
    }

    .url-cell {
      max-width: 70px;
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
// STATUS PILL COMPONENT
// ============================================================

function StatusPill({ status }) {
  const statusMap = {
    running: { label: 'Running', class: 'running' },
    success: { label: 'Success', class: 'success' },
    completed: { label: 'Completed', class: 'success' },
    failed: { label: 'Failed', class: 'failed' },
    paused: { label: 'Paused', class: 'paused' },
    queued: { label: 'Queued', class: 'queued' },
  };
  
  const s = statusMap[status?.toLowerCase()] || statusMap.queued;
  
  return (
    <span className={`status-pill ${s.class}`}>
      <span className="status-dot" />
      {s.label}
    </span>
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
          <ChevronsLeft size={11} />
          <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>
          <span>–</span>
          <strong>{Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)}</strong>
          <span>of</span>
          <strong>{totalPages * itemsPerPage}</strong>
        </div>
        
        <div className="pagination-controls">
          <button className="page-btn" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
            <ChevronsLeft size={11} /> <span>First</span>
          </button>
          <button className="page-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft size={11} /> <span>Prev</span>
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
          
          <button className="page-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            <span>Next</span> <ChevronRight size={11} />
          </button>
          <button className="page-btn" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
            <span>Last</span> <ChevronsRight size={11} />
          </button>
        </div>
        
        <div className="page-size-select" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-canvas)', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
          <label style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Rows:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '3px 6px', fontSize: '10px', color: 'var(--color-text-primary)', cursor: 'pointer' }}
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
// DELETE CONFIRMATION MODAL
// ============================================================

function DeleteConfirmModal({ jobName, onCancel, onConfirm, deleting }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--status-error-bg)', border: '1px solid var(--status-error-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-error)', flexShrink: 0 }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>Delete Job</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>This action cannot be undone</div>
          </div>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            You are about to permanently delete:
          </p>
          <div style={{ display: 'inline-block', background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', fontFamily: 'var(--font-mono)', fontSize: '12px', marginTop: '6px', wordBreak: 'break-all' }}>
            {jobName}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px' }}>
            <AlertTriangle size={11} />
            All scraped data and configurations will be lost
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--status-error-bg)', color: 'var(--color-error)', border: '1px solid var(--status-error-border)' }}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? <Loader size={11} className="spin" /> : <Trash2 size={11} />}
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// JOB DETAILS MODAL
// ============================================================

function JobDetailsModal({ job, onClose }) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  
  useEffect(() => {
    if (job?.id) {
      loadDetails();
    }
  }, [job]);
  
  const loadDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/jobs/${job.id}`);
      setDetails(response.data);
    } catch (err) {
      console.error('Failed to load details:', err);
      setDetails(job);
    } finally {
      setLoading(false);
    }
  };
  
  const d = details || job;
  const status = d.status?.toLowerCase() || 'queued';
  const scrapedContent = d.scraped_content || '';
  const wordCount = scrapedContent ? scrapedContent.split(/\s+/).filter(w => w.length > 0).length : 0;
  const charCount = scrapedContent.length;
  const recordCount = d.records || 0;
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, background: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Briefcase size={16} color="var(--color-info)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.id}</div>
            </div>
          </div>
          <button className="action-btn" onClick={onClose} style={{ flexShrink: 0 }}>
            <X size={13} />
          </button>
        </div>
        
        <div className="modal-body">
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Progress</span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}>{d.progress || 0}%</span>
            </div>
            <div className="progress-bar" style={{ height: 4 }}>
              <div className="progress-fill" style={{ width: `${d.progress || 0}%`, background: d.status === 'failed' ? 'var(--color-error)' : 'var(--color-mdb-green)' }} />
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <StatusPill status={status} />
          </div>
          
          {d.error_message && (
            <div style={{ background: 'var(--status-error-bg)', border: '1px solid var(--status-error-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-error)', marginBottom: 16 }}>
              <AlertCircle size={13} />
              <span style={{ wordBreak: 'break-word' }}>{d.error_message}</span>
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '10px', marginBottom: 16 }}>
            <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}>{recordCount.toLocaleString() || '0'}</div>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginTop: '2px' }}>Records</div>
            </div>
            <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}>{wordCount.toLocaleString()}</div>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginTop: '2px' }}>Words</div>
            </div>
            <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}>{charCount > 999 ? `${(charCount / 1000).toFixed(1)}k` : charCount}</div>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginTop: '2px' }}>Characters</div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 16 }}>
            <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LinkIcon size={9} /> Target URL
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
                <a href={d.target || d.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-info)', textDecoration: 'none' }}>
                  {(d.target || d.url || 'N/A').substring(0, 60)}
                </a>
              </div>
            </div>
            <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={9} /> Frequency
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>{d.frequency || 'One-time'}</div>
            </div>
            <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={9} /> Created
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>{formatDate(d.created_at)}</div>
            </div>
            <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={9} /> Last Scraped
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>{formatDate(d.scraped_at) || 'Never'}</div>
            </div>
          </div>
          
          {scrapedContent && !loading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <span>Full Content</span>
                <span>{charCount.toLocaleString()} chars</span>
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '10px', lineHeight: '1.6', color: 'var(--color-text-secondary)', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {scrapedContent}
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN JOBS COMPONENT - WITH AUTO-POLLING
// ============================================================

export default function Jobs() {
  const [activeTab, setActiveTab] = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [parsingJob, setParsingJob] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [formData, setFormData] = useState({ name: '', url: '' });
  const [isPolling, setIsPolling] = useState(false);
  const pollingInterval = useRef(null);
  
  const { jobUpdates } = useWebSocket(null);
  
  injectStyles('jobs-styles', STYLES);
  
  const filters = ['all', 'running', 'success', 'failed', 'paused', 'queued'];
  
  const filteredJobs = statusFilter === 'all'
    ? jobs
    : jobs.filter(j => j.status?.toLowerCase() === statusFilter);
  
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / itemsPerPage));
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const runningCount = jobs.filter(j => j.status === 'running').length;
  
  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/jobs');
      let jobsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          jobsData = response.data;
        } else if (response.data.jobs && Array.isArray(response.data.jobs)) {
          jobsData = response.data.jobs;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          jobsData = response.data.data;
        }
      }
      setJobs(jobsData);
      
      const hasRunning = jobsData.some(j => j.status === 'running');
      if (hasRunning && !isPolling) {
        startPolling();
      } else if (!hasRunning && isPolling) {
        stopPolling();
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [isPolling]);

  const startPolling = useCallback(() => {
    if (pollingInterval.current) return;
    
    console.log('Starting auto-polling for job updates...');
    setIsPolling(true);
    
    pollingInterval.current = setInterval(() => {
      const hasRunning = jobs.some(j => j.status === 'running');
      if (!hasRunning) {
        stopPolling();
        return;
      }
      loadJobs();
    }, 3000);
  }, [jobs, loadJobs]);

  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      setIsPolling(false);
      console.log('Stopped auto-polling');
    }
  }, []);

  useEffect(() => {
    if (jobUpdates) {
      console.log('Received job update:', jobUpdates);
      
      setJobs(prevJobs => {
        const updatedJobs = prevJobs.map(job => {
          if (job.id === jobUpdates.job_id) {
            return {
              ...job,
              status: jobUpdates.status || job.status,
              progress: jobUpdates.progress || job.progress,
              records: jobUpdates.records || job.records
            };
          }
          return job;
        });
        return updatedJobs;
      });
      
      if (jobUpdates.status === 'success' || jobUpdates.status === 'failed' || jobUpdates.status === 'completed') {
        stopPolling();
        setTimeout(() => loadJobs(), 2000);
      }
    }
  }, [jobUpdates, loadJobs, stopPolling]);

  const handleStartJob = async (jobId) => {
    try {
      await api.post(`/api/jobs/${jobId}/start`);
      setSuccess('Job started - refreshing automatically...');
      await loadJobs();
      startPolling();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to start job');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handlePauseJob = async (jobId) => {
    try {
      await api.post(`/api/jobs/${jobId}/pause`);
      setSuccess('Job paused');
      await loadJobs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to pause job');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteJob = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/jobs/${deleteTarget.id}`);
      setSuccess(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await loadJobs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete job');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Job name is required');
      return;
    }
    if (!formData.url.trim()) {
      setError('Target URL is required');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/jobs', {
        name: formData.name.trim(),
        target: formData.url.trim(),
        url: formData.url.trim()
      });
      setFormData({ name: '', url: '' });
      setSuccess('Job created successfully');
      setActiveTab('list');
      await loadJobs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create job');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Loading State
  if (loading && jobs.length === 0) {
    return (
      <div className="jobs-root page-enter">
        <div className="loading-state">
          <div className="loading-spinner" />
          <span style={{ color: 'var(--color-text-muted)' }}>Loading jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="jobs-root page-enter">
      {/* Alerts */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '12px', background: 'var(--status-error-bg)', border: '1px solid var(--status-error-border)', color: 'var(--color-error)', flexWrap: 'wrap' }}>
          <AlertCircle size={14} />
          <span style={{ flex: 1 }}>{error}</span>
          <button style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', opacity: 0.7 }} onClick={() => setError(null)}>
            <X size={13} />
          </button>
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '12px', background: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', color: 'var(--color-success)', flexWrap: 'wrap' }}>
          <CheckCircle size={14} />
          <span style={{ flex: 1 }}>{success}</span>
          <button style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', opacity: 0.7 }} onClick={() => setSuccess(null)}>
            <X size={13} />
          </button>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '0', overflowX: 'auto', flexWrap: 'wrap' }}>
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <Briefcase size={13} style={{ marginRight: '5px' }} />
          All Jobs
        </button>
      
      </div>
      
      {/* Jobs List Tab */}
      {activeTab === 'list' && (
        <div className="table-container">
          <div className="table-header">
            <div className="table-title">
              <span className="job-count">{filteredJobs.length} jobs</span>
              <div className="filter-group">
                {filters.map(f => (
                  <button
                    key={f}
                    className={`filter-chip ${statusFilter === f ? 'active' : ''}`}
                    onClick={() => setStatusFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {loading && <RefreshCw size={13} className="spin" />}
              {isPolling && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', background: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 500, color: 'var(--color-info)' }}>
                  <Activity size={10} className="spin" /> Auto-refreshing
                </span>
              )}
              {runningCount > 0 && !isPolling && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', background: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 500, color: 'var(--color-info)' }}>
                  <Activity size={10} /> {runningCount} running
                </span>
              )}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('new')}>
              <Play size={11} /> New Job
            </button>
          </div>
          
          {paginatedJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                <Briefcase size={20} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>No jobs found</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {statusFilter !== 'all'
                  ? `No jobs with status: ${statusFilter}`
                  : 'Create your first job to get started'}
              </div>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="jobs-table">
                  <thead>
                    <tr>
                      <th>Job Name</th>
                      <th>Target URL</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Records</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedJobs.map(job => {
                      const isRunning = job.status === 'running';
                      
                      return (
                        <tr key={job.id}>
                          <td style={{ fontWeight: 500, wordBreak: 'break-word' }}>{job.name}</td>
                          <td>
                            <span className="mono-text url-cell">
                              {job.target || job.url || 'N/A'}
                            </span>
                          </td>
                          <td>
                            {isRunning ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                <span className="status-pill running">
                                  <span className="status-dot" />
                                  Running
                                </span>
                                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                                  {job.progress || 0}%
                                </span>
                              </div>
                            ) : (
                              <StatusPill status={job.status} />
                            )}
                          </td>
                          <td>
                            <div className="progress-container">
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ 
                                    width: `${job.progress || 0}%`,
                                    background: isRunning ? 'var(--color-info)' : 
                                               job.status === 'failed' ? 'var(--color-error)' : 
                                               'var(--color-mdb-green)'
                                  }} 
                                />
                              </div>
                              <span className="progress-text">{job.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="mono-text">{job.records?.toLocaleString() || '0'}</td>
                          <td className="mono-text">{formatDate(job.created_at)}</td>
                          <td>
                            <div className="action-group">
                              <button
                                className="action-btn"
                                title="View details"
                                onClick={() => setSelectedJob(job)}
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                className="action-btn"
                                title="Extract with AI"
                                onClick={() => setParsingJob(job)}
                                disabled={!job.scraped_content}
                              >
                                <Brain size={12} />
                              </button>
                              {job.status === 'running' ? (
                                <button
                                  className="action-btn"
                                  title="Pause job"
                                  onClick={() => handlePauseJob(job.id)}
                                >
                                  <Pause size={12} />
                                </button>
                              ) : (
                                <button
                                  className="action-btn"
                                  title={job.status === 'queued' ? 'Start job' : 'Re-run job'}
                                  onClick={() => handleStartJob(job.id)}
                                  disabled={job.status === 'running'}
                                >
                                  {job.status === 'running' ? (
                                    <Loader size={12} className="spin" />
                                  ) : (
                                    <Play size={12} />
                                  )}
                                </button>
                              )}
                              <button
                                className="action-btn danger"
                                title="Delete job"
                                onClick={() => setDeleteTarget({ id: job.id, name: job.name })}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
        </div>
      )}
      
      {/* New Job Tab */}
      {activeTab === 'new' && (
        <form onSubmit={handleCreateJob}>
          <div className="form-card">
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>Configure Scraping Job</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Define the parameters for your data extraction job</div>
            </div>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Job Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Product Catalog Scraper"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Target URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/page-to-scrape"
                  value={formData.url}
                  onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFormData({ name: '', url: '' });
                  setActiveTab('list');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submitting}
              >
                {submitting ? <Loader size={11} className="spin" /> : <Play size={11} />}
                {submitting ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </div>
        </form>
      )}
      
      {/* Modals */}
      {selectedJob && (
        <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
      
      {parsingJob && (
        <ParsingPanel
          jobId={parsingJob.id}
          jobName={parsingJob.name}
          onClose={() => setParsingJob(null)}
        />
      )}
      
      {deleteTarget && (
        <DeleteConfirmModal
          jobName={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteJob}
          deleting={deleting}
        />
      )}
    </div>
  );
}