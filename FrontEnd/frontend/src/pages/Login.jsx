// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import logo from '../logowebby.png';

// ============================================================
// ENTERPRISE-GRADE UI - MongoDB Atlas Inspired Login
// No gradients, clean, professional
// ============================================================

const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --bg-canvas: #0D1117;
    --bg-surface: #161B22;
    --bg-surface-elevated: #1C2128;
    --border-default: #30363D;
    --border-subtle: #21262D;
    --border-focus: #00ED64;
    --text-primary: #F0F6FC;
    --text-secondary: #8B949E;
    --text-muted: #6E7681;
    --text-link: #58A6FF;
    --accent-green: #00ED64;
    --accent-green-dark: #00C255;
    --status-error: #F85149;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --transition-base: all 0.15s ease;
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  }

  body {
    background: var(--bg-canvas);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 15px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const { loading, error: errorMessage } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
      dispatch(signInFailure(errorMsg));
    }
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRemember(true);
    }
  }, []);

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'flex' }}>
        {/* LEFT PANEL */}
        <div style={{
          width: '42%',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-default)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '48px' }}>
            <img src={logo} alt="Webby" style={{ height: '100px', width: 'auto' }} />
          </Link>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '40px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent-green)', letterSpacing: '0.5px', marginBottom: '12px' }}>SECURE ACCESS</div>
              <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Sign in to Webby</h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Access your data pipelines, monitoring, and analytics.</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
              {[
                { value: '99.6%', label: 'Uptime SLA' },
                { value: '<400ms', label: 'Avg response' },
                { value: '24/7', label: 'Support' },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1, padding: '16px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{
              padding: '24px',
              background: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                "Webby cut our data pipeline setup time by 80 percent. What took weeks now runs in hours."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#0D1117' }}>SC</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>Sarah Chen</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Head of Data, Acme Corp</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '32px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            {['SOC 2 Type II', 'GDPR Compliant', 'ISO 27001'].map((badge, i) => (
              <span key={i} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{badge}</span>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Welcome back</h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Enter your credentials to access your account.</p>
            </div>

            {errorMessage && (
              <div style={{
                background: 'rgba(248, 81, 73, 0.1)',
                border: '1px solid var(--status-error)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                color: 'var(--status-error)',
                marginBottom: '24px'
              }}>
                <AlertCircle size={16} />
                <span>{typeof errorMessage === 'string' ? errorMessage : 'Login failed'}</span>
              </div>
            )}

            <button type="button" onClick={() => alert('Google OAuth coming soon')} style={{
              width: '100%',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '10px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '24px'
            }}>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Email address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    background: 'var(--bg-canvas)',
                    border: `1px solid ${validationErrors.email ? 'var(--status-error)' : 'var(--border-default)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-green)'}
                />
                {validationErrors.email && <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--status-error)' }}>{validationErrors.email}</p>}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      background: 'var(--bg-canvas)',
                      border: `1px solid ${validationErrors.password ? 'var(--status-error)' : 'var(--border-default)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 40px 10px 14px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-green)'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {validationErrors.password && <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--status-error)' }}>{validationErrors.password}</p>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent-green)' }} />
                  Remember me
                </label>
                <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--text-link)', textDecoration: 'none' }}>Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%',
                background: 'var(--accent-green)',
                color: '#0D1117',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(13, 17, 23, 0.3)', borderTopColor: '#0D1117', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Signing in...</>
                ) : (
                  <>Sign in <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/signin" style={{ color: 'var(--accent-green)', fontWeight: 500, textDecoration: 'none' }}>Create one free →</Link>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: 'var(--text-muted)' }}>
              © 2026 Webby · Enterprise Web Intelligence
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;