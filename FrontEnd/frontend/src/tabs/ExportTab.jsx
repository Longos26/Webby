// frontend/src/pages/ExportTab.jsx - REFINED ENTERPRISE DESIGN

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download, FileSpreadsheet, FileJson, FileText, Database,
  Mail, Phone, Link as LinkIcon, DollarSign, Eye, CheckCircle,
  AlertCircle, Loader2, RefreshCw, Trash2, Package, X, HardDrive,
  ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft,
  Clock, Hash, Layers, Globe, AtSign, Smartphone, Link, Tag, Calendar,
  Maximize2, Pencil
} from 'lucide-react';
import api from '../api';

// ============================================================
// HELPER FUNCTION TO EXTRACT ERROR MESSAGE
// ============================================================

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
// STYLES - REFINED ENTERPRISE
// ============================================================

const STYLES = `
  .export-root {
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
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Courier New", monospace;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .export-root * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .export-root {
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

  .fade-slide-in {
    animation: fadeSlideIn 0.2s ease-out;
  }

  .spin {
    animation: spin 0.6s linear infinite;
  }

  .export-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: border-color var(--transition);
  }

  .export-card:hover {
    border-color: var(--color-accent-border);
  }

  .export-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 10px;
  }

  .export-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
  }

  .export-card-title svg {
    color: var(--color-mdb-green);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    transition: all var(--transition);
  }

  .stat-card:hover {
    border-color: var(--color-accent-border);
  }

  .stat-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background: var(--color-accent-dim);
    border: 1px solid var(--color-accent-border);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--color-mdb-green);
    margin-bottom: 2px;
  }

  .stat-label {
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 500;
  }

  .job-selector {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .job-search {
    padding: 10px 12px;
    border-bottom: 1px solid var(--color-border);
  }

  .job-search-input {
    width: 100%;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 7px 12px;
    font-size: 14px;
    color: var(--color-text-primary);
    transition: border-color var(--transition);
  }

  .job-search-input:focus {
    outline: none;
    border-color: var(--color-mdb-green);
  }

  .job-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .job-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    cursor: pointer;
    transition: all var(--transition);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .job-item:hover {
    background: var(--color-surface-elevated);
  }

  .job-item.selected {
    background: var(--color-accent-dim);
    border-left: 2px solid var(--color-mdb-green);
  }

  .job-info {
    flex: 1;
    min-width: 0;
  }

  .job-name {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .job-meta {
    font-size: 11px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .job-badge {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    padding: 2px 10px;
    font-size: 10px;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .format-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 10px;
    margin-top: 14px;
  }

  .format-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 10px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition);
  }

  .format-btn:hover:not(:disabled) {
    border-color: var(--color-mdb-green);
    background: var(--color-accent-dim);
    transform: translateY(-1px);
  }

  .format-btn.selected {
    border-color: var(--color-mdb-green);
    background: var(--color-accent-dim);
  }

  .format-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .format-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .format-name {
    font-size: 11px;
    font-weight: 500;
  }

  .options-panel {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--color-border);
  }

  .option-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    flex-wrap: wrap;
    gap: 10px;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 38px;
    height: 20px;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-border);
    transition: 0.2s;
    border-radius: var(--radius-full);
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.2s;
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background-color: var(--color-mdb-green);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(18px);
  }

  .export-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, var(--color-mdb-green) 0%, var(--color-mdb-green-dark) 100%);
    border: none;
    border-radius: var(--radius-md);
    color: #0D1117;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
    margin-top: 16px;
    font-family: var(--font-sans);
  }

  .export-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 237, 100, 0.2);
  }

  .export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .preview-table-container {
    max-height: 400px;
    overflow: auto;
  }

  .preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    min-width: 400px;
  }

  .preview-table th {
    text-align: left;
    padding: 8px 12px;
    background: var(--color-canvas);
    border-bottom: 1px solid var(--color-border);
    font-weight: 600;
    color: var(--color-text-secondary);
    position: sticky;
    top: 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .preview-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border-subtle);
    color: var(--color-text-primary);
  }

  .preview-table tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    margin-bottom: 16px;
    font-size: 13px;
  }

  .alert-error {
    background: var(--status-error-bg);
    border: 1px solid var(--status-error-border);
    color: var(--color-error);
  }

  .alert-success {
    background: var(--status-success-bg);
    border: 1px solid var(--status-success-border);
    color: var(--color-success);
  }

  .alert-info {
    background: var(--status-info-bg);
    border: 1px solid var(--status-info-border);
    color: var(--color-info);
  }

  .empty-state {
    text-align: center;
    padding: 32px 20px;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 12px;
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
    margin-bottom: 4px;
  }

  .empty-description {
    font-size: 12px;
    color: var(--color-text-muted);
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

  .two-column {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 20px;
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .section-subtitle {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  /* ============================================================ */
  /* RESPONSIVE BREAKPOINTS */
  /* ============================================================ */

  @media (max-width: 1024px) {
    .two-column {
      grid-template-columns: 260px 1fr;
      gap: 16px;
    }
  }

  @media (max-width: 768px) {
    .export-root {
      padding: 12px !important;
    }
    
    .two-column {
      grid-template-columns: 1fr !important;
      gap: 14px !important;
    }
    
    .stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }
    
    .format-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 6px !important;
    }
    
    .format-btn {
      padding: 10px 6px !important;
    }
    
    .format-btn .format-icon {
      width: 28px !important;
      height: 28px !important;
      font-size: 16px !important;
    }
    
    .format-btn .format-name {
      font-size: 10px !important;
    }
    
    .job-list {
      max-height: 200px !important;
    }
    
    .job-item {
      padding: 8px 12px !important;
    }
    
    .job-name {
      font-size: 12px !important;
    }
    
    .preview-table-container {
      max-height: 180px !important;
    }
    
    .preview-table th,
    .preview-table td {
      padding: 5px 8px !important;
      font-size: 10px !important;
    }
    
    .option-row {
      flex-wrap: wrap !important;
      gap: 6px !important;
    }
    
    .export-btn {
      font-size: 12px !important;
      padding: 10px !important;
    }

    .job-search-input {
      font-size: 16px !important;
    }
  }
  
  @media (max-width: 480px) {
    .export-root {
      padding: 8px !important;
    }

    .stats-grid {
      grid-template-columns: 1fr !important;
      gap: 6px !important;
    }
    
    .format-grid {
      grid-template-columns: 1fr 1fr !important;
      gap: 6px !important;
    }
    
    .format-btn {
      padding: 8px 4px !important;
    }
    
    .format-btn .format-icon {
      width: 24px !important;
      height: 24px !important;
      font-size: 14px !important;
    }
    
    .format-btn .format-name {
      font-size: 9px !important;
    }
    
    .modal {
      max-width: 100% !important;
      margin: 8px !important;
    }
    
    .preview-table-container {
      max-height: 120px !important;
    }
    
    .export-btn {
      font-size: 11px !important;
      padding: 8px !important;
    }

    .stat-card {
      padding: 8px 12px !important;
    }

    .stat-value {
      font-size: 18px !important;
    }

    .stat-label {
      font-size: 9px !important;
    }

    .stat-icon {
      width: 24px !important;
      height: 24px !important;
    }

    .job-search-input {
      font-size: 16px !important;
      padding: 5px 10px !important;
    }

    .alert {
      font-size: 11px !important;
      padding: 8px 10px !important;
    }

    .empty-state {
      padding: 20px 12px !important;
    }

    .empty-icon {
      width: 36px !important;
      height: 36px !important;
    }

    .empty-title {
      font-size: 12px !important;
    }

    .empty-description {
      font-size: 11px !important;
    }

    .section-label {
      font-size: 10px !important;
    }

    .section-title {
      font-size: 13px !important;
    }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('export-styles')) {
  const style = document.createElement('style');
  style.id = 'export-styles';
  style.textContent = STYLES;
  document.head.appendChild(style);
}

// ============================================================
// PREVIEW MODAL - REFINED
// ============================================================

const PreviewModal = ({ isOpen, onClose, data, fields, jobName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (!isOpen) return null;

  const filteredData = data?.filter(record => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return Object.values(record).some(value => 
      String(value).toLowerCase().includes(searchLower)
    );
  }) || [];

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          width: '95vw',
          maxWidth: '1400px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--color-border)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          animation: 'slideUp 0.25s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
              <Eye size={18} color="var(--color-mdb-green)" />
              <h2 style={{ fontSize: '17px', fontWeight: 600, margin: 0 }}>Dataset Preview</h2>
              {jobName && <span style={{ fontSize: '11px', background: 'var(--color-canvas)', padding: '2px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>{jobName}</span>}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {data?.length || 0} total records • {fields?.length || 0} fields
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-canvas)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              fontSize: '12px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-error)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            <X size={14} />
            <span>Esc</span>
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search in preview..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                background: 'var(--color-canvas)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px',
                fontSize: '14px',
                color: 'var(--color-text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-mdb-green)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {searchTerm && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              Found {filteredData.length} matching records
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px 20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              minWidth: '500px'
            }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 10 }}>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: 'var(--color-text-muted)',
                    borderBottom: '2px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>#</th>
                  {fields?.slice(0, 6).map(field => (
                    <th key={field} style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: 'var(--color-text-muted)',
                      borderBottom: '2px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((record, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{
                      padding: '6px 12px',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px'
                    }}>
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    {fields?.slice(0, 6).map(field => {
                      let value = record[field];
                      const isObject = typeof value === 'object' && value !== null;
                      const displayValue = isObject ? JSON.stringify(value, null, 2) : String(value || '-');
                      const isLong = displayValue.length > 80;
                      
                      return (
                        <td key={field} style={{
                          padding: '6px 12px',
                          color: 'var(--color-text-primary)',
                          maxWidth: '200px',
                          verticalAlign: 'top'
                        }}>
                          <div style={{
                            maxHeight: isLong ? '48px' : 'auto',
                            overflow: 'auto',
                            fontFamily: isObject ? 'var(--font-mono)' : 'inherit',
                            fontSize: isObject ? '10px' : '11px',
                            whiteSpace: isLong ? 'pre-wrap' : 'normal',
                            wordBreak: 'break-word',
                            color: isObject ? 'var(--color-text-secondary)' : 'var(--color-text-primary)'
                          }}>
                            {isLong ? `${displayValue.substring(0, 80)}...` : displayValue}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '32px 20px',
                color: 'var(--color-text-muted)'
              }}>
                <Package size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div style={{ fontSize: '13px' }}>No matching records found</div>
              </div>
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  background: 'var(--color-canvas)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  color: 'var(--color-text-primary)'
                }}
              >
                <ChevronsLeft size={12} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  background: 'var(--color-canvas)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  color: 'var(--color-text-primary)'
                }}
              >
                <ChevronLeft size={12} />
              </button>
              <span style={{ fontSize: '11px', padding: '0 8px', color: 'var(--color-text-secondary)' }}>{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  background: 'var(--color-canvas)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  color: 'var(--color-text-primary)'
                }}
              >
                <ChevronRight size={12} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  background: 'var(--color-canvas)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  color: 'var(--color-text-primary)'
                }}
              >
                <ChevronsRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(16px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 480px) {
          .preview-modal-content {
            width: 100vw !important;
            height: 100vh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// FORMAT CONFIGURATION
// ============================================================

const EXPORT_FORMATS = [
  { id: 'csv', name: 'CSV', icon: FileSpreadsheet, extension: '.csv', description: 'Excel-compatible' },
  { id: 'excel', name: 'Excel', icon: FileSpreadsheet, extension: '.xlsx', description: 'With formatting' },
  { id: 'json', name: 'JSON', icon: FileJson, extension: '.json', description: 'Structured data' },
];

// ============================================================
// MAIN COMPONENT - REFINED
// ============================================================

export default function ExportTab() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullDataset, setFullDataset] = useState(null);
  const [loadingFullPreview, setLoadingFullPreview] = useState(false);
  const [fileName, setFileName] = useState('');
  const itemsPerPage = 10;

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/export/jobs-with-results');
      const jobsData = response.data.jobs || [];
      setJobs(jobsData);
      setFilteredJobs(jobsData);
      if (jobsData.length > 0 && !selectedJobId) {
        setSelectedJobId(jobsData[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedJobId]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredJobs(jobs);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredJobs(jobs.filter(job => 
        job.name?.toLowerCase().includes(term) ||
        job.url?.toLowerCase().includes(term)
      ));
    }
    setCurrentPage(1);
  }, [searchTerm, jobs]);

  const loadStatsAndPreview = useCallback(async () => {
    if (!selectedJobId) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, previewRes] = await Promise.all([
        api.get(`/api/export/stats/${selectedJobId}`),
        api.post(`/api/export/preview/${selectedJobId}`, { limit: 10 })
      ]);
      setStats(statsRes.data);
      setPreviewData(previewRes.data);
      
      const job = jobs.find(j => j.id === selectedJobId);
      if (job && job.name) {
        const baseName = job.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        setFileName(`dataset_${baseName}_${timestamp}`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedJobId, jobs]);

  useEffect(() => {
    if (selectedJobId) loadStatsAndPreview();
  }, [selectedJobId, loadStatsAndPreview]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const loadFullPreview = async () => {
    if (!selectedJobId) return;
    setLoadingFullPreview(true);
    try {
      const response = await api.post(`/api/export/preview/${selectedJobId}`, { limit: 500 });
      setFullDataset(response.data);
      setIsModalOpen(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingFullPreview(false);
    }
  };

  const handleExport = async () => {
    if (!selectedJobId) {
      setError('Please select a job to export');
      return;
    }
    
    if (!fileName.trim()) {
      setError('Please enter a filename');
      return;
    }
    
    setExporting(true);
    setError(null);
    try {
      const response = await api.post('/api/export/generate', {
        job_id: selectedJobId,
        format: selectedFormat,
        include_metadata: includeMetadata
      }, { responseType: 'blob' });
      
      const format = EXPORT_FORMATS.find(f => f.id === selectedFormat);
      const finalFilename = `${fileName.trim()}${format?.extension || '.csv'}`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSuccess(`Dataset exported successfully as ${finalFilename}`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text();
          const errorJson = JSON.parse(errorText);
          setError(getErrorMessage({ response: errorJson }));
        } catch { setError('Export failed. Please try again.'); }
      } else { setError(getErrorMessage(err)); }
    } finally { setExporting(false); }
  };

  const handleBulkExport = async () => {
    if (jobs.length === 0) {
      setError('No jobs available to export');
      return;
    }
    
    if (!fileName.trim()) {
      setError('Please enter a filename');
      return;
    }
    
    setExporting(true);
    setError(null);
    try {
      const response = await api.post('/api/export/bulk', {
        job_ids: jobs.map(j => j.id),
        format: selectedFormat,
        include_metadata: includeMetadata
      }, { responseType: 'blob' });
      
      const format = EXPORT_FORMATS.find(f => f.id === selectedFormat);
      const finalFilename = `${fileName.trim()}_bulk${format?.extension || '.csv'}`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSuccess(`Bulk dataset exported: ${jobs.length} jobs`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text();
          const errorJson = JSON.parse(errorText);
          setError(getErrorMessage({ response: errorJson }));
        } catch { setError('Bulk export failed'); }
      } else { setError(getErrorMessage(err)); }
    } finally { setExporting(false); }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  useEffect(() => {
    if (selectedJob && selectedJob.name) {
      const baseName = selectedJob.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      setFileName(`dataset_${baseName}_${timestamp}`);
    }
  }, [selectedJob]);

  // Loading State
  if (loading && jobs.length === 0) {
    return (
      <div className="export-root">
        <div className="loading-state">
          <div className="loading-spinner" />
          <span style={{ color: 'var(--color-text-muted)' }}>Loading jobs...</span>
        </div>
      </div>
    );
  }

  // Render
  return (
    <div className="export-root" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Modal */}
      <PreviewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFullDataset(null);
        }}
        data={fullDataset?.preview}
        fields={fullDataset?.fields}
        jobName={selectedJob?.name}
      />

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={14} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'currentColor' }}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <CheckCircle size={14} />
          <span style={{ flex: 1 }}>{success}</span>
          <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'currentColor' }}><X size={14} /></button>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="two-column">
        {/* Left Panel - Job Selection */}
        <div className="export-card">
          <div className="export-card-header">
            <div className="export-card-title">
              <Package size={15} />
              Available Jobs
              <span style={{ fontSize: '11px', background: 'var(--color-canvas)', padding: '2px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>{filteredJobs.length}</span>
            </div>
            <button onClick={loadJobs} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><RefreshCw size={13} /></button>
          </div>
          
          <div className="job-search">
            <input 
              type="text" 
              placeholder="Search jobs..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="job-search-input"
            />
          </div>
          
          <div className="job-list">
            {paginatedJobs.map(job => (
              <div 
                key={job.id} 
                onClick={() => setSelectedJobId(job.id)} 
                className={`job-item ${selectedJobId === job.id ? 'selected' : ''}`}
              >
                <div className="job-info">
                  <div className="job-name">
                    {job.name}
                    {job.status === 'success' && <CheckCircle size={11} color="var(--color-success)" />}
                  </div>
                  <div className="job-meta">{job.url}</div>
                  <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--color-text-muted)' }}>{job.parsed_count} parsed results</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1, color: 'var(--color-text-primary)' }}><ChevronsLeft size={12} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1, color: 'var(--color-text-primary)' }}><ChevronLeft size={12} /></button>
              <span style={{ fontSize: '11px', padding: '0 8px', color: 'var(--color-text-secondary)' }}>{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', cursor: 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, color: 'var(--color-text-primary)' }}><ChevronRight size={12} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', cursor: 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, color: 'var(--color-text-primary)' }}><ChevronsRight size={12} /></button>
            </div>
          )}
        </div>

        {/* Right Panel - Export Configuration */}
        <div>
          {selectedJob ? (
            <>
              {/* Selected Job Info */}
              <div className="export-card" style={{ marginBottom: '16px' }}>
                <div className="export-card-body" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Selected Job</div>
                      <div style={{ fontWeight: 600, fontSize: '15px', wordBreak: 'break-word' }}>{selectedJob.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px', wordBreak: 'break-all' }}>{selectedJob.url}</div>
                    </div>
                    <div style={{ background: 'var(--color-canvas)', padding: '6px 14px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--color-border)', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Parsed Records</div>
                      <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-mdb-green)' }}>{selectedJob.parsed_count || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filename Input */}
              <div className="export-card" style={{ marginBottom: '16px' }}>
                <div className="export-card-header">
                  <div className="export-card-title">
                    <Pencil size={14} color="var(--color-mdb-green)" />
                    Export Filename
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="Enter filename..."
                      style={{
                        flex: 1,
                        minWidth: '120px',
                        background: 'var(--color-canvas)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 12px',
                        fontSize: '14px',
                        color: 'var(--color-text-primary)',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-mdb-green)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                    />
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--color-text-muted)',
                      padding: '6px 10px',
                      background: 'var(--color-canvas)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {EXPORT_FORMATS.find(f => f.id === selectedFormat)?.extension || '.csv'}
                    </span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <span>📄 Full filename: <strong style={{ color: 'var(--color-text-primary)' }}>{fileName || 'untitled'}{EXPORT_FORMATS.find(f => f.id === selectedFormat)?.extension || '.csv'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Export Format */}
              <div className="export-card" style={{ marginBottom: '16px' }}>
                <div className="export-card-header">
                  <div className="export-card-title">Export Format</div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div className="format-grid">
                    {EXPORT_FORMATS.map(format => (
                      <button 
                        key={format.id} 
                        onClick={() => setSelectedFormat(format.id)} 
                        className={`format-btn ${selectedFormat === format.id ? 'selected' : ''}`}
                      >
                        <format.icon size={24} color={selectedFormat === format.id ? 'var(--color-mdb-green)' : 'var(--color-text-muted)'} />
                        <div className="format-name">{format.name}</div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{format.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="export-card" style={{ marginBottom: '16px' }}>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>Include Metadata</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Add job info, timestamps, and statistics</div>
                  </div>
                  <label className="toggle-switch" style={{ flexShrink: 0 }}>
                    <input type="checkbox" checked={includeMetadata} onChange={(e) => setIncludeMetadata(e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Export Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={handleExport} disabled={exporting || !fileName.trim()} className="export-btn" style={{ flex: '2 1 140px' }}>
                  {exporting ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
                  Export Dataset
                </button>
                {jobs.length > 1 && (
                  <button onClick={handleBulkExport} disabled={exporting || !fileName.trim()} style={{ 
                    flex: '1 1 90px', 
                    padding: '10px', 
                    background: 'var(--color-canvas)', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: 'var(--radius-md)', 
                    color: 'var(--color-text-secondary)', 
                    fontSize: '12px', 
                    fontWeight: 500, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px', 
                    cursor: (exporting || !fileName.trim()) ? 'not-allowed' : 'pointer', 
                    opacity: (exporting || !fileName.trim()) ? 0.5 : 1,
                    transition: 'all var(--transition)'
                  }}
                  onMouseEnter={(e) => { if (!exporting && fileName.trim()) { e.currentTarget.style.borderColor = 'var(--color-mdb-green)'; e.currentTarget.style.color = 'var(--color-text-primary)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                  >
                    <HardDrive size={13} />
                    Bulk ({jobs.length})
                  </button>
                )}
              </div>

              {/* Stats Footer */}
              {stats && (
                <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <span><Database size={10} style={{ marginRight: '4px' }} />{stats.total_parsed_records || 0} records</span>
                  <span><Clock size={10} style={{ marginRight: '4px' }} />Last parsed: {stats.last_parsed_date ? new Date(stats.last_parsed_date).toLocaleDateString() : 'Never'}</span>
                </div>
              )}
            </>
          ) : (
            <div className="export-card" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', margin: '0 auto 12px', background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={28} color="var(--color-text-muted)" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>No Job Selected</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Select a job from the left panel to export its dataset</div>
            </div>
          )}
        </div>
      </div>

      {/* Data Preview with Modal Trigger */}
      {previewData?.preview && previewData.preview.length > 0 && (
        <div className="export-card" style={{ marginTop: '20px' }}>
          <div className="export-card-header">
            <div className="export-card-title">
              <Eye size={14} color="var(--color-mdb-green)" />
              Data Preview
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 400 }}>First 10 records</span>
            </div>
            <button
              onClick={loadFullPreview}
              disabled={loadingFullPreview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                background: 'var(--color-canvas)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                fontSize: '11px',
                cursor: loadingFullPreview ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                if (!loadingFullPreview) {
                  e.currentTarget.style.borderColor = 'var(--color-mdb-green)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              {loadingFullPreview ? (
                <>
                  <Loader2 size={13} className="spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Maximize2 size={13} />
                  Full Preview
                </>
              )}
            </button>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
            <table className="preview-table">
              <thead>
                <tr>
                  {previewData.fields?.slice(0, 6).map(field => (
                    <th key={field}>
                      {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.preview.map((record, idx) => (
                  <tr key={idx}>
                    {previewData.fields?.slice(0, 6).map(field => {
                      let value = record[field];
                      if (typeof value === 'object') value = JSON.stringify(value);
                      const display = typeof value === 'string' && value.length > 80 ? value.substring(0, 80) + '...' : (value || '-');
                      return <td key={field} title={value}>{display}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}