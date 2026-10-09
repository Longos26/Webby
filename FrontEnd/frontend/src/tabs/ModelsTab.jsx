// frontend/src/pages/ModelsTab.jsx - CLEAN ENTERPRISE DESIGN

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, AlertCircle, Save, RefreshCw,
  ChevronRight, Eye, EyeOff
} from 'lucide-react';
import api from '../api';

// ============================================================
// STYLES - CLEAN UNTITLED UI AESTHETIC
// ============================================================

const STYLES = `
  .models-root {
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
    -webkit-font-smoothing: antialiased;
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
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

  .models-container {
    max-width: 1400px;
    margin: 0 auto;
  }

  /* ---------- Stats Grid ---------- */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
    transition: border-color var(--transition);
  }

  .stat-card:hover {
    border-color: #484F58;
  }

  .stat-value {
    font-size: 26px;
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--color-text-primary);
    margin-bottom: 4px;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 12px;
    font-weight: 400;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* ---------- Two-Column Layout ---------- */
  .two-column {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 20px;
  }

  /* ---------- Provider Sidebar ---------- */
  .providers-sidebar {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    height: fit-content;
  }

  .sidebar-header {
    padding: 14px 18px;
    border-bottom: 1px solid var(--color-border);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .provider-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    cursor: pointer;
    border-bottom: 1px solid var(--color-border-subtle);
    transition: background var(--transition);
  }

  .provider-item:last-child {
    border-bottom: none;
  }

  .provider-item:hover {
    background: var(--color-surface-elevated);
  }

  .provider-item.active {
    background: var(--color-surface-elevated);
  }

  .provider-info {
    flex: 1;
    min-width: 0;
  }

  .provider-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 2px;
  }

  .provider-desc {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .provider-arrow {
    color: var(--color-text-muted);
    opacity: 0.5;
    flex-shrink: 0;
  }

  .provider-item.active .provider-arrow {
    opacity: 1;
    color: var(--color-mdb-green);
  }

  /* ---------- Config Panel ---------- */
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
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 12px;
  }

  .config-title h3 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 2px;
    color: var(--color-text-primary);
  }

  .config-title p {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .config-body {
    padding: 20px;
  }

  /* ---------- Forms ---------- */
  .form-group {
    margin-bottom: 20px;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 6px;
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 9px 12px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
  }

  .form-input:focus,
  .form-select:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.08);
  }

  .form-input::placeholder {
    color: var(--color-text-muted);
  }

  .form-hint {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-top: 4px;
  }

  /* ---------- API Key Toggle ---------- */
  .api-key-wrapper {
    position: relative;
  }

  .api-key-toggle {
    position: absolute;
    right: 12px;
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
    border-radius: var(--radius-sm);
    transition: color var(--transition);
  }

  .api-key-toggle:hover {
    color: var(--color-text-primary);
  }

  /* ---------- Test Button ---------- */
  .test-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color var(--transition), color var(--transition), background var(--transition);
    font-family: inherit;
  }

  .test-btn:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: #484F58;
    color: var(--color-text-primary);
  }

  .test-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .test-btn.success {
    border-color: rgba(0, 237, 100, 0.3);
    color: #56D364;
    background: rgba(0, 237, 100, 0.08);
  }

  .test-btn.error {
    border-color: rgba(248, 81, 73, 0.3);
    color: #FF7B72;
    background: rgba(248, 81, 73, 0.08);
  }

  /* ---------- Models Section ---------- */
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
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .models-count {
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-muted);
    background: var(--color-canvas);
    padding: 3px 10px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }

  .models-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .model-card {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    cursor: pointer;
    transition: border-color var(--transition), background var(--transition);
  }

  .model-card:hover {
    border-color: #484F58;
    background: var(--color-surface-elevated);
  }

  .model-card.selected {
    border-color: var(--color-mdb-green);
    background: rgba(0, 237, 100, 0.05);
  }

  .model-name-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    flex-wrap: wrap;
    gap: 6px;
  }

  .model-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .model-badge {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    white-space: nowrap;
  }

  .model-badge.recommended {
    background: rgba(0, 237, 100, 0.1);
    color: #56D364;
    border: 1px solid rgba(0, 237, 100, 0.2);
  }

  .model-badge.fast {
    background: rgba(88, 166, 255, 0.1);
    color: #79B8FF;
    border: 1px solid rgba(88, 166, 255, 0.2);
  }

  .model-description {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin-bottom: 10px;
  }

  .model-meta {
    display: flex;
    gap: 12px;
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    flex-wrap: wrap;
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

  .alert-success {
    background: rgba(0, 237, 100, 0.1);
    border: 1px solid rgba(0, 237, 100, 0.2);
    color: #56D364;
  }

  .alert-error {
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.2);
    color: #FF7B72;
  }

  .alert-info {
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid rgba(88, 166, 255, 0.2);
    color: #79B8FF;
  }

  .alert-close {
    margin-left: auto;
    background: none;
    border: none;
    color: currentColor;
    cursor: pointer;
    opacity: 0.7;
    display: flex;
    align-items: center;
  }

  /* ---------- Buttons ---------- */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background var(--transition), border-color var(--transition), color var(--transition);
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

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-surface-elevated);
    border-color: #484F58;
    color: var(--color-text-primary);
  }

  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ---------- Responsive ---------- */
  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .two-column {
      grid-template-columns: 240px 1fr;
      gap: 16px;
    }
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-card {
      padding: 14px 16px;
    }

    .stat-value {
      font-size: 22px;
    }

    .two-column {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .providers-sidebar {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      padding: 8px 12px;
      gap: 8px;
      height: auto;
    }

    .providers-sidebar .sidebar-header {
      display: none;
    }

    .provider-item {
      padding: 8px 14px;
      border-bottom: none;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      white-space: nowrap;
      flex-shrink: 0;
      background: var(--color-canvas);
    }

    .provider-item.active {
      border-color: var(--color-mdb-green);
      background: rgba(0, 237, 100, 0.05);
    }

    .provider-desc,
    .provider-arrow {
      display: none;
    }

    .config-header {
      padding: 14px 16px;
    }

    .config-body {
      padding: 16px;
    }

    .models-grid {
      grid-template-columns: 1fr;
    }

    .form-input,
    .form-select {
      font-size: 16px;
    }
  }

  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .stat-card {
      padding: 12px 14px;
    }

    .stat-value {
      font-size: 20px;
    }

    .config-body {
      padding: 14px;
    }

    .model-card {
      padding: 12px 14px;
    }

    .btn {
      padding: 8px 14px;
      font-size: 12px;
    }

    .alert {
      font-size: 12px;
      padding: 10px 12px;
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
// STAT CARD
// ============================================================

function StatCard({ value, label, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">
        {Icon && <Icon size={12} />}
        {label}
      </div>
    </div>
  );
}

// ============================================================
// PROVIDER ITEM
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
      <ChevronRight size={14} className="provider-arrow" />
    </div>
  );
}

// ============================================================
// MODEL CARD
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

  if (loading) {
    return (
      <div className="models-root">
        <div className="models-container">
          <div className="loading-state">
            <div className="loading-spinner" />
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading models configuration…</span>
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
                  {testStatus.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {testStatus.message}
                </div>
              )}

              {/* Success Message */}
              {message && (
                <div className={`alert alert-${message.type}`}>
                  {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, flexWrap: 'wrap', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                  {saving ? 'Saving…' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}