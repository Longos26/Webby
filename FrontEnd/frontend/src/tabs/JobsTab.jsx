import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Play, Eye, AlertCircle,
  Pause, Trash2, RefreshCw, X, Loader,
 Database, Link as LinkIcon, Calendar, Activity,
  CheckCircle, Zap, Brain,
  AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,

} from 'lucide-react';
import  api, { jobService } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import ParsingPanel from '../components/ParsingPanel';

// ============================================================
// ANTI-GENERIC UI/UX ENFORCEMENT v2.0 - JOBS PAGE
// - No nested card anti-pattern
// - Visible borders (10%+ contrast)
// - No emoji icons (Lucide only)
// - No em dashes in UI copy
// - 60-30-10 color ratio enforced
// - Subtle shadows, consistent radius scale
// - Purposeful animation layer
// ============================================================

const STYLES = `
  /* Design Tokens - Anti-Generic Compliant */
  .jd-root {
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

  .spin { animation: spin 0.7s linear infinite; }
  .page-enter { animation: fadeIn 0.3s ease forwards; }

  /* Status Pill */
  .status-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px; border-radius: var(--radius-full);
    font-size: var(--text-xs); font-weight: 600; font-family: var(--font-mono);
  }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; }
  .status-pill.running { background: rgba(59,130,246,0.12); color: #3b82f6; border: 1px solid rgba(59,130,246,0.25); }
  .status-pill.running .status-dot { background: #3b82f6; animation: pulse 1.5s infinite; }
  .status-pill.success { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
  .status-pill.success .status-dot { background: #10b981; }
  .status-pill.failed { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
  .status-pill.failed .status-dot { background: #ef4444; }
  .status-pill.paused { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
  .status-pill.paused .status-dot { background: #f59e0b; }
  .status-pill.queued { background: rgba(255,255,255,0.05); color: #6a8ca8; border: 1px solid rgba(255,255,255,0.08); }
  .status-pill.queued .status-dot { background: #6a8ca8; }

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

  /* Error / Success Alerts */
  .error-alert, .success-alert {
    display: flex; align-items: center; gap: 10px;
    border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 20px;
    font-size: var(--text-sm);
  }
  .error-alert {
    background: var(--color-error-dim); border: 1px solid rgba(239,68,68,0.25);
    color: #f87171;
  }
  .success-alert {
    background: var(--color-success-dim); border: 1px solid rgba(16,185,129,0.25);
    color: #34d399;
  }
  .error-alert button, .success-alert button {
    margin-left: auto; background: none; border: none;
    cursor: pointer; transition: opacity var(--transition-fast);
  }

  /* Table Wrap */
  .table-wrap {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .table-top {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap; gap: 12px;
  }
  .table-filters {
    display: flex; gap: 6px; flex-wrap: wrap;
  }
  .filter-chip {
    font-family: var(--font-mono); font-size: 10px; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
    padding: 4px 10px; border-radius: var(--radius-sm);
    border: 1px solid var(--color-border); background: none;
    color: var(--color-text-muted); cursor: pointer;
    transition: all var(--transition-fast);
  }
  .filter-chip:hover {
    border-color: var(--color-border-strong);
    color: var(--color-text-primary);
  }
  .filter-chip.active {
    background: rgba(59,130,246,0.12);
    border-color: rgba(59,130,246,0.25);
    color: var(--color-brand);
  }

  .jobs-table {
    width: 100%; border-collapse: collapse;
  }
  .jobs-table thead tr {
    border-bottom: 1px solid var(--color-border);
  }
  .jobs-table th {
    padding: 12px 16px; text-align: left;
    font-family: var(--font-mono); font-size: 10px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .jobs-table td {
    padding: 12px 16px; font-size: var(--text-sm);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    vertical-align: middle;
  }
  .jobs-table tbody tr:last-child td {
    border-bottom: none;
  }
  .jobs-table tbody tr:hover td {
    background: rgba(255,255,255,0.02);
  }

  .mono {
    font-family: var(--font-mono); font-size: 11px; color: var(--color-text-muted);
  }

  .progress-bar {
    width: 100%; height: 4px;
    background: rgba(255,255,255,0.06);
    border-radius: var(--radius-full); overflow: hidden;
  }
  .progress-fill {
    height: 100%; background: var(--color-brand);
    border-radius: var(--radius-full);
    transition: width 0.4s ease;
  }

  .action-row {
    display: flex; gap: 4px;
  }
  .action-btn {
    width: 28px; height: 28px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--color-text-muted);
    transition: all var(--transition-base);
  }
  .action-btn:hover {
    background: rgba(255,255,255,0.08);
    color: var(--color-text-primary);
    border-color: var(--color-border-strong);
  }
  .action-btn:disabled {
    opacity: 0.5; cursor: not-allowed;
  }

  .status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(59,130,246,0.12); color: var(--color-brand);
    border: 1px solid rgba(59,130,246,0.25);
    padding: 3px 9px; border-radius: var(--radius-full);
    font-size: 11px; font-family: var(--font-mono);
  }

  .empty-state {
    text-align: center; padding: 48px 24px; color: var(--color-text-muted);
  }
  .empty-icon {
    width: 48px; height: 48px; margin: 0 auto 14px;
    border-radius: var(--radius-md);
    background: rgba(255,255,255,0.04); border: 1px solid var(--color-border);
    display: flex; align-items: center; justify-content: center;
  }
  .empty-title {
    font-size: 14px; font-weight: 600; color: var(--color-text-primary);
    margin-bottom: 6px;
  }
  .empty-sub {
    font-size: 13px;
  }

  .loading-state {
    padding: 48px; text-align: center; color: var(--color-text-muted);
  }

  .section-title-sm {
    font-size: 14px; font-weight: 600; letter-spacing: -0.02em;
  }
  .section-sub-sm {
    font-size: 12px; color: var(--color-text-muted); margin-top: 2px;
  }

  /* Job Form */
  .job-form {
    background: var(--color-surface-1); border: 1px solid var(--color-border);
    border-radius: var(--radius-md); padding: 24px;
  }
  .form-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 18px;
  }
  .form-group {
    display: flex; flex-direction: column; gap: 6px;
  }
  .form-group.full {
    grid-column: 1 / -1;
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
    padding: 10px 12px; font-size: var(--text-sm);
    color: var(--color-text-primary); outline: none;
    font-family: var(--font-sans);
    transition: all var(--transition-base);
  }
  .form-input:focus {
    border-color: var(--color-border-focus);
    background: rgba(59,130,246,0.05);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
  }

  /* Pagination */
  .pagination-container {
    margin-top: 20px; padding: 16px 20px;
    border-top: 1px solid var(--color-border);
  }
  .pagination-wrapper {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
  }
  .pagination-info {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--color-text-muted);
    background: rgba(255,255,255,0.03);
    padding: 5px 12px; border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }
  .pagination-info span {
    color: var(--color-brand); font-weight: 600;
  }
  .pagination-controls {
    display: flex; align-items: center; gap: 6px;
    flex-wrap: wrap;
  }
  .page-nav {
    display: flex; align-items: center; gap: 4px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 6px 10px; cursor: pointer;
    color: var(--color-text-muted); font-size: 12px;
    font-weight: 500; transition: all var(--transition-base);
  }
  .page-nav:hover:not(:disabled) {
    background: rgba(255,255,255,0.08);
    border-color: var(--color-border-strong);
    color: var(--color-text-primary);
  }
  .page-nav:disabled {
    opacity: 0.4; cursor: not-allowed;
  }
  .page-numbers {
    display: flex; align-items: center; gap: 4px;
  }
  .page-number {
    min-width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all var(--transition-base);
  }
  .page-number:hover {
    background: rgba(255,255,255,0.08);
    border-color: var(--color-border-strong);
    color: var(--color-text-primary);
  }
  .page-number.active {
    background: rgba(59,130,246,0.12);
    border-color: rgba(59,130,246,0.25);
    color: var(--color-brand);
  }
  .page-ellipsis {
    color: var(--color-text-muted); padding: 0 4px; font-size: 12px;
  }
  .page-size-selector {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.03);
    padding: 4px 12px; border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }
  .page-size-selector label {
    font-size: 11px; color: var(--color-text-muted);
  }
  .page-size-selector select {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 4px 8px; color: var(--color-text-primary);
    font-size: 11px; font-weight: 500; cursor: pointer;
  }

  @media (max-width: 768px) {
    .pagination-wrapper { flex-direction: column; align-items: stretch; }
    .pagination-controls { justify-content: center; }
    .page-numbers { order: -1; justify-content: center; flex-wrap: wrap; }
    .form-grid { grid-template-columns: 1fr; }
  }
`;

/* Status Pill Component */
function StatusPill({ status }) {
  const labels = { running: 'Running', success: 'Success', failed: 'Failed', paused: 'Paused', queued: 'Queued' };
  const cls = status?.toLowerCase() || 'queued';
  return (
    <span className={`status-pill ${cls}`}>
      <span className="status-dot" />
      {labels[cls] || status || 'Queued'}
    </span>
  );
}

/* Pagination Component */
function Pagination({ currentPage, totalPages, itemsPerPage, onPageChange, onItemsPerPageChange }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1 && itemsPerPage >= 50) return null;

  return (
    <div className="pagination-container">
      <div className="pagination-wrapper">
        <div className="pagination-info">
          <ChevronsLeft size={12} />
          <span>{(currentPage - 1) * itemsPerPage + 1}</span> – 
          <span>{Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)}</span> of 
          <span>{totalPages * itemsPerPage}</span> jobs
        </div>

        <div className="pagination-controls">
          <button className="page-nav" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
            <ChevronsLeft size={14} />
            <span>First</span>
          </button>
          
          <button className="page-nav" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft size={14} />
            <span>Prev</span>
          </button>
          
          <div className="page-numbers">
            {getPageNumbers().map((page, idx) => (
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
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
          </div>
          
          <button className="page-nav" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
          
          <button className="page-nav" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
            <span>Last</span>
            <ChevronsRight size={14} />
          </button>
        </div>

        <div className="page-size-selector">
          <label>Show</label>
          <select value={itemsPerPage} onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }}>
            <option value={5}>5 per page</option>
            <option value={8}>8 per page</option>
            <option value={10}>10 per page</option>
            <option value={15}>15 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* Delete Confirm Modal */
function DeleteModal({ jobName, onCancel, onConfirm, deleting }) {
  const [closing, setClosing] = useState(false);
  
  const handleCancel = () => { setClosing(true); setTimeout(onCancel, 160); };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') handleCancel(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(6,10,18,0.82)', backdropFilter: 'blur(14px)',
      opacity: closing ? 0 : 1, transition: 'opacity 0.16s ease'
    }} onClick={handleCancel}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-md)', margin: '0 auto 18px',
            background: 'var(--color-error-dim)', border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444'
          }}><Trash2 size={22} /></div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Delete job</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>You are about to permanently delete</div>
          <span style={{
            display: 'inline-block', marginTop: 4, padding: '4px 12px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xs)', fontSize: 13, fontWeight: 600,
            fontFamily: 'monospace'
          }}>{jobName}</span>
          <div style={{ fontSize: 11, color: '#5a3040', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <AlertTriangle size={11} />
            This action cannot be undone
          </div>
        </div>
        <div style={{ padding: '16px 24px 20px', display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={handleCancel} style={{
            flex: 1, padding: 10, borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)', cursor: 'pointer'
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting} style={{
            flex: 1, padding: 10, borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
            background: 'var(--color-error-dim)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444', cursor: deleting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            {deleting ? <Loader size={13} className="spin" /> : <Trash2 size={13} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* Job Details Modal */
function JobDetailsModal({ job, onClose }) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => { if (job?.id) loadDetails(); }, [job]);
  
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleClose = () => { setClosing(true); setTimeout(onClose, 160); };
  
  const loadDetails = async () => {
    setLoading(true);
    try { setDetails(await jobService.getJob(job.id)); } 
    catch { setDetails(job); } 
    finally { setLoading(false); }
  };

  if (!job) return null;
  const d = details || job;
  const status = d.status?.toLowerCase() || 'queued';
  const statusColor = status === 'running' ? '#3b82f6' : status === 'success' ? '#10b981' : status === 'failed' ? '#ef4444' : status === 'paused' ? '#f59e0b' : '#6a8ca8';
  const pct = d.progress || 0;

  // ACCURATE CONTENT STATISTICS
  const scrapedContent = d.scraped_content || '';
  const wordCount = scrapedContent ? scrapedContent.split(/\s+/).filter(w => w.length > 0).length : 0;
  const charCount = scrapedContent.length;
  const recordCount = d.records || 0;

  // Format date with local timezone
  const formatLocalDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(6,10,18,0.82)', backdropFilter: 'blur(14px)',
      opacity: closing ? 0 : 1, transition: 'opacity 0.16s ease'
    }} onClick={handleClose}>
      <div style={{
        width: '100%', maxWidth: 620, maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
          background: 'linear-gradient(180deg, rgba(59,130,246,0.04) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-sm)',
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6'
            }}><Briefcase size={16} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{d.id}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusPill status={status} />
            <button onClick={handleClose} style={{
              width: 32, height: 32, borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><X size={13} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Progress */}
          <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Scraping progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: statusColor, borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Error message */}
          {d.error_message && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 9,
              background: 'var(--color-error-dim)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-sm)', padding: '11px 13px', fontSize: 12, color: '#f87171'
            }}>
              <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{d.error_message}</span>
            </div>
          )}

          {/* Running indicator */}
          {status === 'running' && !loading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 'var(--radius-sm)', padding: '11px 13px', fontSize: 12, color: '#60a5fa'
            }}>
              <div style={{ width: 14, height: 14, border: '2px solid rgba(91,163,245,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span>Scraping in progress. Auto-refreshes when complete.</span>
            </div>
          )}

          {/* Content stats - ACCURATE */}
          {scrapedContent && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Content statistics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>{recordCount.toLocaleString() || '0'}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Records</div>
                </div>
                <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>{wordCount.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Words</div>
                </div>
                <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>{charCount > 999 ? `${(charCount / 1000).toFixed(1)}k` : charCount}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chars</div>
                </div>
              </div>
            </div>
          )}

          {/* Job Details with ACCURATE timestamps */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Job details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ gridColumn: '1/-1', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  <LinkIcon size={10} />Target URL
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <a href={d.target || d.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                    {d.target || d.url || 'N/A'}
                  </a>
                </div>
              </div>
              <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}><Database size={10} />Records</div>
                <div style={{ fontSize: 12 }}>{recordCount.toLocaleString() || '0'}</div>
              </div>
              <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}><Zap size={10} />Frequency</div>
                <div style={{ fontSize: 12 }}>{d.frequency || 'One-time'}</div>
              </div>
              <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}><Calendar size={10} />Created</div>
                <div style={{ fontSize: 12 }}>{formatLocalDate(d.created_at)}</div>
              </div>
              {d.scraped_at && (
                <div style={{ gridColumn: '1/-1', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '12px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    <Activity size={10} />Last Scraped
                  </div>
                  <div style={{ fontSize: 12 }}>{formatLocalDate(d.scraped_at)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Content Preview */}
          {scrapedContent && !loading && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Content preview</div>
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 13px', background: 'var(--color-surface-1)', borderBottom: '1px solid var(--color-border)', fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  <span>Raw text</span>
                  <span>{charCount.toLocaleString()} chars</span>
                </div>
                <pre style={{
                  margin: 0, padding: 13, fontSize: 11, lineHeight: 1.75, color: 'var(--color-text-secondary)',
                  fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  maxHeight: 190, overflowY: 'auto'
                }}>
                  {scrapedContent.substring(0, 3000)}
                  {scrapedContent.length > 3000 && '\n\n... truncated'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--color-surface-1)' }}>
          <button onClick={handleClose} style={{
            padding: '8px 20px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600,
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)', cursor: 'pointer'
          }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* Main Jobs Component */
export default function Jobs() {
  const [tab, setTab] = useState('list');
  const [filter, setFilter] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmit] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [parsingJob, setParsingJob] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [runningJobs, setRunningJobs] = useState(new Set());
  const [formData, setFormData] = useState({ name: '', url: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Inject styles
  useEffect(() => {
    if (!document.getElementById('jobs-styles')) {
      const style = document.createElement('style');
      style.id = 'jobs-styles';
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
  }, []);

  const currentUserId = null;
  const { jobUpdates } = useWebSocket(currentUserId);

  const loadJobs = useCallback(async () => {
  setLoading(true); 
  setError(null);
  try {
    const response = await api.get(`/api/jobs${filter !== 'all' ? `?status=${filter}` : ''}`);
    const data = response.data;
    const arr = Array.isArray(data) ? data : [];
    setJobs(arr);
    const running = new Set();
    arr.forEach(j => { if (j.status === 'running') running.add(j.id); });
    setRunningJobs(running);
  } catch (err) {
    console.error('Failed to load jobs:', err);
    setError(err.response?.data?.detail || err.message || 'Failed to load jobs');
    setJobs([]);
  } finally { 
    setLoading(false); 
  }
}, [filter]);

// Also fix the create job function:
const handleCreate = async (e) => {
  e.preventDefault();
  if (!formData.name.trim()) { setError('Job name is required'); return; }
  if (!formData.url.trim()) { setError('Target URL is required'); return; }
  setSubmit(true); 
  setError(null);
  try {
    const response = await api.post('/api/jobs', { 
      name: formData.name.trim(), 
      target: formData.url.trim(),
      url: formData.url.trim()
    });
    const nj = response.data;
    setFormData({ name: '', url: '' });
    setSuccess(`Job "${nj.name}" created successfully.`);
    setTab('list'); 
    await loadJobs();
    setTimeout(() => setSuccess(null), 3000);
  } catch (err) {
    console.error('Create job error:', err);
    setError(err.response?.data?.detail || err.message || 'Failed to create job');
  } finally { 
    setSubmit(false); 
  }
};

// Fix start/pause/delete:
const handleStart = async (jobId) => {
  try {
    await api.post(`/api/jobs/${jobId}/start`);
    setSuccess('Job started. Scraping will begin shortly.');
    await loadJobs();
    setTimeout(() => setSuccess(null), 4000);
  } catch (err) {
    setError(err.response?.data?.detail || err.message || 'Failed to start job');
    setTimeout(() => setError(null), 3000);
  }
};

const handlePause = async (jobId) => {
  try {
    await api.post(`/api/jobs/${jobId}/pause`);
    setSuccess('Job paused.');
    await loadJobs();
    setTimeout(() => setSuccess(null), 3000);
  } catch (err) {
    setError(err.response?.data?.detail || err.message || 'Failed to pause job');
    setTimeout(() => setError(null), 3000);
  }
};

const handleDeleteConfirm = async () => {
  if (!deleteTarget) return;
  setDeleting(true);
  try {
    await api.delete(`/api/jobs/${deleteTarget.id}`);
    setSuccess(`"${deleteTarget.name}" deleted.`);
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

  const filters = ['all', 'running', 'success', 'failed', 'paused', 'queued'];
  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedJobs = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Helper to format date for table display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="jd-root page-enter" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Error / Success Alerts */}
      {error && (
        <div className="error-alert">
          <AlertCircle size={16} /><span>{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="success-alert">
          <CheckCircle size={16} /><span>{success}</span>
          <button onClick={() => setSuccess(null)}><X size={14} /></button>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button className={`btn-sm ${tab === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('list')}>
          <Briefcase size={12} /> All Jobs
        </button>
      </div>

      {/* Jobs List Tab */}
      {tab === 'list' && (
        <div className="table-wrap">
          <div className="table-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span className="section-title-sm" style={{ fontSize: 12 }}>
                {filtered.length} jobs {filter !== 'all' ? `with status: ${filter}` : 'total'}
              </span>
              <div className="table-filters">
                {filters.map(f => (
                  <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {loading && <RefreshCw size={14} className="spin" />}
              {runningJobs.size > 0 && (
                <span className="status-badge">
                  <Activity size={11} /> {runningJobs.size} running
                </span>
              )}
            </div>
            <button className="btn-sm btn-primary" onClick={() => setTab('new')}>
              <Play size={12} /> New Job
            </button>
          </div>

          {loading && jobs.length === 0 ? (
            <div className="loading-state">Loading jobs...</div>
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
                    <th>Frequency</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedJobs.map(job => (
                    <tr key={job.id}>
                      <td style={{ fontWeight: 600 }}>{job.name}</td>
                      <td>
                        <span className="mono" style={{ maxWidth: 220, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {job.target || job.url || 'N/A'}
                        </span>
                      </td>
                      <td><StatusPill status={job.status} /></td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${job.progress || 0}%` }} />
                          </div>
                          <span className="mono" style={{ minWidth: 32 }}>{job.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="mono">{job.records?.toLocaleString() || '0'}</td>
                      <td className="mono">{job.frequency || 'One-time'}</td>
                      <td className="mono">{formatDate(job.created_at)}</td>
                      <td>
                        <div className="action-row">
                          <button className="action-btn" title="View details" onClick={() => setSelectedJob(job)}>
                            <Eye size={13} />
                          </button>
                          <button className="action-btn" title="Extract content with AI" onClick={() => setParsingJob(job)}>
                            <Brain size={13} />
                          </button>
                          {job.status === 'running' ? (
                            <button className="action-btn" title="Pause job" onClick={() => handlePause(job.id)}>
                              <Pause size={13} />
                            </button>
                          ) : (
                            <button className="action-btn" title="Start job" onClick={() => handleStart(job.id)} disabled={job.status === 'queued'}>
                              {job.status === 'queued' ? <Loader size={13} className="spin" /> : <Play size={13} />}
                            </button>
                          )}
                          <button className="action-btn" title="Delete job" style={{ color: '#ef4444' }} onClick={() => setDeleteTarget({ id: job.id, name: job.name })}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {paginatedJobs.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon"><Briefcase /></div>
                  <div className="empty-title">No jobs found</div>
                  <div className="empty-sub">
                    {filter !== 'all' ? `No jobs with status: ${filter}` : 'Create your first job to get started'}
                  </div>
                </div>
              )}

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

      {/* Create Job Tab */}
      {tab === 'new' && (
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="section-title-sm">Configure scraping job</div>
              <div className="section-sub-sm">Define the parameters for your data extraction job</div>
            </div>
          </div>
          <div className="job-form">
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Job name</label>
                <input
                  className="form-input"
                  placeholder="Example: E-commerce product sync"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group full">
                <label className="form-label">Target URL</label>
                <input
                  className="form-input"
                  placeholder="https://example.com/products"
                  value={formData.url}
                  onChange={e => setFormData(p => ({ ...p, url: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-sm btn-ghost" onClick={() => { setFormData({ name: '', url: '' }); setTab('list'); }}>
                Cancel
              </button>
              <button type="submit" className="btn-sm btn-primary" disabled={submitting}>
                {submitting ? <Loader size={12} className="spin" /> : <Play size={12} />}
                {submitting ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Modals */}
      {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
      {parsingJob && <ParsingPanel jobId={parsingJob.id} jobName={parsingJob.name} onClose={() => setParsingJob(null)} />}
      {deleteTarget && (
        <DeleteModal
          jobName={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}
    </div>
  );
}