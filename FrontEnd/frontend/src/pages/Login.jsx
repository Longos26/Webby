// src/pages/Login.jsx - CLEAN ENTERPRISE DESIGN
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import { ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../api';
import { authService } from '../api';
import React from 'react';
import logo from '../newlogo.png';

// ============================================================
// STYLES - CLEAN UNTITLED UI AESTHETIC
// ============================================================

const STYLES = `
  .login-root {
    --bg-canvas: #0D1117;
    --bg-surface: #161B22;
    --bg-surface-elevated: #1C2128;
    --border-default: #30363D;
    --border-subtle: #21262D;
    --border-focus: #00ED64;
    --text-primary: #F0F6FC;
    --text-secondary: #9BA4B0;
    --text-muted: #6E7681;
    --text-link: #58A6FF;
    --accent-green: #00ED64;
    --accent-green-dark: #00C255;
    --status-error: #F85149;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .login-root * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .login-root {
    min-height: 100vh;
    background: var(--bg-canvas);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
    font-family: var(--font-sans);
    font-size: 15px;
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }

  .login-container {
    width: 100%;
    max-width: 420px;
  }

  .login-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 32px;
  }

  .login-logo img {
    height: 100px;
    width: auto;
  }

  .login-header {
    margin-bottom: 32px;
    text-align: center;
  }

  .login-header h2 {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin-bottom: 8px;
    line-height: 1.2;
  }

  .login-header p {
    font-size: 15px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .login-error {
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.25);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #FF7B72;
    margin-bottom: 24px;
  }

  .login-field {
    margin-bottom: 20px;
  }

  .login-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .login-input-wrap {
    position: relative;
  }

  .login-input {
    width: 100%;
    background: var(--bg-canvas);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    font-size: 14px;
    font-family: inherit;
    color: var(--text-primary);
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
  }

  .login-input::placeholder {
    color: var(--text-muted);
  }

  .login-input:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.08);
  }

  .login-input.has-error {
    border-color: var(--status-error);
  }

  .login-input.has-error:focus {
    box-shadow: 0 0 0 3px rgba(248, 81, 73, 0.12);
  }

  .login-input.with-toggle {
    padding-right: 40px;
  }

  .login-password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: color var(--transition);
  }

  .login-password-toggle:hover {
    color: var(--text-primary);
  }

  .login-field-error {
    margin-top: 6px;
    font-size: 12px;
    color: #FF7B72;
  }

  .login-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .login-remember {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .login-remember input {
    width: 16px;
    height: 16px;
    accent-color: var(--accent-green);
    cursor: pointer;
  }

  .login-link {
    font-size: 13px;
    color: var(--text-link);
    text-decoration: none;
    transition: color var(--transition);
  }

  .login-link:hover {
    color: #79B8FF;
  }

  .login-submit {
    width: 100%;
    background: var(--accent-green);
    color: #0D1117;
    border: none;
    border-radius: var(--radius-md);
    padding: 12px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background var(--transition);
  }

  .login-submit:hover:not(:disabled) {
    background: var(--accent-green-dark);
  }

  .login-submit:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .login-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(13, 17, 23, 0.3);
    border-top-color: #0D1117;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .login-footer {
    text-align: center;
    margin-top: 32px;
    font-size: 14px;
    color: var(--text-secondary);
  }

  .login-footer a {
    color: var(--accent-green);
    font-weight: 500;
    text-decoration: none;
    transition: color var(--transition);
  }

  .login-footer a:hover {
    color: var(--accent-green-dark);
  }

  .login-copyright {
    text-align: center;
    margin-top: 40px;
    font-size: 12px;
    color: var(--text-muted);
  }

  /* ---------- Skeleton ---------- */
  .login-skeleton {
    min-height: 100vh;
    background: var(--bg-canvas);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
    font-family: var(--font-sans);
  }

  .login-skeleton-inner {
    width: 100%;
    max-width: 420px;
  }

  .skeleton {
    background: var(--bg-surface);
    border-radius: var(--radius-sm);
    animation: pulse 1.6s ease-in-out infinite;
  }

  @media (max-width: 480px) {
    .login-root {
      padding: 32px 20px;
    }

    .login-header h2 {
      font-size: 24px;
    }

    .login-logo img {
      height: 72px;
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
// SKELETON
// ============================================================

const LoginSkeleton = () => (
  <div className="login-skeleton">
    <div className="login-skeleton-inner">
      {/* Logo */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: 120, height: 100 }} />
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div className="skeleton" style={{ width: '60%', height: 32, margin: '0 auto 8px' }} />
        <div className="skeleton" style={{ width: '50%', height: 18, margin: '0 auto' }} />
      </div>

      {/* Email */}
      <div style={{ marginBottom: 20 }}>
        <div className="skeleton" style={{ width: '30%', height: 16, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '100%', height: 44 }} />
      </div>

      {/* Password */}
      <div style={{ marginBottom: 20 }}>
        <div className="skeleton" style={{ width: '30%', height: 16, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '100%', height: 44 }} />
      </div>

      {/* Remember / Forgot */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
        <div className="skeleton" style={{ width: 120, height: 16 }} />
        <div className="skeleton" style={{ width: 120, height: 16 }} />
      </div>

      {/* Button */}
      <div className="skeleton" style={{ width: '100%', height: 48 }} />
    </div>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  injectStyles('login-styles', STYLES);

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Please enter a valid email address';
    if (!formData.password.trim()) errors.password = 'Password is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (validationErrors[id]) setValidationErrors(prev => ({ ...prev, [id]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      dispatch(signInStart());
      const data = await authService.login(formData.email, formData.password);
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (remember) localStorage.setItem('rememberedEmail', formData.email);
        else localStorage.removeItem('rememberedEmail');
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        dispatch(signInSuccess({ user: data.user, token: data.access_token }));
        navigate('/dashboard');
      }
    } catch (error) {
      let errorMsg = 'Login failed. Please try again.';
      if (error.response?.data?.detail) errorMsg = error.response.data.detail;
      else if (error.response?.data?.message) errorMsg = error.response.data.message;
      else if (error.userMessage) errorMsg = error.userMessage;
      setErrorMessage(errorMsg);
      dispatch(signInFailure(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRemember(true);
    }
  }, []);

  if (loading) {
    return <LoginSkeleton />;
  }

  return (
    <div className="login-root">
      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src={logo} alt="Webby" />
          </Link>
        </div>

        {/* Header */}
        <div className="login-header">
          <h2>Welcome back</h2>
          <p>Enter your credentials to access your account.</p>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{typeof errorMessage === 'string' ? errorMessage : 'Login failed'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="login-field">
            <label htmlFor="email" className="login-label">Email address</label>
            <input
              type="email"
              id="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className={`login-input ${validationErrors.email ? 'has-error' : ''}`}
            />
            {validationErrors.email && (
              <p className="login-field-error">{validationErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="login-field">
            <label htmlFor="password" className="login-label">Password</label>
            <div className="login-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className={`login-input with-toggle ${validationErrors.password ? 'has-error' : ''}`}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="login-field-error">{validationErrors.password}</p>
            )}
          </div>

          {/* Remember / Forgot */}
          <div className="login-row">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="login-link">Forgot password?</Link>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="login-submit">
            {loading ? (
              <>
                <div className="login-spinner" />
                Signing in…
              </>
            ) : (
              <>
                Sign in <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          Don't have an account?{' '}
          <Link to="/signin">Create one free →</Link>
        </div>

        <div className="login-copyright">
          © 2026 Webby · Enterprise Web Intelligence
        </div>
      </div>
    </div>
  );
};

export default Login;