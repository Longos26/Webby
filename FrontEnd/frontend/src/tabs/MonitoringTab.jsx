// frontend/src/pages/MonitoringTab.jsx - MONITORING & LOGS ENTERPRISE EDITION

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Activity, Play, Pause, X, RefreshCw, AlertCircle, CheckCircle,
  Clock, Database, Globe, Zap, Eye, Trash2, RotateCcw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, Filter, Download, Terminal, AlertTriangle, Info,
  StopCircle, Timer, TrendingUp, Server, Wifi, WifiOff,
  FileText, Hash, Layers, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, List, Grid, Maximize2, Minimize2,
  CircleDot, Loader2, Brain, Link as LinkIcon, Calendar,
  Briefcase, PlayCircle
} from 'lucide-react';
import api from '../api';
import { useWebSocket } from '../hooks/useWebSocket';

// ============================================================
// STYLES (unchanged — keep your existing STYLES block)
// ============================================================

const STYLES = `
  .monitoring-root {
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
  .monitoring-root * { margin: 0; padding: 0; box-sizing: border-box; }
  .monitoring-root {
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    background: var(--color-canvas);
    line-height: 1.5;
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
  }
  @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
  .monitoring-root .page-enter { animation: fadeSlideIn 0.2s ease-out; }
  .monitoring-root .spin { animation: spin 0.7s linear infinite; }
  .monitoring-root .blink { animation: blink 1s ease-in-out infinite; }
  .monitoring-root .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .monitoring-root .stat-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px 18px; transition: border-color var(--transition); }
  .monitoring-root .stat-card:hover { border-color: #484F58; }
  .monitoring-root .stat-card.running { border-color: rgba(88, 166, 255, 0.3); background: linear-gradient(135deg, var(--color-surface) 0%, rgba(88, 166, 255, 0.05) 100%); }
  .monitoring-root .stat-icon { width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
  .monitoring-root .stat-icon.blue { background: rgba(88, 166, 255, 0.1); color: #79B8FF; }
  .monitoring-root .stat-icon.green { background: rgba(0, 237, 100, 0.1); color: #56D364; }
  .monitoring-root .stat-icon.red { background: rgba(248, 81, 73, 0.1); color: #FF7B72; }
  .monitoring-root .stat-icon.yellow { background: rgba(210, 153, 34, 0.1); color: #E3B341; }
  .monitoring-root .stat-icon.purple { background: rgba(163, 113, 247, 0.1); color: #A371F7; }
  .monitoring-root .stat-value { font-size: 24px; font-weight: 600; font-family: var(--font-mono); color: var(--color-text-primary); line-height: 1.2; margin-bottom: 2px; }
  .monitoring-root .stat-label { font-size: 12px; color: var(--color-text-muted); display: flex; align-items: center; gap: 4px; }
  .monitoring-root .tab-nav { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border-subtle); margin-bottom: 20px; overflow-x: auto; padding-bottom: 1px; }
  .monitoring-root .tab-btn { padding: 10px 16px; font-size: 13px; font-weight: 500; background: none; border: none; color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition); border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; font-family: inherit; }
  .monitoring-root .tab-btn:hover { color: var(--color-text-primary); }
  .monitoring-root .tab-btn.active { color: #56D364; border-bottom-color: var(--color-mdb-green); }
  .monitoring-root .tab-btn .badge { font-size: 10px; padding: 1px 6px; border-radius: var(--radius-full); background: var(--color-canvas); border: 1px solid var(--color-border); color: var(--color-text-muted); }
  .monitoring-root .tab-btn.active .badge { background: rgba(0, 237, 100, 0.1); border-color: rgba(0, 237, 100, 0.2); color: #56D364; }
  .monitoring-root .live-jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; }
  .monitoring-root .live-job-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: border-color var(--transition); }
  .monitoring-root .live-job-card:hover { border-color: #484F58; }
  .monitoring-root .live-job-card.running { border-color: rgba(88, 166, 255, 0.4); }
  .monitoring-root .live-job-header { padding: 14px 16px; border-bottom: 1px solid var(--color-border-subtle); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .monitoring-root .live-job-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .monitoring-root .live-job-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .monitoring-root .live-job-url { font-size: 11px; font-family: var(--font-mono); color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
  .monitoring-root .live-job-body { padding: 16px; }
  .monitoring-root .live-progress-bar { height: 8px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden; margin-bottom: 12px; }
  .monitoring-root .live-progress-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.5s ease; position: relative; }
  .monitoring-root .live-progress-fill::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: shimmer 1.5s infinite; }
  .monitoring-root .live-telemetry { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
  .monitoring-root .telemetry-item { text-align: center; }
  .monitoring-root .telemetry-value { font-size: 16px; font-weight: 600; font-family: var(--font-mono); color: var(--color-text-primary); }
  .monitoring-root .telemetry-label { font-size: 10px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .monitoring-root .live-job-actions { display: flex; gap: 6px; flex-wrap: wrap; }
  .monitoring-root .live-btn { flex: 1 1 auto; min-width: 80px; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 8px 12px; border-radius: var(--radius-md); font-size: 12px; font-weight: 500; cursor: pointer; transition: all var(--transition); font-family: inherit; border: 1px solid transparent; }
  .monitoring-root .live-btn.pause { background: rgba(210, 153, 34, 0.1); border-color: rgba(210, 153, 34, 0.2); color: #E3B341; }
  .monitoring-root .live-btn.pause:hover { background: rgba(210, 153, 34, 0.2); }
  .monitoring-root .live-btn.resume { background: rgba(0, 237, 100, 0.1); border-color: rgba(0, 237, 100, 0.2); color: #56D364; }
  .monitoring-root .live-btn.resume:hover { background: rgba(0, 237, 100, 0.2); }
  .monitoring-root .live-btn.cancel { background: rgba(248, 81, 73, 0.1); border-color: rgba(248, 81, 73, 0.2); color: #FF7B72; }
  .monitoring-root .live-btn.cancel:hover { background: rgba(248, 81, 73, 0.2); }
  .monitoring-root .live-btn.view { background: var(--color-canvas); border-color: var(--color-border); color: var(--color-text-secondary); }
  .monitoring-root .live-btn.view:hover { border-color: #484F58; color: var(--color-text-primary); }
  .monitoring-root .live-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .monitoring-root .log-viewer { background: var(--color-canvas); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
  .monitoring-root .log-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; gap: 10px; background: var(--color-surface); }
  .monitoring-root .log-filters { display: flex; gap: 6px; flex-wrap: wrap; }
  .monitoring-root .log-filter-btn { padding: 5px 12px; font-size: 11px; font-weight: 500; background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-full); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition); font-family: inherit; display: inline-flex; align-items: center; gap: 4px; }
  .monitoring-root .log-filter-btn:hover { border-color: #484F58; color: var(--color-text-primary); }
  .monitoring-root .log-filter-btn.active { background: rgba(0, 237, 100, 0.1); border-color: rgba(0, 237, 100, 0.2); color: #56D364; }
  .monitoring-root .log-filter-btn.error.active { background: rgba(248, 81, 73, 0.1); border-color: rgba(248, 81, 73, 0.2); color: #FF7B72; }
  .monitoring-root .log-filter-btn.warning.active { background: rgba(210, 153, 34, 0.1); border-color: rgba(210, 153, 34, 0.2); color: #E3B341; }
  .monitoring-root .log-search { position: relative; flex: 1; min-width: 200px; max-width: 300px; }
  .monitoring-root .log-search-input { width: 100%; padding: 7px 12px 7px 32px; background: var(--color-canvas); border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text-primary); font-size: 12px; font-family: var(--font-sans); outline: none; transition: border-color var(--transition); }
  .monitoring-root .log-search-input:focus { border-color: var(--color-mdb-green); }
  .monitoring-root .log-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); pointer-events: none; }
  .monitoring-root .log-entries { max-height: 500px; overflow-y: auto; font-family: var(--font-mono); font-size: 12px; line-height: 1.6; }
  .monitoring-root .log-entries::-webkit-scrollbar { width: 8px; }
  .monitoring-root .log-entries::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: var(--radius-full); }
  .monitoring-root .log-entry { display: flex; padding: 8px 16px; border-bottom: 1px solid var(--color-border-subtle); gap: 12px; transition: background var(--transition); }
  .monitoring-root .log-entry:hover { background: var(--color-surface); }
  .monitoring-root .log-entry.error { background: rgba(248, 81, 73, 0.05); border-left: 3px solid #F85149; }
  .monitoring-root .log-entry.warning { background: rgba(210, 153, 34, 0.05); border-left: 3px solid #D29922; }
  .monitoring-root .log-entry.success { background: rgba(0, 237, 100, 0.03); border-left: 3px solid #00ED64; }
  .monitoring-root .log-entry.info { border-left: 3px solid #58A6FF; }
  .monitoring-root .log-timestamp { color: var(--color-text-muted); flex-shrink: 0; min-width: 85px; }
  .monitoring-root .log-level { flex-shrink: 0; min-width: 60px; font-weight: 600; text-transform: uppercase; font-size: 10px; padding-top: 2px; }
  .monitoring-root .log-level.error { color: #FF7B72; }
  .monitoring-root .log-level.warning { color: #E3B341; }
  .monitoring-root .log-level.success { color: #56D364; }
  .monitoring-root .log-level.info { color: #79B8FF; }
  .monitoring-root .log-message { flex: 1; color: var(--color-text-secondary); word-break: break-word; }
  .monitoring-root .log-source { flex-shrink: 0; color: var(--color-text-muted); font-size: 11px; padding: 2px 8px; background: var(--color-surface); border-radius: var(--radius-sm); height: fit-content; }
  .monitoring-root .error-list { display: flex; flex-direction: column; gap: 12px; }
  .monitoring-root .error-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
  .monitoring-root .error-card-header { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); background: rgba(248, 81, 73, 0.05); gap: 12px; flex-wrap: wrap; }
  .monitoring-root .error-card-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #FF7B72; }
  .monitoring-root .error-card-body { padding: 14px 16px; }
  .monitoring-root .error-url { font-family: var(--font-mono); font-size: 11px; color: var(--color-text-muted); margin-bottom: 8px; word-break: break-all; padding: 6px 10px; background: var(--color-canvas); border-radius: var(--radius-sm); }
  .monitoring-root .error-message { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }
  .monitoring-root .error-actions { padding: 10px 16px; border-top: 1px solid var(--color-border-subtle); display: flex; gap: 8px; justify-content: flex-end; }
  .monitoring-root .history-table-container { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
  .monitoring-root .history-table { width: 100%; border-collapse: collapse; min-width: 800px; }
  .monitoring-root .history-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 500; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); background: var(--color-surface); white-space: nowrap; text-transform: uppercase; letter-spacing: 0.04em; }
  .monitoring-root .history-table td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid var(--color-border-subtle); vertical-align: middle; color: var(--color-text-secondary); }
  .monitoring-root .history-table tr:last-child td { border-bottom: none; }
  .monitoring-root .history-table tbody tr { transition: background var(--transition); }
  .monitoring-root .history-table tbody tr:hover { background: var(--color-surface-elevated); }
  .monitoring-root .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 500; white-space: nowrap; }
  .monitoring-root .status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .monitoring-root .status-pill.running { background: rgba(88, 166, 255, 0.1); color: #79B8FF; border: 1px solid rgba(88, 166, 255, 0.2); }
  .monitoring-root .status-pill.running .status-dot { background: #58A6FF; animation: pulse-dot 1.5s ease-in-out infinite; }
  .monitoring-root .status-pill.success { background: rgba(0, 237, 100, 0.1); color: #56D364; border: 1px solid rgba(0, 237, 100, 0.2); }
  .monitoring-root .status-pill.success .status-dot { background: #00ED64; }
  .monitoring-root .status-pill.failed { background: rgba(248, 81, 73, 0.1); color: #FF7B72; border: 1px solid rgba(248, 81, 73, 0.2); }
  .monitoring-root .status-pill.failed .status-dot { background: #F85149; }
  .monitoring-root .status-pill.paused { background: rgba(210, 153, 34, 0.1); color: #E3B341; border: 1px solid rgba(210, 153, 34, 0.2); }
  .monitoring-root .status-pill.paused .status-dot { background: #D29922; }
  .monitoring-root .status-pill.queued { background: rgba(110, 118, 129, 0.1); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
  .monitoring-root .status-pill.queued .status-dot { background: var(--color-text-muted); }
  .monitoring-root .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: var(--radius-md); font-size: 13px; font-weight: 500; font-family: var(--font-sans); cursor: pointer; transition: all var(--transition); border: none; white-space: nowrap; }
  .monitoring-root .btn-primary { background: var(--color-mdb-green); color: #0D1117; }
  .monitoring-root .btn-primary:hover:not(:disabled) { background: var(--color-mdb-green-dark); }
  .monitoring-root .btn-secondary { background: var(--color-surface); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
  .monitoring-root .btn-secondary:hover:not(:disabled) { background: var(--color-surface-elevated); color: var(--color-text-primary); border-color: #484F58; }
  .monitoring-root .btn-danger { background: rgba(248, 81, 73, 0.1); color: #FF7B72; border: 1px solid rgba(248, 81, 73, 0.2); }
  .monitoring-root .btn-danger:hover:not(:disabled) { background: rgba(248, 81, 73, 0.2); }
  .monitoring-root .btn-sm { padding: 6px 12px; font-size: 12px; }
  .monitoring-root .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .monitoring-root .action-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); color: var(--color-text-muted); cursor: pointer; transition: all var(--transition); }
  .monitoring-root .action-btn:hover:not(:disabled) { background: var(--color-surface-elevated); border-color: var(--color-border); color: var(--color-text-primary); }
  .monitoring-root .action-btn.danger:hover:not(:disabled) { color: #FF7B72; background: rgba(248, 81, 73, 0.08); border-color: rgba(248, 81, 73, 0.2); }
  .monitoring-root .action-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .monitoring-root .empty-state { text-align: center; padding: 56px 24px; }
  .monitoring-root .empty-icon { width: 56px; height: 56px; margin: 0 auto 16px; background: var(--color-canvas); border: 1px solid var(--color-border); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); }
  .monitoring-root .empty-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; color: var(--color-text-primary); }
  .monitoring-root .empty-desc { font-size: 13px; color: var(--color-text-muted); }
  .monitoring-root .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 24px; gap: 12px; }
  .monitoring-root .loading-spinner { width: 24px; height: 24px; border: 2px solid var(--color-border); border-top-color: var(--color-mdb-green); border-radius: 50%; animation: spin 0.7s linear infinite; }
  .monitoring-root .pagination-container { padding: 14px 16px; border-top: 1px solid var(--color-border-subtle); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .monitoring-root .pagination-info { font-size: 12px; color: var(--color-text-muted); }
  .monitoring-root .pagination-controls { display: flex; align-items: center; gap: 4px; }
  .monitoring-root .page-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 12px; font-weight: 500; color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition); font-family: inherit; }
  .monitoring-root .page-btn:hover:not(:disabled) { background: var(--color-surface-elevated); color: var(--color-text-primary); border-color: #484F58; }
  .monitoring-root .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .monitoring-root .page-number { min-width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); font-size: 12px; font-weight: 500; color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition); font-family: inherit; }
  .monitoring-root .page-number:hover { background: var(--color-surface-elevated); color: var(--color-text-primary); }
  .monitoring-root .page-number.active { background: rgba(0, 237, 100, 0.1); color: #56D364; border-color: rgba(0, 237, 100, 0.2); }

  /* ---------- Modal ---------- */
  .monitoring-root .modal-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(13, 17, 23, 0.85); backdrop-filter: blur(4px); }
  .monitoring-root .modal { width: 100%; max-width: 640px; max-height: 90vh; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5); }
  .monitoring-root .modal-header { padding: 16px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--color-border-subtle); flex-shrink: 0; }
  .monitoring-root .modal-body { padding: 20px; overflow-y: auto; flex: 1; }
  .monitoring-root .modal-footer { padding: 16px 20px; display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid var(--color-border-subtle); background: var(--color-canvas); flex-shrink: 0; flex-wrap: wrap; }

  @media (max-width: 768px) {
    .monitoring-root .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .monitoring-root .live-jobs-grid { grid-template-columns: 1fr; }
    .monitoring-root .live-telemetry { grid-template-columns: repeat(2, 1fr); }
    .monitoring-root .log-entry { flex-wrap: wrap; gap: 6px; }
    .monitoring-root .log-timestamp { min-width: auto; }
    .monitoring-root .log-level { min-width: auto; }
    .monitoring-root .log-source { display: none; }
  }
  @media (max-width: 480px) {
    .monitoring-root .stats-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .monitoring-root .stat-card { padding: 12px 14px; }
    .monitoring-root .stat-value { font-size: 20px; }
    .monitoring-root .live-btn { flex: 1 1 45%; min-width: 0; }
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
// HELPERS
// ============================================================

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const formatFullDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString();
};

const getErrorMessage = (err) => {
  if (err.response?.data?.detail) {
    const detail = err.response.data.detail;
    if (Array.isArray(detail)) return detail.map(d => d.msg).join(', ');
    if (typeof detail === 'string') return detail;
  }
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message) return err.message;
  return 'An unexpected error occurred';
};

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
// STAT CARD
// ============================================================

function StatCard({ icon: Icon, value, label, color = 'blue' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={18} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ============================================================
// LIVE JOB CARD
// ============================================================

function LiveJobCard({ job, onPause, onResume, onCancel, onView }) {
  const isRunning = job.status === 'running';
  const isPaused = job.status === 'paused';
  const progress = job.progress || 0;

  return (
    <div className={`live-job-card ${isRunning ? 'running' : ''}`}>
      <div className="live-job-header">
        <div className="live-job-title">
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: isRunning ? 'rgba(88, 166, 255, 0.1)' : 'var(--color-canvas)',
            border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {isRunning ? (
              <Activity size={15} color="#79B8FF" className="blink" />
            ) : isPaused ? (
              <Pause size={15} color="#E3B341" />
            ) : (
              <Clock size={15} color="var(--color-text-muted)" />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="live-job-name">{job.name}</div>
            <div className="live-job-url">{job.target || job.url}</div>
          </div>
        </div>
        <StatusPill status={job.status} />
      </div>

      <div className="live-job-body">
        <div className="live-progress-bar">
          <div
            className="live-progress-fill"
            style={{
              width: `${progress}%`,
              background: isRunning
                ? 'linear-gradient(90deg, #58A6FF, #79B8FF)'
                : isPaused
                ? '#D29922'
                : 'var(--color-mdb-green)',
            }}
          />
        </div>

        <div className="live-telemetry">
          <div className="telemetry-item">
            <div className="telemetry-value">{progress}%</div>
            <div className="telemetry-label">Progress</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-value">
              {job.pages_processed || 0}
              {job.pages_discovered > 0 && `/${job.pages_discovered}`}
            </div>
            <div className="telemetry-label">Pages</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-value">{formatNumber(job.records || 0)}</div>
            <div className="telemetry-label">Records</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-value">{formatDuration(job.elapsed_seconds || 0)}</div>
            <div className="telemetry-label">Elapsed</div>
          </div>
        </div>

        {(job.last_page || job.current_url) && (
          <div style={{
            padding: '8px 10px',
            background: 'var(--color-canvas)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-muted)',
            marginBottom: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {job.current_url || job.last_page}
          </div>
        )}

        <div className="live-job-actions">
          {isRunning && (
            <button className="live-btn pause" onClick={() => onPause(job.id)}>
              <Pause size={12} /> Pause
            </button>
          )}
          {isPaused && (
            <button className="live-btn resume" onClick={() => onResume(job.id)}>
              <Play size={12} /> Resume
            </button>
          )}
          {job.status === 'queued' && (
            <button className="live-btn resume" onClick={() => onResume(job.id)}>
              <Play size={12} /> Start
            </button>
          )}
          <button className="live-btn view" onClick={() => onView(job)}>
            <Eye size={12} /> Details
          </button>
          <button className="live-btn cancel" onClick={() => onCancel(job)}>
            <StopCircle size={12} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LOG ENTRY
// ============================================================

function LogEntry({ log }) {
  const level = log.level?.toLowerCase() || 'info';
  const timestamp = new Date(log.timestamp || log.created_at);
  const timeStr = timestamp.toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div className={`log-entry ${level}`}>
      <span className="log-timestamp">{timeStr}</span>
      <span className={`log-level ${level}`}>{level}</span>
      <span className="log-message">{log.message}</span>
      {log.source && <span className="log-source">{log.source}</span>}
    </div>
  );
}

// ============================================================
// ERROR CARD
// ============================================================

function ErrorCard({ error, onRetry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="error-card">
      <div className="error-card-header">
        <div className="error-card-title">
          <AlertTriangle size={14} />
          Extraction Error
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {formatDate(error.timestamp || error.created_at)}
          </span>
          <button
            className="action-btn"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      <div className="error-card-body">
        {error.url && <div className="error-url">{error.url}</div>}
        <div className="error-message">
          {expanded
            ? error.error || error.message
            : (error.error || error.message || '').substring(0, 200)}
          {!expanded && (error.error || error.message || '').length > 200 && '...'}
        </div>
      </div>

      <div className="error-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onRetry(error)}
          disabled={!error.job_id}
        >
          <RotateCcw size={12} /> Retry Job
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PAGINATION
// ============================================================

function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  if (totalPages <= 1) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push(null); pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1); pages.push(null);
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1); pages.push(null);
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push(null); pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing <strong style={{ color: 'var(--color-text-primary)' }}>{startItem}–{endItem}</strong> of{' '}
        <strong style={{ color: 'var(--color-text-primary)' }}>{totalItems}</strong>
      </div>
      <div className="pagination-controls">
        <button className="page-btn" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
          <ChevronsLeft size={13} />
        </button>
        <button className="page-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft size={13} />
        </button>
        {getPageNumbers().map((page, idx) =>
          page === null ? (
            <span key={`ellipsis-${idx}`} className="page-number" style={{ cursor: 'default', color: 'var(--color-text-muted)' }}>…</span>
          ) : (
            <button key={page} className={`page-number ${currentPage === page ? 'active' : ''}`} onClick={() => onPageChange(page)}>
              {page}
            </button>
          )
        )}
        <button className="page-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <ChevronRight size={13} />
        </button>
        <button className="page-btn" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
          <ChevronsRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// JOB DETAILS MODAL
// ============================================================

function JobDetailsModal({ job, onClose, onRetry, onPause, onCancel }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/jobs/${job.id}`);
        setDetails(res.data);
      } catch (err) {
        console.error('Failed to load job details:', err);
        setDetails(job);
      } finally {
        setLoading(false);
      }
    };
    if (job?.id) load();
  }, [job]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const d = details || job;
  const isRunning = d.status === 'running';
  const isPaused = d.status === 'paused';
  const errors = d.errors || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-md)',
            background: isRunning ? 'rgba(88, 166, 255, 0.1)' : 'rgba(0, 237, 100, 0.1)',
            border: `1px solid ${isRunning ? 'rgba(88, 166, 255, 0.2)' : 'rgba(0, 237, 100, 0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Briefcase size={18} color={isRunning ? '#79B8FF' : '#56D364'} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.name}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.id}
            </div>
          </div>
          <StatusPill status={d.status} />
          <button className="action-btn" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-border-subtle)', padding: '0 16px', flexShrink: 0, overflowX: 'auto' }}>
          <button
            className="tab-btn"
            style={{
              color: activeTab === 'overview' ? '#56D364' : 'var(--color-text-secondary)',
              borderBottomColor: activeTab === 'overview' ? 'var(--color-mdb-green)' : 'transparent',
            }}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          {errors.length > 0 && (
            <button
              className="tab-btn"
              style={{
                color: activeTab === 'errors' ? '#FF7B72' : 'var(--color-text-secondary)',
                borderBottomColor: activeTab === 'errors' ? '#F85149' : 'transparent',
              }}
              onClick={() => setActiveTab('errors')}
            >
              <AlertCircle size={13} style={{ marginRight: 6 }} />
              Errors ({errors.length})
            </button>
          )}
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state" style={{ padding: '32px 24px' }}>
              <div className="loading-spinner" />
              <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Loading…</span>
            </div>
          ) : activeTab === 'overview' ? (
            <>
              {/* Progress */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>Progress</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', fontWeight: 600 }}>{d.progress || 0}%</span>
                </div>
                <div className="live-progress-bar" style={{ height: 6, marginBottom: 0 }}>
                  <div
                    className="live-progress-fill"
                    style={{
                      width: `${d.progress || 0}%`,
                      background: d.status === 'failed' ? '#F85149' :
                                 d.status === 'paused' ? '#D29922' :
                                 d.status === 'running' ? 'linear-gradient(90deg, #58A6FF, #79B8FF)' :
                                 'var(--color-mdb-green)',
                    }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Records', value: d.records || 0, color: '#79B8FF' },
                  { label: 'Pages', value: d.pages_processed || 0, color: '#79B8FF' },
                  { label: 'Dupes', value: d.duplicates_removed || 0, color: '#E3B341' },
                  { label: 'Skipped', value: d.records_skipped || 0, color: '#E3B341' },
                  { label: 'Errors', value: errors.length, color: '#FF7B72' },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: 'var(--color-canvas)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 12,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color }}>{formatNumber(s.value)}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Error message */}
              {d.error_message && (
                <div style={{
                  background: 'rgba(248, 81, 73, 0.08)',
                  border: '1px solid rgba(248, 81, 73, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: 10,
                  fontSize: 13,
                  color: '#FF7B72',
                  marginBottom: 20,
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ wordBreak: 'break-word' }}>{d.error_message}</span>
                </div>
              )}

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { icon: <LinkIcon size={11} />, label: 'Target URL', value: <a href={d.target || d.url} target="_blank" rel="noopener noreferrer" style={{ color: '#79B8FF', textDecoration: 'none', wordBreak: 'break-all' }}>{d.target || d.url || 'N/A'}</a> },
                  { icon: <Zap size={11} />, label: 'Mode', value: <>{d.mode || 'pagination'}</> },
                  { icon: <Calendar size={11} />, label: 'Created', value: formatFullDate(d.created_at) },
                  { icon: <Clock size={11} />, label: 'Scraped At', value: formatFullDate(d.scraped_at) || 'Never' },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'var(--color-canvas)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {errors.map((err, idx) => (
                <div key={idx} style={{
                  background: 'rgba(248, 81, 73, 0.06)',
                  border: '1px solid rgba(248, 81, 73, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#FF7B72', wordBreak: 'break-all', marginBottom: 4 }}>{err.url}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', wordBreak: 'break-word' }}>{err.error}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {isRunning && (
            <button className="btn btn-secondary btn-sm" onClick={() => onPause(d.id)}>
              <Pause size={13} /> Pause
            </button>
          )}
          {isPaused && (
            <button className="btn btn-primary btn-sm" onClick={() => onRetry(d.id)}>
              <Play size={13} /> Resume
            </button>
          )}
          {(d.status === 'failed' || d.status === 'cancelled') && (
            <button className="btn btn-primary btn-sm" onClick={() => onRetry(d.id)}>
              <RotateCcw size={13} /> Retry Job
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CANCEL CONFIRM MODAL
// ============================================================

function CancelConfirmModal({ job, onCancel, onConfirm, cancelling }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !cancelling) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, cancelling]);

  return (
    <div className="modal-overlay" onClick={() => { if (!cancelling) onCancel(); }}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-md)',
            background: 'rgba(248, 81, 73, 0.1)',
            border: '1px solid rgba(248, 81, 73, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF7B72', flexShrink: 0,
          }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Cancel Job</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>This will stop the running job</div>
          </div>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Are you sure you want to cancel this job? Progress may be lost.
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
            {job?.name}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={cancelling}>
            Keep Running
          </button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm} disabled={cancelling}>
            {cancelling ? <Loader2 size={13} className="spin" /> : <StopCircle size={13} />}
            {cancelling ? 'Cancelling…' : 'Cancel Job'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN MONITORING COMPONENT
// ============================================================

export default function MonitoringTab() {
  const [activeTab, setActiveTab] = useState('live');
  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedJob, setSelectedJob] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshInterval = useRef(null);
  const { jobUpdates } = useWebSocket(null);

  injectStyles('monitoring-styles', STYLES);

  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadJobs = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get('/api/jobs');
      const jobsData = Array.isArray(response.data) ? response.data :
                       response.data.jobs || response.data.data || [];
      setJobs(jobsData);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      if (showLoading) {
        setError('Failed to load jobs');
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      // Try the monitoring endpoint first
      let activitiesData = [];
      try {
        const response = await api.get('/api/monitoring/logs?limit=100');
        activitiesData = response.data?.logs || [];
      } catch {
        // Fall back to activity endpoint
        const response = await api.get('/api/activity/recent?limit=100');
        activitiesData = response.data?.activities || response.data || [];
      }

      const transformedLogs = activitiesData.map(activity => ({
        id: activity.id || activity._id,
        level: activity.level || (
          activity.type === 'error' || activity.type === 'job_failed' ? 'error' :
          activity.type === 'warning' ? 'warning' :
          activity.type === 'success' || activity.type === 'job_completed' ? 'success' :
          'info'
        ),
        message: activity.description || activity.message || activity.title,
        source: activity.source || 'system',
        timestamp: activity.timestamp || activity.created_at,
        job_id: activity.job_id,
      }));

      setLogs(transformedLogs);
    } catch (err) {
      console.error('Failed to load logs:', err);
      setLogs([]);
    }
  }, []);

  const loadErrors = useCallback(async () => {
    try {
      const response = await api.get('/api/monitoring/errors?limit=50');
      setErrors(response.data?.errors || []);
    } catch (err) {
      console.error('Failed to load errors:', err);
      // Derive errors from logs as fallback
      setErrors(prev => {
        const errLogs = logs.filter(l => l.level === 'error').map(l => ({
          id: l.id,
          message: l.message,
          job_id: l.job_id,
          error: l.message,
          timestamp: l.timestamp,
        }));
        return errLogs;
      });
    }
  }, [logs]);

  // ============================================================
  // ACTIONS
  // ============================================================

  const handlePauseJob = async (jobId) => {
    setActionLoading(jobId);
    try {
      await api.post(`/api/jobs/${jobId}/pause`);
      setSuccess('Job paused');
      await loadJobs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to pause job');
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeJob = async (jobId) => {
    setActionLoading(jobId);
    try {
      await api.post(`/api/jobs/${jobId}/start`);
      setSuccess('Job started');
      await loadJobs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to start job');
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = (job) => {
    setCancelTarget(job);
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget?.id) return;
    setCancelling(true);
    try {
      // Try monitoring cancel first, fall back to jobs cancel
      try {
        await api.post(`/api/monitoring/cancel/${cancelTarget.id}`);
      } catch {
        await api.post(`/api/jobs/${cancelTarget.id}/cancel`);
      }
      setSuccess(`"${cancelTarget.name}" cancelled`);
      setCancelTarget(null);
      await loadJobs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to cancel job');
      setTimeout(() => setError(null), 4000);
    } finally {
      setCancelling(false);
    }
  };

  const handleRetryJob = async (jobId) => {
    if (!jobId) return;
    setActionLoading(jobId);
    try {
      try {
        await api.post(`/api/monitoring/retry/${jobId}`);
      } catch {
        await api.post(`/api/jobs/${jobId}/start`);
      }
      setSuccess('Job restarted');
      await loadJobs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to restart job');
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryError = (errorItem) => {
    if (errorItem.job_id) {
      handleRetryJob(errorItem.job_id);
    } else {
      setError('Cannot retry — no associated job ID');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadJobs(), loadLogs(), loadErrors()]);
    setRefreshing(false);
  };

  const handleExportLogs = () => {
    const text = filteredLogs.map(l => {
      const ts = new Date(l.timestamp).toISOString();
      return `[${ts}] [${l.level.toUpperCase()}] [${l.source || 'system'}] ${l.message}`;
    }).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-logs-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccess('Logs exported');
    setTimeout(() => setSuccess(null), 3000);
  };

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadJobs(true), loadLogs()]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load errors when jobs change (derives from active jobs)
  useEffect(() => {
    const jobErrors = [];
    jobs.forEach(job => {
      if (job.errors && Array.isArray(job.errors)) {
        job.errors.forEach((e, i) => {
          jobErrors.push({
            id: `${job.id}-${i}`,
            job_id: job.id,
            job_name: job.name,
            url: e.url,
            error: e.error,
            message: e.error,
            timestamp: job.updated_at || job.created_at,
          });
        });
      }
    });
    if (jobErrors.length > 0) {
      setErrors(jobErrors);
    }
  }, [jobs]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        loadJobs();
        if (activeTab === 'logs') loadLogs();
      }, 3000);
    }
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [autoRefresh, loadJobs, loadLogs, activeTab]);

  // WebSocket updates
  useEffect(() => {
    if (jobUpdates) {
      setJobs(prev => prev.map(job => {
        if (job.id === jobUpdates.job_id) {
          return {
            ...job,
            status: jobUpdates.status || job.status,
            progress: jobUpdates.progress ?? job.progress,
            records: jobUpdates.records ?? job.records,
            pages_processed: jobUpdates.pages_processed ?? job.pages_processed,
            current_url: jobUpdates.current_url,
          };
        }
        return job;
      }));
    }
  }, [jobUpdates]);

  // ============================================================
  // COMPUTED
  // ============================================================

  const stats = useMemo(() => ({
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'success' || j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    queued: jobs.filter(j => j.status === 'queued').length,
    totalRecords: jobs.reduce((sum, j) => sum + (j.records || 0), 0),
    totalPages: jobs.reduce((sum, j) => sum + (j.pages_processed || 0), 0),
  }), [jobs]);

  const runningJobs = useMemo(() => jobs.filter(j => j.status === 'running'), [jobs]);
  const activeJobs = useMemo(
    () => jobs.filter(j => ['running', 'queued', 'paused'].includes(j.status)),
    [jobs]
  );

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (logFilter !== 'all') result = result.filter(l => l.level === logFilter);
    if (logSearch.trim()) {
      const search = logSearch.toLowerCase();
      result = result.filter(l =>
        l.message?.toLowerCase().includes(search) ||
        l.source?.toLowerCase().includes(search)
      );
    }
    return result;
  }, [logs, logFilter, logSearch]);

  const paginatedJobs = useMemo(
    () => jobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [jobs, currentPage, itemsPerPage]
  );

  const totalPages = Math.ceil(jobs.length / itemsPerPage);

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="monitoring-root page-enter">
        <div className="loading-state">
          <div className="loading-spinner" />
          <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading monitoring data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="monitoring-root page-enter">
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
          <button
            style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', opacity: 0.7, padding: 4 }}
            onClick={() => setError(null)}
          >
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
          <button
            style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', opacity: 0.7, padding: 4 }}
            onClick={() => setSuccess(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={Activity} value={stats.running} label="Running Now" color="blue" />
        <StatCard icon={CheckCircle} value={stats.completed} label="Completed" color="green" />
        <StatCard icon={AlertCircle} value={stats.failed} label="Failed" color="red" />
        <StatCard icon={Clock} value={stats.queued} label="Queued" color="yellow" />
        <StatCard icon={Database} value={formatNumber(stats.totalRecords)} label="Total Records" color="purple" />
        <StatCard icon={Layers} value={formatNumber(stats.totalPages)} label="Pages Scraped" color="blue" />
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
          <Activity size={14} /> Live Operations
          {runningJobs.length > 0 && <span className="badge">{runningJobs.length}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <Terminal size={14} /> Execution Logs
          <span className="badge">{logs.length}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'errors' ? 'active' : ''}`} onClick={() => setActiveTab('errors')}>
          <AlertTriangle size={14} /> Errors
          {errors.length > 0 && (
            <span className="badge" style={{
              background: 'rgba(248, 81, 73, 0.1)',
              borderColor: 'rgba(248, 81, 73, 0.2)',
              color: '#FF7B72',
            }}>{errors.length}</span>
          )}
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <List size={14} /> Job History
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ accentColor: 'var(--color-mdb-green)' }}
            />
            Auto-refresh
          </label>
          <button className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Operations Tab */}
      {activeTab === 'live' && (
        <>
          {activeJobs.length === 0 ? (
            <div className="empty-state" style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div className="empty-icon">
                <WifiOff size={24} />
              </div>
              <div className="empty-title">No Active Operations</div>
              <div className="empty-desc">
                There are no jobs currently running. Start a job to see live monitoring data.
              </div>
            </div>
          ) : (
            <div className="live-jobs-grid">
              {activeJobs.map(job => (
                <LiveJobCard
                  key={job.id}
                  job={job}
                  onPause={handlePauseJob}
                  onResume={handleResumeJob}
                  onCancel={handleCancelRequest}
                  onView={setSelectedJob}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Execution Logs Tab */}
      {activeTab === 'logs' && (
        <div className="log-viewer">
          <div className="log-toolbar">
            <div className="log-filters">
              {['all', 'info', 'success', 'warning', 'error'].map(filter => (
                <button
                  key={filter}
                  className={`log-filter-btn ${filter} ${logFilter === filter ? 'active' : ''}`}
                  onClick={() => setLogFilter(filter)}
                >
                  {filter === 'all' && <List size={11} />}
                  {filter === 'info' && <Info size={11} />}
                  {filter === 'success' && <CheckCircle size={11} />}
                  {filter === 'warning' && <AlertTriangle size={11} />}
                  {filter === 'error' && <AlertCircle size={11} />}
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
              <div className="log-search">
                <Search size={14} className="log-search-icon" />
                <input
                  type="text"
                  className="log-search-input"
                  placeholder="Search logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                />
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleExportLogs}
                disabled={filteredLogs.length === 0}
                title="Export logs"
              >
                <Download size={13} />
              </button>
            </div>
          </div>

          <div className="log-entries">
            {filteredLogs.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <div className="empty-icon" style={{ width: 40, height: 40 }}>
                  <Terminal size={18} />
                </div>
                <div className="empty-title" style={{ fontSize: 14 }}>No Logs Found</div>
                <div className="empty-desc">
                  {logSearch ? 'Try a different search term' :
                   logFilter !== 'all' ? `No ${logFilter} logs available` :
                   'No execution logs available'}
                </div>
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <LogEntry key={log.id || idx} log={log} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && (
        <>
          {errors.length === 0 ? (
            <div className="empty-state" style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div className="empty-icon" style={{ borderColor: 'rgba(0, 237, 100, 0.2)' }}>
                <CheckCircle size={24} color="#56D364" />
              </div>
              <div className="empty-title">No Errors</div>
              <div className="empty-desc">
                All scraping operations completed successfully. No errors to report.
              </div>
            </div>
          ) : (
            <div className="error-list">
              {errors.map((error, idx) => (
                <ErrorCard
                  key={error.id || idx}
                  error={error}
                  onRetry={handleRetryError}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Job History Tab */}
      {activeTab === 'history' && (
        <div className="history-table-container">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid var(--color-border-subtle)',
            flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Job History</span>
              <span style={{
                fontSize: 11, color: 'var(--color-text-muted)',
                background: 'var(--color-canvas)', padding: '3px 10px',
                borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)',
              }}>{jobs.length} jobs</span>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <div className="empty-icon">
                <Database size={20} />
              </div>
              <div className="empty-title">No Jobs</div>
              <div className="empty-desc">No jobs have been created yet</div>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Job Name</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Records</th>
                      <th>Pages</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedJobs.map(job => (
                      <tr key={job.id}>
                        <td>
                          <div style={{
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>{job.name}</div>
                          <div style={{
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--color-text-muted)',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>{job.target || job.url}</div>
                        </td>
                        <td><StatusPill status={job.status} /></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 60, height: 4,
                              background: 'var(--color-border)',
                              borderRadius: 'var(--radius-full)',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${job.progress || 0}%`,
                                height: '100%',
                                background: job.status === 'failed' ? '#F85149' :
                                           job.status === 'running' ? '#58A6FF' :
                                           'var(--color-mdb-green)',
                                borderRadius: 'var(--radius-full)',
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              color: 'var(--color-text-muted)',
                            }}>{job.progress || 0}%</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(job.records || 0)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {job.pages_processed || 0}
                          {job.pages_discovered > 0 && (
                            <span style={{ color: 'var(--color-text-muted)' }}>/{job.pages_discovered}</span>
                          )}
                        </td>
                        <td style={{ fontSize: 12 }}>{formatDate(job.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              className="action-btn"
                              title="View details"
                              onClick={() => setSelectedJob(job)}
                            >
                              <Eye size={14} />
                            </button>
                            {job.status === 'running' ? (
                              <button
                                className="action-btn"
                                title="Pause"
                                onClick={() => handlePauseJob(job.id)}
                                disabled={actionLoading === job.id}
                              >
                                {actionLoading === job.id ? <Loader2 size={14} className="spin" /> : <Pause size={14} />}
                              </button>
                            ) : job.status === 'paused' ? (
                              <button
                                className="action-btn"
                                title="Resume"
                                onClick={() => handleResumeJob(job.id)}
                                disabled={actionLoading === job.id}
                              >
                                {actionLoading === job.id ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
                              </button>
                            ) : (
                              <button
                                className="action-btn"
                                title="Restart"
                                onClick={() => handleRetryJob(job.id)}
                                disabled={actionLoading === job.id}
                              >
                                {actionLoading === job.id ? <Loader2 size={14} className="spin" /> : <RotateCcw size={14} />}
                              </button>
                            )}
                            {(job.status === 'running' || job.status === 'queued' || job.status === 'paused') && (
                              <button
                                className="action-btn danger"
                                title="Cancel"
                                onClick={() => handleCancelRequest(job)}
                              >
                                <StopCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={jobs.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onRetry={handleRetryJob}
          onPause={handlePauseJob}
          onCancel={handleCancelRequest}
        />
      )}
      {cancelTarget && (
        <CancelConfirmModal
          job={cancelTarget}
          onCancel={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
          cancelling={cancelling}
        />
      )}
    </div>
  );
}