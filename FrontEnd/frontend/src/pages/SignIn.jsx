// src/pages/SignUp.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import { Eye, EyeOff, AlertCircle, UserPlus, CheckCircle2, Shield, Zap, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';
import { authService } from '../api';
import React from 'react';
import logo from '../newlogo.png';

// ============================================================
// ENTERPRISE-GRADE UI - MongoDB Atlas Inspired
// No gradients, no glassmorphism, no neon effects
// Professional, clean, data-platform aesthetic
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
    --bg-sidebar: #0D1117;
    --border-default: #30363D;
    --border-subtle: #21262D;
    --border-focus: #00ED64;
    --text-primary: #F0F6FC;
    --text-secondary: #8B949E;
    --text-muted: #6E7681;
    --text-link: #58A6FF;
    --accent-green: #00ED64;
    --accent-green-dark: #00C255;
    --status-success: #00ED64;
    --status-warning: #D29922;
    --status-error: #F85149;
    --status-info: #58A6FF;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.25);
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
    line-height: 1.5;
  }

  *:focus-visible {
    outline: none;
    ring: 2px solid var(--accent-green);
    ring-offset: 2px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .skeleton {
    background: linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-surface-elevated) 50%, var(--bg-surface) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: var(--radius-sm);
  }
`;

const PERKS = [
  { text: 'Free 14-day trial', subtext: 'No credit card required', icon: CheckCircle2 },
  { text: '10,000 records', subtext: 'Processed on signup', icon: BarChart3 },
  { text: 'Real-time monitoring', subtext: 'Error alerts included', icon: Zap },
  { text: 'Cancel anytime', subtext: 'No lock-in contracts', icon: Shield },
];

const SignUpSkeleton = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'flex' }}>
    {/* Left Panel Skeleton */}
    <div style={{
      width: '42%',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-default)',
      padding: '48px 40px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div className="skeleton" style={{ width: '120px', height: '100px', marginBottom: '48px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '40px' }}>
          <div className="skeleton" style={{ width: '180px', height: '20px', marginBottom: '12px' }} />
          <div className="skeleton" style={{ width: '80%', height: '36px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ width: '70%', height: '18px' }} />
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ flex: 1, padding: '16px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div className="skeleton" style={{ width: '60%', height: '32px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '50%', height: '16px' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton" style={{ width: '40%', height: '16px' }} />
              <div className="skeleton" style={{ width: '30%', height: '14px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Right Panel Skeleton */}
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div className="skeleton" style={{ width: '60%', height: '32px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '50%', height: '18px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div className="skeleton" style={{ width: '40%', height: '16px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: 'var(--radius-md)' }} />
          </div>
          <div>
            <div className="skeleton" style={{ width: '40%', height: '16px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <div className="skeleton" style={{ width: '30%', height: '16px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: 'var(--radius-md)' }} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <div className="skeleton" style={{ width: '30%', height: '16px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: 'var(--radius-md)' }} />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <div className="skeleton" style={{ width: '40%', height: '16px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: 'var(--radius-md)' }} />
        </div>
        <div className="skeleton" style={{ width: '100%', height: '48px', borderRadius: 'var(--radius-md)', marginBottom: '28px' }} />
      </div>
    </div>
  </div>
);

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, label: '', cls: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score: 1, label: 'Weak', cls: 'weak' };
    if (score <= 2) return { score: 2, label: 'Fair', cls: 'fair' };
    return { score: 3, label: 'Strong', cls: 'strong' };
  };

  const strength = getPasswordStrength(formData.password);

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!agreed) errors.terms = 'You must accept the terms to continue';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (validationErrors[id]) {
      setValidationErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      dispatch(signInStart());
      const data = await authService.signup({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        dispatch(signInSuccess({ user: data.user, token: data.access_token }));
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
      let errorMsg = 'Registration failed. Please try again.';
      if (error.response?.data?.detail) errorMsg = error.response.data.detail;
      else if (error.response?.data?.message) errorMsg = error.response.data.message;
      else if (error.userMessage) errorMsg = error.userMessage;
      setErrorMessage(errorMsg);
      dispatch(signInFailure(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SignUpSkeleton />;
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'flex' }}>
        {/* LEFT PANEL - Brand Section */}
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
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent-green)', letterSpacing: '0.5px', marginBottom: '12px' }}>ENTERPRISE DATA PLATFORM</div>
              <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.2 }}>Start scaling your<br />web intelligence</h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Join thousands of engineering teams using Webby to automate data pipelines at scale.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { value: '2.8K', label: 'Active scraping jobs' },
                  { value: '184M', label: 'Records processed daily' },
                  { value: '99.6%', label: 'Success rate' },
                ].map((stat, i) => (
                  <div key={i} style={{ flex: 1, padding: '16px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{stat.value}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {PERKS.map((perk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 28, height: 28, background: 'rgba(0, 237, 100, 0.1)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <perk.icon size={16} color="var(--accent-green)" />
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{perk.text}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{perk.subtext}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '32px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              {['SOC 2 Type II', 'GDPR Compliant', 'ISO 27001'].map((badge, i) => (
                <span key={i} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{badge}</span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Signup Form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
          <div style={{ width: '100%', maxWidth: '460px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Create account</h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Start your 14-day free trial. No credit card required.</p>
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
                <span>{typeof errorMessage === 'string' ? errorMessage : 'Registration failed'}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>First name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      background: 'var(--bg-canvas)',
                      border: `1px solid ${validationErrors.firstName ? 'var(--status-error)' : 'var(--border-default)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-green)'}
                    onBlur={e => { if (!validationErrors.firstName) e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                  />
                  {validationErrors.firstName && <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--status-error)' }}>{validationErrors.firstName}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Last name</label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      background: 'var(--bg-canvas)',
                      border: `1px solid ${validationErrors.lastName ? 'var(--status-error)' : 'var(--border-default)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-green)'}
                    onBlur={e => { if (!validationErrors.lastName) e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                  />
                  {validationErrors.lastName && <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--status-error)' }}>{validationErrors.lastName}</p>}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Work email</label>
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
                {formData.password && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1, 2, 3].map((n) => (
                        <div key={n} style={{ flex: 1, height: '3px', borderRadius: 'var(--radius-sm)', background: strength.score >= n ? (strength.cls === 'weak' ? 'var(--status-error)' : strength.cls === 'fair' ? 'var(--status-warning)' : 'var(--accent-green)') : 'var(--border-default)' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '12px', color: strength.cls === 'weak' ? 'var(--status-error)' : strength.cls === 'fair' ? 'var(--status-warning)' : 'var(--accent-green)' }}>{strength.label}</span>
                  </div>
                )}
                {validationErrors.password && <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--status-error)' }}>{validationErrors.password}</p>}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      background: 'var(--bg-canvas)',
                      border: `1px solid ${validationErrors.confirmPassword ? 'var(--status-error)' : 'var(--border-default)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 40px 10px 14px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-green)'}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {validationErrors.confirmPassword && <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--status-error)' }}>{validationErrors.confirmPassword}</p>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
                <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent-green)' }} />
                <label htmlFor="terms" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  I agree to Webby's <Link to="/terms" style={{ color: 'var(--text-link)', textDecoration: 'none' }}>Terms of Service</Link> and <Link to="/privacy" style={{ color: 'var(--text-link)', textDecoration: 'none' }}>Privacy Policy</Link>
                </label>
              </div>
              {validationErrors.terms && <p style={{ marginTop: '-16px', marginBottom: '16px', fontSize: '12px', color: 'var(--status-error)' }}>{validationErrors.terms}</p>}

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
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(13, 17, 23, 0.3)', borderTopColor: '#0D1117', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Creating account...</>
                ) : (
                  <>Create account <UserPlus size={16} /></>
                )}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '28px 0 20px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Already have an account</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: 'var(--accent-green)', fontWeight: 500, textDecoration: 'none', fontSize: '14px' }}>Sign in →</Link>
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: 'var(--text-muted)' }}>
              © 2026 Webby · Enterprise Web Intelligence
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;