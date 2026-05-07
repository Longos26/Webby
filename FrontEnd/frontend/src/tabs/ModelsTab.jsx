import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, AlertCircle, Save, RefreshCw,  
} from 'lucide-react';
import api from '../api';

const STYLES = `
  /* Design Tokens */
  .llm-root {
    --color-brand:       hsl(217, 91%, 60%);
    --color-brand-light: hsl(217, 91%, 55%);
    --color-brand-dark:  hsl(217, 83%, 48%);
    --color-success:     hsl(142, 76%, 36%);
    --color-success-dim: hsla(142, 76%, 36%, 0.12);
    --color-warning:     hsl(38, 92%, 50%);
    --color-warning-dim: hsla(38, 92%, 50%, 0.12);
    --color-error:       hsl(0, 84%, 60%);
    --color-error-dim:   hsla(0, 84%, 60%, 0.12);
    --color-canvas:      hsl(222, 47%, 5%);
    --color-surface:     hsl(224, 35%, 8%);
    --color-surface-1:   hsl(224, 35%, 8%);
    --color-surface-2:   hsl(226, 30%, 12%);
    --color-surface-3:   hsl(228, 28%, 16%);
    --color-text-primary:   hsl(210, 20%, 98%);
    --color-text-secondary: hsl(216, 12%, 68%);
    --color-text-muted:     hsl(218, 15%, 48%);
    --color-border:        hsla(0, 0%, 100%, 0.08);
    --color-border-strong: hsla(0, 0%, 100%, 0.16);
    --color-border-focus:  var(--color-brand);
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.16);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 8px 28px rgba(0, 0, 0, 0.24);
    --shadow-modal: 0 16px 48px rgba(0, 0, 0, 0.38);
    --radius-xs:   4px;
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   14px;
    --radius-xl:   18px;
    --radius-2xl:  24px;
    --radius-full: 9999px;
    --transition-fast: 120ms cubic-bezier(0.16, 1, 0.3, 1);
    --transition-base: 200ms cubic-bezier(0.16, 1, 0.3, 1);
    --transition-slow: 320ms cubic-bezier(0.16, 1, 0.3, 1);
    --text-xs:   0.75rem;
    --text-sm:   0.8125rem;
    --text-base: 0.9375rem;
    --text-md:   1.0625rem;
    --text-lg:   1.25rem;
    --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .fade-in { animation: fadeIn 0.3s ease forwards; }
  .slide-in { animation: slideIn 0.3s ease forwards; }
  .spin { animation: spin 0.7s linear infinite; }
  .pulse { animation: pulse 2s ease-in-out infinite; }

  .llm-container {
    max-width: 1400px; margin: 0 auto; padding: 24px;
  }

  .llm-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
  }
  .llm-title h1 {
    font-size: 28px; font-weight: 700; letter-spacing: -0.03em;
    margin-bottom: 8px; background: linear-gradient(135deg, #fff 0%, #a0aec0 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .llm-title p {
    font-size: var(--text-sm); color: var(--color-text-muted);
  }

  .llm-stats {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px; margin-bottom: 28px;
  }
  .llm-stat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 9px 12px;
    transition: all var(--transition-base);
  }
  .llm-stat-card:hover {
    transform: translateY(-2px);
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-md);
  }
  .llm-stat-value {
    font-size: 32px; font-weight: 700; font-family: var(--font-mono);
    margin-bottom: 8px; background: linear-gradient(135deg, #fff 0%, var(--color-brand) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .llm-stat-label {
    font-size: var(--text-xs); color: var(--color-text-muted);
    text-transform: uppercase; letter-spacing: 0.05em;
  }

  .llm-grid {
    display: grid; grid-template-columns: 320px 1fr;
    gap: 24px;
  }
  @media (max-width: 900px) {
    .llm-grid { grid-template-columns: 1fr; }
  }

  .llm-providers {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    height: fit-content;
  }
  .llm-providers-header {
    padding: 18px 20px;
    border-bottom: 1px solid var(--color-border);
    font-weight: 600; font-size: var(--text-sm);
    background: rgba(255,255,255,0.02);
  }
  .llm-provider-item {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 20px;
    cursor: pointer;
    border-bottom: 1px solid var(--color-border);
    transition: all var(--transition-base);
    position: relative;
  }
  .llm-provider-item:last-child {
    border-bottom: none;
  }
  .llm-provider-item:hover {
    background: rgba(255,255,255,0.04);
    transform: translateX(4px);
  }
  .llm-provider-item.active {
    background: rgba(59,130,246,0.08);
  }
  .llm-provider-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--color-brand);
  }
  .llm-provider-icon {
    width: 44px; height: 44px; border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 24px;
    background: rgba(255,255,255,0.05);
  }
  .llm-provider-info {
    flex: 1;
  }
  .llm-provider-name {
    font-weight: 600; font-size: var(--text-base);
    margin-bottom: 4px;
  }
  .llm-provider-desc {
    font-size: var(--text-xs); color: var(--color-text-muted);
  }

  .llm-config {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .llm-config-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border);
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
    background: rgba(255,255,255,0.02);
  }
  .llm-config-title {
    display: flex; align-items: center; gap: 12px;
  }
  .llm-config-title h2 {
    font-size: 20px; font-weight: 600;
  }
  .llm-config-body {
    padding: 28px;
  }

  .form-group {
    margin-bottom: 24px;
  }
  .form-label {
    display: block; font-size: var(--text-xs); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--color-text-muted); margin-bottom: 10px;
  }
  .form-input, .form-select {
    width: 100%; padding: 12px 16px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    transition: all var(--transition-base);
  }
  .form-input:focus, .form-select:focus {
    outline: none; border-color: var(--color-brand);
    background: rgba(59,130,246,0.05);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
  }
  .form-textarea {
    width: 100%; padding: 12px 16px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    resize: vertical;
    font-family: var(--font-mono);
  }
  .form-hint {
    font-size: var(--text-xs); color: var(--color-text-muted);
    margin-top: 8px;
  }

  .api-key-input {
    position: relative;
  }
  .api-key-toggle {
    position: absolute; right: 14px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    color: var(--color-text-muted); cursor: pointer;
    padding: 4px;
  }

  .test-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all var(--transition-base);
  }
  .test-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.08);
    border-color: var(--color-border-strong);
    transform: translateY(-1px);
  }
  .test-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .test-btn.success {
    color: #10b981; border-color: rgba(16,185,129,0.3);
    background: rgba(16,185,129,0.08);
  }
  .test-btn.error {
    color: #ef4444; border-color: rgba(239,68,68,0.3);
    background: rgba(239,68,68,0.08);
  }

  .models-section {
    margin-top: 32px;
  }
  .models-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
  }
  .models-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }
  .model-card {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px 18px;
    cursor: pointer;
    transition: all var(--transition-base);
  }
  .model-card:hover {
    border-color: var(--color-border-strong);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }
  .model-card.selected {
    border-color: rgba(59,130,246,0.25);
    background: rgba(59,130,246,0.08);
  }
  .model-name {
    font-weight: 600; font-size: var(--text-base);
    margin-bottom: 6px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .model-badge {
    font-size: 10px; font-weight: 600; padding: 2px 8px;
    border-radius: var(--radius-full); text-transform: uppercase;
  }
  .model-badge.recommended {
    background: rgba(16,185,129,0.12); color: #10b981;
  }
  .model-badge.fast {
    background: rgba(59,130,246,0.12); color: #3b82f6;
  }
  .model-description {
    font-size: var(--text-xs); color: var(--color-text-muted);
    line-height: 1.5; margin-bottom: 8px;
  }
  .model-meta {
    display: flex; gap: 12px; font-size: 10px;
    color: var(--color-text-muted);
  }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px;
    background: var(--color-brand);
    border: none; border-radius: var(--radius-sm);
    color: white; font-weight: 600; font-size: var(--text-sm);
    cursor: pointer; transition: all var(--transition-base);
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--color-brand-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn-secondary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    cursor: pointer; transition: all var(--transition-base);
  }
  .btn-secondary:hover {
    background: rgba(255,255,255,0.08);
    border-color: var(--color-border-strong);
    color: var(--color-text-primary);
  }

  .alert {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 20px; border-radius: var(--radius-sm);
    margin-bottom: 24px;
    animation: slideIn 0.3s ease;
  }
  .alert-success {
    background: rgba(16,185,129,0.08);
    border: 1px solid rgba(16,185,129,0.25);
    color: #10b981;
  }
  .alert-error {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.25);
    color: #f87171;
  }

  .provider-selector {
    position: relative;
  }
  .provider-selector summary {
    cursor: pointer;
    padding: 12px 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
  .provider-selector summary:hover {
    color: var(--color-text-primary);
  }
  input[type="range"] {
    -webkit-appearance: none;
    background: var(--color-surface-3);
    height: 4px;
    border-radius: var(--radius-full);
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-brand);
    cursor: pointer;
  }
`;

export default function LLMConfiguration() {
  const [providers, setProviders] = useState({});
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [selectedModel, setSelectedModel] = useState('');
  const [config, setConfig] = useState({});
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [stats, setStats] = useState({
    total_requests: 0,
    success_rate: 99.2,
    avg_processing_time: 1.24
  });

  const loadProviders = useCallback(async () => {
    try {
      const res = await api.get('/api/llm/providers');
      setProviders(res.data);
      const firstProvider = Object.keys(res.data)[0];
      if (firstProvider && res.data[firstProvider].models[0]) {
        setSelectedModel(res.data[firstProvider].models[0].id);
      }
    } catch (err) {
      console.error('Failed to load providers:', err);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const res = await api.get(`/api/llm/config/${selectedProvider}`);
      if (res.data) {
        setConfig(res.data);
        if (res.data.default_model) {
          setSelectedModel(res.data.default_model);
        } else if (providers[selectedProvider]?.models[0]) {
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
          avg_processing_time: res.data.avg_processing_time || 0
        });
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    loadProviders();
    loadStats();
  }, [loadProviders, loadStats]);

  useEffect(() => {
    if (selectedProvider) {
      loadConfig();
    }
  }, [selectedProvider, loadConfig]);

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
        setTestStatus({ success: true, message: 'Connection successful! Your configuration is working.' });
      } else {
        setTestStatus({ success: false, message: res.data.error || 'Connection failed. Please check your credentials.' });
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

  if (!currentProvider) {
    return (
      <div className="llm-root" style={{ fontFamily: 'var(--font-sans)' }}>
        <style>{STYLES}</style>
        <div className="llm-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-muted)' }}>
            <RefreshCw size={20} className="spin" />
            <span>Loading configuration...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="llm-root" style={{ fontFamily: 'var(--font-sans)' }}>
      <style>{STYLES}</style>
      
      <div className="llm-container fade-in">
        <div className="llm-header">
          <div className="llm-title">
            <h1>LLM Configuration</h1>
            <p>Configure AI providers for intelligent content parsing and extraction</p>
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <div className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%' }} /> : <Save size={16} />}
            Save Configuration
          </button>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <div className="llm-stats">
          <div className="llm-stat-card">
            <div className="llm-stat-value">{stats.total_requests.toLocaleString()}</div>
            <div className="llm-stat-label">Total API Calls</div>
          </div>
          <div className="llm-stat-card">
            <div className="llm-stat-value">{stats.success_rate.toFixed(1)}%</div>
            <div className="llm-stat-label">Success Rate</div>
          </div>
          <div className="llm-stat-card">
            <div className="llm-stat-value">{stats.avg_processing_time.toFixed(2)}s</div>
            <div className="llm-stat-label">Avg Response Time</div>
          </div>
          <div className="llm-stat-card">
            <div className="llm-stat-value">{currentModels.length}</div>
            <div className="llm-stat-label">Available Models</div>
          </div>
        </div>

        <div className="llm-grid">
          <div className="llm-providers">
            <div className="llm-providers-header">AI Providers</div>
            {Object.entries(providers).map(([id, provider]) => (
              <div
                key={id}
                className={`llm-provider-item ${selectedProvider === id ? 'active' : ''}`}
                onClick={() => setSelectedProvider(id)}
              >
                <div className="llm-provider-info">
                  <div className="llm-provider-name">{provider.name}</div>
                  <div className="llm-provider-desc">{provider.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="llm-config">
            <div className="llm-config-header">
              <div className="llm-config-title">
                <div>
                  <h2>{currentProvider.name}</h2>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {currentProvider.description}
                  </p>
                </div>
              </div>
              <button 
                className={`test-btn ${testStatus?.success ? 'success' : testStatus?.error ? 'error' : ''}`}
                onClick={handleTestConnection} 
                disabled={testing}
              >
                {testing ? <div className="spin" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} /> : <RefreshCw size={14} />}
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            <div className="llm-config-body">
              {testStatus && (
                <div className={`alert alert-${testStatus.success ? 'success' : 'error'}`}>
                  {testStatus.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {testStatus.message}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">API Key</label>
                <div className="api-key-input">
                  <input
                    type="password"
                    className="form-input"
                    value={config.apiKey || ''}
                    onChange={e => handleConfigChange('apiKey', e.target.value)}
                    placeholder={`Enter your ${currentProvider.name} API key`}
                  />
                </div>
                <div className="form-hint">Your API key is stored encrypted. Never share it with anyone.</div>
              </div>

              <div className="form-group">
                <label className="form-label">Base URL (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.baseUrl || ''}
                  onChange={e => handleConfigChange('baseUrl', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
                <div className="form-hint">Override the default API endpoint for custom deployments</div>
              </div>

              <div className="models-section">
                <div className="models-header">
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>Available Models</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {currentModels.length} models available
                  </span>
                </div>
                <div className="models-grid">
                  {currentModels.map(model => (
                    <div
                      key={model.id}
                      className={`model-card ${selectedModel === model.id ? 'selected' : ''}`}
                      onClick={() => setSelectedModel(model.id)}
                    >
                      <div className="model-name">
                        {model.name}
                        <div style={{ display: 'flex', gap: 6 }}>
                          {model.recommended && <span className="model-badge recommended">Recommended</span>}
                          {model.speed === 'fast' && <span className="model-badge fast">Fast</span>}
                        </div>
                      </div>
                      <div className="model-description">{model.description}</div>
                      <div className="model-meta">
                        <span>Context: {model.context_length?.toLocaleString() || 'N/A'} tokens</span>
                        <span>Speed: {model.speed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <details className="provider-selector" style={{ marginTop: 24 }}>
                <summary style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', padding: '12px 0', cursor: 'pointer' }}>
                  Advanced Settings
                </summary>
                <div style={{ marginTop: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Temperature</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      className="form-input"
                      value={config.temperature || 0.7}
                      onChange={e => handleConfigChange('temperature', parseFloat(e.target.value))}
                      style={{ padding: 0 }}
                    />
                    <div className="form-hint">
                      Controls randomness: 0 = deterministic, 1 = creative
                      <br />
                      Current value: {config.temperature || 0.7}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Tokens</label>
                    <input
                      type="number"
                      className="form-input"
                      value={config.maxTokens || 4096}
                      onChange={e => handleConfigChange('maxTokens', parseInt(e.target.value))}
                      min="1"
                      max="32768"
                    />
                    <div className="form-hint">Maximum number of tokens to generate</div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}