// frontend/src/pages/DatasetLibraryTab.jsx - DATASET LIBRARY (UNTITLED UI STYLE)

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Database, Search, Filter, SortAsc, SortDesc, Eye, Trash2,
  RefreshCw, Archive, Download, Copy, GitCompare, Play,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, AlertCircle, CheckCircle, Clock, Calendar, Layers,
  FileText, Hash, FolderOpen, Star, StarOff, MoreVertical,
  Loader2, Maximize2, Minimize2, ChevronDown, ChevronUp,
  BarChart3, TrendingUp, History, RotateCcw, Link as LinkIcon,
  Globe, Package, Boxes, ArchiveRestore, AlertTriangle, Info,
  Grid, List, SlidersHorizontal, ArrowUpDown, ExternalLink
} from 'lucide-react';
import api from '../api';

// ============================================================
// STYLES  (Untitled UI visual language — colors unchanged)
// ============================================================

const STYLES = `
  .dlib-root {
    /* ---- Original color scheme (unchanged) ---- */
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

    /* ---- Untitled UI additions (shadows, radii, spacing) ---- */
    --radius-xs: 4px;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 10px;
    --radius-xl: 12px;
    --radius-2xl: 16px;
    --radius-full: 9999px;

    --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.24);
    --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.32), 0 1px 2px -1px rgba(0, 0, 0, 0.28);
    --shadow-md: 0 4px 8px -2px rgba(0, 0, 0, 0.36), 0 2px 4px -2px rgba(0, 0, 0, 0.28);
    --shadow-lg: 0 12px 16px -4px rgba(0, 0, 0, 0.42), 0 4px 6px -2px rgba(0, 0, 0, 0.28);
    --shadow-xl: 0 20px 24px -4px rgba(0, 0, 0, 0.5), 0 8px 8px -4px rgba(0, 0, 0, 0.32);

    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Courier New", monospace;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dlib-root * { margin: 0; padding: 0; box-sizing: border-box; }

  .dlib-root {
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    background: var(--color-canvas);
    line-height: 1.5;
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  @keyframes dlib-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes dlib-spin { to { transform: rotate(360deg); } }
  @keyframes dlib-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

  .dlib-root .page-enter { animation: dlib-fade 0.2s ease-out; }
  .dlib-root .spin { animation: dlib-spin 0.7s linear infinite; }

  /* Untitled UI-style focus ring */
  .dlib-root .focus-ring:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.16), 0 0 0 1px var(--color-mdb-green);
  }

  /* ---------- Toolbar ---------- */
  .dlib-root .dlib-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xl);
    padding: 12px 14px;
    box-shadow: var(--shadow-xs);
  }

  /* ---------- Search ---------- */
  .dlib-root .dlib-search {
    position: relative;
    flex: 1;
    min-width: 240px;
  }

  .dlib-root .dlib-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    pointer-events: none;
    transition: color var(--transition);
  }

  .dlib-root .dlib-search-input {
    width: 100%;
    height: 38px;
    padding: 0 34px 0 36px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    color: var(--color-text-primary);
    font-size: 13px;
    font-family: var(--font-sans);
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition), background var(--transition);
  }

  .dlib-root .dlib-search-input::placeholder { color: var(--color-text-muted); }

  .dlib-root .dlib-search-input:hover { border-color: #484F58; }

  .dlib-root .dlib-search-input:focus {
    border-color: var(--color-mdb-green);
    background: var(--color-surface);
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.12);
  }

  .dlib-root .dlib-search:focus-within .dlib-search-icon { color: var(--color-text-primary); }

  .dlib-root .dlib-search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    border-radius: var(--radius-sm);
    transition: color var(--transition), background var(--transition);
  }

  .dlib-root .dlib-search-clear:hover {
    color: var(--color-text-primary);
    background: var(--color-surface-elevated);
  }

  /* ---------- Select ---------- */
  .dlib-root .dlib-select {
    height: 38px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 0 32px 0 12px;
    color: var(--color-text-primary);
    font-size: 13px;
    font-family: inherit;
    outline: none;
    cursor: pointer;
    transition: border-color var(--transition), box-shadow var(--transition);
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236E7681' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  .dlib-root .dlib-select:hover { border-color: #484F58; }

  .dlib-root .dlib-select:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.12);
  }

  /* ---------- Buttons ---------- */
  .dlib-root .dlib-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 38px;
    padding: 0 14px;
    border-radius: var(--radius-lg);
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all var(--transition);
    border: 1px solid transparent;
    white-space: nowrap;
    box-shadow: var(--shadow-xs);
  }

  .dlib-root .dlib-btn-primary {
    background: var(--color-mdb-green);
    color: #0D1117;
    border-color: var(--color-mdb-green);
  }
  .dlib-root .dlib-btn-primary:hover:not(:disabled) {
    background: var(--color-mdb-green-dark);
    border-color: var(--color-mdb-green-dark);
  }

  .dlib-root .dlib-btn-secondary {
    background: var(--color-canvas);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }
  .dlib-root .dlib-btn-secondary:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    color: var(--color-text-primary);
    border-color: #484F58;
  }

  .dlib-root .dlib-btn-danger {
    background: rgba(248, 81, 73, 0.1);
    color: #FF7B72;
    border: 1px solid rgba(248, 81, 73, 0.24);
    box-shadow: none;
  }
  .dlib-root .dlib-btn-danger:hover:not(:disabled) {
    background: rgba(248, 81, 73, 0.18);
    border-color: rgba(248, 81, 73, 0.4);
  }

  .dlib-root .dlib-btn-sm {
    height: 34px;
    padding: 0 12px;
    font-size: 12px;
  }

  .dlib-root .dlib-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .dlib-root .dlib-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.2);
  }

  /* ---------- View Toggle (segmented control) ---------- */
  .dlib-root .dlib-view-toggle {
    display: flex;
    gap: 2px;
    padding: 3px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-canvas);
  }

  .dlib-root .dlib-view-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 30px;
    border-radius: var(--radius-md);
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition);
  }

  .dlib-root .dlib-view-btn.active {
    background: var(--color-surface-elevated);
    color: #56D364;
    box-shadow: var(--shadow-xs);
  }

  .dlib-root .dlib-view-btn:hover:not(.active) { color: var(--color-text-primary); }

  /* ---------- Stats Bar ---------- */
  .dlib-root .dlib-stats {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .dlib-root .dlib-stat-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    font-family: var(--font-mono);
    font-size: 11px;
    box-shadow: var(--shadow-xs);
  }

  /* ---------- Grid View ---------- */
  .dlib-root .dlib-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .dlib-root .dlib-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xl);
    overflow: hidden;
    transition: border-color var(--transition), transform var(--transition), box-shadow var(--transition);
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-sm);
  }

  .dlib-root .dlib-card:hover {
    border-color: var(--color-border);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .dlib-root .dlib-card.archived { opacity: 0.65; }

  .dlib-root .dlib-card-header {
    padding: 16px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .dlib-root .dlib-card-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-lg);
    background: var(--color-canvas);
    border: 1px solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dlib-root .dlib-card-title-block { flex: 1; min-width: 0; }

  .dlib-root .dlib-card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: -0.01em;
  }

  .dlib-root .dlib-card-url {
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ---------- Card Menu ---------- */
  .dlib-root .dlib-card-menu { position: relative; flex-shrink: 0; }

  .dlib-root .dlib-menu-btn {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition);
  }

  .dlib-root .dlib-menu-btn:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-border-subtle);
    color: var(--color-text-primary);
  }

  .dlib-root .dlib-menu-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.2);
  }

  .dlib-root .dlib-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 190px;
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    z-index: 20;
    overflow: hidden;
    padding: 4px;
    animation: dlib-fade 0.12s ease-out;
  }

  .dlib-root .dlib-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: var(--radius-md);
    font-size: 13px;
    color: var(--color-text-secondary);
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background var(--transition), color var(--transition);
    font-family: inherit;
  }

  .dlib-root .dlib-menu-item:hover {
    background: var(--color-surface);
    color: var(--color-text-primary);
  }

  .dlib-root .dlib-menu-item.danger { color: #FF7B72; }
  .dlib-root .dlib-menu-item.danger:hover { background: rgba(248, 81, 73, 0.1); color: #FF7B72; }

  .dlib-root .dlib-menu-divider {
    height: 1px;
    background: var(--color-border-subtle);
    margin: 4px 2px;
  }

  .dlib-root .dlib-card-body { padding: 16px; flex: 1; }

  .dlib-root .dlib-card-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }

  .dlib-root .dlib-card-stat { text-align: center; }

  .dlib-root .dlib-card-stat-value {
    font-size: 16px;
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
  }

  .dlib-root .dlib-card-stat-label {
    font-size: 10px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  /* ---------- Tags ---------- */
  .dlib-root .dlib-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .dlib-root .dlib-tag {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: var(--color-canvas);
    border: 1px solid var(--color-border-subtle);
    color: var(--color-text-muted);
    white-space: nowrap;
    line-height: 1.6;
  }

  .dlib-root .dlib-tag.archived {
    background: rgba(210, 153, 34, 0.1);
    border-color: rgba(210, 153, 34, 0.2);
    color: #E3B341;
  }

  .dlib-root .dlib-tag.success {
    background: rgba(0, 237, 100, 0.1);
    border-color: rgba(0, 237, 100, 0.2);
    color: #56D364;
  }

  .dlib-root .dlib-tag.failed {
    background: rgba(248, 81, 73, 0.1);
    border-color: rgba(248, 81, 73, 0.2);
    color: #FF7B72;
  }

  /* ---------- Card Footer ---------- */
  .dlib-root .dlib-card-footer {
    padding: 10px 12px;
    border-top: 1px solid var(--color-border-subtle);
    display: flex;
    gap: 6px;
    background: var(--color-canvas);
  }

  .dlib-root .dlib-footer-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 7px 10px;
    border-radius: var(--radius-md);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
    font-family: inherit;
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text-secondary);
  }

  .dlib-root .dlib-footer-btn:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: var(--color-border-subtle);
    color: var(--color-text-primary);
  }

  .dlib-root .dlib-footer-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ---------- List View / Table ---------- */
  .dlib-root .dlib-table-container {
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .dlib-root .dlib-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
  }

  .dlib-root .dlib-table th {
    text-align: left;
    padding: 11px 16px;
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border-subtle);
    background: var(--color-canvas);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    user-select: none;
    transition: color var(--transition), background var(--transition);
  }

  .dlib-root .dlib-table th:hover {
    color: var(--color-text-primary);
    background: var(--color-surface-elevated);
  }

  .dlib-root .dlib-table th .th-inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .dlib-root .dlib-table td {
    padding: 12px 16px;
    font-size: 13px;
    border-bottom: 1px solid var(--color-border-subtle);
    vertical-align: middle;
    color: var(--color-text-secondary);
  }

  .dlib-root .dlib-table tr:last-child td { border-bottom: none; }
  .dlib-root .dlib-table tbody tr { transition: background var(--transition); }
  .dlib-root .dlib-table tbody tr:hover { background: var(--color-surface-elevated); }

  /* ---------- Pagination ---------- */
  .dlib-root .dlib-pagination {
    padding: 12px 16px;
    border-top: 1px solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    background: var(--color-surface);
  }

  .dlib-root .dlib-page-info { font-size: 12px; color: var(--color-text-muted); }
  .dlib-root .dlib-page-controls { display: flex; align-items: center; gap: 4px; }

  .dlib-root .dlib-page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 34px;
    height: 34px;
    padding: 0 10px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    font-family: inherit;
  }

  .dlib-root .dlib-page-btn:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    color: var(--color-text-primary);
    border-color: var(--color-border-subtle);
  }

  .dlib-root .dlib-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .dlib-root .dlib-page-btn.active {
    background: rgba(0, 237, 100, 0.1);
    color: #56D364;
    border-color: rgba(0, 237, 100, 0.2);
    box-shadow: var(--shadow-xs);
  }

  .dlib-root .dlib-page-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.2);
  }

  /* ---------- Empty / Loading ---------- */
  .dlib-root .dlib-empty {
    text-align: center;
    padding: 72px 24px;
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-sm);
  }

  .dlib-root .dlib-empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
  }

  .dlib-root .dlib-empty-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--color-text-primary);
    letter-spacing: -0.01em;
  }

  .dlib-root .dlib-empty-desc {
    font-size: 13px;
    color: var(--color-text-muted);
    max-width: 380px;
    margin: 0 auto 20px;
    line-height: 1.55;
  }

  .dlib-root .dlib-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 72px 24px;
    gap: 14px;
  }

  .dlib-root .dlib-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border-subtle);
    border-top-color: var(--color-mdb-green);
    border-radius: 50%;
    animation: dlib-spin 0.7s linear infinite;
  }

  /* ---------- Modal ---------- */
  .dlib-root .dlib-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(13, 17, 23, 0.8);
    backdrop-filter: blur(6px);
    animation: dlib-fade 0.15s ease-out;
  }

  .dlib-root .dlib-modal {
    width: 100%;
    max-width: 1000px;
    max-height: 90vh;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
  }

  .dlib-root .dlib-modal.small { max-width: 480px; }

  .dlib-root .dlib-modal-header {
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--color-border-subtle);
    flex-shrink: 0;
  }

  .dlib-root .dlib-modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .dlib-root .dlib-modal-footer {
    padding: 14px 20px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border-subtle);
    background: var(--color-canvas);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .dlib-root .dlib-modal-close {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition);
    margin-left: auto;
  }

  .dlib-root .dlib-modal-close:hover {
    background: var(--color-surface-elevated);
    border-color: var(--color-border-subtle);
    color: var(--color-text-primary);
  }

  /* ---------- Record Table in Modal ---------- */
  .dlib-root .dlib-record-search {
    padding: 12px 20px;
    border-bottom: 1px solid var(--color-border-subtle);
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .dlib-root .dlib-record-table-container {
    overflow: auto;
    max-height: 55vh;
  }

  .dlib-root .dlib-record-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .dlib-root .dlib-record-table th {
    text-align: left;
    padding: 10px 14px;
    background: var(--color-canvas);
    border-bottom: 1px solid var(--color-border-subtle);
    font-weight: 500;
    color: var(--color-text-muted);
    position: sticky;
    top: 0;
    font-size: 11px;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .dlib-root .dlib-record-table td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--color-border-subtle);
    color: var(--color-text-secondary);
    vertical-align: top;
  }

  .dlib-root .dlib-record-table tr:hover td {
    background: var(--color-surface-elevated);
  }

  /* ---------- Compare View ---------- */
  .dlib-root .dlib-compare {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .dlib-root .dlib-compare-col {
    background: var(--color-canvas);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-xs);
  }

  .dlib-root .dlib-compare-header {
    padding: 12px 14px;
    border-bottom: 1px solid var(--color-border-subtle);
    background: var(--color-surface);
  }

  .dlib-root .dlib-compare-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    letter-spacing: -0.01em;
  }

  .dlib-root .dlib-compare-meta {
    font-size: 11px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  .dlib-root .dlib-compare-body {
    padding: 14px;
    max-height: 50vh;
    overflow-y: auto;
    font-size: 12px;
  }

  .dlib-root .dlib-compare-stat {
    display: flex;
    justify-content: space-between;
    padding: 7px 0;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .dlib-root .dlib-compare-stat:last-child { border-bottom: none; }

  .dlib-root .dlib-compare-stat-label { color: var(--color-text-muted); }

  .dlib-root .dlib-compare-stat-value {
    font-family: var(--font-mono);
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .dlib-root .dlib-compare-stat-value.up { color: #56D364; }
  .dlib-root .dlib-compare-stat-value.down { color: #FF7B72; }

  /* ---------- Responsive ---------- */
  @media (max-width: 768px) {
    .dlib-root .dlib-grid { grid-template-columns: 1fr; }
    .dlib-root .dlib-toolbar { flex-direction: column; align-items: stretch; }
    .dlib-root .dlib-search { min-width: 100%; }
    .dlib-root .dlib-compare { grid-template-columns: 1fr; }
    .dlib-root .dlib-modal { max-width: 100%; margin: 0 8px; max-height: 95vh; }
    .dlib-root .dlib-card-stats { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 480px) {
    .dlib-root .dlib-card-footer { flex-wrap: wrap; }
    .dlib-root .dlib-footer-btn { flex: 1 1 40%; }
    .dlib-root .dlib-page-btn { min-width: 28px; height: 28px; padding: 4px 6px; font-size: 11px; }
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
// HELPERS  (unchanged)
// ============================================================

const formatDate = (d) => {
  if (!d) return 'N/A';
  const date = new Date(d);
  const now = new Date();
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const formatFullDate = (d) => d ? new Date(d).toLocaleString() : 'N/A';

const formatNumber = (n) => (n ?? 0).toLocaleString();

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
};

const getErrorMessage = (err) => {
  if (err.response?.data?.detail) {
    const d = err.response.data.detail;
    if (Array.isArray(d)) return d.map(x => x.msg).join(', ');
    if (typeof d === 'string') return d;
  }
  return err.response?.data?.message || err.message || 'An unexpected error occurred';
};

// ============================================================
// STAT CHIP
// ============================================================

function StatChip({ icon: Icon, value, label }) {
  return (
    <div className="dlib-stat-chip">
      {Icon && <Icon size={11} />}
      <span>{label}:</span>
      <strong style={{ color: 'var(--color-text-primary)' }}>{value}</strong>
    </div>
  );
}

// ============================================================
// DATASET CARD (GRID VIEW)
// ============================================================

function DatasetCard({ dataset, onPreview, onCompare, onRerun, onArchive, onDelete, onDuplicate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isArchived = dataset.archived || dataset.status === 'archived';

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`dlib-card ${isArchived ? 'archived' : ''}`}>
      <div className="dlib-card-header">
        <div className="dlib-card-icon">
          <Database size={18} color={isArchived ? 'var(--color-text-muted)' : '#56D364'} />
        </div>
        <div className="dlib-card-title-block">
          <div className="dlib-card-title" title={dataset.name}>{dataset.name}</div>
          <div className="dlib-card-url" title={dataset.url}>{dataset.url || 'No URL'}</div>
        </div>
        <div className="dlib-card-menu" ref={menuRef}>
          <button className="dlib-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="dlib-menu">
              <button className="dlib-menu-item" onClick={() => { onPreview(dataset); setMenuOpen(false); }}>
                <Eye size={13} /> Preview Records
              </button>
              <button className="dlib-menu-item" onClick={() => { onCompare(dataset); setMenuOpen(false); }}>
                <GitCompare size={13} /> Compare Versions
              </button>
              <button className="dlib-menu-item" onClick={() => { onDuplicate(dataset); setMenuOpen(false); }}>
                <Copy size={13} /> Duplicate
              </button>
              <div className="dlib-menu-divider" />
              <button className="dlib-menu-item" onClick={() => { onArchive(dataset); setMenuOpen(false); }}>
                {isArchived ? <><ArchiveRestore size={13} /> Restore</> : <><Archive size={13} /> Archive</>}
              </button>
              <button className="dlib-menu-item danger" onClick={() => { onDelete(dataset); setMenuOpen(false); }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="dlib-card-body">
        <div className="dlib-card-stats">
          <div className="dlib-card-stat">
            <div className="dlib-card-stat-value">{formatNumber(dataset.record_count || dataset.parsed_count)}</div>
            <div className="dlib-card-stat-label">Records</div>
          </div>
          <div className="dlib-card-stat">
            <div className="dlib-card-stat-value">{formatNumber(dataset.field_count || 0)}</div>
            <div className="dlib-card-stat-label">Fields</div>
          </div>
          <div className="dlib-card-stat">
            <div className="dlib-card-stat-value">v{dataset.version || 1}</div>
            <div className="dlib-card-stat-label">Version</div>
          </div>
        </div>

        <div className="dlib-tags">
          {isArchived && <span className="dlib-tag archived"><Archive size={9} style={{ marginRight: 3 }} />Archived</span>}
          {dataset.status === 'success' && !isArchived && <span className="dlib-tag success">Ready</span>}
          {dataset.status === 'failed' && <span className="dlib-tag failed">Failed</span>}
          {dataset.tags?.slice(0, 3).map((tag, i) => (
            <span key={i} className="dlib-tag">{tag}</span>
          ))}
        </div>

        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} /> Updated {formatDate(dataset.updated_at || dataset.created_at)}
        </div>
      </div>

      <div className="dlib-card-footer">
        <button className="dlib-footer-btn" onClick={() => onPreview(dataset)}>
          <Eye size={12} /> Preview
        </button>
        <button className="dlib-footer-btn" onClick={() => onRerun(dataset)}>
          <RefreshCw size={12} /> Re-run
        </button>
      </div>
    </div>
  );
}

// ============================================================
// DATASET ROW (LIST VIEW)
// ============================================================

function DatasetRow({ dataset, onPreview, onCompare, onRerun, onArchive, onDelete, onDuplicate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isArchived = dataset.archived || dataset.status === 'archived';

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: 'var(--color-canvas)', border: '1px solid var(--color-border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Database size={14} color={isArchived ? 'var(--color-text-muted)' : '#56D364'} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontWeight: 500, color: 'var(--color-text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220,
            }}>{dataset.name}</div>
            <div style={{
              fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220,
            }}>{dataset.url}</div>
          </div>
        </div>
      </td>
      <td style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(dataset.record_count || dataset.parsed_count)}</td>
      <td style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(dataset.field_count || 0)}</td>
      <td style={{ fontFamily: 'var(--font-mono)' }}>v{dataset.version || 1}</td>
      <td>
        {isArchived ? (
          <span className="dlib-tag archived">Archived</span>
        ) : dataset.status === 'success' ? (
          <span className="dlib-tag success">Ready</span>
        ) : dataset.status === 'failed' ? (
          <span className="dlib-tag failed">Failed</span>
        ) : (
          <span className="dlib-tag">{dataset.status || 'Unknown'}</span>
        )}
      </td>
      <td style={{ fontSize: 12 }}>{formatDate(dataset.updated_at || dataset.created_at)}</td>
      <td>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <button className="dlib-menu-btn" title="Preview" onClick={() => onPreview(dataset)}>
            <Eye size={14} />
          </button>
          <button className="dlib-menu-btn" title="Re-run" onClick={() => onRerun(dataset)}>
            <RefreshCw size={14} />
          </button>
          <div className="dlib-card-menu" ref={menuRef}>
            <button className="dlib-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div className="dlib-menu">
                <button className="dlib-menu-item" onClick={() => { onCompare(dataset); setMenuOpen(false); }}>
                  <GitCompare size={13} /> Compare
                </button>
                <button className="dlib-menu-item" onClick={() => { onDuplicate(dataset); setMenuOpen(false); }}>
                  <Copy size={13} /> Duplicate
                </button>
                <div className="dlib-menu-divider" />
                <button className="dlib-menu-item" onClick={() => { onArchive(dataset); setMenuOpen(false); }}>
                  {isArchived ? <><ArchiveRestore size={13} /> Restore</> : <><Archive size={13} /> Archive</>}
                </button>
                <button className="dlib-menu-item danger" onClick={() => { onDelete(dataset); setMenuOpen(false); }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ============================================================
// DATASET PREVIEW MODAL
// ============================================================

function DatasetPreviewModal({ dataset, onClose }) {
  const [records, setRecords] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const perPage = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const jobId = dataset.job_id || dataset.id;
        const res = await api.post(`/api/export/preview/${jobId}`, { limit: 500 });
        setRecords(res.data.preview || []);
        setFields(res.data.fields || []);
        setTotalAvailable(res.data.total_available || res.data.preview?.length || 0);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dataset]);

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(r =>
      Object.values(r).some(v =>
        String(v ?? '').toLowerCase().includes(q)
      )
    );
  }, [records, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => setPage(1), [search]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dlib-modal-overlay" onClick={onClose}>
      <div className="dlib-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dlib-modal-header">
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-lg)',
            background: 'rgba(88, 166, 255, 0.1)', border: '1px solid rgba(88, 166, 255, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Database size={18} color="#79B8FF" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              {dataset.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {formatNumber(totalAvailable)} records • {fields.length} fields
            </div>
          </div>
          <button className="dlib-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="dlib-record-search">
          <div className="dlib-search" style={{ flex: 1 }}>
            <Search size={14} className="dlib-search-icon" />
            <input
              type="text"
              className="dlib-search-input"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="dlib-search-clear" onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {filtered.length} matching
          </span>
        </div>

        <div className="dlib-modal-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="dlib-loading">
              <div className="dlib-spinner" />
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Loading records…</span>
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <AlertCircle size={24} color="#FF7B72" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 13, color: '#FF7B72' }}>{error}</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Package size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
              <div style={{ fontSize: 13 }}>
                {search ? 'No matching records found' : 'No records in this dataset'}
              </div>
            </div>
          ) : (
            <div className="dlib-record-table-container">
              <table className="dlib-record-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    {fields.slice(0, 8).map(f => (
                      <th key={f}>{f.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((rec, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      {fields.slice(0, 8).map(f => {
                        const v = rec[f];
                        const isObj = typeof v === 'object' && v !== null;
                        const display = isObj ? JSON.stringify(v) : String(v ?? '—');
                        const truncated = display.length > 120 ? display.substring(0, 120) + '…' : display;
                        return (
                          <td key={f} style={{
                            fontFamily: isObj ? 'var(--font-mono)' : 'inherit',
                            fontSize: isObj ? 11 : 13,
                            maxWidth: 220,
                            wordBreak: 'break-word',
                          }} title={display}>
                            {truncated}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && !loading && !error && (
          <div className="dlib-pagination">
            <div className="dlib-page-info">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </div>
            <div className="dlib-page-controls">
              <button className="dlib-page-btn" onClick={() => setPage(1)} disabled={page === 1}>
                <ChevronsLeft size={13} />
              </button>
              <button className="dlib-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={13} />
              </button>
              <span style={{ fontSize: 12, padding: '0 10px', color: 'var(--color-text-secondary)' }}>
                {page} / {totalPages}
              </span>
              <button className="dlib-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={13} />
              </button>
              <button className="dlib-page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                <ChevronsRight size={13} />
              </button>
            </div>
          </div>
        )}

        <div className="dlib-modal-footer">
          <button className="dlib-btn dlib-btn-secondary dlib-btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPARE VERSIONS MODAL
// ============================================================

function CompareModal({ dataset, allDatasets, onClose }) {
  const [selectedB, setSelectedB] = useState(null);
  const [statsA, setStatsA] = useState(null);
  const [statsB, setStatsB] = useState(null);
  const [loading, setLoading] = useState(false);

  const siblings = useMemo(
    () => allDatasets.filter(d => d.url === dataset.url && d.id !== dataset.id),
    [allDatasets, dataset]
  );

  useEffect(() => {
    if (siblings.length > 0 && !selectedB) {
      setSelectedB(siblings[0]);
    }
  }, [siblings, selectedB]);

  const loadStats = useCallback(async (d, setter) => {
    if (!d) { setter(null); return; }
    try {
      const res = await api.get(`/api/export/stats/${d.job_id || d.id}`);
      setter(res.data);
    } catch (err) {
      setter({
        total_rows: d.record_count || 0,
        total_parsed_records: d.record_count || 0,
        fields: d.fields || [],
      });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadStats(dataset, setStatsA),
      selectedB ? loadStats(selectedB, setStatsB) : Promise.resolve(setStatsB(null)),
    ]).finally(() => setLoading(false));
  }, [dataset, selectedB, loadStats]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const diff = (a, b) => {
    const av = a ?? 0;
    const bv = b ?? 0;
    const d = av - bv;
    if (d > 0) return { value: `+${formatNumber(d)}`, cls: 'up' };
    if (d < 0) return { value: formatNumber(d), cls: 'down' };
    return { value: '0', cls: '' };
  };

  return (
    <div className="dlib-modal-overlay" onClick={onClose}>
      <div className="dlib-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dlib-modal-header">
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-lg)',
            background: 'rgba(163, 113, 247, 0.1)', border: '1px solid rgba(163, 113, 247, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <GitCompare size={18} color="#A371F7" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Compare Dataset Versions</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {siblings.length} other version{siblings.length !== 1 ? 's' : ''} available for this URL
            </div>
          </div>
          <button className="dlib-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="dlib-modal-body">
          {siblings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <Info size={24} style={{ color: 'var(--color-text-muted)', marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No Other Versions</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                There are no other datasets for this URL to compare against.
                Re-run the scraper to create a new version.
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                  Compare against:
                </label>
                <select
                  className="dlib-select"
                  style={{ width: '100%' }}
                  value={selectedB?.id || ''}
                  onChange={(e) => {
                    const found = siblings.find(s => s.id === e.target.value);
                    setSelectedB(found || null);
                  }}
                >
                  {siblings.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatNumber(s.record_count)} records • {formatFullDate(s.updated_at || s.created_at)}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="dlib-loading">
                  <div className="dlib-spinner" />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Loading comparison…</span>
                </div>
              ) : (
                <div className="dlib-compare">
                  <div className="dlib-compare-col">
                    <div className="dlib-compare-header">
                      <div className="dlib-compare-title">{dataset.name}</div>
                      <div className="dlib-compare-meta">
                        v{dataset.version || 1} • {formatFullDate(dataset.updated_at || dataset.created_at)}
                      </div>
                    </div>
                    <div className="dlib-compare-body">
                      <div className="dlib-compare-stat">
                        <span className="dlib-compare-stat-label">Records</span>
                        <span className="dlib-compare-stat-value">
                          {formatNumber(statsA?.total_rows ?? dataset.record_count ?? 0)}
                        </span>
                      </div>
                      <div className="dlib-compare-stat">
                        <span className="dlib-compare-stat-label">Parsed Results</span>
                        <span className="dlib-compare-stat-value">
                          {formatNumber(statsA?.total_parsed_records ?? 0)}
                        </span>
                      </div>
                      <div className="dlib-compare-stat">
                        <span className="dlib-compare-stat-label">Fields</span>
                        <span className="dlib-compare-stat-value">
                          {(statsA?.fields?.length ?? dataset.field_count ?? 0)}
                        </span>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                        {dataset.url}
                      </div>
                    </div>
                  </div>

                  <div className="dlib-compare-col">
                    <div className="dlib-compare-header">
                      <div className="dlib-compare-title">{selectedB?.name || 'Select a version'}</div>
                      <div className="dlib-compare-meta">
                        {selectedB ? (
                          <>v{selectedB.version || 1} • {formatFullDate(selectedB.updated_at || selectedB.created_at)}</>
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>
                    <div className="dlib-compare-body">
                      {selectedB ? (
                        <>
                          <div className="dlib-compare-stat">
                            <span className="dlib-compare-stat-label">Records</span>
                            <span className="dlib-compare-stat-value">
                              {formatNumber(statsB?.total_rows ?? selectedB.record_count ?? 0)}
                            </span>
                          </div>
                          <div className="dlib-compare-stat">
                            <span className="dlib-compare-stat-label">Parsed Results</span>
                            <span className="dlib-compare-stat-value">
                              {formatNumber(statsB?.total_parsed_records ?? 0)}
                            </span>
                          </div>
                          <div className="dlib-compare-stat">
                            <span className="dlib-compare-stat-label">Fields</span>
                            <span className="dlib-compare-stat-value">
                              {(statsB?.fields?.length ?? selectedB.field_count ?? 0)}
                            </span>
                          </div>
                          <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                            {selectedB.url}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>
                          Select a version above
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!loading && selectedB && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={14} color="#56D364" /> Difference Summary
                  </div>
                  <div style={{
                    background: 'var(--color-canvas)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 14,
                  }}>
                    {[
                      { label: 'Records Change', a: statsA?.total_rows ?? dataset.record_count ?? 0, b: statsB?.total_rows ?? selectedB.record_count ?? 0 },
                      { label: 'Parsed Results Change', a: statsA?.total_parsed_records ?? 0, b: statsB?.total_parsed_records ?? 0 },
                      { label: 'Fields Change', a: statsA?.fields?.length ?? dataset.field_count ?? 0, b: statsB?.fields?.length ?? selectedB.field_count ?? 0 },
                    ].map((row, i) => {
                      const d = diff(row.a, row.b);
                      return (
                        <div key={i} className="dlib-compare-stat">
                          <span className="dlib-compare-stat-label">{row.label}</span>
                          <span className={`dlib-compare-stat-value ${d.cls}`}>{d.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="dlib-modal-footer">
          <button className="dlib-btn dlib-btn-secondary dlib-btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CONFIRM MODAL
// ============================================================

function ConfirmModal({ title, message, confirmLabel, confirmDanger, itemName, onCancel, onConfirm, loading }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, loading]);

  return (
    <div className="dlib-modal-overlay" onClick={() => { if (!loading) onCancel(); }}>
      <div className="dlib-modal small" onClick={(e) => e.stopPropagation()}>
        <div className="dlib-modal-header">
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-lg)',
            background: confirmDanger ? 'rgba(248, 81, 73, 0.1)' : 'rgba(88, 166, 255, 0.1)',
            border: `1px solid ${confirmDanger ? 'rgba(248, 81, 73, 0.2)' : 'rgba(88, 166, 255, 0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: confirmDanger ? '#FF7B72' : '#79B8FF', flexShrink: 0,
          }}>
            {confirmDanger ? <AlertTriangle size={18} /> : <Info size={18} />}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>{title}</div>
          </div>
        </div>
        <div className="dlib-modal-body">
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{message}</p>
          {itemName && (
            <div style={{
              display: 'inline-block',
              background: 'var(--color-canvas)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              marginTop: 10,
              color: 'var(--color-text-primary)',
              wordBreak: 'break-all',
            }}>{itemName}</div>
          )}
        </div>
        <div className="dlib-modal-footer">
          <button className="dlib-btn dlib-btn-secondary dlib-btn-sm" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={`dlib-btn ${confirmDanger ? 'dlib-btn-danger' : 'dlib-btn-primary'} dlib-btn-sm`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 size={13} className="spin" /> : null}
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGINATION
// ============================================================

function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  if (totalPages <= 1) return null;
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  const pages = [];
  const maxVis = 5;
  if (totalPages <= maxVis) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 4; i++) pages.push(i);
    pages.push(null, totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, null);
    for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, null);
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push(null, totalPages);
  }

  return (
    <div className="dlib-pagination">
      <div className="dlib-page-info">
        Showing <strong style={{ color: 'var(--color-text-primary)' }}>{start}–{end}</strong> of{' '}
        <strong style={{ color: 'var(--color-text-primary)' }}>{totalItems}</strong>
      </div>
      <div className="dlib-page-controls">
        <button className="dlib-page-btn" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
          <ChevronsLeft size={13} />
        </button>
        <button className="dlib-page-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft size={13} />
        </button>
        {pages.map((p, i) => p === null ? (
          <span key={`e-${i}`} style={{ padding: '0 4px', color: 'var(--color-text-muted)' }}>…</span>
        ) : (
          <button key={p} className={`dlib-page-btn ${currentPage === p ? 'active' : ''}`} onClick={() => onPageChange(p)}>
            {p}
          </button>
        ))}
        <button className="dlib-page-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <ChevronRight size={13} />
        </button>
        <button className="dlib-page-btn" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
          <ChevronsRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN DATASET LIBRARY COMPONENT
// ============================================================

export default function DatasetLibraryTab() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [previewDataset, setPreviewDataset] = useState(null);
  const [compareDataset, setCompareDataset] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  injectStyles('dlib-styles', STYLES);

  const loadDatasets = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      let items = [];
      try {
        const res = await api.get('/api/export/jobs-with-results');
        items = (res.data.jobs || []).map(j => ({
          id: j.id,
          job_id: j.id,
          name: j.name,
          url: j.url,
          status: j.status,
          created_at: j.created_at,
          updated_at: j.created_at,
          record_count: j.parsed_count || 0,
          parsed_count: j.parsed_count || 0,
          field_count: 0,
          version: 1,
          tags: [],
          archived: false,
        }));
      } catch {
        const res = await api.get('/api/jobs');
        const jobs = Array.isArray(res.data) ? res.data : res.data.jobs || [];
        items = jobs
          .filter(j => (j.records || 0) > 0)
          .map(j => ({
            id: j.id,
            job_id: j.id,
            name: j.name,
            url: j.url || j.target,
            status: j.status,
            created_at: j.created_at,
            updated_at: j.updated_at || j.created_at,
            record_count: j.records || 0,
            parsed_count: j.records || 0,
            field_count: 0,
            version: 1,
            tags: [],
            archived: j.status === 'archived',
          }));
      }
      setDatasets(items);
    } catch (err) {
      setError(getErrorMessage(err));
      setTimeout(() => setError(null), 4000);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDatasets();
    setRefreshing(false);
  };

  const requestDelete = (dataset) => {
    setConfirmAction({ type: 'delete', dataset });
  };

  const requestArchive = (dataset) => {
    const isArchived = dataset.archived || dataset.status === 'archived';
    setConfirmAction({ type: isArchived ? 'restore' : 'archive', dataset });
  };

  const requestRerun = (dataset) => {
    setConfirmAction({ type: 'rerun', dataset });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, dataset } = confirmAction;
    setActionLoading(true);
    try {
      if (type === 'delete') {
        await api.delete(`/api/jobs/${dataset.job_id || dataset.id}`);
        setSuccess(`"${dataset.name}" deleted`);
      } else if (type === 'archive') {
        setDatasets(prev => prev.map(d =>
          d.id === dataset.id ? { ...d, archived: true, status: 'archived' } : d
        ));
        setSuccess(`"${dataset.name}" archived`);
      } else if (type === 'restore') {
        setDatasets(prev => prev.map(d =>
          d.id === dataset.id ? { ...d, archived: false, status: 'success' } : d
        ));
        setSuccess(`"${dataset.name}" restored`);
      } else if (type === 'rerun') {
        await api.post(`/api/jobs/${dataset.job_id || dataset.id}/start`);
        setSuccess(`"${dataset.name}" is re-running`);
      }
      setConfirmAction(null);
      if (type === 'delete' || type === 'rerun') {
        await loadDatasets();
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async (dataset) => {
    try {
      await api.post('/api/jobs', {
        name: `${dataset.name} (copy)`,
        url: dataset.url,
        target: dataset.url,
        mode: 'pagination',
        max_pages: 100,
      });
      setSuccess(`"${dataset.name}" duplicated`);
      await loadDatasets();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
      setTimeout(() => setError(null), 4000);
    }
  };

  const filtered = useMemo(() => {
    let list = datasets;

    list = list.filter(d => {
      const isArch = d.archived || d.status === 'archived';
      return showArchived ? true : !isArch;
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.url?.toLowerCase().includes(q)
      );
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = a[sortBy] ?? '';
      const bv = b[sortBy] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return list;
  }, [datasets, search, showArchived, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );

  useEffect(() => setCurrentPage(1), [search, showArchived, sortBy, sortDir, itemsPerPage]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  if (loading) {
    return (
      <div className="dlib-root page-enter">
        <div className="dlib-loading">
          <div className="dlib-spinner" />
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading datasets…</span>
        </div>
      </div>
    );
  }

  const activeCount = datasets.filter(d => !d.archived && d.status !== 'archived').length;
  const archivedCount = datasets.length - activeCount;

  return (
    <div className="dlib-root page-enter">
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          borderRadius: 'var(--radius-lg)', marginBottom: 16, fontSize: 13,
          background: 'rgba(248, 81, 73, 0.08)', border: '1px solid rgba(248, 81, 73, 0.2)',
          color: '#FF7B72', boxShadow: 'var(--shadow-xs)',
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
          borderRadius: 'var(--radius-lg)', marginBottom: 16, fontSize: 13,
          background: 'rgba(0, 237, 100, 0.08)', border: '1px solid rgba(0, 237, 100, 0.2)',
          color: '#56D364', boxShadow: 'var(--shadow-xs)',
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

      <div className="dlib-toolbar">
        <div className="dlib-search">
          <Search size={15} className="dlib-search-icon" />
          <input
            type="text"
            className="dlib-search-input"
            placeholder="Search datasets by name or URL…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="dlib-search-clear" onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <select className="dlib-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="updated_at">Sort: Last Updated</option>
          <option value="created_at">Sort: Created</option>
          <option value="name">Sort: Name</option>
          <option value="record_count">Sort: Records</option>
          <option value="version">Sort: Version</option>
        </select>

        <button
          className="dlib-btn dlib-btn-secondary"
          onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sortDir === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
          {sortDir === 'asc' ? 'Asc' : 'Desc'}
        </button>

        <label style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer',
          height: 38, padding: '0 12px',
          background: 'var(--color-canvas)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            style={{ accentColor: 'var(--color-mdb-green)' }}
          />
          Show archived
        </label>

        <div className="dlib-view-toggle">
          <button
            className={`dlib-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <Grid size={14} />
          </button>
          <button
            className={`dlib-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List size={14} />
          </button>
        </div>

        <button
          className="dlib-btn dlib-btn-secondary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="dlib-stats">
        <StatChip icon={Database} value={activeCount} label="Active" />
        <StatChip icon={Archive} value={archivedCount} label="Archived" />
        <StatChip icon={Layers} value={datasets.length} label="Total" />
        <StatChip
          icon={Hash}
          value={formatNumber(datasets.reduce((s, d) => s + (d.record_count || 0), 0))}
          label="Records"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="dlib-empty">
          <div className="dlib-empty-icon">
            <FolderOpen size={28} />
          </div>
          <div className="dlib-empty-title">
            {search ? 'No matching datasets' : showArchived ? 'No datasets' : 'No active datasets'}
          </div>
          <div className="dlib-empty-desc">
            {search
              ? `No datasets match "${search}". Try a different search term.`
              : 'Datasets appear here after you scrape and parse a job. Run a scraper to get started.'}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="dlib-grid">
          {paginated.map(d => (
            <DatasetCard
              key={d.id}
              dataset={d}
              onPreview={setPreviewDataset}
              onCompare={setCompareDataset}
              onRerun={requestRerun}
              onArchive={requestArchive}
              onDelete={requestDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <div className="dlib-table-container">
          <div style={{ overflowX: 'auto' }}>
            <table className="dlib-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('name')}>
                    <span className="th-inner">
                      Dataset
                      <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th onClick={() => toggleSort('record_count')}>
                    <span className="th-inner">
                      Records
                      <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th onClick={() => toggleSort('field_count')}>
                    <span className="th-inner">
                      Fields
                      <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th onClick={() => toggleSort('version')}>
                    <span className="th-inner">
                      Version
                      <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th>Status</th>
                  <th onClick={() => toggleSort('updated_at')}>
                    <span className="th-inner">
                      Updated
                      <ArrowUpDown size={11} />
                    </span>
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(d => (
                  <DatasetRow
                    key={d.id}
                    dataset={d}
                    onPreview={setPreviewDataset}
                    onCompare={setCompareDataset}
                    onRerun={requestRerun}
                    onArchive={requestArchive}
                    onDelete={requestDelete}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Rows per page:</label>
            <select
              className="dlib-select"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{ height: 34, fontSize: 12 }}
            >
              {[6, 12, 24, 48].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {previewDataset && (
        <DatasetPreviewModal
          dataset={previewDataset}
          onClose={() => setPreviewDataset(null)}
        />
      )}

      {compareDataset && (
        <CompareModal
          dataset={compareDataset}
          allDatasets={datasets}
          onClose={() => setCompareDataset(null)}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction.type === 'delete' ? 'Delete Dataset' :
            confirmAction.type === 'archive' ? 'Archive Dataset' :
            confirmAction.type === 'restore' ? 'Restore Dataset' :
            'Re-run Scraper'
          }
          message={
            confirmAction.type === 'delete'
              ? 'This will permanently delete the dataset and all its records. This action cannot be undone.'
              : confirmAction.type === 'archive'
              ? 'The dataset will be hidden from the active list but can be restored later.'
              : confirmAction.type === 'restore'
              ? 'The dataset will be restored to your active list.'
              : 'This will start a fresh scrape and create a new version of this dataset.'
          }
          confirmLabel={
            confirmAction.type === 'delete' ? 'Delete' :
            confirmAction.type === 'archive' ? 'Archive' :
            confirmAction.type === 'restore' ? 'Restore' :
            'Re-run Now'
          }
          confirmDanger={confirmAction.type === 'delete'}
          itemName={confirmAction.dataset?.name}
          onCancel={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          loading={actionLoading}
        />
      )}
    </div>
  );
}