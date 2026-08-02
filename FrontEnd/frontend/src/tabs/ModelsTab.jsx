// frontend/src/pages/ModelsTab.jsx - MongoDB Atlas Enterprise Edition

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, AlertCircle, Save, RefreshCw, 
  Zap, Cpu, Key, Settings, ChevronRight, Database,
  TrendingUp, Clock, Server, Lock, Eye, EyeOff
} from 'lucide-react';
import api from '../api';

// ============================================================
// MONGODB ATLAS ENTERPRISE DESIGN SYSTEM
// ============================================================

const STYLES = `
  /* Enterprise Design Tokens - MongoDB Atlas Inspired */
  .models-root {
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

  /* Base */
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

  /* Animations */
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
    animation: spin 0.6s linear infinite;
  }

  /* Layout */
  .models-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
  }

  /* Header */
  .page-header {
    margin-bottom: 28px;
  }
  
  .page-title {
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-bottom: 6px;
  }
  
  .page-description {
    font-size: 14px;
    color: var(--color-text-muted);
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }
  
  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    transition: all var(--transition);
  }
  
  .stat-card:hover {
    border-color: var(--color-border-subtle);
    background: var(--color-surface-elevated);
  }
  
  .stat-value {
    font-size: 32px;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--color-text-primary);
    margin-bottom: 6px;
  }
  
  .stat-label {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  /* Two Column Layout */
  .two-column {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 24px;
  }
  
  @media (max-width: 900px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .two-column {
      grid-template-columns: 1fr;
    }
  }

  /* Provider Sidebar */
  .providers-sidebar {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    height: fit-content;
  }
  
  .sidebar-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    font-size: 12px;
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
    padding: 14px 20px;
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
    border-left: 3px solid var(--color-mdb-green);
  }
  
  .provider-info {
    flex: 1;
  }
  
  .provider-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 3px;
  }
  
  .provider-desc {
    font-size: 11px;
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

  /* Config Panel */
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
    padding: 18px 24px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 16px;
    background: rgba(255, 255, 255, 0.02);
  }
  
  .config-title h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .config-title p {
    font-size: 12px;
    color: var(--color-text-muted);
  }
  
  .config-body {
    padding: 24px;
  }

  /* Form Elements */
  .form-group {
    margin-bottom: 24px;
  }
  
  .form-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }
  
  .form-input,
  .form-select {
    width: 100%;
    padding: 10px 14px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 13px;
    font-family: var(--font-sans);
    outline: none;
    transition: all var(--transition);
  }
  
  .form-input:focus,
  .form-select:focus {
    border-color: var(--color-mdb-green);
    box-shadow: 0 0 0 2px rgba(0, 237, 100, 0.1);
  }
  
  .form-input::placeholder {
    color: var(--color-text-muted);
  }
  
  .form-hint {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-top: 6px;
  }
  
  /* API Key Input with Toggle */
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
  }
  
  .api-key-toggle:hover {
    color: var(--color-text-primary);
  }

  /* Test Button */
  .test-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 12px;
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

  /* Models Section */
  .models-section {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid var(--color-border);
  }
  
  .models-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .models-title {
    font-size: 14px;
    font-weight: 600;
  }
  
  .models-count {
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    background: var(--color-canvas);
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid var(--color-border);
  }
  
  .models-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
  
  .model-card {
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 14px 16px;
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
    margin-bottom: 8px;
  }
  
  .model-name {
    font-size: 14px;
    font-weight: 600;
  }
  
  .model-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
    text-transform: uppercase;
  }
  
  .model-badge.recommended {
    background: rgba(0, 237, 100, 0.1);
    color: var(--color-success);
  }
  
  .model-badge.fast {
    background: rgba(88, 166, 255, 0.1);
    color: var(--color-info);
  }
  
  .model-description {
    font-size: 11px;
    color: var(--color-text-secondary);
    line-height: 1.4;
    margin-bottom: 10px;
  }
  
  .model-meta {
    display: flex;
    gap: 12px;
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
  }

  /* Advanced Settings */
  .advanced-toggle {
    margin-top: 24px;
    border-top: 1px solid var(--color-border);
  }
  
  .advanced-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 0;
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 500;
    list-style: none;
  }
  
  .advanced-summary::-webkit-details-marker {
    display: none;
  }
  
  .advanced-summary:hover {
    color: var(--color-text-primary);
  }
  
  .advanced-content {
    padding: 16px 0 8px;
  }
  
  /* Slider */
  .slider-input {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    background: var(--color-border);
    border-radius: 4px;
    outline: none;
  }
  
  .slider-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: var(--color-mdb-green);
    border-radius: 50%;
    cursor: pointer;
  }
  
  .slider-value {
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
    margin-top: 8px;
  }
  
  /* Number Input */
  .number-input {
    width: 100%;
    padding: 10px 14px;
    background: var(--color-canvas);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 13px;
    font-family: var(--font-mono);
  }
  
  .number-input:focus {
    border-color: var(--color-mdb-green);
    outline: none;
  }

  /* Alert */
  .alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
    font-size: 13px;
  }
  
  .alert-success {
    background: rgba(0, 237, 100, 0.1);
    border: 1px solid rgba(0, 237, 100, 0.25);
    color: var(--color-success);
  }
  
  .alert-error {
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.25);
    color: var(--color-error);
  }
  
  .alert-info {
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid rgba(88, 166, 255, 0.25);
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

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-size: 13px;
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
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px;
    color: var(--color-text-muted);
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
        {Icon && <Icon size={12} />}
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
      <ChevronRight size={14} className="provider-arrow" />
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
        <div style={{ display: 'flex', gap: 6 }}>
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
  const [stats, setStats] = useState({
    total_requests: 0,
    success_rate: 0,
    avg_processing_time: 0,
    active_providers: 0
  });

  injectStyles('models-styles', STYLES);

  // Load providers
  const loadProviders = useCallback(async () => {
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
    }
  }, []);

  // Load config for selected provider
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

  // Load stats
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
    if (selectedProvider) {
      loadConfig();
    }
  }, [selectedProvider, loadConfig]);

  useEffect(() => {
    loadStats();
  }, [loadStats, providers]);

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

  if (Object.keys(providers).length === 0) {
    return (
      <div className="models-root">
        <div className="models-container">
          <div className="loading-state">
            <RefreshCw size={20} className="spin" />
            <span>Loading configuration...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="models-root page-enter">
      <div className="models-container">
        {/* Header */}
        

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard 
            value={stats.total_requests.toLocaleString()} 
            label="Total API Calls" 
            icon={TrendingUp}
          />
          <StatCard 
            value={`${stats.success_rate.toFixed(1)}%`} 
            label="Success Rate" 
            icon={CheckCircle}
          />
          <StatCard 
            value={`${stats.avg_processing_time.toFixed(2)}s`} 
            label="Avg Response Time" 
            icon={Clock}
          />
          <StatCard 
            value={stats.active_providers} 
            label="Active Providers" 
            icon={Database}
          />
        </div>

        {/* Two Column Layout */}
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
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