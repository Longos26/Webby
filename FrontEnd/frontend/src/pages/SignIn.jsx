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

// ============================================================
// ANTI-GENERIC UI/UX ENFORCEMENT v2.0 - SIGNUP PAGE
// - No nested card anti-pattern
// - Visible borders (10%+ contrast)
// - No emoji icons (Lucide only)
// - No em dashes in UI copy (using colons or separate visual elements)
// - 60-30-10 color ratio enforced
// - Subtle shadows, consistent radius scale
// - Purposeful animation layer
// - Password strength meter (no emojis)
// ============================================================

const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    /* Brand (10% accent) */
    --color-brand:       hsl(217, 91%, 60%);
    --color-brand-light: hsl(217, 91%, 55%);
    --color-brand-dark:  hsl(217, 83%, 48%);
    
    /* Semantic colors - limited palette */
    --color-success:     hsl(142, 76%, 36%);
    --color-success-dim: hsl(142, 76%, 96%);
    --color-warning:     hsl(38, 92%, 50%);
    --color-error:       hsl(0, 84%, 60%);
    --color-error-dim:   hsl(0, 84%, 96%);

    /* Surfaces (60% canvas, 30% secondary) */
    --color-canvas:      hsl(222, 47%, 5%);
    --color-surface:     hsl(224, 35%, 8%);
    --color-surface-elevated: hsl(226, 30%, 12%);
    --color-overlay:     hsl(225, 25%, 10%);

    /* Text hierarchy */
    --color-text-primary:   hsl(210, 20%, 98%);
    --color-text-secondary: hsl(216, 12%, 68%);
    --color-text-muted:     hsl(218, 15%, 48%);

    /* Borders - must be visibly distinct (policy requirement) */
    --color-border:        hsl(224, 25%, 18%);
    --color-border-strong: hsl(224, 25%, 28%);
    --color-border-focus:  var(--color-brand);

    /* Shadows - subtle, never dark */
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2), 0 1px 1px rgba(0, 0, 0, 0.1);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 8px 28px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1);

    /* Border radius scale - consistent nesting rule */
    --radius-xs:   4px;
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   14px;
    --radius-xl:   18px;
    --radius-2xl:  24px;
    --radius-full: 9999px;

    /* Transitions - purposeful motion */
    --transition-fast: 120ms cubic-bezier(0.16, 1, 0.3, 1);
    --transition-base: 200ms cubic-bezier(0.16, 1, 0.3, 1);
    --transition-slow: 320ms cubic-bezier(0.16, 1, 0.3, 1);

    /* Type scale */
    --text-xs:   0.75rem;
    --text-sm:   0.8125rem;
    --text-base: 0.9375rem;
    --text-md:   1.0625rem;
    --text-lg:   1.25rem;
    --text-xl:   1.5rem;
    --text-2xl:  1.875rem;
    --text-3xl:  2.5rem;

    /* Font families - max 2 */
    --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  }

  body {
    background: var(--color-canvas);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: 1.5;
  }

  /* Global interactive transitions */
  button, a, [role="button"], input {
    transition: all var(--transition-base);
  }

  /* Focus ring with transition */
  *:focus-visible {
    outline: none;
    ring: 2px solid var(--color-brand);
    ring-offset: 2px;
    transition: ring var(--transition-fast);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// SVG Illustration for left panel - geometric abstract (no generic stock)
const SignupIllustration = () => (
  <svg width="380" height="300" viewBox="0 0 380 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%' }}>
    <defs>
      <linearGradient id="signupGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
      </linearGradient>
      <linearGradient id="signupGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#10b981" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
    <rect x="50" y="40" width="280" height="180" rx="16" fill="url(#signupGrad1)" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5"/>
    <path d="M110 110 L160 80 L210 110 L260 80" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="160" cy="110" r="6" fill="#10b981" />
    <circle cx="210" cy="110" r="6" fill="#3b82f6" />
    <rect x="100" y="145" width="55" height="25" rx="6" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
    <rect x="225" y="145" width="55" height="25" rx="6" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.3)" strokeWidth="1"/>
    <path d="M270 220 L310 200 L350 220" stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M30 220 L70 200 L110 220" stroke="#8b5cf6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <circle cx="330" cy="70" r="22" fill="url(#signupGrad2)" stroke="rgba(139,92,246,0.3)" strokeWidth="1"/>
    <path d="M330 58 L330 82 M318 70 L342 70" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
    {/* Checkmark badge */}
    <circle cx="280" cy="180" r="16" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5"/>
    <path d="M274 180 L278 184 L286 174" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* Password strength helper - returns descriptive labels (no emojis) */
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

const PERKS = [
  { text: 'Free 14-day trial', subtext: 'no credit card required', icon: CheckCircle2 },
  { text: '10,000 records', subtext: 'processed on signup', icon: BarChart3 },
  { text: 'Real-time monitoring', subtext: 'and error alerts included', icon: Zap },
  { text: 'Cancel anytime', subtext: 'no lock-in contracts', icon: Shield },
];

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

  const { loading, error: errorMessage } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  const extractErrorMessage = (raw) => {
    if (!raw) return 'Registration failed. Please try again.';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw)) {
      return raw.map((e) => e?.msg || JSON.stringify(e)).join('; ');
    }
    if (typeof raw === 'object') {
      return raw.msg || raw.message || raw.detail || JSON.stringify(raw);
    }
    return String(raw);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  try {
    dispatch(signInStart());

    const response = await api.post('https://webby-1osa.onrender.com/api/auth/signup', {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      password: formData.password,
    });

    const data = response.data;

    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      dispatch(signInSuccess({ 
        user: data.user, 
        token: data.access_token 
      }));
      navigate('/dashboard');
    } else {
      throw new Error('Registration failed - no token received');
    }
  } catch (error) {
    console.error('Signup error:', error);
    let errorMsg = 'Registration failed. Please try again.';
    
    if (error.response?.data?.detail) {
      errorMsg = error.response.data.detail;
    } else if (error.response?.data?.message) {
      errorMsg = error.response.data.message;
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    dispatch(signInFailure(errorMsg));
  }
};
  // Animation variants
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }
  });

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--color-canvas)', 
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background grid - subtle, adds depth without distraction */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(16,185,129,0.05) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(16,185,129,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          pointerEvents: 'none'
        }} />

        {/* ========== LEFT PANEL: Brand Story & Perks ========== */}
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '45%',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 2,
          overflowY: 'auto'
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '24px' }}>
            <div style={{ width: 10, height: 10, background: 'var(--color-success)', borderRadius: 'var(--radius-full)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>Webby</span>
          </Link>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '36px' }}>
            {/* Stats Grid - no nested cards anti-pattern */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { value: '47.3M', label: 'Records processed daily' },
                { value: '1,294', label: 'Active scraping jobs' },
                { value: '99.6%', label: 'Success rate' }
              ].map((stat, i) => (
                <motion.div key={i} {...fadeUp(i * 0.1)} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 12px',
                  transition: 'border-color var(--transition-fast)'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '6px', color: 'white' }}>{stat.value}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Illustration */}
            <motion.div {...fadeUp(0.2)} style={{ display: 'flex', justifyContent: 'center' }}>
              <SignupIllustration />
            </motion.div>

            {/* Perks List - no em dashes, uses proper formatting */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: '16px'
              }}>What you get for free</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {PERKS.map((perk, i) => (
                  <motion.div key={i} {...fadeUp(0.25 + i * 0.05)} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 'var(--radius-full)',
                      background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <perk.icon size={12} color="var(--color-success)" />
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{perk.text}</span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{perk.subtext}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            <motion.div {...fadeUp(0.4)} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px'
            }}>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', marginBottom: '16px' }}>
                "Webby cut our data pipeline setup time by 80 percent. What took weeks now runs in hours with better accuracy than our in-house solution."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--color-brand), #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, fontSize: 'var(--text-sm)', color: 'white'
                }}>SC</div>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Sarah Chen</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Head of Data, Acme Corp</div>
                </div>
              </div>
            </motion.div>

            {/* Security badges */}
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '8px' }}>
              {['SOC 2 Type II', 'GDPR Compliant', 'ISO 27001'].map((badge, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  <Shield size={11} />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========== RIGHT PANEL: Signup Form ========== */}
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          marginLeft: '45%',
          position: 'relative',
          zIndex: 1
        }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', maxWidth: '440px' }}
          >
            {/* Header - no em dashes */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--color-success)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}>Get started free</div>
              <h1 style={{
                fontSize: 'clamp(32px, 4vw, 44px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                marginBottom: '12px',
                color: 'white'
              }}>Create your account</h1>
              <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Join thousands of teams using Webby to automate their data pipelines.
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: 'var(--text-sm)',
                color: '#f87171',
                marginBottom: '28px'
              }}>
                <AlertCircle size={16} />
                <span>{typeof errorMessage === 'string' ? errorMessage : 'Registration failed'}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Two-column name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label htmlFor="firstName" style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>First name</label>
                  <input
                    type="text"
                    id="firstName"
                    placeholder="Jane"
                    value={formData.firstName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${validationErrors.firstName ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-text-primary)',
                      outline: 'none'
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-border-focus)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                    onBlur={e => { if (!validationErrors.firstName) e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  />
                  {validationErrors.firstName && <p style={{ marginTop: '6px', fontSize: 'var(--text-xs)', color: '#f87171' }}>{validationErrors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>Last name</label>
                  <input
                    type="text"
                    id="lastName"
                    placeholder="Smith"
                    value={formData.lastName}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${validationErrors.lastName ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-text-primary)',
                      outline: 'none'
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-border-focus)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                    onBlur={e => { if (!validationErrors.lastName) e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  />
                  {validationErrors.lastName && <p style={{ marginTop: '6px', fontSize: 'var(--text-xs)', color: '#f87171' }}>{validationErrors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="email" style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: '8px'
                }}>Work email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="jane@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${validationErrors.email ? 'var(--color-error)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-text-primary)',
                    outline: 'none'
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-border-focus)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                  onBlur={e => { if (!validationErrors.email) e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                />
                {validationErrors.email && <p style={{ marginTop: '6px', fontSize: 'var(--text-xs)', color: '#f87171' }}>{validationErrors.email}</p>}
              </div>

              {/* Password with strength meter */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="password" style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: '8px'
                }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${validationErrors.password ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 48px 12px 14px',
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-text-primary)',
                      outline: 'none'
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-border-focus)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                    onBlur={e => { if (!validationErrors.password) e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Password strength meter - no emojis, uses color-coded bars */}
                {formData.password && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          style={{
                            flex: 1,
                            height: '3px',
                            borderRadius: 'var(--radius-full)',
                            background: strength.score >= n
                              ? strength.cls === 'weak' ? '#ef4444' : strength.cls === 'fair' ? '#f59e0b' : '#10b981'
                              : 'rgba(255,255,255,0.08)',
                            transition: 'background var(--transition-fast)'
                          }}
                        />
                      ))}
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.05em',
                      color: strength.cls === 'weak' ? '#ef4444' : strength.cls === 'fair' ? '#f59e0b' : '#10b981'
                    }}>
                      {strength.label} password
                    </span>
                  </div>
                )}
                {validationErrors.password && <p style={{ marginTop: '6px', fontSize: 'var(--text-xs)', color: '#f87171' }}>{validationErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="confirmPassword" style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: '8px'
                }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${validationErrors.confirmPassword ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 48px 12px 14px',
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-text-primary)',
                      outline: 'none'
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-border-focus)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                    onBlur={e => { if (!validationErrors.confirmPassword) e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {validationErrors.confirmPassword && <p style={{ marginTop: '6px', fontSize: 'var(--text-xs)', color: '#f87171' }}>{validationErrors.confirmPassword}</p>}
              </div>

              {/* Terms - no em dashes */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '28px' }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (validationErrors.terms) setValidationErrors(prev => ({ ...prev, terms: '' }));
                  }}
                  style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--color-brand)' }}
                />
                <label htmlFor="terms" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  I agree to Webby's <Link to="/terms" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>Terms of Service</Link> and <Link to="/privacy" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>Privacy Policy</Link>
                </label>
              </div>
              {validationErrors.terms && <p style={{ marginTop: '-16px', marginBottom: '16px', fontSize: 'var(--text-xs)', color: '#f87171' }}>{validationErrors.terms}</p>}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--color-success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = 'var(--color-success)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}
              >
                {loading ? (
                  <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Creating account...</>
                ) : (
                  <>Create account <UserPlus size={18} /></>
                )}
              </button>
            </form>

            {/* Divider - visual separator, no em dashes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '28px 0 20px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Already have an account</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            </div>

            {/* Sign in link */}
            <div style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: 'var(--color-brand)', fontWeight: 500, textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
                Log in instead →
              </Link>
            </div>

            {/* Copyright */}
            <div style={{ textAlign: 'center', marginTop: '36px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.12)' }}>
              © 2026 Webby · Enterprise Web Intelligence
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SignUp;