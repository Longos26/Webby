// frontend/src/pages/ExportTab.jsx - WITH LOADING STATE

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
// STYLES
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
    from { opacity: 0; transform: translateY(4px); }
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
  }

  .export-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 12px;
  }

  .export-card-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
  }

  .export-card-title svg {
    color: var(--color-mdb-green);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px;
    transition: all var(--transition);
  }

  .stat-card:hover {
    border-color: var(--color-accent-border);
    background: var(--color-surface-elevated);
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    background: var(--color-accent-dim);
    border: 1px solid var(--color-accent-border);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-mdb-green);
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .job-selector {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .job-search {
    padding: 12px;
    border-bottom: 1px solid var(--color-border);
  }

  .job-search-input {
    width: 100%;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 8px 12px;
    font-size: 12px;
    color: var(--color-text-primary);
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
    padding: 12px 16px;
    cursor: pointer;
    transition: all var(--transition);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .job-item:hover {
    background: var(--color-surface-elevated);
  }

  .job-item.selected {
    background: var(--color-accent-dim);
    border-left: 3px solid var(--color-mdb-green);
  }

  .job-info {
    flex: 1;
    min-width: 0;
  }

  .job-name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
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
    border-radius: 20px;
    padding: 4px 10px;
    font-size: 11px;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .format-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .format-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition);
  }

  .format-btn:hover:not(:disabled) {
    border-color: var(--color-mdb-green);
    background: var(--color-accent-dim);
    transform: translateY(-2px);
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
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }

  .format-name {
    font-size: 12px;
    font-weight: 500;
  }

  .options-panel {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }

  .option-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 40px;
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
    border-radius: 20px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.2s;
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background-color: var(--color-mdb-green);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(20px);
  }

  .export-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, var(--color-mdb-green) 0%, var(--color-mdb-green-dark) 100%);
    border: none;
    border-radius: var(--radius-md);
    color: #0D1117;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
    margin-top: 20px;
  }

  .export-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(0, 237, 100, 0.3);
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
  }

  .preview-table th {
    text-align: left;
    padding: 10px 12px;
    background: var(--color-canvas);
    border-bottom: 1px solid var(--color-border);
    font-weight: 600;
    color: var(--color-text-secondary);
    position: sticky;
    top: 0;
  }

  .preview-table td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--color-border-subtle);
    color: var(--color-text-primary);
  }

  .preview-table tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }

  .truncate-text {
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 10px;
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

  .alert-info {
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid rgba(88, 166, 255, 0.3);
    color: var(--color-info);
  }

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

  /* Loading State - Same as AppShell */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px;
    gap: 16px;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-mdb-green);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Mobile Responsive Fixes for Export */
  @media (max-width: 768px) {
    .export-root {
      padding: 12px !important;
    }
    
    .export-root .two-column {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    
    .export-root .stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }
    
    .export-root .format-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 8px !important;
    }
    
    .export-root .format-btn {
      padding: 12px 8px !important;
    }
    
    .export-root .format-btn .format-icon {
      width: 32px !important;
      height: 32px !important;
      font-size: 18px !important;
    }
    
    .export-root .format-btn .format-name {
      font-size: 10px !important;
    }
    
    .export-root .job-list {
      max-height: 200px !important;
    }
    
    .export-root .job-item {
      padding: 10px 12px !important;
    }
    
    .export-root .job-name {
      font-size: 12px !important;
    }
    
    .export-root .preview-table-container {
      max-height: 200px !important;
    }
    
    .export-root .preview-table th,
    .export-root .preview-table td {
      padding: 6px 8px !important;
      font-size: 10px !important;
    }
    
    .export-root .option-row {
      flex-wrap: wrap !important;
      gap: 8px !important;
    }
    
    .export-root .export-btn {
      font-size: 13px !important;
      padding: 12px !important;
    }
  }
  
  @media (max-width: 480px) {
    .export-root .stats-grid {
      grid-template-columns: 1fr !important;
    }
    
    .export-root .format-grid {
      grid-template-columns: 1fr 1fr !important;
    }
    
    .export-root .modal {
      max-width: 100% !important;
      margin: 8px !important;
    }
    
    .export-root .preview-table-container {
      max-height: 150px !important;
    }
    
    .export-root .export-btn {
      font-size: 12px !important;
      padding: 10px !important;
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
// PREVIEW MODAL
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
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#161B22',
          borderRadius: '16px',
          width: '90vw',
          maxWidth: '1400px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #30363D',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.25s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #30363D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Eye size={20} color="#00ED64" />
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Dataset Preview</h2>
              {jobName && <span style={{ fontSize: '12px', background: '#0D1117', padding: '4px 12px', borderRadius: '20px', border: '1px solid #30363D' }}>{jobName}</span>}
            </div>
            <div style={{ fontSize: '13px', color: '#8B949E' }}>
              {data?.length || 0} total records • {fields?.length || 0} fields
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#0D1117',
              border: '1px solid #30363D',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: '#8B949E',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F85149'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#30363D'}
          >
            <X size={16} />
            <span style={{ fontSize: '12px' }}>Esc</span>
          </button>
        </div>

        <div style={{ padding: '16px 24px', borderBottom: '1px solid #21262D' }}>
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
                background: '#0D1117',
                border: '1px solid #30363D',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                color: '#F0F6FC',
                outline: 'none'
              }}
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
                  color: '#6E7681'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {searchTerm && (
            <div style={{ fontSize: '11px', color: '#6E7681', marginTop: '8px' }}>
              Found {filteredData.length} matching records
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px 24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: '#161B22', zIndex: 10 }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#8B949E',
                    borderBottom: '2px solid #30363D',
                    background: '#161B22',
                    fontSize: '12px'
                  }}>#</th>
                  {fields?.map(field => (
                    <th key={field} style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#8B949E',
                      borderBottom: '2px solid #30363D',
                      background: '#161B22',
                      fontSize: '12px'
                    }}>
                      {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((record, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #21262D' }}>
                    <td style={{
                      padding: '10px 16px',
                      color: '#6E7681',
                      fontFamily: 'monospace',
                      fontSize: '11px'
                    }}>
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    {fields?.map(field => {
                      let value = record[field];
                      const isObject = typeof value === 'object' && value !== null;
                      const displayValue = isObject ? JSON.stringify(value, null, 2) : String(value || '-');
                      const isLong = displayValue.length > 100;
                      
                      return (
                        <td key={field} style={{
                          padding: '10px 16px',
                          color: '#F0F6FC',
                          maxWidth: '300px',
                          verticalAlign: 'top'
                        }}>
                          <div style={{
                            maxHeight: isLong ? '60px' : 'auto',
                            overflow: 'auto',
                            fontFamily: isObject ? 'monospace' : 'inherit',
                            fontSize: isObject ? '11px' : '12px',
                            whiteSpace: isLong ? 'pre-wrap' : 'normal',
                            wordBreak: 'break-word'
                          }}>
                            {isLong ? `${displayValue.substring(0, 100)}...` : displayValue}
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
                padding: '60px 20px',
                color: '#6E7681'
              }}>
                <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <div>No matching records found</div>
              </div>
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #30363D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ fontSize: '12px', color: '#8B949E' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  background: '#0D1117',
                  border: '1px solid #30363D',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  color: '#F0F6FC'
                }}
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  background: '#0D1117',
                  border: '1px solid #30363D',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  color: '#F0F6FC'
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                  if (endPage - startPage + 1 < maxVisible) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(i);
                  }
                  return pages.map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        background: currentPage === page ? '#00ED64' : '#0D1117',
                        border: currentPage === page ? '1px solid #00ED64' : '1px solid #30363D',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        color: currentPage === page ? '#0D1117' : '#F0F6FC',
                        fontWeight: currentPage === page ? '600' : '400',
                        fontSize: '12px'
                      }}
                    >
                      {page}
                    </button>
                  ));
                })()}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  background: '#0D1117',
                  border: '1px solid #30363D',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  color: '#F0F6FC'
                }}
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  background: '#0D1117',
                  border: '1px solid #30363D',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  color: '#F0F6FC'
                }}
              >
                <ChevronsRight size={14} />
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
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
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
// MAIN COMPONENT
// ============================================================

export default function ExportTab() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [loading, setLoading] = useState(true); // Changed to true for initial load
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

  // ============================================================
  // LOADING STATE - Same as AppShell
  // ============================================================
  
  if (loading && jobs.length === 0) {
    return (
      <div className="export-root">
        <div className="loading-state">
          <div className="loading-spinner" />
          <span style={{ color: 'var(--color-text-muted)' }}>Plss Wait a Moment...</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="export-root" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
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
        <div style={{ background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={16} color="#F85149" />
          <span style={{ flex: 1, fontSize: '13px', color: '#F85149' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F85149' }}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(0, 237, 100, 0.1)', border: '1px solid rgba(0, 237, 100, 0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={16} color="#00ED64" />
          <span style={{ flex: 1, fontSize: '13px', color: '#00ED64' }}>{success}</span>
          <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00ED64' }}><X size={14} /></button>
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
        {/* Left Panel - Job Selection */}
        <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #30363D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package size={16} color="#00ED64" />
              <span style={{ fontWeight: '600' }}>Available Jobs</span>
              <span style={{ fontSize: '11px', background: '#0D1117', padding: '4px 10px', borderRadius: '20px', border: '1px solid #30363D' }}>{filteredJobs.length} jobs</span>
            </div>
            <button onClick={loadJobs} style={{ background: 'none', border: 'none', color: '#6E7681', cursor: 'pointer' }}><RefreshCw size={14} /></button>
          </div>
          
          <div style={{ padding: '12px', borderBottom: '1px solid #30363D' }}>
            <input type="text" placeholder="Search jobs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', background: '#0D1117', border: '1px solid #30363D', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#F0F6FC' }} />
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {paginatedJobs.map(job => (
              <div key={job.id} onClick={() => setSelectedJobId(job.id)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #21262D', background: selectedJobId === job.id ? 'rgba(0, 237, 100, 0.08)' : 'transparent', borderLeft: selectedJobId === job.id ? '3px solid #00ED64' : '3px solid transparent' }}>
                <div style={{ fontWeight: '500', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {job.name}
                  {job.status === 'success' && <CheckCircle size={12} color="#00ED64" />}
                </div>
                <div style={{ fontSize: '11px', color: '#6E7681', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.url}</div>
                <div style={{ marginTop: '6px', fontSize: '10px', color: '#6E7681' }}>{job.parsed_count} parsed results</div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #30363D', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ background: '#0D1117', border: '1px solid #30363D', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}><ChevronsLeft size={12} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ background: '#0D1117', border: '1px solid #30363D', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}><ChevronLeft size={12} /></button>
              <span style={{ fontSize: '12px', padding: '0 12px' }}>{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ background: '#0D1117', border: '1px solid #30363D', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}><ChevronRight size={12} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ background: '#0D1117', border: '1px solid #30363D', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}><ChevronsRight size={12} /></button>
            </div>
          )}
        </div>

        {/* Right Panel - Export Configuration */}
        <div>
          {selectedJob ? (
            <>
              {/* Selected Job Info */}
              <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '12px', marginBottom: '20px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6E7681', marginBottom: '4px' }}>Selected Job</div>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{selectedJob.name}</div>
                    <div style={{ fontSize: '12px', color: '#8B949E', fontFamily: 'monospace', marginTop: '4px' }}>{selectedJob.url}</div>
                  </div>
                  <div style={{ background: '#0D1117', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#6E7681' }}>Parsed Records</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#00ED64' }}>{selectedJob.parsed_count || 0}</div>
                  </div>
                </div>
              </div>

              {/* Filename Input */}
              <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '12px', marginBottom: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #30363D' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pencil size={16} color="#00ED64" />
                    Export Filename
                  </div>
                  <div style={{ fontSize: '12px', color: '#8B949E' }}>Customize the name of your exported file</div>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="Enter filename..."
                      style={{
                        flex: 1,
                        background: '#0D1117',
                        border: '1px solid #30363D',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        color: '#F0F6FC',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#00ED64'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#30363D'}
                    />
                    <span style={{
                      fontSize: '12px',
                      color: '#6E7681',
                      padding: '8px 12px',
                      background: '#0D1117',
                      borderRadius: '4px',
                      border: '1px solid #30363D',
                      whiteSpace: 'nowrap'
                    }}>
                      {EXPORT_FORMATS.find(f => f.id === selectedFormat)?.extension || '.csv'}
                    </span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#6E7681' }}>
                    <span>📄 Full filename: <strong style={{ color: '#F0F6FC' }}>{fileName || 'untitled'}{EXPORT_FORMATS.find(f => f.id === selectedFormat)?.extension || '.csv'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Export Format */}
              <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '12px', marginBottom: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #30363D' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Export Format</div>
                  <div style={{ fontSize: '12px', color: '#8B949E' }}>Choose the output format for your dataset</div>
                </div>
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {EXPORT_FORMATS.map(format => (
                    <button key={format.id} onClick={() => setSelectedFormat(format.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: selectedFormat === format.id ? 'rgba(0, 237, 100, 0.08)' : '#0D1117', border: selectedFormat === format.id ? '1px solid #00ED64' : '1px solid #30363D', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <format.icon size={32} color={selectedFormat === format.id ? '#00ED64' : '#8B949E'} />
                      <div style={{ fontWeight: '500', fontSize: '13px' }}>{format.name}</div>
                      <div style={{ fontSize: '10px', color: '#6E7681' }}>{format.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '12px', marginBottom: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '13px' }}>Include Metadata</div>
                  <div style={{ fontSize: '11px', color: '#6E7681' }}>Add job info, timestamps, and statistics</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                  <input type="checkbox" checked={includeMetadata} onChange={(e) => setIncludeMetadata(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: includeMetadata ? '#00ED64' : '#30363D', transition: '0.2s', borderRadius: '20px' }}>
                    <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '2px', bottom: '2px', backgroundColor: 'white', transition: '0.2s', borderRadius: '50%', transform: includeMetadata ? 'translateX(20px)' : 'none' }}></span>
                  </span>
                </label>
              </div>

              {/* Export Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleExport} disabled={exporting || !fileName.trim()} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #00ED64 0%, #00C355 100%)', border: 'none', borderRadius: '8px', color: '#0D1117', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: (exporting || !fileName.trim()) ? 'not-allowed' : 'pointer', opacity: (exporting || !fileName.trim()) ? 0.6 : 1 }}>
                  {exporting ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                  Export Dataset
                </button>
                {jobs.length > 1 && (
                  <button onClick={handleBulkExport} disabled={exporting || !fileName.trim()} style={{ flex: 1, padding: '14px', background: '#0D1117', border: '1px solid #30363D', borderRadius: '8px', color: '#F0F6FC', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: (exporting || !fileName.trim()) ? 'not-allowed' : 'pointer', opacity: (exporting || !fileName.trim()) ? 0.5 : 1 }}>
                    <HardDrive size={14} />
                    Bulk ({jobs.length})
                  </button>
                )}
              </div>

              {/* Stats Footer */}
              {stats && (
                <div style={{ marginTop: '16px', fontSize: '11px', color: '#6E7681', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <span><Database size={10} style={{ marginRight: '4px' }} />{stats.total_parsed_records || 0} records</span>
                  <span><Clock size={10} style={{ marginRight: '4px' }} />Last parsed: {stats.last_parsed_date ? new Date(stats.last_parsed_date).toLocaleDateString() : 'Never'}</span>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: '#0D1117', border: '1px solid #30363D', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={32} color="#6E7681" />
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No Job Selected</div>
              <div style={{ fontSize: '13px', color: '#8B949E' }}>Select a job from the left panel to export its dataset</div>
            </div>
          )}
        </div>
      </div>

      {/* Data Preview with Modal Trigger */}
      {previewData?.preview && previewData.preview.length > 0 && (
        <div style={{ marginTop: '24px', background: '#161B22', border: '1px solid #30363D', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #30363D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Eye size={16} color="#00ED64" />
              <span style={{ fontWeight: '600' }}>Data Preview</span>
              <span style={{ fontSize: '11px', color: '#6E7681' }}>First 10 records</span>
            </div>
            <button
              onClick={loadFullPreview}
              disabled={loadingFullPreview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: '#0D1117',
                border: '1px solid #30363D',
                borderRadius: '6px',
                color: '#F0F6FC',
                fontSize: '12px',
                cursor: loadingFullPreview ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loadingFullPreview) {
                  e.currentTarget.style.borderColor = '#00ED64';
                  e.currentTarget.style.color = '#00ED64';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#30363D';
                e.currentTarget.style.color = '#F0F6FC';
              }}
            >
              {loadingFullPreview ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Maximize2 size={14} />
                  <span>Full Preview</span>
                </>
              )}
            </button>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#0D1117', borderBottom: '1px solid #30363D' }}>
                  {previewData.fields?.slice(0, 8).map(field => (
                    <th key={field} style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#8B949E' }}>
                      {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.preview.map((record, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #21262D' }}>
                    {previewData.fields?.slice(0, 8).map(field => {
                      let value = record[field];
                      if (typeof value === 'object') value = JSON.stringify(value);
                      const display = typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : (value || '-');
                      return <td key={field} style={{ padding: '12px', color: '#F0F6FC', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={value}>{display}</td>;
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