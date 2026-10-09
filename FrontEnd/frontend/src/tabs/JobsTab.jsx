// frontend/src/pages/JobsTab.jsx - MO-TECH ENTERPRISE EDITION

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Briefcase, Play, Eye, AlertCircle,
  Pause, Trash2, RefreshCw, X, Loader,
  Database, Link as LinkIcon, Calendar, Activity,
  CheckCircle, Zap, Brain,
  AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock, Hash
} from 'lucide-react';
import api from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import ParsingPanel from '../components/ParsingPanel';

// ============================================================
// STYLES - CLEAN UNTITLED UI AESTHETIC
// ============================================================

const STYLES = `
  .jobs-root {
    --color-mdb-green: #00ED64;
    --color-mdb-green-dark: #00C355;
    --color-canvas: #0D1117;
    --color-surface: #161B22;
    --color-surface-elevated: #1C2128;
    --color-border: #30363D;
    --color-border-subtle: #21262D;
    --color-text-primary: #F0F6FC;
    --color-text-secondary: #9BA4B0;
    --color-text-muted: #6E7681;
    --color-success: #00ED64;
    --color-warning: #D29922;
    --color-error: #F85149;
    --color-info: #58A6FF;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
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
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .page-enter {
    animation: fadeSlideIn 0.2s ease-out;
  }

  .spin {
    animation: spin 0.7s linear infinite;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    gap: 12px;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-mdb-green);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* ---------- Status Pills ---------- */
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
    white-space: nowrap;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-pill.running {
    background: rgba(88, 166, 255, 0.1);
    color: #79B8FF;
    border: 1px solid rgba(88, 166, 255, 0.2);
  }
  .status-pill.running .status-dot {
    background: #58A6FF;
    animation: pulse-dot 1.5s ease-in-out infinite;
  }

  .status-pill.success {
    background: rgba(0, 237, 100, 0.1);
    color: #56D364;
    border: 1px solid rgba(0, 237, 100, 0.2);
  }
  .status-pill.success .status-dot { background: #00ED64; }

  .status-pill.failed {
    background: rgba(248, 81, 73, 0.1);
    color: #FF7B72;
    border: 1px solid rgba(248, 81, 73, 0.2);
  }
  .status-pill.failed .status-dot { background: #F85149; }

  .status-pill.paused {
    background: rgba(210, 153, 34, 0.1);
    color: #E3B341;
    border: 1px solid rgba(210, 153, 34, 0.2);
  }
  .status-pill.paused .status-dot { background: #D29922; }

  .status-pill.queued {
    background: rgba(110, 118, 129, 0.1);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  .status-pill.queued .status-dot { background: var(--color-text-muted); }

  /* ---------- Buttons ---------- */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all var(--transition);
    border: none;
    white-space: nowrap;
  }

  .btn-primary {
    background: var(--color-mdb-green);
    color: #0D1117;
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--color-mdb-green-dark);
  }

  .btn-secondary {
    background: var(--color-surface);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  .btn-secondary:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    color: var(--color-text-primary);
    border-color: #484F58;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ---------- Table ---------- */
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
    border-bottom: 1px solid var(--color-border-subtle);
    flex-wrap: wrap;
    gap: 12px;
  }

  .table-title {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .job-count {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
    background: var(--color-canvas);
    padding: 4px 10px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }

  .filter-group {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .filter-chip {
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 500;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    white-space: nowrap;
    font-family: inherit;
  }

  .filter-chip:hover {
    background: var(--color-surface-elevated);
    color: var(--color-text-primary);
  }

  .filter-chip.active {
    background: rgba(0, 237, 100, 0.1);
    color: #56D364;
    border-color: rgba(0, 237, 100, 0.2);
  }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .jobs-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 720px;
  }

  .jobs-table th {
    text-align: left;
    padding: 12px 20px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border-subtle);
    white-space: nowrap;
    background: var(--color-surface);
  }

  .jobs-table td {
    padding: 16px 20px;
    font-size: 13px;
    border-bottom: 1px solid var(--color-border-subtle);
    vertical-align: middle;
    color: var(--color-text-secondary);
  }

  .jobs-table tr:last-child td {
    border-bottom: none;
  }

  .jobs-table tbody tr {
    transition: background var(--transition);
  }

  .jobs-table tbody tr:hover {
    background: var(--color-surface-elevated);
  }

  .mono-text {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .url-cell {
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    color: var(--color-text-secondary);
  }

  .job-name {
    font-weight: 500;
    color: var(--color-text-primary);
    font-size: 13px;
    word-break: break-word;
  }

  /* ---------- Progress ---------- */
  .progress-container {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 90px;
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: var(--color-border);
    border-radius: var(--radius-full);
    overflow: hidden;
    min-width: 40px;
  }

  .progress-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 0.4s ease;
  }

  .progress-text {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-muted);
    min-width: 32px;
    text-align: right;
  }

  /* ---------- Action Buttons ---------- */
  .action-group {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .action-btn {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition);
  }

  .action-btn:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: var(--color-border);
    color: var(--color-text-primary);
  }

  .action-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .action-btn.danger:hover:not(:disabled) {
    color: #FF7B72;
    background: rgba(248, 81, 73, 0.08);
    border-color: rgba(248, 81, 73, 0.2);
  }

  /* ---------- Pagination ---------- */
  .pagination-container {
    padding: 14px 20px;
    border-top: 1px solid var(--color-border-subtle);
  }

  .pagination-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .pagination-info {
    font-size: 12px;
    color: var(--color-text-muted);
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
    padding: 6px 10px;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    font-family: inherit;
  }

  .page-btn:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    color: var(--color-text-primary);
    border-color: #484F58;
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
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    font-family: inherit;
  }

  .page-number:hover {
    background: var(--color-surface-elevated);
    color: var(--color-text-primary);
  }

  .page-number.active {
    background: rgba(0, 237, 100, 0.1);
    color: #56D364;
    border-color: rgba(0, 237, 100, 0.2);
  }

  /* ---------- Form ---------- */
  .form-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 24px;
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
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .form-input {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 10px 12px;
    font-size: 14px;
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    outline: none;
    transition: all var(--transition);
    width: 100%;
  }

  .form-input::placeholder {
    color: var(--color-text-muted);
  }

  .form-input:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.08);
  }

  .form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 24px;
    flex-wrap: wrap;
  }

  /* ---------- Modal ---------- */
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(13, 17, 23, 0.85);
    backdrop-filter: blur(4px);
  }

  .modal {
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--color-border-subtle);
    flex-shrink: 0;
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    padding: 16px 20px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border-subtle);
    background: var(--color-canvas);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  /* ---------- Tabs ---------- */
  .tab-btn {
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 500;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    font-family: inherit;
  }

  .tab-btn:hover {
    color: var(--color-text-primary);
  }

  .tab-btn.active {
    color: #56D364;
    border-bottom-color: var(--color-mdb-green);
  }

  /* ---------- Content Viewer (Untitled UI) ---------- */
  .content-viewer {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    max-height: 520px;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  .content-viewer::-webkit-scrollbar {
    width: 8px;
  }

  .content-viewer::-webkit-scrollbar-track {
    background: transparent;
  }

  .content-viewer::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: var(--radius-full);
    border: 2px solid var(--color-canvas);
  }

  .content-viewer::-webkit-scrollbar-thumb:hover {
    background: #484F58;
  }

  .content-fade-top {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    height: 24px;
    background: linear-gradient(to bottom, var(--color-canvas), transparent);
    z-index: 1;
    pointer-events: none;
  }

  .content-body {
    padding: 8px 24px 24px;
  }

  .content-page-marker {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: #56D364;
    padding: 6px 12px;
    margin: 8px 0;
    background: rgba(0, 237, 100, 0.06);
    border: 1px solid rgba(0, 237, 100, 0.12);
    border-radius: var(--radius-sm);
    font-weight: 500;
    word-break: break-word;
  }

  .content-h1 {
    font-size: 17px;
    font-weight: 700;
    color: #56D364;
    margin-top: 22px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .content-h1::before {
    content: '';
    width: 4px;
    height: 20px;
    background: #56D364;
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }

  .content-h2 {
    font-size: 15px;
    font-weight: 600;
    color: #79B8FF;
    margin-top: 20px;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .content-h2::before {
    content: '';
    width: 3px;
    height: 16px;
    background: #79B8FF;
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }

  .content-h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-top: 18px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .content-bullet {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding-left: 12px;
    margin-bottom: 6px;
  }

  .content-bullet.nested {
    padding-left: 24px;
  }

  .content-bullet-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #56D364;
    margin-top: 8px;
    flex-shrink: 0;
  }

  .content-bullet.nested .content-bullet-dot {
    background: var(--color-text-muted);
  }

  .content-bullet-text {
    font-size: 13px;
    line-height: 1.7;
    color: var(--color-text-secondary);
  }

  .content-paragraph {
    font-size: 13px;
    line-height: 1.8;
    color: var(--color-text-primary);
    padding: 2px 0;
    word-break: break-word;
  }

  .content-divider {
    border-top: 1px solid var(--color-border);
    margin: 20px 0 16px;
  }

  .content-divider-subtle {
    border-top: 1px solid var(--color-border-subtle);
    margin: 16px 0;
  }

  .content-empty-line {
    height: 12px;
  }

  /* ---------- Content Empty State (Untitled UI) ---------- */
  .content-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    text-align: center;
  }

  .content-empty-icon-wrapper {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-lg);
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    position: relative;
  }

  .content-empty-icon-badge {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content-empty-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 6px;
  }

  .content-empty-desc {
    font-size: 13px;
    color: var(--color-text-muted);
    max-width: 280px;
    line-height: 1.6;
    margin-bottom: 20px;
  }

  .content-empty-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    font-size: 11px;
    color: var(--color-text-muted);
  }

  /* ---------- Content Header Stats ---------- */
  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .content-header-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .content-stat-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
  }

  /* ---------- Live Banner (clean) ---------- */
  .live-banner {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    margin-bottom: 16px;
    animation: fadeSlideIn 0.3s ease-out;
  }

  .live-banner-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .live-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    background: rgba(0, 237, 100, 0.1);
    border: 1px solid rgba(0, 237, 100, 0.2);
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;
    color: #56D364;
    letter-spacing: 0.02em;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-mdb-green);
    animation: pulse-dot 1.5s ease-in-out infinite;
  }

  .telemetry-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }

  .telemetry-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .telemetry-label {
    font-size: 11px;
    color: var(--color-text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .telemetry-value {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  /* ---------- Empty State ---------- */
  .empty-state {
    text-align: center;
    padding: 56px 24px;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
  }

  /* ---------- Responsive ---------- */
  @media (max-width: 768px) {
    .form-grid { grid-template-columns: 1fr; }
    .pagination-wrapper { flex-direction: column; align-items: stretch; }
    .pagination-controls { justify-content: center; }
    .table-header { flex-direction: column; align-items: stretch; }
    .table-title { flex-direction: column; align-items: stretch; }
    .filter-group { justify-content: flex-start; }
    .jobs-table th, .jobs-table td { padding: 12px 14px; }
    .page-btn span { display: none; }
    .modal { max-width: 100%; margin: 0 8px; max-height: 95vh; }
    .url-cell { max-width: 140px; }
    .content-header { flex-direction: column; align-items: flex-start; }
  }

  @media (max-width: 480px) {
    .jobs-table th, .jobs-table td { padding: 10px 12px; font-size: 12px; }
    .filter-chip { font-size: 11px; padding: 4px 10px; }
    .page-number { min-width: 28px; height: 28px; font-size: 11px; }
    .page-btn { padding: 4px 8px; font-size: 11px; }
    .action-btn { width: 28px; height: 28px; }
    .url-cell { max-width: 90px; }
    .content-body { padding: 8px 16px 20px; }
    .content-empty-state { padding: 48px 16px; }
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
// STATUS PILL
// ============================================================

function StatusPill({ status }) {
  const statusMap = {
    running: { label: 'Running', class: 'running' },
    success: { label: 'Success', class: 'success' },
    completed: { label: 'Completed', class: 'success' },
    failed: { label: 'Failed', class: 'failed' },
    paused: { label: 'Paused', class: 'paused' },
    queued: { label: 'Queued', class: 'queued' },
    cancelled: { label: 'Cancelled', class: 'failed' },
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
// LIVE PROGRESS BANNER — clean version
// ============================================================

function LiveProgressBanner({ jobs }) {
  const runningJobs = jobs.filter(j => j.status === 'running');
  if (runningJobs.length === 0) return null;

  return (
    <div className="live-banner">
      <div className="live-banner-header">
        <span className="live-indicator">
          <span className="live-dot" />
          LIVE
        </span>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {runningJobs.length} job{runningJobs.length > 1 ? 's' : ''} currently running
        </span>
      </div>

      {runningJobs.map((job, idx) => {
        const progress = job.progress || 0;
        const pages = job.pages_processed || 0;
        const discovered = job.pages_discovered || 0;
        const records = job.records || 0;
        const dupes = job.duplicates_removed || 0;
        const elapsed = job.elapsed_seconds || 0;

        return (
          <div
            key={job.id}
            style={{
              marginBottom: idx === runningJobs.length - 1 ? 0 : 20,
              paddingBottom: idx === runningJobs.length - 1 ? 0 : 20,
              borderBottom: idx === runningJobs.length - 1 ? 'none' : '1px solid var(--color-border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
              <span className="job-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.name}
              </span>
              <span className="mono-text" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {progress}%
              </span>
            </div>

            <div className="progress-bar" style={{ height: 6 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  background: 'var(--color-mdb-green)',
                }}
              />
            </div>

            <div className="telemetry-grid">
              <div className="telemetry-cell">
                <span className="telemetry-label">Pages</span>
                <span className="telemetry-value">
                  {discovered > 0 ? `${pages}/${discovered}` : pages}
                </span>
              </div>
              <div className="telemetry-cell">
                <span className="telemetry-label">Records</span>
                <span className="telemetry-value">{records.toLocaleString()}</span>
              </div>
              {dupes > 0 && (
                <div className="telemetry-cell">
                  <span className="telemetry-label">Dupes</span>
                  <span className="telemetry-value">{dupes.toLocaleString()}</span>
                </div>
              )}
              {elapsed > 0 && (
                <div className="telemetry-cell">
                  <span className="telemetry-label">Elapsed</span>
                  <span className="telemetry-value">{Math.round(elapsed)}s</span>
                </div>
              )}
            </div>

            {job.last_page && (
              <div
                style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  background: 'var(--color-canvas)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {job.last_page}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// PAGINATION
// ============================================================

function Pagination({ currentPage, totalPages, itemsPerPage, totalItems, onPageChange, onItemsPerPageChange }) {
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

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination-container">
      <div className="pagination-wrapper">
        <div className="pagination-info">
          Showing <strong style={{ color: 'var(--color-text-primary)' }}>{startItem}–{endItem}</strong> of <strong style={{ color: 'var(--color-text-primary)' }}>{totalItems}</strong>
        </div>

        <div className="pagination-controls">
          <button className="page-btn" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
            <ChevronsLeft size={13} />
          </button>
          <button className="page-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft size={13} /> <span>Prev</span>
          </button>

          {getPageNumbers().map((page, idx) =>
            page === null ? (
              <span key={`ellipsis-${idx}`} className="page-number" style={{ cursor: 'default', color: 'var(--color-text-muted)' }}>
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
          )}

          <button className="page-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            <span>Next</span> <ChevronRight size={13} />
          </button>
          <button className="page-btn" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
            <ChevronsRight size={13} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Rows:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            style={{
              background: 'var(--color-canvas)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 8px',
              fontSize: 12,
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
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
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !deleting) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, deleting]);

  return (
    <div className="modal-overlay" onClick={() => { if (!deleting) onCancel(); }}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF7B72', flexShrink: 0 }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Delete Job</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>This action cannot be undone</div>
          </div>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            You are about to permanently delete:
          </p>
          <div style={{
            display: 'inline-block',
            background: 'var(--color-canvas)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            marginTop: 8,
            color: 'var(--color-text-primary)',
            wordBreak: 'break-all',
          }}>
            {jobName}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button
            className="btn btn-sm"
            style={{
              background: 'rgba(248, 81, 73, 0.1)',
              color: '#FF7B72',
              border: '1px solid rgba(248, 81, 73, 0.2)',
            }}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? <Loader size={13} className="spin" /> : <Trash2 size={13} />}
            {deleting ? 'Deleting…' : 'Delete Job'}
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
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (job?.id) loadDetails();
  }, [job]);

  useEffect(() => {
    if (details?.status !== 'running') return;
    const id = setInterval(loadDetails, 2000);
    return () => clearInterval(id);
  }, [details?.status]);

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
  const items = d.items || [];
  const errors = d.errors || [];

  const hasHtmlTags = /<[^>]+>/.test(scrapedContent);
  const displayContent = hasHtmlTags
    ? scrapedContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : scrapedContent;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 920 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(88, 166, 255, 0.1)', border: '1px solid rgba(88, 166, 255, 0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Briefcase size={18} color="#79B8FF" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.id}</div>
            </div>
          </div>
          <button className="action-btn" onClick={onClose} style={{ flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-border-subtle)', padding: '0 16px', flexShrink: 0, overflowX: 'auto' }}>
          <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
            Summary
          </button>
          <button className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
            <Database size={13} style={{ marginRight: 6 }} />
            Content
          </button>
          {errors.length > 0 && (
            <button className={`tab-btn ${activeTab === 'errors' ? 'active' : ''}`} onClick={() => setActiveTab('errors')}>
              <AlertCircle size={13} style={{ marginRight: 6 }} />
              Errors ({errors.length})
            </button>
          )}
        </div>

        <div className="modal-body">
          {activeTab === 'summary' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>Progress</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', fontWeight: 600 }}>{d.progress || 0}%</span>
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${d.progress || 0}%`,
                      background: d.status === 'failed' ? '#F85149' : 'var(--color-mdb-green)',
                    }}
                  />
                </div>
              </div>

              {status === 'running' && (
                <div style={{
                  background: 'rgba(88, 166, 255, 0.06)',
                  border: '1px solid rgba(88, 166, 255, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#79B8FF', fontWeight: 500, marginBottom: 12 }}>
                    <Activity size={14} />
                    Scraping in progress…
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: 12,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-secondary)',
                  }}>
                    <div>Pages: <strong style={{ color: 'var(--color-text-primary)' }}>{d.pages_processed || 0}</strong></div>
                    <div>Records: <strong style={{ color: 'var(--color-text-primary)' }}>{d.records || 0}</strong></div>
                    <div>Dupes: <strong style={{ color: 'var(--color-text-primary)' }}>{d.duplicates_removed || 0}</strong></div>
                    <div>Skipped: <strong style={{ color: 'var(--color-text-primary)' }}>{d.records_skipped || 0}</strong></div>
                    <div>Elapsed: <strong style={{ color: 'var(--color-text-primary)' }}>{Math.round(d.elapsed_seconds || 0)}s</strong></div>
                    <div>Errors: <strong style={{ color: 'var(--color-text-primary)' }}>{errors.length}</strong></div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <StatusPill status={status} />
              </div>

              {d.error_message && (
                <div style={{ background: 'rgba(248, 81, 73, 0.08)', border: '1px solid rgba(248, 81, 73, 0.2)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#FF7B72', marginBottom: 20 }}>
                  <AlertCircle size={14} />
                  <span style={{ wordBreak: 'break-word' }}>{d.error_message}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Records', value: recordCount, color: '#79B8FF' },
                  { label: 'Pages', value: d.pages_processed || 0, color: '#79B8FF' },
                  { label: 'Dupes', value: d.duplicates_removed || 0, color: '#E3B341' },
                  { label: 'Skipped', value: d.records_skipped || 0, color: '#E3B341' },
                  { label: 'Errors', value: errors.length, color: '#FF7B72' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)', color: stat.color }}>{stat.value.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { icon: <LinkIcon size={11} />, label: 'Target URL', value: <a href={d.target || d.url} target="_blank" rel="noopener noreferrer" style={{ color: '#79B8FF', textDecoration: 'none' }}>{(d.target || d.url || 'N/A').substring(0, 60)}</a> },
                  { icon: <Zap size={11} />, label: 'Mode', value: <>{d.mode || 'pagination'} · max {d.max_pages || 100}</> },
                  { icon: <Calendar size={11} />, label: 'Created', value: formatDate(d.created_at) },
                  { icon: <Clock size={11} />, label: 'Last Scraped', value: formatDate(d.scraped_at) || 'Never' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'content' && (
            <>
              {displayContent && !loading ? (
                <div>
                  {/* Content Header with Stats */}
                  <div className="content-header">
                    <div className="content-header-badge">
                      <Database size={13} color="#56D364" />
                      <span>Scraped Content</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="content-stat-chip">
                        <Hash size={10} />
                        {charCount.toLocaleString()} chars
                      </span>
                      <span className="content-stat-chip">
                        {wordCount.toLocaleString()} words
                      </span>
                    </div>
                  </div>

                  {/* Content Viewer */}
                  <div className="content-viewer">
                    {/* Subtle top gradient fade */}
                    <div className="content-fade-top" />

                    <div className="content-body">
                      {displayContent.split('\n').map((line, idx) => {
                        const trimmed = line.trim();

                        // Empty line spacing
                        if (!trimmed) return <div key={idx} className="content-empty-line" />;

                        // Divider lines
                        if (trimmed.startsWith('═')) {
                          return <div key={idx} className="content-divider" />;
                        }
                        if (trimmed.startsWith('─') && trimmed.length > 10) {
                          return <div key={idx} className="content-divider-subtle" />;
                        }

                        // Page markers and special prefixes
                        if (trimmed.startsWith('📄 PAGE') || trimmed.startsWith('🔗') ||
                            trimmed.startsWith('📝') || trimmed.startsWith('📊')) {
                          return (
                            <div key={idx} className="content-page-marker">
                              {trimmed}
                            </div>
                          );
                        }

                        // Markdown headings
                        if (trimmed.startsWith('### ')) {
                          return (
                            <div key={idx} className="content-h3">
                              {trimmed.replace('### ', '')}
                            </div>
                          );
                        }
                        if (trimmed.startsWith('## ')) {
                          return (
                            <div key={idx} className="content-h2">
                              {trimmed.replace('## ', '')}
                            </div>
                          );
                        }
                        if (trimmed.startsWith('# ')) {
                          return (
                            <div key={idx} className="content-h1">
                              {trimmed.replace('# ', '')}
                            </div>
                          );
                        }

                        // Bullet points
                        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') ||
                            trimmed.startsWith('  • ')) {
                          const isNested = trimmed.startsWith('  • ');
                          const content = trimmed.replace(/^[\s]*[•\-]\s*/, '');
                          return (
                            <div key={idx} className={`content-bullet ${isNested ? 'nested' : ''}`}>
                              <span className="content-bullet-dot" />
                              <span className="content-bullet-text">
                                {content}
                              </span>
                            </div>
                          );
                        }

                        // Regular paragraphs
                        return (
                          <div key={idx} className="content-paragraph">
                            {trimmed}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty State - Untitled UI Style */
                <div className="content-empty-state">
                  <div className="content-empty-icon-wrapper">
                    <Database size={24} color="var(--color-text-muted)" />
                    <div className="content-empty-icon-badge">
                      <Zap size={10} color="#E3B341" />
                    </div>
                  </div>

                  <div className="content-empty-title">
                    No content available
                  </div>

                  <div className="content-empty-desc">
                    Run this job to start scraping content. Results will appear here once the job completes.
                  </div>

                  <div className="content-empty-pill">
                    <Clock size={11} />
                    Waiting for scrape data
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'errors' && errors.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {errors.map((err, idx) => (
                <div key={idx} style={{ background: 'rgba(248, 81, 73, 0.06)', border: '1px solid rgba(248, 81, 73, 0.15)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#FF7B72', wordBreak: 'break-all', marginBottom: 4 }}>{err.url}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', wordBreak: 'break-word' }}>{err.error}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
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
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    mode: 'pagination',
    max_pages: 100,
    max_depth: 2,
    link_selector: '',
    auto_parse: false,
    parse_description: '',
  });
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
      loadJobs();
    }, 2000);
  }, [loadJobs]);

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
      setJobs(prevJobs => prevJobs.map(job => {
        if (job.id === jobUpdates.job_id) {
          return {
            ...job,
            status: jobUpdates.status || job.status,
            progress: jobUpdates.progress || job.progress,
            records: jobUpdates.records || job.records
          };
        }
        return job;
      }));

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
    if (!deleteTarget?.id) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/api/jobs/${deleteTarget.id}`);
      setSuccess(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await loadJobs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to delete job');
      setTimeout(() => setError(null), 4000);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Job name is required'); return; }
    if (!formData.url.trim()) { setError('Target URL is required'); return; }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        url: formData.url.trim(),
        target: formData.url.trim(),
        mode: formData.mode,
        max_pages: formData.max_pages,
        max_depth: formData.max_depth,
        link_selector: formData.link_selector || undefined,
        auto_parse: formData.auto_parse,
        parse_description: formData.parse_description || undefined,
      };
      await api.post('/api/jobs', payload);
      setFormData({
        name: '', url: '', mode: 'pagination', max_pages: 100, max_depth: 2,
        link_selector: '', auto_parse: false, parse_description: '',
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (loading && jobs.length === 0) {
    return (
      <div className="jobs-root page-enter">
        <div className="loading-state">
          <div className="loading-spinner" />
          <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading jobs…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="jobs-root page-enter">
      {/* Alerts */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 13,
          background: 'rgba(248, 81, 73, 0.08)', border: '1px solid rgba(248, 81, 73, 0.2)',
          color: '#FF7B72',
        }}>
          <AlertCircle size={15} />
          <span style={{ flex: 1 }}>{error}</span>
          <button style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', opacity: 0.7, padding: 4 }} onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 13,
          background: 'rgba(0, 237, 100, 0.08)', border: '1px solid rgba(0, 237, 100, 0.2)',
          color: '#56D364',
        }}>
          <CheckCircle size={15} />
          <span style={{ flex: 1 }}>{success}</span>
          <button style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', opacity: 0.7, padding: 4 }} onClick={() => setSuccess(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--color-border-subtle)', overflowX: 'auto' }}>
        <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          <Briefcase size={14} style={{ marginRight: 6 }} />
          All Jobs
        </button>
      </div>

      {/* Jobs List Tab */}
      {activeTab === 'list' && (
        <>
          <LiveProgressBanner jobs={jobs} />

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
                {loading && <RefreshCw size={14} className="spin" color="var(--color-text-muted)" />}
                {isPolling && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(88, 166, 255, 0.1)', border: '1px solid rgba(88, 166, 255, 0.2)', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 500, color: '#79B8FF' }}>
                    <Activity size={11} className="spin" /> Auto-refreshing
                  </span>
                )}
                {runningCount > 0 && !isPolling && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(88, 166, 255, 0.1)', border: '1px solid rgba(88, 166, 255, 0.2)', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 500, color: '#79B8FF' }}>
                    <Activity size={11} /> {runningCount} running
                  </span>
                )}
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('new')}>
                <Play size={13} /> New Job
              </button>
            </div>

            {paginatedJobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Briefcase size={20} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No jobs found</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
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
                            <td><span className="job-name">{job.name}</span></td>
                            <td>
                              <span className="mono-text url-cell">
                                {job.target || job.url || 'N/A'}
                              </span>
                            </td>
                            <td><StatusPill status={job.status} /></td>
                            <td>
                              <div className="progress-container">
                                <div className="progress-bar">
                                  <div
                                    className="progress-fill"
                                    style={{
                                      width: `${job.progress || 0}%`,
                                      background: isRunning ? '#58A6FF' :
                                                 job.status === 'failed' ? '#F85149' :
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
                                <button className="action-btn" title="View details" onClick={() => setSelectedJob(job)}>
                                  <Eye size={14} />
                                </button>
                                <button
                                  className="action-btn"
                                  title="Extract with AI"
                                  onClick={() => setParsingJob(job)}
                                  disabled={!job.scraped_content}
                                >
                                  <Brain size={14} />
                                </button>
                                {isRunning ? (
                                  <button className="action-btn" title="Pause job" onClick={() => handlePauseJob(job.id)}>
                                    <Pause size={14} />
                                  </button>
                                ) : (
                                  <button
                                    className="action-btn"
                                    title={job.status === 'queued' ? 'Start job' : 'Re-run job'}
                                    onClick={() => handleStartJob(job.id)}
                                  >
                                    <Play size={14} />
                                  </button>
                                )}
                                <button
                                  className="action-btn danger"
                                  title="Delete job"
                                  onClick={() => setDeleteTarget({ id: job.id, name: job.name })}
                                >
                                  <Trash2 size={14} />
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
                  totalItems={filteredJobs.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* New Job Tab */}
      {activeTab === 'new' && (
        <form onSubmit={handleCreateJob}>
          <div className="form-card">
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-primary)' }}>Configure Scraping Job</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Define the parameters for your data extraction job</div>
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
              <div className="form-group">
                <label className="form-label">Mode</label>
                <select
                  className="form-input"
                  value={formData.mode}
                  onChange={e => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                >
                  <option value="pagination">Pagination (follow Next / page-N)</option>
                  <option value="deep">Deep Crawl (follow internal links)</option>
                  <option value="details">Listing + Detail Pages</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Max Pages</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="5000"
                  value={formData.max_pages}
                  onChange={e => setFormData(prev => ({ ...prev, max_pages: parseInt(e.target.value) || 100 }))}
                />
              </div>
              {formData.mode === 'deep' && (
                <div className="form-group">
                  <label className="form-label">Max Depth</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="10"
                    value={formData.max_depth}
                    onChange={e => setFormData(prev => ({ ...prev, max_depth: parseInt(e.target.value) || 2 }))}
                  />
                </div>
              )}
              {formData.mode === 'details' && (
                <div className="form-group full-width">
                  <label className="form-label">Link Selector (CSS)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder='e.g., "h3 a" or ".product a"'
                    value={formData.link_selector}
                    onChange={e => setFormData(prev => ({ ...prev, link_selector: e.target.value }))}
                  />
                </div>
              )}
              <div className="form-group full-width">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.auto_parse}
                    onChange={e => setFormData(prev => ({ ...prev, auto_parse: e.target.checked }))}
                    style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--color-mdb-green)' }}
                  />
                  Auto-parse results with AI after scraping
                </label>
              </div>
              {formData.auto_parse && (
                <div className="form-group full-width">
                  <label className="form-label">Parse Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="e.g., Extract product name, price, and rating as JSON"
                    value={formData.parse_description}
                    onChange={e => setFormData(prev => ({ ...prev, parse_description: e.target.value }))}
                    style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                  />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFormData({
                    name: '', url: '', mode: 'pagination', max_pages: 100, max_depth: 2,
                    link_selector: '', auto_parse: false, parse_description: '',
                  });
                  setActiveTab('list');
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? <Loader size={13} className="spin" /> : <Play size={13} />}
                {submitting ? 'Creating…' : 'Create Job'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Modals */}
      {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
      {parsingJob && <ParsingPanel jobId={parsingJob.id} jobName={parsingJob.name} onClose={() => setParsingJob(null)} />}
      {deleteTarget && (
        <DeleteConfirmModal
          jobName={deleteTarget.name}
          onConfirm={handleDeleteJob}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}