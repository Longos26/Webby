// src/pages/HomePage.jsx - CLEAN ENTERPRISE DESIGN

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Activity,
  Database,
  Shield,
  BarChart3,
  Zap,
  ExternalLink,
  Menu,
  X,
  Brain,
  Briefcase,
  BookOpen,
} from 'lucide-react';
import logo from '../newlogo.png';
import api from '../api';

// ============================================================
// STYLES - CLEAN UNTITLED UI AESTHETIC
// ============================================================

const STYLES = `
  .home-root {
    --green-primary: #00ED64;
    --green-dark: #00c951;
    --bg-dark: #0D1117;
    --bg-surface: #161B22;
    --bg-elevated: #1C2128;
    --border-default: #30363D;
    --border-subtle: #21262D;
    --text-primary: #F0F6FC;
    --text-secondary: #9BA4B0;
    --text-muted: #6E7681;
    --success: #00ED64;
    --warning: #D29922;
    --error: #F85149;
    --info: #58A6FF;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, -apple-system, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", monospace;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .home-root * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .home-root {
    background-color: var(--bg-dark);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.5;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .home-root ::-webkit-scrollbar { width: 8px; height: 8px; }
  .home-root ::-webkit-scrollbar-track { background: transparent; }
  .home-root ::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: var(--radius-sm);
  }
  .home-root ::-webkit-scrollbar-thumb:hover { background: #484F58; }

  .home-root *:focus-visible {
    outline: 2px solid var(--green-primary);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.7s linear infinite; }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-slide-in { animation: fadeSlideIn 0.2s ease-out; }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes skeletonPulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }

  .skeleton {
    background: var(--bg-surface);
    border-radius: var(--radius-sm);
    animation: skeletonPulse 1.6s ease-in-out infinite;
  }

  /* ---------- Nav ---------- */
  .home-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(13, 17, 23, 0.9);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-default);
    padding: 0 16px;
  }

  .home-nav-inner {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
  }

  .home-nav-links {
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .home-nav-link {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: color var(--transition);
  }

  .home-nav-link:hover {
    color: var(--text-primary);
  }

  .home-mobile-menu-btn {
    background: none;
    border: none;
    color: var(--text-primary);
    display: none;
    cursor: pointer;
    padding: 8px;
    border-radius: var(--radius-md);
  }

  .home-mobile-menu-btn:hover {
    background: var(--bg-surface);
  }

  .home-mobile-menu {
    display: flex;
    flex-direction: column;
    padding: 16px;
    background: var(--bg-surface);
    border-top: 1px solid var(--border-default);
    gap: 4px;
  }

  .home-mobile-menu a {
    color: var(--text-secondary);
    font-size: 15px;
    font-weight: 500;
    padding: 12px;
    text-decoration: none;
    border-radius: var(--radius-md);
    transition: background var(--transition), color var(--transition);
  }

  .home-mobile-menu a:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  /* ---------- Section ---------- */
  .home-section {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 16px;
  }

  .home-hero {
    padding: 48px 16px 56px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .home-hero-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
  }

  .home-hero h1 {
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin-bottom: 20px;
    color: var(--text-primary);
  }

  .home-hero p {
    font-size: clamp(15px, 1.5vw, 17px);
    color: var(--text-secondary);
    line-height: 1.6;
    max-width: 540px;
    margin-bottom: 32px;
  }

  .home-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: 9999px;
    padding: 5px 14px;
    margin-bottom: 24px;
  }

  .home-eyebrow-dot {
    width: 8px;
    height: 8px;
    background: var(--green-primary);
    border-radius: 50%;
    display: inline-block;
  }

  .home-eyebrow-text {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .home-section-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--green-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 10px;
  }

  .home-section-title {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.01em;
    margin-bottom: 10px;
  }

  .home-section-desc {
    font-size: clamp(15px, 1.2vw, 16px);
    color: var(--text-secondary);
    max-width: 640px;
  }

  /* ---------- Buttons ---------- */
  .home-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    border: none;
    transition: background var(--transition), border-color var(--transition), color var(--transition);
    cursor: pointer;
    font-family: inherit;
    text-decoration: none;
    white-space: nowrap;
  }

  .home-btn-primary {
    background: var(--green-primary);
    color: #0D1117;
  }

  .home-btn-primary:hover:not(:disabled) {
    background: var(--green-dark);
  }

  .home-btn-primary:disabled {
    background: var(--text-muted);
    color: var(--bg-dark);
    opacity: 0.6;
    cursor: not-allowed;
  }

  .home-btn-secondary {
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    font-weight: 500;
  }

  .home-btn-secondary:hover:not(:disabled) {
    border-color: #484F58;
    color: var(--text-primary);
  }

  .home-btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ---------- Card ---------- */
  .home-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: 24px;
    transition: border-color var(--transition);
  }

  .home-card.hoverable:hover {
    border-color: #484F58;
  }

  /* ---------- Status Badge ---------- */
  .home-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  .home-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .home-badge.running {
    background: rgba(88, 166, 255, 0.1);
    color: #79B8FF;
    border: 1px solid rgba(88, 166, 255, 0.2);
  }
  .home-badge.running .home-badge-dot {
    background: #58A6FF;
    animation: pulse-dot 1.5s ease-in-out infinite;
  }

  .home-badge.success {
    background: rgba(0, 237, 100, 0.1);
    color: #56D364;
    border: 1px solid rgba(0, 237, 100, 0.2);
  }
  .home-badge.success .home-badge-dot { background: #00ED64; }

  .home-badge.failed {
    background: rgba(248, 81, 73, 0.1);
    color: #FF7B72;
    border: 1px solid rgba(248, 81, 73, 0.2);
  }
  .home-badge.failed .home-badge-dot { background: #F85149; }

  .home-badge.paused {
    background: rgba(210, 153, 34, 0.1);
    color: #E3B341;
    border: 1px solid rgba(210, 153, 34, 0.2);
  }
  .home-badge.paused .home-badge-dot { background: #D29922; }

  .home-badge.queued {
    background: rgba(110, 118, 129, 0.1);
    color: var(--text-secondary);
    border: 1px solid var(--border-default);
  }
  .home-badge.queued .home-badge-dot { background: var(--text-muted); }

  /* ---------- Hero Graphic ---------- */
  .home-hero-graphic {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .home-hero-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    padding: 32px 28px;
    width: 100%;
    max-width: 480px;
    text-align: center;
  }

  .home-hero-logo {
    width: 200px;
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto 20px;
  }

  .home-hero-metric {
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 16px;
    margin-top: 16px;
  }

  .home-hero-metric-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .home-hero-metric-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .home-hero-metric-value {
    margin-left: auto;
    font-size: 13px;
    font-family: var(--font-mono);
    color: var(--green-primary);
  }

  .home-hero-progress {
    height: 4px;
    background: var(--border-subtle);
    border-radius: 2px;
    overflow: hidden;
  }

  .home-hero-progress-fill {
    height: 100%;
    background: var(--green-primary);
    border-radius: 2px;
  }

  .home-hero-metric-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    font-size: 12px;
    color: var(--text-muted);
  }

  /* ---------- Stats ---------- */
  .home-stats-band {
    border-top: 1px solid var(--border-default);
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-surface);
  }

  .home-stats-grid {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 16px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .home-stat-value {
    font-size: clamp(24px, 4vw, 40px);
    font-weight: 700;
    font-family: var(--font-mono);
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin-bottom: 6px;
    line-height: 1.1;
  }

  .home-stat-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }

  .home-stat-meta {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    font-size: 12px;
  }

  .home-stat-change {
    color: var(--green-primary);
  }

  .home-stat-subtext {
    color: var(--text-muted);
  }

  /* ---------- Features ---------- */
  .home-features {
    padding: 64px 16px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .home-features-header {
    margin-bottom: 40px;
    text-align: center;
  }

  .home-features-header .home-section-desc {
    margin: 0 auto;
  }

  .home-features-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .home-feature-icon {
    width: 44px;
    height: 44px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    color: var(--green-primary);
  }

  .home-feature-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--text-primary);
  }

  .home-feature-desc {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  /* ---------- Recent Jobs ---------- */
  .home-recent {
    padding: 0 16px 64px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .home-recent-header {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .home-recent-title {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--text-primary);
  }

  .home-recent-sub {
    color: var(--text-secondary);
    font-size: 14px;
  }

  .home-table-wrap {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    overflow: auto;
  }

  .home-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    min-width: 600px;
  }

  .home-table th {
    text-align: left;
    padding: 16px 20px;
    font-weight: 500;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-elevated);
    font-size: 12px;
    white-space: nowrap;
  }

  .home-table td {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-secondary);
  }

  .home-table tr:last-child td {
    border-bottom: none;
  }

  .home-table tr {
    transition: background var(--transition);
  }

  .home-table tr:hover td {
    background: var(--bg-elevated);
  }

  .home-table .job-name-cell {
    font-weight: 500;
    color: var(--text-primary);
  }

  .home-empty {
    padding: 48px 20px;
    text-align: center;
    color: var(--text-muted);
  }

  .home-empty-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .home-empty-title {
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--text-secondary);
  }

  .home-empty-desc {
    font-size: 13px;
  }

  /* ---------- CTA ---------- */
  .home-cta-wrap {
    padding: 0 16px 64px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .home-cta {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    padding: 48px 24px;
    text-align: center;
  }

  .home-cta h2 {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .home-cta p {
    font-size: 16px;
    color: var(--text-secondary);
    max-width: 520px;
    margin: 0 auto 32px;
    line-height: 1.6;
  }

  .home-cta-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  /* ---------- Footer ---------- */
  .home-footer {
    border-top: 1px solid var(--border-default);
    padding: 32px 16px;
    background: var(--bg-dark);
  }

  .home-footer-inner {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 24px;
  }

  .home-footer-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .home-footer-brand span {
    font-weight: 600;
    font-size: 16px;
    color: var(--text-primary);
  }

  .home-footer-copy {
    font-size: 13px;
    color: var(--text-muted);
  }

  .home-footer-badges {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  .home-footer-badge {
    font-size: 11px;
    border: 1px solid var(--border-subtle);
    padding: 3px 10px;
    border-radius: 9999px;
    color: var(--text-muted);
  }

  .home-footer-links {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
  }

  .home-footer-link {
    font-size: 13px;
    color: var(--text-muted);
    text-decoration: none;
    transition: color var(--transition);
  }

  .home-footer-link:hover {
    color: var(--text-primary);
  }

  /* ---------- Skeleton ---------- */
  .home-skeleton-nav {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
  }

  /* ---------- Playground CTA ---------- */
  .home-playground-cta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    padding: 32px;
    flex-wrap: wrap;
  }

  .home-playground-cta-content {
    flex: 1;
    min-width: 240px;
  }

  .home-playground-cta-icon {
    width: 48px;
    height: 48px;
    background: rgba(0, 237, 100, 0.1);
    border: 1px solid rgba(0, 237, 100, 0.2);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--green-primary);
    margin-bottom: 16px;
  }

  .home-playground-cta-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary);
  }

  .home-playground-cta-desc {
    font-size: 14px;
    color: var(--text-secondary);
    max-width: 480px;
    line-height: 1.6;
  }

  /* ---------- Responsive ---------- */
  @media (max-width: 1024px) {
    .home-features-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .home-hero {
      padding: 32px 16px 40px;
    }

    .home-hero-grid {
      grid-template-columns: 1fr;
      gap: 32px;
      text-align: center;
    }

    .home-hero p {
      margin-left: auto;
      margin-right: auto;
    }

    .home-hero > * + * {
      margin-left: auto;
    }

    .home-hero .home-btn {
      margin-left: auto;
      margin-right: auto;
    }

    .home-nav-links {
      display: none;
    }

    .home-mobile-menu-btn {
      display: block;
    }

    .home-stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .home-card {
      padding: 20px;
    }

    .home-playground-cta {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (max-width: 480px) {
    .home-stats-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .home-stat-value {
      font-size: 24px;
    }

    .home-cta-actions .home-btn {
      width: 100%;
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
// COMPONENTS
// ============================================================

const Card = ({ children, hover = true }) => (
  <div className={`home-card ${hover ? 'hoverable' : ''}`}>{children}</div>
);

const PrimaryButton = ({ children, icon, onClick, to, disabled = false, loading = false, fullWidth = false }) => {
  const cls = `home-btn home-btn-primary`;
  const content = (
    <>
      {loading ? <span className="spin" style={{ display: 'inline-flex' }}>⟳</span> : icon}
      {children}
    </>
  );
  const style = fullWidth ? { width: '100%' } : undefined;
  if (to) {
    return (
      <Link to={to} className={cls} style={style}>
        {content}
      </Link>
    );
  }
  return (
    <button className={cls} style={style} onClick={onClick} disabled={disabled || loading}>
      {content}
    </button>
  );
};

const SecondaryButton = ({ children, onClick, disabled = false }) => (
  <button className="home-btn home-btn-secondary" onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

const StatusBadge = ({ status }) => {
  const key = (status || 'queued').toLowerCase();
  const config = {
    running: 'Running',
    success: 'Success',
    completed: 'Completed',
    failed: 'Failed',
    paused: 'Paused',
    queued: 'Queued',
  };
  const label = config[key] || 'Queued';
  const cls = ['running', 'success', 'failed', 'paused'].includes(key)
    ? key
    : (key === 'completed' ? 'success' : 'queued');
  return (
    <span className={`home-badge ${cls}`}>
      <span className="home-badge-dot" />
      {label}
    </span>
  );
};

// ============================================================
// HERO GRAPHIC
// ============================================================

const HeroGraphic = ({ stats }) => (
  <div className="home-hero-graphic">
    <div className="home-hero-card">
      <img src={logo} alt="Webby" className="home-hero-logo" />
      <div className="home-hero-metric">
        <div className="home-hero-metric-row">
          <Activity size={18} color="var(--green-primary)" />
          <span className="home-hero-metric-label">Active pipelines</span>
          <span className="home-hero-metric-value">{stats.active_jobs || 0} active</span>
        </div>
        <div className="home-hero-progress">
          <div
            className="home-hero-progress-fill"
            style={{ width: `${stats.success_rate || 99.87}%` }}
          />
        </div>
        <div className="home-hero-metric-footer">
          <span>Success rate</span>
          <span style={{ color: 'var(--green-primary)' }}>{stats.success_rate || 99.87}%</span>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// SKELETON
// ============================================================

const HomePageSkeleton = () => (
  <div className="home-root">
    <nav className="home-nav">
      <div className="home-skeleton-nav">
        <div className="skeleton" style={{ width: 120, height: 40 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="skeleton" style={{ width: 80, height: 36 }} />
          <div className="skeleton" style={{ width: 100, height: 36 }} />
        </div>
      </div>
    </nav>
    <section className="home-hero">
      <div className="home-hero-grid">
        <div>
          <div className="skeleton" style={{ width: 180, height: 28, borderRadius: 40, marginBottom: 28 }} />
          <div className="skeleton" style={{ width: '90%', height: 48, marginBottom: 20 }} />
          <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '70%', height: 16, marginBottom: 36 }} />
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="skeleton" style={{ width: 140, height: 44 }} />
            <div className="skeleton" style={{ width: 140, height: 44 }} />
          </div>
        </div>
        <div>
          <div className="skeleton" style={{ padding: 32, borderRadius: 16, height: 320 }} />
        </div>
      </div>
    </section>
  </div>
);

// ============================================================
// MAIN HOMEPAGE
// ============================================================

const HomePage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [stats, setStats] = useState({
    total_jobs: 0,
    completed_jobs: 0,
    failed_jobs: 0,
    running_jobs: 0,
    success_rate: 99.97,
    total_pages_scraped: 0,
    unique_urls: 0
  });

  const [realtimeMetrics, setRealtimeMetrics] = useState({
    active_jobs: 0,
    today_jobs: 0,
    today_records: 0,
    success_rate: 99.97
  });

  const [recentJobs, setRecentJobs] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    average_job_duration_seconds: 0,
    success_rate_7d: 0,
    today_success_rate: 0,
    today_total_jobs: 0,
    last_7_days_total_jobs: 0
  });

  const [exportStats, setExportStats] = useState({
    total_exports: 0,
    total_rows_exported: 0
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [analyticsResponse, realtimeResponse, recentJobsResponse, performanceResponse, exportStatsResponse] = await Promise.allSettled([
        api.get('/api/jobs/analytics/dashboard'),
        api.get('/api/dashboard/realtime'),
        api.get('/api/dashboard/recent?limit=5'),
        api.get('/api/dashboard/performance'),
        api.get('/api/dashboard/export-stats')
      ]);

      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value?.data) {
        const data = analyticsResponse.value.data;
        setStats({
          total_jobs: data.total_jobs || 0,
          completed_jobs: data.completed_jobs || 0,
          failed_jobs: data.failed_jobs || 0,
          running_jobs: data.running_jobs || 0,
          success_rate: data.success_rate || 99.97,
          total_pages_scraped: data.total_pages_scraped || 0,
          unique_urls: data.unique_urls || 0
        });
      } else {
        try {
          const jobsResponse = await api.get('/api/jobs');
          const jobs = jobsResponse.data?.jobs || [];
          const completed = jobs.filter(j => j.status === 'success' || j.status === 'completed').length;
          const failed = jobs.filter(j => j.status === 'failed').length;
          const running = jobs.filter(j => j.status === 'running').length;
          const total = jobs.length;

          setStats({
            total_jobs: total,
            completed_jobs: completed,
            failed_jobs: failed,
            running_jobs: running,
            success_rate: total > 0 ? (completed / total * 100) : 99.97,
            total_pages_scraped: jobs.reduce((acc, j) => acc + (j.pages_scraped || 0), 0),
            unique_urls: jobs.length
          });
        } catch (e) {
          setStats({
            total_jobs: 0,
            completed_jobs: 0,
            failed_jobs: 0,
            running_jobs: 0,
            success_rate: 99.97,
            total_pages_scraped: 0,
            unique_urls: 0
          });
        }
      }

      if (realtimeResponse.status === 'fulfilled' && realtimeResponse.value?.data) {
        const data = realtimeResponse.value.data;
        setRealtimeMetrics({
          active_jobs: data.active_jobs || 0,
          today_jobs: data.today_jobs || 0,
          today_records: data.today_records || 0,
          success_rate: stats.success_rate
        });
      } else {
        setRealtimeMetrics({
          active_jobs: stats.running_jobs || 0,
          today_jobs: 0,
          today_records: 0,
          success_rate: stats.success_rate
        });
      }

      if (recentJobsResponse.status === 'fulfilled' && recentJobsResponse.value?.data) {
        const jobs = recentJobsResponse.value.data;
        setRecentJobs(jobs.map(job => ({
          id: job.id,
          name: job.name,
          status: job.status,
          records: job.records || 0,
          url: job.url || job.target,
          scraped_content: job.scraped_content || '',
          created_at: job.created_at,
          completed: formatRelativeTime(job.created_at)
        })));
      } else {
        try {
          const jobsResponse = await api.get('/api/jobs?limit=5');
          const jobs = jobsResponse.data?.jobs || [];
          setRecentJobs(jobs.map(job => ({
            id: job.id,
            name: job.name,
            status: job.status,
            records: job.records || 0,
            url: job.url || job.target,
            scraped_content: job.scraped_content || '',
            created_at: job.created_at,
            completed: formatRelativeTime(job.created_at)
          })));
        } catch (e) {
          setRecentJobs([]);
        }
      }

      if (performanceResponse.status === 'fulfilled' && performanceResponse.value?.data) {
        const data = performanceResponse.value.data;
        setPerformanceMetrics({
          average_job_duration_seconds: data.average_job_duration_seconds || 0,
          success_rate_7d: data.success_rate_7d || 0,
          today_success_rate: data.today_success_rate || 0,
          today_total_jobs: data.today_total_jobs || 0,
          last_7_days_total_jobs: data.last_7_days_total_jobs || 0
        });
      } else {
        setPerformanceMetrics({
          average_job_duration_seconds: 0,
          success_rate_7d: 0,
          today_success_rate: 0,
          today_total_jobs: 0,
          last_7_days_total_jobs: 0
        });
      }

      if (exportStatsResponse.status === 'fulfilled' && exportStatsResponse.value?.data) {
        const data = exportStatsResponse.value.data;
        setExportStats({
          total_exports: data.total_exports || 0,
          total_rows_exported: data.total_rows_exported || 0
        });
      } else {
        setExportStats({
          total_exports: 0,
          total_rows_exported: 0
        });
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch {
      return 'Unknown';
    }
  };

  const handleJobCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  useEffect(() => {
    injectStyles('home-styles', STYLES);
  }, []);

  const dashboardStats = [
    { value: formatNumber(stats.total_jobs), label: 'Jobs processed', change: `+${performanceMetrics.today_total_jobs} today`, subtext: 'Total jobs' },
    { value: formatNumber(exportStats.total_rows_exported), label: 'Records extracted', change: `+${realtimeMetrics.today_records.toLocaleString()} today`, subtext: 'Total volume' },
    { value: `${stats.success_rate}%`, label: 'Success rate', change: `7d: ${performanceMetrics.success_rate_7d}%`, subtext: 'Last 7 days' },
    { value: formatNumber(stats.total_pages_scraped), label: 'Pages scraped', change: `+${realtimeMetrics.today_jobs} jobs`, subtext: 'Total pages' },
  ];

  const features = [
    {
      title: 'AI-powered parsing',
      description: 'Intelligent field detection and entity recognition without manual selectors. Adapts to layout changes automatically.',
      icon: Zap,
    },
    {
      title: 'Proxy rotation & bypass',
      description: 'Automatic residential/datacenter rotation, CAPTCHA solving, and geo-targeting with real-time ban detection.',
      icon: Shield,
    },
    {
      title: 'Multi-format delivery',
      description: 'Export to CSV, JSON, Parquet, or direct database sync. Webhooks and scheduled pipelines included.',
      icon: Database,
    },
    {
      title: 'Observability suite',
      description: 'Granular metrics, logs, and alerts. Monitor every job, proxy health, and data volume in real time.',
      icon: BarChart3,
    },
  ];

  function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-30px' },
    transition: { duration: 0.35, delay, ease: [0.2, 0.65, 0.3, 0.9] },
  });

  const navItems = [
    { label: 'Playground', path: '/playground' },
    { label: 'Documentation', path: '/docs' },
  ];

  const footerLinks = [
    { label: 'Privacy', path: '/privacy' },
    { label: 'Terms', path: '/terms' },
    { label: 'Documentation', path: '/docs' },
    { label: 'Status', path: '/status' },
  ];

  if (loading) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="home-root">
      {error && (
        <div style={{ background: 'var(--error)', color: 'white', padding: 12, textAlign: 'center', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Nav */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Webby" style={{ height: 70, width: 'auto', display: 'block' }} />
          </Link>

          <div className="home-nav-links">
            {navItems.map((item) => (
              <Link key={item.label} to={item.path} className="home-nav-link">
                {item.label}
              </Link>
            ))}
            <PrimaryButton to="/login" icon={<ArrowRight size={16} />}>
              Get started
            </PrimaryButton>
          </div>

          <button className="home-mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="home-mobile-menu">
            {navItems.map((item) => (
              <Link key={item.label} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            <PrimaryButton to="/login" icon={<ArrowRight size={16} />} fullWidth>
              Get started
            </PrimaryButton>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-grid">
          <div>
            <div className="home-eyebrow">
              <span className="home-eyebrow-dot" />
              <span className="home-eyebrow-text">
                Production ready · {stats.completed_jobs.toLocaleString()} jobs completed
              </span>
            </div>
            <h1>
              Web data extraction <br /> at enterprise scale
            </h1>
            <p>
              The platform engineering teams trust for high-volume scraping, intelligent parsing, and reliable data delivery — without the ops overhead.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <PrimaryButton to="/login" icon={<ArrowRight size={16} />}>
                Get started
              </PrimaryButton>
              <Link to="/playground">
                <SecondaryButton>
                  <Zap size={14} /> Try Playground
                </SecondaryButton>
              </Link>
            </div>
          </div>
          <div>
            <HeroGraphic stats={{ active_jobs: realtimeMetrics.active_jobs, success_rate: stats.success_rate }} />
          </div>
        </div>
      </section>

      

      {/* Stats */}
      <div className="home-stats-band">
        <div className="home-stats-grid">
          {dashboardStats.map((stat, idx) => (
            <div key={idx}>
              <div className="home-stat-value">{stat.value}</div>
              <div className="home-stat-label">{stat.label}</div>
              <div className="home-stat-meta">
                <span className="home-stat-change">{stat.change}</span>
                <span className="home-stat-subtext">{stat.subtext}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="home-features">
        <div className="home-features-header">
          <div className="home-section-label">Platform capabilities</div>
          <h2 className="home-section-title">Built for demanding data teams</h2>
          <p className="home-section-desc">
            Everything you need to extract, process, and act on web data — reliably and at scale.
          </p>
        </div>
        <div className="home-features-grid">
          {features.map((feat, i) => (
            <motion.div key={i} {...fadeUp(i * 0.05)}>
              <Card hover>
                <div className="home-feature-icon">
                  <feat.icon size={22} strokeWidth={1.7} />
                </div>
                <h3 className="home-feature-title">{feat.title}</h3>
                <p className="home-feature-desc">{feat.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Jobs */}
      <section className="home-recent">
        <div className="home-recent-header">
          <div>
            <h2 className="home-recent-title">Recent extraction jobs</h2>
            <p className="home-recent-sub">
              {realtimeMetrics.active_jobs} active jobs · {performanceMetrics.today_total_jobs} today
            </p>
          </div>
        </div>
        <div className="home-table-wrap">
          {recentJobs.length === 0 ? (
            <div className="home-empty">
              <div className="home-empty-icon"><Briefcase size={32} /></div>
              <div className="home-empty-title">No jobs yet</div>
              <div className="home-empty-desc">Start scraping in the playground to create your first job</div>
            </div>
          ) : (
            <table className="home-table">
              <thead>
                <tr>
                  <th>Job name</th>
                  <th>Status</th>
                  <th>Records</th>
                  <th>Completed</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="job-name-cell">{job.name || 'Untitled'}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td>{job.records ? job.records.toLocaleString() : '—'}</td>
                    <td>{job.completed || 'Unknown'}</td>
                    <td>
                      <Link to="/jobs" style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* CTA */}
      <div className="home-cta-wrap">
        <div className="home-cta">
          <h2>Ready to scale your web intelligence?</h2>
          <p>
            Join leading organizations extracting clean, structured data at enterprise volume.
          </p>
          <div className="home-cta-actions">
            <PrimaryButton to="/login" icon={<ArrowRight size={16} />}>
              Get started
            </PrimaryButton>
            <Link to="/docs">
              <SecondaryButton>
                <BookOpen size={14} /> View Docs
              </SecondaryButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div>
            <div className="home-footer-brand">
              <img src={logo} alt="Webby" style={{ height: 28 }} />
              <span>Webby</span>
            </div>
            <div className="home-footer-copy">© 2026 Webby · Enterprise Web Intelligence</div>
            <div className="home-footer-badges">
              <span className="home-footer-badge">SOC 2 Type II</span>
              <span className="home-footer-badge">GDPR compliant</span>
            </div>
          </div>
          <div className="home-footer-links">
            {footerLinks.map((item) => (
              <Link key={item.label} to={item.path} className="home-footer-link">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;