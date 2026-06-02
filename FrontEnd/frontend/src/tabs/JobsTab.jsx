// frontend/src/pages/JobsTab.jsx - MongoDB Atlas Enterprise Edition

import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Play, Eye, AlertCircle,
  Pause, Trash2, RefreshCw, X, Loader,
  Database, Link as LinkIcon, Calendar, Activity,
  CheckCircle, Zap, Brain,
  AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock, Hash, Server
} from 'lucide-react';
import api from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import ParsingPanel from '../components/ParsingPanel';

// ============================================================
// MONGODB ATLAS ENTERPRISE DESIGN SYSTEM
// ============================================================

const STYLES = `
  /* Enterprise Design Tokens - MongoDB Atlas Inspired */
  .jobs-root {
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

  /* Base */
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

  /* Animations - Subtle Only */
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .page-enter {
    animation: fadeSlideIn 0.2s ease-out;
  }

  .spin {
    animation: spin 0.6s linear infinite;
  }

  /* Status Pills */
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-mono);
  }
  
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  
  .status-pill.running {
    background: rgba(88, 166, 255, 0.1);
    color: var(--color-info);
    border: 1px solid rgba(88, 166, 255, 0.25);
  }
  .status-pill.running .status-dot {
    background: var(--color-info);
    animation: pulse 1.5s infinite;
  }
  
  .status-pill.success {
    background: rgba(0, 237, 100, 0.1);
    color: var(--color-success);
    border: 1px solid rgba(0, 237, 100, 0.25);
  }
  .status-pill.success .status-dot {
    background: var(--color-success);
  }
  
  .status-pill.failed {
    background: rgba(248, 81, 73, 0.1);
    color: var(--color-error);
    border: 1px solid rgba(248, 81, 73, 0.25);
  }
  .status-pill.failed .status-dot {
    background: var(--color-error);
  }
  
  .status-pill.paused {
    background: rgba(210, 153, 34, 0.1);
    color: var(--color-warning);
    border: 1px solid rgba(210, 153, 34, 0.25);
  }
  .status-pill.paused .status-dot {
    background: var(--color-warning);
  }
  
  .status-pill.queued {
    background: rgba(139, 148, 158, 0.1);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }
  .status-pill.queued .status-dot {
    background: var(--color-text-muted);
  }

  /* Buttons */
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
  
  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
    gap: 6px;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Alerts */
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
  
  .alert-success {
    background: rgba(0, 237, 100, 0.1);
    border: 1px solid rgba(0, 237, 100, 0.3);
    color: var(--color-success);
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

  /* Tab Navigation */
  .tab-nav {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0;
  }
  
  .tab-btn {
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 500;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  
  .tab-btn:hover {
    color: var(--color-text-primary);
  }
  
  .tab-btn.active {
    color: var(--color-mdb-green);
    border-bottom-color: var(--color-mdb-green);
  }

  /* Table */
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
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .table-title {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .job-count {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
    background: var(--color-canvas);
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid var(--color-border);
  }
  
  .filter-group {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  
  .filter-chip {
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 500;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
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
  
  .jobs-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .jobs-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
  }
  
  .jobs-table td {
    padding: 14px 16px;
    font-size: 13px;
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
    font-size: 12px;
    color: var(--color-text-secondary);
  }
  
  .url-cell {
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
  }
  
  /* Progress Bar */
  .progress-container {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 130px;
  }
  
  .progress-bar {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--color-mdb-green);
    border-radius: 4px;
    transition: width var(--transition);
  }
  
  .progress-text {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-muted);
    min-width: 36px;
  }
  
  /* Action Buttons */
  .action-group {
    display: flex;
    gap: 4px;
  }
  
  .action-btn {
    width: 30px;
    height: 30px;
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
  
  .action-btn:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
  
  .action-btn.danger:hover {
    border-color: var(--color-error);
    color: var(--color-error);
    background: rgba(248, 81, 73, 0.1);
  }
  
  .running-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid rgba(88, 166, 255, 0.25);
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    color: var(--color-info);
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
  }
  
  .empty-icon {
    width: 56px;
    height: 56px;
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
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  
  .empty-description {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  /* Form */
  .form-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 24px;
  }
  
  .form-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border);
  }
  
  .form-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .form-description {
    font-size: 12px;
    color: var(--color-text-muted);
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .form-group.full-width {
    grid-column: 1 / -1;
  }
  
  .form-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  .form-input {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 10px 12px;
    font-size: 13px;
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    outline: none;
    transition: all var(--transition);
  }
  
  .form-input:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 2px rgba(0, 237, 100, 0.1);
  }
  
  .form-input::placeholder {
    color: var(--color-text-muted);
  }
  
  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 28px;
  }

  /* Pagination */
  .pagination-container {
    padding: 16px 20px;
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
    background: var(--color-canvas);
    padding: 5px 12px;
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
    flex-wrap: wrap;
  }
  
  .page-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: var(--color-canvas);
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
    min-width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-canvas);
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
    background: var(--color-canvas);
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid var(--color-border);
  }
  
  .page-size-select label {
    font-size: 11px;
    color: var(--color-text-muted);
  }
  
  .page-size-select select {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 4px 8px;
    font-size: 11px;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  /* Modal */
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
    max-width: 560px;
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
  }
  
  .modal-header {
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--color-border);
  }
  
  .modal-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-error);
  }
  
  .modal-title {
    font-size: 16px;
    font-weight: 600;
  }
  
  .modal-subtitle {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 4px;
  }
  
  .modal-body {
    padding: 20px 24px;
  }
  
  .job-name-badge {
    display: inline-block;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 6px 12px;
    font-family: var(--font-mono);
    font-size: 13px;
    margin-top: 8px;
  }
  
  .warning-text {
    font-size: 12px;
    color: var(--color-warning);
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
  }
  
  .modal-footer {
    padding: 16px 24px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  /* Job Details Modal */
  .details-modal {
    max-width: 680px;
    max-height: 85vh;
  }
  
  .details-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 14px;
    text-align: center;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-info);
  }
  
  .stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-top: 4px;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .info-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 12px 14px;
  }
  
  .info-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .info-value {
    font-size: 13px;
    color: var(--color-text-primary);
    word-break: break-all;
  }
  
  .preview-section {
    margin-top: 20px;
  }
  
  .preview-header {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
  }
  
  .preview-content {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 14px;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.6;
    color: var(--color-text-secondary);
    max-height: 200px;
    overflow-y: auto;
    white-space: pre-wrap;
  }

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
    .stats-grid {
      grid-template-columns: 1fr;
    }
    .info-grid {
      grid-template-columns: 1fr;
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
          <ChevronsLeft size={12} />
          <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>
          <span>–</span>
          <strong>{Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)}</strong>
          <span>of</span>
          <strong>{totalPages * itemsPerPage}</strong>
          <span>jobs</span>
        </div>
        
        <div className="pagination-controls">
          <button className="page-btn" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
            <ChevronsLeft size={12} /> First
          </button>
          <button className="page-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
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
          
          <button className="page-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next <ChevronRight size={12} />
          </button>
          <button className="page-btn" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
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
// DELETE CONFIRMATION MODAL
// ============================================================

function DeleteConfirmModal({ jobName, onCancel, onConfirm, deleting }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="modal-title">Delete Job</div>
            <div className="modal-subtitle">This action cannot be undone</div>
          </div>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            You are about to permanently delete:
          </p>
          <div className="job-name-badge">{jobName}</div>
          <div className="warning-text">
            <AlertTriangle size={12} />
            All scraped data and configurations will be lost
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(248, 81, 73, 0.1)', color: 'var(--color-error)', border: '1px solid rgba(248, 81, 73, 0.25)' }}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? <Loader size={12} className="spin" /> : <Trash2 size={12} />}
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
      <div className="modal details-modal" style={{ maxWidth: 680, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40,
              background: 'rgba(88, 166, 255, 0.1)',
              border: '1px solid rgba(88, 166, 255, 0.25)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Briefcase size={18} color="#58A6FF" />
            </div>
            <div>
              <div className="modal-title">{d.name}</div>
              <div className="modal-subtitle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{d.id}</div>
            </div>
          </div>
          <button className="action-btn" onClick={onClose} style={{ marginLeft: 'auto' }}>
            <X size={14} />
          </button>
        </div>
        
        <div className="details-body">
          {/* Progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Progress</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-info)' }}>{d.progress || 0}%</span>
            </div>
            <div className="progress-bar" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${d.progress || 0}%` }} />
            </div>
          </div>
          
          {/* Status */}
          <div style={{ marginBottom: 20 }}>
            <StatusPill status={status} />
          </div>
          
          {/* Error */}
          {d.error_message && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <AlertCircle size={14} />
              <span style={{ fontSize: 12 }}>{d.error_message}</span>
            </div>
          )}
          
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{recordCount.toLocaleString() || '0'}</div>
              <div className="stat-label">Records</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{wordCount.toLocaleString()}</div>
              <div className="stat-label">Words</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{charCount > 999 ? `${(charCount / 1000).toFixed(1)}k` : charCount}</div>
              <div className="stat-label">Characters</div>
            </div>
          </div>
          
          {/* Info Grid */}
          <div className="info-grid">
            <div className="info-card">
              <div className="info-label"><LinkIcon size={10} /> Target URL</div>
              <div className="info-value">
                <a href={d.target || d.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-info)', textDecoration: 'none' }}>
                  {(d.target || d.url || 'N/A').substring(0, 60)}
                </a>
              </div>
            </div>
            <div className="info-card">
              <div className="info-label"><Zap size={10} /> Frequency</div>
              <div className="info-value">{d.frequency || 'One-time'}</div>
            </div>
            <div className="info-card">
              <div className="info-label"><Calendar size={10} /> Created</div>
              <div className="info-value">{formatDate(d.created_at)}</div>
            </div>
            <div className="info-card">
              <div className="info-label"><Clock size={10} /> Last Scraped</div>
              <div className="info-value">{formatDate(d.scraped_at) || 'Never'}</div>
            </div>
          </div>
          
          {/* Content Preview */}
          {scrapedContent && !loading && (
            <div className="preview-section">
              <div className="preview-header">
                <span>Content Preview</span>
                <span>{charCount.toLocaleString()} chars</span>
              </div>
              <div className="preview-content">
                {scrapedContent.substring(0, 2000)}
                {scrapedContent.length > 2000 && '\n\n... truncated'}
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
// MAIN JOBS COMPONENT
// ============================================================

export default function Jobs() {
  const [activeTab, setActiveTab] = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
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
      const data = response.data;
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
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
  
  const handleStartJob = async (jobId) => {
    try {
      await api.post(`/api/jobs/${jobId}/start`);
      setSuccess('Job started');
      await loadJobs();
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
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);
  
  useEffect(() => {
    if (jobUpdates) {
      loadJobs();
    }
  }, [jobUpdates, loadJobs]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);
  
  return (
    <div className="jobs-root page-enter">
      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          <span>{success}</span>
          <button className="alert-close" onClick={() => setSuccess(null)}>
            <X size={14} />
          </button>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <Briefcase size={14} style={{ marginRight: 6 }} />
          All Jobs
        </button>
        <button
          className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          <Play size={14} style={{ marginRight: 6 }} />
          New Job
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
              {loading && <RefreshCw size={14} className="spin" />}
              {runningCount > 0 && (
                <span className="running-badge">
                  <Activity size={11} /> {runningCount} running
                </span>
              )}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('new')}>
              <Play size={12} /> New Job
            </button>
          </div>
          
          {loading && jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Loader size={24} className="spin" /></div>
              <div className="empty-title">Loading jobs...</div>
            </div>
          ) : paginatedJobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Briefcase size={24} /></div>
              <div className="empty-title">No jobs found</div>
              <div className="empty-description">
                {statusFilter !== 'all'
                  ? `No jobs with status: ${statusFilter}`
                  : 'Create your first job to get started'}
              </div>
            </div>
          ) : (
            <>
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
                  {paginatedJobs.map(job => (
                    <tr key={job.id}>
                      <td style={{ fontWeight: 600 }}>{job.name}</td>
                      <td>
                        <span className="mono-text url-cell">
                          {job.target || job.url || 'N/A'}
                        </span>
                      </td>
                      <td><StatusPill status={job.status} /></td>
                      <td>
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${job.progress || 0}%` }} />
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
                            <Eye size={13} />
                          </button>
                          <button
                            className="action-btn"
                            title="Extract with AI"
                            onClick={() => setParsingJob(job)}
                          >
                            <Brain size={13} />
                          </button>
                          {job.status === 'running' ? (
                            <button
                              className="action-btn"
                              title="Pause job"
                              onClick={() => handlePauseJob(job.id)}
                            >
                              <Pause size={13} />
                            </button>
                          ) : (
                            <button
                              className="action-btn"
                              title="Start job"
                              onClick={() => handleStartJob(job.id)}
                              disabled={job.status === 'queued'}
                            >
                              <Play size={13} />
                            </button>
                          )}
                          <button
                            className="action-btn danger"
                            title="Delete job"
                            onClick={() => setDeleteTarget({ id: job.id, name: job.name })}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
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
            <div className="form-header">
              <div className="form-title">Configure Scraping Job</div>
              <div className="form-description">Define the parameters for your data extraction job</div>
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
                {submitting ? <Loader size={12} className="spin" /> : <Play size={12} />}
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