// frontend/src/pages/ExportTab.jsx - CLEAN ENTERPRISE DESIGN

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
// HELPER
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
// STYLES - CLEAN UNTITLED UI AESTHETIC
// ============================================================

const STYLES = `
  .export-root {
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
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.35);
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 9999px;
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
    -webkit-font-smoothing: antialiased;
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
    animation: spin 0.7s linear infinite;
  }

  /* ---------- Cards ---------- */
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
    padding: 14px 18px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 10px;
  }

  .export-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .export-card-title svg {
    color: var(--color-mdb-green);
  }

  /* ---------- Job Selector ---------- */
  .job-search {
    padding: 12px 14px;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .job-search-input {
    width: 100%;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 8px 12px;
    font-size: 14px;
    font-family: inherit;
    color: var(--color-text-primary);
    transition: border-color var(--transition), box-shadow var(--transition);
    outline: none;
  }

  .job-search-input::placeholder {
    color: var(--color-text-muted);
  }

  .job-search-input:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.08);
  }

  .job-list {
    max-height: 420px;
    overflow-y: auto;
  }

  .job-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    cursor: pointer;
    transition: background var(--transition);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .job-item:last-child {
    border-bottom: none;
  }

  .job-item:hover {
    background: var(--color-surface-elevated);
  }

  .job-item.selected {
    background: var(--color-surface-elevated);
  }

  .job-info {
    flex: 1;
    min-width: 0;
  }

  .job-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
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

  /* ---------- Format Grid ---------- */
  .format-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 10px;
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
    transition: border-color var(--transition), background var(--transition);
    font-family: inherit;
    color: inherit;
  }

  .format-btn:hover:not(:disabled) {
    border-color: var(--color-border-active, #484F58);
    background: var(--color-surface-elevated);
  }

  .format-btn.selected {
    border-color: var(--color-mdb-green);
    background: rgba(0, 237, 100, 0.05);
  }

  .format-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .format-name {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  /* ---------- Toggle ---------- */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 22px;
    flex-shrink: 0;
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
    height: 16px;
    width: 16px;
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

  /* ---------- Export Button ---------- */
  .export-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    background: var(--color-mdb-green);
    border: none;
    border-radius: var(--radius-md);
    color: #0D1117;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition);
    font-family: inherit;
  }

  .export-btn:hover:not(:disabled) {
    background: var(--color-mdb-green-dark);
  }

  .export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ---------- Preview Table ---------- */
  .preview-table-container {
    max-height: 400px;
    overflow: auto;
  }

  .preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    min-width: 400px;
  }

  .preview-table th {
    text-align: left;
    padding: 10px 14px;
    background: var(--color-canvas);
    border-bottom: 1px solid var(--color-border);
    font-weight: 500;
    color: var(--color-text-muted);
    position: sticky;
    top: 0;
    font-size: 12px;
    white-space: nowrap;
  }

  .preview-table td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--color-border-subtle);
    color: var(--color-text-secondary);
    vertical-align: top;
  }

  .preview-table tr:last-child td {
    border-bottom: none;
  }

  .preview-table tr:hover td {
    background: var(--color-surface-elevated);
  }

  /* ---------- Alerts ---------- */
  .alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    margin-bottom: 16px;
    font-size: 13px;
  }

  .alert-error {
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.2);
    color: #FF7B72;
  }

  .alert-success {
    background: rgba(0, 237, 100, 0.1);
    border: 1px solid rgba(0, 237, 100, 0.2);
    color: #56D364;
  }

  /* ---------- Empty / Loading ---------- */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
  }

  .empty-icon {
    width: 52px;
    height: 52px;
    margin: 0 auto 14px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
  }

  .empty-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--color-text-primary);
  }

  .empty-description {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    gap: 14px;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-mdb-green);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* ---------- Layout ---------- */
  .two-column {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 20px;
  }

  /* ---------- Responsive ---------- */
  @media (max-width: 1024px) {
    .two-column {
      grid-template-columns: 280px 1fr;
      gap: 16px;
    }
  }

  @media (max-width: 768px) {
    .two-column {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }

    .format-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 8px !important;
    }

    .format-btn {
      padding: 12px 8px !important;
    }

    .job-list {
      max-height: 260px !important;
    }

    .preview-table th,
    .preview-table td {
      padding: 8px 10px !important;
      font-size: 12px !important;
    }

    .job-search-input {
      font-size: 16px;
    }
  }

  @media (max-width: 480px) {
    .format-grid {
      grid-template-columns: 1fr 1fr !important;
      gap: 8px !important;
    }

    .export-btn {
      font-size: 13px;
      padding: 10px;
    }

    .job-search-input {
      font-size: 16px;
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
// PREVIEW MODAL - CLEAN
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
        inset: 0,
        background: 'rgba(13, 17, 23, 0.85)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeSlideIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          width: '95vw',
          maxWidth: '1400px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          flexShrink: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
              <Eye size={16} color="var(--color-mdb-green)" />
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Dataset Preview</h2>
              {jobName && (
                <span style={{
                  fontSize: '11px',
                  background: 'var(--color-canvas)',
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}>{jobName}</span>
              )}
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
              padding: '6px 12px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontFamily: 'inherit',
              transition: 'border-color var(--transition), color var(--transition)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-error)'; e.currentTarget.style.color = '#FF7B72'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-subtle)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search in preview..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                background: 'var(--color-canvas)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: 'var(--color-text-primary)',
                outline: 'none',
                transition: 'border-color var(--transition), box-shadow var(--transition)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-mdb-green)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 237, 100, 0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center',
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

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px 20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              minWidth: '500px',
            }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 10 }}>
                  <th style={{
                    padding: '10px 14px', textAlign: 'left', fontWeight: 500,
                    color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)',
                    background: 'var(--color-surface)', fontSize: '12px',
                  }}>#</th>
                  {fields?.slice(0, 6).map(field => (
                    <th key={field} style={{
                      padding: '10px 14px', textAlign: 'left', fontWeight: 500,
                      color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)',
                      background: 'var(--color-surface)', fontSize: '12px', whiteSpace: 'nowrap',
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
                      padding: '10px 14px',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
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
                          padding: '10px 14px',
                          color: 'var(--color-text-secondary)',
                          maxWidth: '200px',
                          verticalAlign: 'top',
                        }}>
                          <div style={{
                            maxHeight: isLong ? '60px' : 'auto',
                            overflow: 'auto',
                            fontFamily: isObject ? 'var(--font-mono)' : 'inherit',
                            fontSize: isObject ? '11px' : '13px',
                            whiteSpace: isLong ? 'pre-wrap' : 'normal',
                            wordBreak: 'break-word',
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
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                <Package size={28} style={{ marginBottom: '10px', opacity: 0.4 }} />
                <div style={{ fontSize: '13px' }}>No matching records found</div>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '10px', flexShrink: 0,
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  background: 'var(--color-canvas)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)', padding: '5px 9px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1,
                  color: 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center',
                }}
              ><ChevronsLeft size={13} /></button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  background: 'var(--color-canvas)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)', padding: '5px 9px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1,
                  color: 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center',
                }}
              ><ChevronLeft size={13} /></button>
              <span style={{ fontSize: '12px', padding: '0 10px', color: 'var(--color-text-secondary)' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  background: 'var(--color-canvas)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)', padding: '5px 9px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.4 : 1,
                  color: 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center',
                }}
              ><ChevronRight size={13} /></button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  background: 'var(--color-canvas)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)', padding: '5px 9px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.4 : 1,
                  color: 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center',
                }}
              ><ChevronsRight size={13} /></button>
            </div>
          </div>
        )}
      </div>
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
    if (!selectedJobId) { setError('Please select a job to export'); return; }
    if (!fileName.trim()) { setError('Please enter a filename'); return; }

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
    if (jobs.length === 0) { setError('No jobs available to export'); return; }
    if (!fileName.trim()) { setError('Please enter a filename'); return; }

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

  if (loading && jobs.length === 0) {
    return (
      <div className="export-root">
        <div className="loading-state">
          <div className="loading-spinner" />
          <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading jobs…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="export-root" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <PreviewModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setFullDataset(null); }}
        data={fullDataset?.preview}
        fields={fullDataset?.fields}
        jobName={selectedJob?.name}
      />

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={15} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'currentColor', display: 'flex', alignItems: 'center' }}>
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <CheckCircle size={15} />
          <span style={{ flex: 1 }}>{success}</span>
          <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'currentColor', display: 'flex', alignItems: 'center' }}>
            <X size={14} />
          </button>
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
              <span style={{
                fontSize: '11px',
                background: 'var(--color-canvas)',
                padding: '2px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
              }}>{filteredJobs.length}</span>
            </div>
            <button
              onClick={loadJobs}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
                borderRadius: 'var(--radius-sm)',
                transition: 'color var(--transition)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              <RefreshCw size={14} />
            </button>
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
            {paginatedJobs.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No jobs found</div>
              </div>
            ) : (
              paginatedJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`job-item ${selectedJobId === job.id ? 'selected' : ''}`}
                >
                  <div className="job-info">
                    <div className="job-name">
                      {job.name}
                      {job.status === 'success' && <CheckCircle size={12} color="var(--color-success)" />}
                    </div>
                    <div className="job-meta">{job.url}</div>
                    <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {job.parsed_count} parsed results
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '12px 14px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '5px 9px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}
              ><ChevronsLeft size={13} /></button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '5px 9px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}
              ><ChevronLeft size={13} /></button>
              <span style={{ fontSize: '12px', padding: '0 10px', color: 'var(--color-text-secondary)' }}>{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '5px 9px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}
              ><ChevronRight size={13} /></button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '5px 9px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}
              ><ChevronsRight size={13} /></button>
            </div>
          )}
        </div>

        {/* Right Panel - Export Configuration */}
        <div>
          {selectedJob ? (
            <>
              {/* Selected Job Info */}
              <div className="export-card" style={{ marginBottom: 16 }}>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 500 }}>
                        Selected Job
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>{selectedJob.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px', wordBreak: 'break-all' }}>{selectedJob.url}</div>
                    </div>
                    <div style={{
                      background: 'var(--color-canvas)',
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      border: '1px solid var(--color-border)',
                      flexShrink: 0,
                    }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Parsed Records</div>
                      <div style={{ fontSize: '22px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-mdb-green)', lineHeight: 1.2 }}>{selectedJob.parsed_count || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filename Input */}
              <div className="export-card" style={{ marginBottom: 16 }}>
                <div className="export-card-header">
                  <div className="export-card-title">
                    <Pencil size={14} />
                    Export Filename
                  </div>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="Enter filename..."
                      style={{
                        flex: 1,
                        minWidth: '140px',
                        background: 'var(--color-canvas)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '9px 12px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        color: 'var(--color-text-primary)',
                        outline: 'none',
                        transition: 'border-color var(--transition), box-shadow var(--transition)',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-mdb-green)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 237, 100, 0.08)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      padding: '8px 12px',
                      background: 'var(--color-canvas)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {EXPORT_FORMATS.find(f => f.id === selectedFormat)?.extension || '.csv'}
                    </span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Full filename: <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {fileName || 'untitled'}{EXPORT_FORMATS.find(f => f.id === selectedFormat)?.extension || '.csv'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Export Format */}
              <div className="export-card" style={{ marginBottom: 16 }}>
                <div className="export-card-header">
                  <div className="export-card-title">Export Format</div>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div className="format-grid">
                    {EXPORT_FORMATS.map(format => {
                      const Icon = format.icon;
                      const isSelected = selectedFormat === format.id;
                      return (
                        <button
                          key={format.id}
                          onClick={() => setSelectedFormat(format.id)}
                          className={`format-btn ${isSelected ? 'selected' : ''}`}
                        >
                          <Icon size={22} color={isSelected ? 'var(--color-mdb-green)' : 'var(--color-text-muted)'} />
                          <div className="format-name">{format.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{format.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="export-card" style={{ marginBottom: 16 }}>
                <div style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--color-text-primary)' }}>Include Metadata</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Add job info, timestamps, and statistics</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={includeMetadata} onChange={(e) => setIncludeMetadata(e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Export Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleExport}
                  disabled={exporting || !fileName.trim()}
                  className="export-btn"
                  style={{ flex: '2 1 160px' }}
                >
                  {exporting ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
                  Export Dataset
                </button>
                {jobs.length > 1 && (
                  <button
                    onClick={handleBulkExport}
                    disabled={exporting || !fileName.trim()}
                    style={{
                      flex: '1 1 110px',
                      padding: '12px',
                      background: 'var(--color-canvas)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-secondary)',
                      fontSize: '13px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: (exporting || !fileName.trim()) ? 'not-allowed' : 'pointer',
                      opacity: (exporting || !fileName.trim()) ? 0.5 : 1,
                      transition: 'border-color var(--transition), color var(--transition)',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => { if (!exporting && fileName.trim()) { e.currentTarget.style.borderColor = '#484F58'; e.currentTarget.style.color = 'var(--color-text-primary)'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                  >
                    <HardDrive size={14} />
                    Bulk ({jobs.length})
                  </button>
                )}
              </div>

              {/* Stats Footer */}
              {stats && (
                <div style={{
                  marginTop: '16px',
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Database size={11} />{stats.total_parsed_records || 0} records
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />Last parsed: {stats.last_parsed_date ? new Date(stats.last_parsed_date).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="export-card">
              <div className="empty-state" style={{ padding: '56px 20px' }}>
                <div className="empty-icon">
                  <Package size={22} />
                </div>
                <div className="empty-title">No Job Selected</div>
                <div className="empty-description">Select a job from the left panel to export its dataset</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Preview with Modal Trigger */}
      {previewData?.preview && previewData.preview.length > 0 && (
        <div className="export-card" style={{ marginTop: '20px' }}>
          <div className="export-card-header">
            <div className="export-card-title">
              <Eye size={14} />
              Data Preview
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 400 }}>First 10 records</span>
            </div>
            <button
              onClick={loadFullPreview}
              disabled={loadingFullPreview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--color-canvas)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                fontSize: '12px',
                cursor: loadingFullPreview ? 'not-allowed' : 'pointer',
                transition: 'border-color var(--transition), color var(--transition)',
                fontWeight: 500,
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (!loadingFullPreview) {
                  e.currentTarget.style.borderColor = '#484F58';
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
          <div style={{ overflowX: 'auto', maxHeight: '380px' }}>
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
    </div>
  );
}