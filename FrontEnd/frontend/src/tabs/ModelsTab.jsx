// frontend/src/pages/ModelsTab.jsx - REFINED ENTERPRISE DESIGN

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, AlertCircle, Save, RefreshCw, 
  Zap, Cpu, Key, Settings, ChevronRight, Database,
  TrendingUp, Clock, Server, Lock, Eye, EyeOff
} from 'lucide-react';
import api from '../api';

// ============================================================
// STYLES - REFINED ENTERPRISE
// ============================================================

const STYLES = `
  /* Enterprise Design Tokens - Refined */
  .models-root {
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
    --radius-full: 9999px;
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "JetBrains Mono", "SF Mono", "Courier New", monospace;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .models-root * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .models-root {
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

  .page-enter {
    animation: fadeSlideIn 0.2s ease-out;
  }

  .spin {
    animation: spin 0.6s linear infinite;
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

  .models-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 14px 18px;
    transition: all var(--transition);
  }
  
  .stat-card:hover {
    border-color: var(--color-accent-border);
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .two-column {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 20px;
  }

  .providers-sidebar {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    height: fit-content;
  }
  
  .sidebar-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    background: rgba(255, 255, 255, 0.02);
  }
  
  .provider-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid var(--color-border-subtle);
    transition: all var(--transition);
  }
  
  .provider-item:last-child {
    border-bottom: none;
  }
  
  .provider-item:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .provider-item.active {
    background: var(--color-accent-dim);
    border-left: 2px solid var(--color-mdb-green);
  }
  
  .provider-info {
    flex: 1;
  }
  
  .provider-name {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  
  .provider-desc {
    font-size: 10px;
    color: var(--color-text-muted);
  }
  
  .provider-arrow {
    color: var(--color-text-muted);
    opacity: 0.5;
  }
  
  .provider-item.active .provider-arrow {
    opacity: 1;
    color: var(--color-mdb-green);
  }

  .config-panel {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  
  .config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 12px;
    background: rgba(255, 255, 255, 0.02);
  }
  
  .config-title h3 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  
  .config-title p {
    font-size: 11px;
    color: var(--color-text-muted);
  }
  
  .config-body {
    padding: 20px;
  }

  .form-group {
    margin-bottom: 20px;
  }
  
  .form-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    margin-bottom: 6px;
  }
  
  .form-input,
  .form-select {
    width: 100%;
    padding: 8px 12px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 14px;
    font-family: var(--font-sans);
    outline: none;
    transition: all var(--transition);
  }
  
  .form-input:focus,
  .form-select:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 2px rgba(0, 237, 100, 0.06);
  }
  
  .form-input::placeholder {
    color: var(--color-text-muted);
  }
  
  .form-hint {
    font-size: 10px;
    color: var(--color-text-muted);
    margin-top: 4px;
  }

  .api-key-wrapper {
    position: relative;
  }
  
  .api-key-toggle {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .api-key-toggle:hover {
    color: var(--color-text-primary);
  }

  .test-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
  }
  
  .test-btn:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }
  
  .test-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .test-btn.success {
    border-color: var(--color-success);
    color: var(--color-success);
  }
  
  .test-btn.error {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .models-section {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--color-border);
  }
  
  .models-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .models-title {
    font-size: 13px;
    font-weight: 600;
  }
  
  .models-count {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    background: var(--color-canvas);
    padding: 2px 10px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }
  
  .models-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
  }
  
  .model-card {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    cursor: pointer;
    transition: all var(--transition);
  }
  
  .model-card:hover {
    border-color: var(--color-border-subtle);
    background: var(--color-surface);
  }
  
  .model-card.selected {
    border-color: var(--color-mdb-green);
    background: var(--color-accent-dim);
  }
  
  .model-name-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .model-name {
    font-size: 13px;
    font-weight: 600;
  }
  
  .model-badge {
    font-size: 9px;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: var(--radius-full);
    text-transform: uppercase;
  }
  
  .model-badge.recommended {
    background: var(--status-success-bg);
    color: var(--color-success);
  }
  
  .model-badge.fast {
    background: var(--status-info-bg);
    color: var(--color-info);
  }
  
  .model-description {
    font-size: 10px;
    color: var(--color-text-secondary);
    line-height: 1.4;
    margin-bottom: 8px;
  }
  
  .model-meta {
    display: flex;
    gap: 10px;
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    flex-wrap: wrap;
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    margin-bottom: 16px;
    font-size: 12px;
  }
  
  .alert-success {
    background: var(--status-success-bg);
    border: 1px solid var(--status-success-border);
    color: var(--color-success);
  }
  
  .alert-error {
    background: var(--status-error-bg);
    border: 1px solid var(--status-error-border);
    color: var(--color-error);
  }
  
  .alert-info {
    background: var(--status-info-bg);
    border: 1px solid var(--status-info-border);
    color: var(--color-info);
  }
  
  .alert-close {
    margin-left: auto;
    background: none;
    border: none;
    color: currentColor;
    cursor: pointer;
    opacity: 0.7;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: var(--radius-md);
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all var(--transition);
    border: none;
  }
  
  .btn-primary {
    background: var(--color-mdb-green);
    color: #0D1117;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--color-mdb-green-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 237, 100, 0.2);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ============================================================ */
  /* RESPONSIVE BREAKPOINTS */
  /* ============================================================ */

  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .two-column {
      grid-template-columns: 220px 1fr;
      gap: 16px;
    }
  }

  @media (max-width: 768px) {
    .models-container {
      padding: 14px;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    
    .stat-card {
      padding: 10px 14px;
    }
    
    .stat-value {
      font-size: 20px;
    }
    
    .stat-label {
      font-size: 9px;
    }
    
    .two-column {
      grid-template-columns: 1fr;
      gap: 14px;
    }
    
    .providers-sidebar {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      padding: 6px 10px;
      gap: 6px;
      height: auto;
      border-radius: var(--radius-lg);
    }
    
    .providers-sidebar .sidebar-header {
      display: none;
    }
    
    .provider-item {
      padding: 8px 14px;
      border-bottom: none;
      border-left: none;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    .provider-item.active {
      border-left: none;
      border-bottom-color: var(--color-mdb-green);
    }
    
    .provider-desc {
      display: none;
    }
    
    .provider-arrow {
      display: none;
    }
    
    .config-header {
      padding: 12px 16px;
    }
    
    .config-title h3 {
      font-size: 14px;
    }
    
    .config-body {
      padding: 14px;
    }
    
    .models-grid {
      grid-template-columns: 1fr;
    }
    
    .model-card {
      padding: 10px 12px;
    }
    
    .form-input,
    .form-select {
      font-size: 16px;
      padding: 7px 10px;
    }
  }

  @media (max-width: 480px) {
    .models-container {
      padding: 10px;
    }

    .stats-grid {
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    
    .stat-card {
      padding: 8px 12px;
    }
    
    .stat-value {
      font-size: 18px;
    }
    
    .stat-label {
      font-size: 8px;
    }
    
    .config-body {
      padding: 10px;
    }
    
    .model-name {
      font-size: 12px;
    }
    
    .model-description {
      font-size: 9px;
    }
    
    .model-meta {
      font-size: 8px;
      gap: 6px;
    }
    
    .btn {
      padding: 6px 14px;
      font-size: 11px;
    }
    
    .alert {
      font-size: 11px;
      padding: 8px 10px;
    }

    .providers-sidebar {
      padding: 4px 8px;
      gap: 4px;
    }
    
    .provider-item {
      padding: 5px 10px;
      font-size: 11px;
    }
    
    .provider-name {
      font-size: 11px;
    }
    
    .config-header {
      padding: 10px 12px;
    }
    
    .config-title h3 {
      font-size: 13px;
    }
    
    .config-title p {
      font-size: 10px;
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
// STAT CARD COMPONENT
// ============================================================

function StatCard({ value, label, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">
        {Icon && <Icon size={11} />}
        {label}
      </div>
    </div>
  );
}

// ============================================================
// PROVIDER ITEM COMPONENT
// ============================================================

function ProviderItem({ id, provider, isActive, onSelect }) {
  return (
    <div
      className={`provider-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(id)}
    >
      <div className="provider-info">
        <div className="provider-name">{provider.name}</div>
        <div className="provider-desc">{provider.description}</div>
      </div>
      <ChevronRight size={13} className="provider-arrow" />
    </div>
  );
}

// ============================================================
// MODEL CARD COMPONENT
// ============================================================

function ModelCard({ model, isSelected, onSelect }) {
  return (
    <div
      className={`model-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(model.id)}
    >
      <div className="model-name-row">
        <span className="model-name">{model.name}</span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {model.recommended && (
            <span className="model-badge recommended">Recommended</span>
          )}
          {model.speed === 'fast' && (
            <span className="model-badge fast">Fast</span>
          )}
        </div>
      </div>
      <div className="model-description">{model.description}</div>
      <div className="model-meta">
        <span>Context: {model.context_length?.toLocaleString() || 'N/A'} tokens</span>
        <span>Speed: {model.speed || 'standard'}</span>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ModelsTab() {
  const [providers, setProviders] = useState({});
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [selectedModel, setSelectedModel] = useState('');
  const [config, setConfig] = useState({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_requests: 0,
    success_rate: 0,
    avg_processing_time: 0,
    active_providers: 0
  });

  injectStyles('models-styles', STYLES);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/llm/providers');
      setProviders(res.data);
      const firstKey = Object.keys(res.data)[0];
      if (firstKey) {
        setSelectedProvider(firstKey);
        if (res.data[firstKey].models?.[0]) {
          setSelectedModel(res.data[firstKey].models[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const res = await api.get(`/api/llm/config/${selectedProvider}`);
      if (res.data) {
        setConfig(res.data);
        if (res.data.default_model) {
          setSelectedModel(res.data.default_model);
        } else if (providers[selectedProvider]?.models?.[0]) {
          setSelectedModel(providers[selectedProvider].models[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  }, [selectedProvider, providers]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/api/llm/stats');
      if (res.data && !res.data.error) {
        setStats({
          total_requests: res.data.total_requests || 0,
          success_rate: res.data.success_rate || 0,
          avg_processing_time: res.data.avg_processing_time || 0,
          active_providers: Object.keys(providers).length || 0
        });
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [providers]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    if (selectedProvider && !loading) {
      loadConfig();
    }
  }, [selectedProvider, loadConfig, loading]);

  useEffect(() => {
    if (!loading) {
      loadStats();
    }
  }, [loadStats, loading, providers]);

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const res = await api.post('/api/llm/test', {
        provider: selectedProvider,
        model: selectedModel,
        api_key: config.apiKey,
        base_url: config.baseUrl
      });
      if (res.data.success) {
        setTestStatus({ success: true, message: 'Connection successful. Your API key is valid.' });
      } else {
        setTestStatus({ success: false, message: res.data.error || 'Connection failed. Please verify your credentials.' });
      }
    } catch (err) {
      setTestStatus({ success: false, message: err.response?.data?.detail || 'Connection failed. Please try again.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/api/llm/config/${selectedProvider}`, {
        api_key: config.apiKey,
        base_url: config.baseUrl,
        default_model: selectedModel,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 4096
      });
      setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
      await loadStats();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const currentProvider = providers[selectedProvider];
  const currentModels = currentProvider?.models || [];

  // Loading State
  if (loading) {
    return (
      <div className="models-root">
        <div className="models-container">
          <div className="loading-state">
            <div className="loading-spinner" />
            <span style={{ color: 'var(--color-text-muted)' }}>Loading models configuration...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="models-root page-enter">
      <div className="models-container">
        <div className="two-column">
          {/* Provider Sidebar */}
          <div className="providers-sidebar">
            <div className="sidebar-header">AI Providers</div>
            {Object.entries(providers).map(([id, provider]) => (
              <ProviderItem
                key={id}
                id={id}
                provider={provider}
                isActive={selectedProvider === id}
                onSelect={setSelectedProvider}
              />
            ))}
          </div>

          {/* Config Panel */}
          <div className="config-panel">
            <div className="config-header">
              <div className="config-title">
                <h3>{currentProvider?.name}</h3>
                <p>{currentProvider?.description}</p>
              </div>
            </div>

            <div className="config-body">
              {/* Test Result Alert */}
              {testStatus && (
                <div className={`alert alert-${testStatus.success ? 'success' : 'error'}`}>
                  {testStatus.success ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  {testStatus.message}
                </div>
              )}

              {/* Success Message */}
              {message && (
                <div className={`alert alert-${message.type}`}>
                  {message.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  {message.text}
                </div>
              )}

              {/* Models Section */}
              <div className="models-section">
                <div className="models-header">
                  <span className="models-title">Available Models</span>
                  <span className="models-count">{currentModels.length} models</span>
                </div>
                <div className="models-grid">
                  {currentModels.map(model => (
                    <ModelCard
                      key={model.id}
                      model={model}
                      isSelected={selectedModel === model.id}
                      onSelect={setSelectedModel}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', flexWrap: 'wrap', gap: '10px' }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}