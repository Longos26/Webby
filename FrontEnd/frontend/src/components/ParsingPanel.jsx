// frontend/src/components/ParsingPanel.jsx - MongoDB Atlas Enterprise Edition

import React, { useState, useEffect } from 'react';
import {
  Wand2, Copy, Download, CheckCircle, AlertCircle,
  RefreshCw, Code, List, Sparkles,
  X, ChevronDown, Brain, Hash, Type, FileText,
  Loader2, History, MessageSquare,
  Archive, FileCheck, Layers, Tag, Mail, Image, Settings, Users, Link, Eye
} from 'lucide-react';
import api from '../api';

// ============================================================
// STYLES — clean, no aggressive resets
// ============================================================

const STYLES = `
  .pp-root {
    --green: #00ED64;
    --green-dark: #00C355;
    --canvas: #0D1117;
    --surface: #161B22;
    --surface-el: #1F242E;
    --border: #30363D;
    --border-sub: #21262D;
    --text-1: #F0F6FC;
    --text-2: #8B949E;
    --text-3: #6E7681;
    --error: #F85149;
    --accent-bg: rgba(0,237,100,0.07);
    --accent-border: rgba(0,237,100,0.2);
    --r-sm: 6px;
    --r-md: 8px;
    --r-lg: 12px;
    --r-xl: 16px;
    --r-2xl: 20px;
    --mono: "JetBrains Mono","SF Mono","Courier New",monospace;
    --sans: "Inter","Segoe UI",system-ui,sans-serif;
    font-family: var(--sans);
    box-sizing: border-box;
  }

  .pp-root *, .pp-root *::before, .pp-root *::after {
    box-sizing: border-box;
  }

  @keyframes ppFadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes ppFadeOut { from { opacity:1; transform:scale(1); }        to { opacity:0; transform:scale(0.98); } }
  @keyframes ppSpin    { to { transform:rotate(360deg); } }
  @keyframes ppShimmer { 0%{background-position:-200px 0} 100%{background-position:200px 0} }
  @keyframes ppSlideIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }

  .pp-fade-in  { animation: ppFadeIn  0.22s ease-out; }
  .pp-slide-in { animation: ppSlideIn 0.25s ease-out; }
  .pp-spin     { animation: ppSpin    0.65s linear infinite; }
  .pp-fade-out { animation: ppFadeOut 0.15s ease forwards; }

  /* ── Overlay ── */
  .pp-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(13,17,23,0.92);
    backdrop-filter: blur(8px);
  }

  /* ── Modal shell ── */
  .pp-modal {
    width: 100%;
    max-width: 1200px;
    height: 85vh;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-2xl);
    box-shadow: 0 24px 48px rgba(0,0,0,0.4);
    overflow: hidden;
  }

  /* ── Header ── */
  .pp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    background: rgba(0,237,100,0.02);
  }

  .pp-brand { display:flex; align-items:center; gap:12px; }

  .pp-brand-icon {
    width: 38px;
    height: 38px;
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    border-radius: var(--r-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--green);
    flex-shrink: 0;
  }

  .pp-brand-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-1);
    margin: 0 0 3px;
    line-height: 1;
  }

  .pp-brand-sub {
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--mono);
    margin: 0;
    line-height: 1;
  }

  .pp-close-btn {
    width: 30px;
    height: 30px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: var(--text-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 120ms, border-color 120ms, color 120ms;
  }
  .pp-close-btn:hover {
    background: rgba(248,81,73,0.1);
    border-color: var(--error);
    color: var(--error);
  }

  /* ── Body layout ── */
  .pp-body {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }

  /* ── Left panel ── */
  .pp-left {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    border-right: 1px solid var(--border);
    overflow-y: auto;
  }
  .pp-left::-webkit-scrollbar { width:3px; }
  .pp-left::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }

  /* ── Right panel ── */
  .pp-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    background: var(--canvas);
  }

  /* ── Card ── */
  .pp-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    overflow: hidden;
  }

  .pp-card-hd {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
  }
  .pp-card-hd svg { color: var(--green); }

  .pp-card-bd { padding: 14px; }

  /* ── Textarea ── */
  .pp-textarea {
    width: 100%;
    background: var(--canvas);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 10px 12px;
    color: var(--text-1);
    font-size: 13px;
    font-family: var(--sans);
    line-height: 1.55;
    resize: vertical;
    outline: none;
    transition: border-color 120ms, box-shadow 120ms;
    display: block;
  }
  .pp-textarea:focus {
    border-color: var(--green);
    box-shadow: 0 0 0 2px rgba(0,237,100,0.1);
  }
  .pp-textarea::placeholder { color: var(--text-3); }

  .pp-char-count {
    text-align: right;
    margin-top: 4px;
    font-size: 10px;
    font-family: var(--mono);
    color: var(--text-3);
  }

  /* ── Quick prompts ── */
  .pp-quick-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
    margin: 12px 0 8px;
  }
  .pp-quick-label svg { color: var(--green); }

  .pp-chips {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .pp-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    background: var(--canvas);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    font-size: 11px;
    color: var(--text-2);
    cursor: pointer;
    transition: background 120ms, border-color 120ms, color 120ms;
    text-align: left;
  }
  .pp-chip:hover {
    background: var(--surface-el);
    border-color: var(--green);
    color: var(--text-1);
  }
  .pp-chip svg { opacity: 0.5; width:11px; height:11px; flex-shrink:0; }
  .pp-chip:hover svg { opacity:1; color:var(--green); }

  /* ── Extract button ── */
  .pp-extract-btn {
    width: 100%;
    margin-top: 14px;
    padding: 10px;
    background: linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%);
    border: none;
    border-radius: var(--r-lg);
    color: #0D1117;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    transition: opacity 120ms, transform 120ms, box-shadow 120ms;
  }
  .pp-extract-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(0,237,100,0.22);
  }
  .pp-extract-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .pp-shortcut {
    margin-top: 7px;
    text-align: center;
    font-size: 10px;
    font-family: var(--mono);
    color: var(--text-3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  .pp-key {
    background: var(--canvas);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 5px;
    font-size: 10px;
  }

  /* ── How-it-works ── */
  .pp-how {
    font-size: 11px;
    color: var(--text-3);
    line-height: 1.55;
    margin: 0;
  }
  .pp-how-checks {
    display: flex;
    gap: 14px;
    margin-top: 10px;
    font-size: 11px;
    color: var(--text-2);
  }
  .pp-how-checks span { color: var(--green); margin-right: 4px; }

  /* ── Error ── */
  .pp-error {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    background: rgba(248,81,73,0.08);
    border: 1px solid rgba(248,81,73,0.25);
    border-radius: var(--r-lg);
    font-size: 12px;
    color: var(--error);
  }
  .pp-error-msg { flex: 1; line-height: 1.4; }
  .pp-error-x {
    background: none;
    border: none;
    color: var(--error);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* ── Result card (right panel) ── */
  .pp-result-wrap { padding: 14px 14px 0; }

  .pp-result-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    overflow: hidden;
    animation: ppSlideIn 0.28s ease-out;
  }

  .pp-result-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    background: rgba(0,237,100,0.025);
    gap: 10px;
  }

  .pp-result-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--green);
    flex-shrink: 0;
  }

  .pp-ai-badge {
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    padding: 1px 6px;
    border-radius: var(--r-sm);
    font-size: 9px;
    color: var(--green);
    font-family: var(--mono);
  }

  .pp-result-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pp-result-body {
    padding: 14px;
    max-height: 260px;
    overflow-y: auto;
  }
  .pp-result-body::-webkit-scrollbar { width:3px; }
  .pp-result-body::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }

  .pp-pre {
    margin: 0;
    font-size: 11px;
    font-family: var(--mono);
    line-height: 1.55;
    color: var(--text-2);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .pp-formatted { font-size: 12px; line-height: 1.55; color: var(--text-2); }
  .pp-formatted h2 { font-size:13px; font-weight:600; color:var(--text-1); margin:12px 0 5px; padding-bottom:4px; border-bottom:1px solid var(--border); }
  .pp-formatted h3 { font-size:12px; font-weight:600; color:var(--text-2); margin:8px 0 4px; }
  .pp-formatted p  { margin:0 0 5px; }
  .pp-formatted ul, .pp-formatted ol { margin:5px 0; padding-left:18px; }
  .pp-formatted li { margin:2px 0; }
  .pp-formatted code { background:rgba(255,255,255,0.05); padding:1px 4px; border-radius:var(--r-sm); font-family:var(--mono); font-size:10px; }
  .pp-formatted blockquote { border-left:2px solid var(--green); padding-left:9px; margin:5px 0; color:var(--text-3); }

  /* ── Stats bar ── */
  .pp-stats {
    display: flex;
    gap: 18px;
    padding: 8px 14px;
    border-top: 1px solid var(--border);
    background: var(--canvas);
  }
  .pp-stat {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    color: var(--text-3);
  }
  .pp-stat-val {
    font-weight: 600;
    color: var(--text-1);
    background: var(--surface);
    padding: 1px 6px;
    border-radius: var(--r-sm);
    font-family: var(--mono);
    font-size: 10px;
  }

  /* ── View tabs ── */
  .pp-view-tabs {
    display: flex;
    gap: 2px;
    background: var(--canvas);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 2px;
  }
  .pp-vtab {
    padding: 4px 9px;
    background: transparent;
    border: none;
    border-radius: var(--r-sm);
    font-size: 10px;
    font-weight: 500;
    color: var(--text-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: background 100ms, color 100ms;
  }
  .pp-vtab:hover { color: var(--text-1); }
  .pp-vtab.active { background: var(--accent-bg); color: var(--green); }

  /* ── Icon buttons ── */
  .pp-icon-btn {
    width: 28px;
    height: 28px;
    background: var(--canvas);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: var(--text-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 120ms, border-color 120ms, color 120ms;
    flex-shrink: 0;
  }
  .pp-icon-btn:hover { background: var(--surface-el); border-color: var(--text-3); color: var(--text-1); }
  .pp-icon-btn.success { color: var(--green); border-color: var(--green); }

  /* ── History section ── */
  .pp-history-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 14px;
  }

  .pp-history-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 10px;
  }

  .pp-history-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
  }

  .pp-history-count {
    margin-left: 3px;
    color: var(--text-3);
  }

  .pp-history-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pp-history-list::-webkit-scrollbar { width:3px; }
  .pp-history-list::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }

  /* ── History item ── */
  .pp-hitem {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
    transition: border-color 120ms;
  }
  .pp-hitem:hover { border-color: var(--accent-border); }

  .pp-hitem-hd {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    cursor: pointer;
    min-width: 0;
  }

  .pp-hitem-dot {
    width: 5px;
    height: 5px;
    background: var(--green);
    border-radius: 50%;
    opacity: 0.5;
    flex-shrink: 0;
  }

  .pp-hitem-desc {
    flex: 1;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .pp-hitem-date {
    font-size: 10px;
    font-family: var(--mono);
    color: var(--text-3);
    flex-shrink: 0;
    white-space: nowrap;
  }

  .pp-hitem-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .pp-chevron {
    color: var(--text-3);
    transition: transform 150ms;
    flex-shrink: 0;
  }
  .pp-chevron.open { transform: rotate(180deg); }

  .pp-hitem-body {
    border-top: 1px solid var(--border);
    padding: 10px 12px;
    max-height: 140px;
    overflow-y: auto;
    background: var(--canvas);
  }
  .pp-hitem-body::-webkit-scrollbar { width:3px; }
  .pp-hitem-body::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }

  .pp-hitem-pre {
    font-size: 11px;
    font-family: var(--mono);
    color: var(--text-3);
    line-height: 1.45;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* ── Skeleton ── */
  .pp-skeleton {
    height: 48px;
    border-radius: var(--r-lg);
    background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
    background-size: 200px 100%;
    animation: ppShimmer 1.4s ease-in-out infinite;
  }

  /* ── Empty state ── */
  .pp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 36px 20px;
    text-align: center;
  }
  .pp-empty-icon {
    width: 52px;
    height: 52px;
    background: var(--accent-bg);
    border: 1px solid var(--accent-border);
    border-radius: var(--r-2xl);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--green);
  }
  .pp-empty-title { font-size:13px; font-weight:600; color:var(--text-2); margin:0; }
  .pp-empty-sub   { font-size:11px; color:var(--text-3); max-width:200px; line-height:1.45; margin:0; }

  /* ── Footer ── */
  .pp-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 18px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .pp-footer-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 10px;
    color: var(--text-3);
  }
  .pp-status-dot {
    width: 5px;
    height: 5px;
    background: var(--green);
    border-radius: 50%;
  }
  .pp-footer-status { display:flex; align-items:center; gap:5px; }
  .pp-footer-close {
    padding: 5px 16px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    font-size: 11px;
    font-weight: 500;
    color: var(--text-2);
    cursor: pointer;
    transition: background 120ms, border-color 120ms, color 120ms;
  }
  .pp-footer-close:hover {
    background: var(--surface-el);
    border-color: var(--text-3);
    color: var(--text-1);
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('pp-styles')) {
  const s = document.createElement('style');
  s.id = 'pp-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
}

// ============================================================
// HELPERS
// ============================================================

const escapeHtml = (text) => {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
};

const formatContent = (content, mode) => {
  if (mode === 'raw') return { type: 'pre', text: content };
  if (mode === 'json') {
    try { return { type: 'pre', text: JSON.stringify(JSON.parse(content), null, 2) }; }
    catch { return { type: 'pre', text: content }; }
  }

  const lines = content.split('\n');
  let inList = false, listType = null, html = '';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (inList) { html += `</${listType}>`; inList = false; }
      html += `<h2>${escapeHtml(line.slice(3))}</h2>`;
    } else if (line.startsWith('### ')) {
      if (inList) { html += `</${listType}>`; inList = false; }
      html += `<h3>${escapeHtml(line.slice(4))}</h3>`;
    } else if (/^[-*]\s/.test(line)) {
      if (!inList || listType !== 'ul') { if (inList) html += `</${listType}>`; html += '<ul>'; inList = true; listType = 'ul'; }
      html += `<li>${escapeHtml(line.slice(2))}</li>`;
    } else if (/^\d+\.\s/.test(line)) {
      if (!inList || listType !== 'ol') { if (inList) html += `</${listType}>`; html += '<ol>'; inList = true; listType = 'ol'; }
      html += `<li>${escapeHtml(line.replace(/^\d+\.\s/, ''))}</li>`;
    } else if (line.startsWith('> ')) {
      if (inList) { html += `</${listType}>`; inList = false; }
      html += `<blockquote>${escapeHtml(line.slice(2))}</blockquote>`;
    } else if (line.trim() === '') {
      if (inList) { html += `</${listType}>`; inList = false; }
      html += '<br/>';
    } else {
      if (inList) { html += `</${listType}>`; inList = false; }
      let l = escapeHtml(line);
      l = l.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      l = l.replace(/\*(.*?)\*/g, '<em>$1</em>');
      l = l.replace(/`(.*?)`/g, '<code>$1</code>');
      html += `<p>${l}</p>`;
    }
  }
  if (inList) html += `</${listType}>`;
  return { type: 'html', html };
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button className={`pp-icon-btn${copied ? ' success' : ''}`} onClick={handle} title={copied ? 'Copied!' : 'Copy'}>
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
    </button>
  );
}

function DownloadButton({ content, jobId }) {
  const handle = () => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([content], { type: 'text/plain' })),
      download: `extract_${jobId}_${Date.now()}.txt`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  return (
    <button className="pp-icon-btn" onClick={handle} title="Download">
      <Download size={12} />
    </button>
  );
}

function ViewTabs({ current, onChange }) {
  return (
    <div className="pp-view-tabs">
      {[{ id: 'formatted', label: 'Formatted', Icon: Eye }, { id: 'raw', label: 'Raw', Icon: FileText }, { id: 'json', label: 'JSON', Icon: Code }].map(({ id, label, Icon }) => (
        <button key={id} className={`pp-vtab${current === id ? ' active' : ''}`} onClick={() => onChange(id)}>
          <Icon size={10} /> {label}
        </button>
      ))}
    </div>
  );
}

function ResultContent({ content, viewMode }) {
  const f = formatContent(content, viewMode);
  if (f.type === 'pre') return <pre className="pp-pre">{f.text}</pre>;
  return <div className="pp-formatted" dangerouslySetInnerHTML={{ __html: f.html }} />;
}

function ResultStats({ content }) {
  const words = content.split(/\s+/).filter(Boolean).length;
  return (
    <div className="pp-stats">
      <div className="pp-stat"><Type size={10} /> Words <span className="pp-stat-val">{words.toLocaleString()}</span></div>
      <div className="pp-stat"><Hash size={10} /> Chars <span className="pp-stat-val">{content.length.toLocaleString()}</span></div>
      <div className="pp-stat"><List size={10} /> Lines <span className="pp-stat-val">{content.split('\n').length}</span></div>
    </div>
  );
}

function HistoryItem({ result, jobId }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pp-hitem">
      <div className="pp-hitem-hd" onClick={() => setOpen(!open)}>
        <span className="pp-hitem-dot" />
        <span className="pp-hitem-desc" title={result.parse_description || 'Extraction result'}>
          {result.parse_description || 'Extraction result'}
        </span>
        <span className="pp-hitem-date">{new Date(result.created_at).toLocaleString()}</span>
        <div className="pp-hitem-actions" onClick={e => e.stopPropagation()}>
          <CopyButton text={result.parsed_content} />
          <DownloadButton content={result.parsed_content} jobId={jobId} />
        </div>
        <ChevronDown size={12} className={`pp-chevron${open ? ' open' : ''}`} />
      </div>
      {open && (
        <div className="pp-hitem-body">
          <pre className="pp-hitem-pre">
            {result.parsed_content.substring(0, 500)}{result.parsed_content.length > 500 ? '…' : ''}
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================================================
// QUICK PROMPTS
// ============================================================

const QUICK_PROMPTS = [
  { Icon: Tag,      label: 'Products & Prices', prompt: 'Extract all product names and prices' },
  { Icon: Mail,     label: 'Contact Info',       prompt: 'Find all email addresses and phone numbers' },
  { Icon: FileText, label: 'Article Metadata',   prompt: 'Extract article titles, authors, and dates' },
  { Icon: Image,    label: 'Images & Media',     prompt: 'Get all image URLs with alt text' },
  { Icon: Settings, label: 'Specifications',     prompt: 'Extract technical specifications' },
  { Icon: Users,    label: 'Contact Details',    prompt: 'Find contact information from the page' },
  { Icon: Link,     label: 'Links',              prompt: 'Extract all links with anchor text' },
  { Icon: Layers,   label: 'Headings',           prompt: 'Get main headings and their content' },
];

// ============================================================
// MAIN
// ============================================================

export default function ParsingPanel({ jobId, jobName, onClose }) {
  const [description, setDescription]   = useState('');
  const [isParsing, setIsParsing]       = useState(false);
  const [result, setResult]             = useState(null);
  const [history, setHistory]           = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [viewMode, setViewMode]         = useState('formatted');
  const [isClosing, setIsClosing]       = useState(false);
  const [error, setError]               = useState(null);

  const close = () => { setIsClosing(true); setTimeout(onClose, 160); };

  useEffect(() => {
    if (jobId) fetchHistory();
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jobId]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/scraping/jobs/${jobId}/parsed-results`);
      setHistory(res.data.parsed_results || []);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParse = async () => {
    if (!description.trim()) return;
    setIsParsing(true);
    setError(null);
    try {
      const res = await api.post(`/api/scraping/jobs/${jobId}/parse`, {
        dom_content: '',
        parse_description: description,
      });
      setResult(res.data.parse_result);
      await fetchHistory();
      setDescription('');
    } catch (e) {
      setError(e.response?.data?.detail || 'Extraction failed. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleParse();
  };

  return (
    <div className={`pp-root pp-overlay${isClosing ? ' pp-fade-out' : ''}`} onClick={close}>
      <div className={`pp-modal${isClosing ? ' pp-fade-out' : ''}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pp-header">
          <div className="pp-brand">
            <div className="pp-brand-icon"><Brain size={18} /></div>
            <div>
              <p className="pp-brand-title">Intelligent Data Extraction</p>
              <p className="pp-brand-sub">{jobName || 'Scraping Job'} · Job {jobId}</p>
            </div>
          </div>
          <button className="pp-close-btn" onClick={close}><X size={14} /></button>
        </div>

        {/* Body */}
        <div className="pp-body">

          {/* ── Left Panel ── */}
          <div className="pp-left">
            {error && (
              <div className="pp-error pp-fade-in">
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span className="pp-error-msg">{error}</span>
                <button className="pp-error-x" onClick={() => setError(null)}><X size={12} /></button>
              </div>
            )}

            <div className="pp-card">
              <div className="pp-card-hd"><Wand2 size={11} /> Extraction Query</div>
              <div className="pp-card-bd">
                <textarea
                  className="pp-textarea"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Describe what you want to extract…"
                  rows={4}
                />
                {description.length > 0 && (
                  <div className="pp-char-count">{description.length} chars</div>
                )}

                <div className="pp-quick-label"><Sparkles size={10} /> Quick Start</div>
                <div className="pp-chips">
                  {QUICK_PROMPTS.map(({ Icon, label, prompt }) => (
                    <button key={label} className="pp-chip" onClick={() => setDescription(prompt)}>
                      <Icon size={11} /> {label}
                    </button>
                  ))}
                </div>

                <button className="pp-extract-btn" onClick={handleParse} disabled={isParsing || !description.trim()}>
                  {isParsing
                    ? <><Loader2 size={14} className="pp-spin" /> Processing…</>
                    : <><Wand2 size={14} /> Extract</>
                  }
                </button>
                <div className="pp-shortcut">
                  <span className="pp-key">⌘↵</span> to extract
                </div>
              </div>
            </div>

            <div className="pp-card">
              <div className="pp-card-hd"><FileCheck size={11} /> How it works</div>
              <div className="pp-card-bd">
                <p className="pp-how">
                  Our AI analyzes the scraped content and extracts exactly what you need.
                  Describe the information you're looking for, and the system will identify
                  and extract relevant data.
                </p>
                <div className="pp-how-checks">
                  <div><span>✓</span>Structured data</div>
                  <div><span>✓</span>Natural language</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="pp-right">
            {result && (
              <div className="pp-result-wrap">
                <div className="pp-result-card">
                  <div className="pp-result-hd">
                    <div className="pp-result-title">
                      <Sparkles size={11} /> Latest
                      <span className="pp-ai-badge">AI</span>
                    </div>
                    <div className="pp-result-actions">
                      <ViewTabs current={viewMode} onChange={setViewMode} />
                      <CopyButton text={result} />
                      <DownloadButton content={result} jobId={jobId} />
                    </div>
                  </div>
                  <div className="pp-result-body">
                    <ResultContent content={result} viewMode={viewMode} />
                  </div>
                  <ResultStats content={result} />
                </div>
              </div>
            )}

            {/* History */}
            <div className="pp-history-section">
              <div className="pp-history-hd">
                <div className="pp-history-title">
                  <History size={11} /> History
                  {history.length > 0 && <span className="pp-history-count">({history.length})</span>}
                </div>
                <button className="pp-icon-btn" onClick={fetchHistory} title="Refresh" style={{ width: 26, height: 26 }}>
                  <RefreshCw size={11} />
                </button>
              </div>

              <div className="pp-history-list">
                {isLoading ? (
                  <>
                    <div className="pp-skeleton" />
                    <div className="pp-skeleton" style={{ opacity: 0.7 }} />
                    <div className="pp-skeleton" style={{ opacity: 0.4 }} />
                  </>
                ) : history.length > 0 ? (
                  history.map(item => <HistoryItem key={item.id} result={item} jobId={jobId} />)
                ) : !result ? (
                  <div className="pp-empty">
                    <div className="pp-empty-icon"><MessageSquare size={24} /></div>
                    <p className="pp-empty-title">No extractions yet</p>
                    <p className="pp-empty-sub">Enter a description on the left to get started</p>
                  </div>
                ) : (
                  <div className="pp-empty">
                    <div className="pp-empty-icon"><Archive size={24} /></div>
                    <p className="pp-empty-title">History empty</p>
                    <p className="pp-empty-sub">Past extractions will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pp-footer">
          <div className="pp-footer-meta">
            <div className="pp-footer-status">
              <div className="pp-status-dot" />
              <span>AI Ready</span>
            </div>
            <span>·</span>
            <Brain size={10} />
            <span>Powered by OpenAI</span>
          </div>
          <button className="pp-footer-close" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}