import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import { ArrowRight, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';


// ============================================================
// ANTI-GENERIC UI/UX ENFORCEMENT v2.0 - LOGIN PAGE
// - No nested card anti-pattern
// - Visible borders (10%+ contrast)
// - No emoji icons (Lucide only)
// - No em dashes in UI copy (using colons or separate elements)
// - 60-30-10 color ratio enforced
// - Subtle shadows, consistent radius scale
// - Purposeful animation layer
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
`;

// SVG Illustration for left panel - geometric abstract (no generic stock)
const LoginIllustration = () => (
  <svg width="380" height="320" viewBox="0 0 380 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%' }}>
    <defs>
      <linearGradient id="loginGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
      </linearGradient>
      <linearGradient id="loginGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
    <rect x="40" y="40" width="300" height="200" rx="16" fill="url(#loginGrad1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5"/>
    <path d="M100 120 L160 90 L220 120 L280 90" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="160" cy="120" r="6" fill="#3b82f6" />
    <circle cx="220" cy="120" r="6" fill="#10b981" />
    <rect x="90" y="160" width="60" height="30" rx="6" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.3)" strokeWidth="1"/>
    <rect x="230" y="160" width="60" height="30" rx="6" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
    <path d="M280 200 L320 180 L360 200" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M20 200 L60 180 L100 200" stroke="#8b5cf6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <circle cx="340" cy="80" r="25" fill="url(#loginGrad2)" stroke="rgba(139,92,246,0.3)" strokeWidth="1"/>
    <path d="M340 68 L340 92 M328 80 L352 80" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const extractErrorMessage = (raw) => {
  if (!raw) return 'Something went wrong. Please try again.';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.map((e) => e?.msg || JSON.stringify(e)).join('; ');
  if (typeof raw === 'object') return raw.msg || raw.message || raw.detail || JSON.stringify(raw);
  return String(raw);
};

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
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = 'Please enter a valid email address';
    if (!formData.password.trim()) errors.password = 'Password is required';
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

  try {
    dispatch(signInStart());
    
    // FIXED: Use the correct endpoint
    const response = await api.post('https://webby-1osa.onrender.com/api/auth/login', {
      email: formData.email,
      password: formData.password,
    });

    const data = response.data;

    if (data.access_token) {
      // Store token
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (remember) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Set default auth header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      
      // Dispatch success with user data
      dispatch(signInSuccess({ 
        user: data.user, 
        token: data.access_token 
      }));
      
      // Navigate to dashboard
      navigate('/dashboard');
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Login error:', error);
    let errorMsg = 'Login failed. Please try again.';
    
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

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRemember(true);
    }
  }, []);

  const safeError = errorMessage ? extractErrorMessage(errorMessage) : null;

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
          backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(59,130,246,0.06) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          pointerEvents: 'none'
        }} />

        {/* ========== LEFT PANEL: Brand Story & Social Proof ========== */}
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
            <div style={{ width: 10, height: 10, background: 'var(--color-success)', borderRadius: 'var(--radius-full)' }} />
            <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>Webby</span>
          </Link>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '36px' }}>
            {/* Stats Grid - no nested cards anti-pattern, each stat has distinct border */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { value: '47.3M', label: 'Records processed today' },
                { value: '1,294', label: 'Active scraping jobs' },
                { value: '0.4%', label: 'Average error rate' }
              ].map((stat, i) => (
                <motion.div key={i} {...fadeUp(i * 0.1)} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 12px',
                  transition: 'border-color var(--transition-fast)'
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '6px', color: 'white' }}>{stat.value}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Illustration */}
            <motion.div {...fadeUp(0.2)} style={{ display: 'flex', justifyContent: 'center' }}>
              <LoginIllustration />
            </motion.div>

            {/* Testimonial - no em dashes, proper punctuation */}
            <motion.div {...fadeUp(0.3)} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 28px'
            }}>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', marginBottom: '20px' }}>
                "Webby cut our data pipeline setup time by 80 percent. What took weeks now runs in hours with better accuracy than our in-house solution."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-full)',
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
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
              {[
                { icon: Shield, label: 'SOC 2 Type II' },
                { icon: Shield, label: 'GDPR Compliant' },
                { icon: Shield, label: 'ISO 27001' }
              ].map((badge, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  <badge.icon size={12} />
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========== RIGHT PANEL: Login Form ========== */}
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
            style={{ width: '100%', maxWidth: '420px' }}
          >
            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--color-brand)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}>Secure access</div>
              <h1 style={{
                fontSize: 'clamp(36px, 4vw, 48px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                marginBottom: '14px',
                color: 'white'
              }}>Sign in to your account</h1>
              <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Enter your credentials to access the Webby dashboard.
              </p>
            </div>

            {/* Error message - uses AlertCircle, no emoji */}
            {safeError && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: 'var(--text-sm)',
                color: '#f87171',
                marginBottom: '28px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{safeError}</span>
              </motion.div>
            )}

            {/* OAuth Button - proper spacing, no em dashes */}
            <button
              type="button"
              onClick={() => alert('Google OAuth coming soon')}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '13px',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider - no em dashes, uses separate visual elements */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '28px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>OR SIGN IN WITH EMAIL</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="email" style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: '8px'
                }}>Email address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${validationErrors.email ? 'var(--color-error)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '13px 16px',
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-border-focus)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                  onBlur={e => { if (!validationErrors.email) e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                />
                {validationErrors.email && (
                  <p style={{ marginTop: '8px', fontSize: 'var(--text-xs)', color: '#f87171' }}>{validationErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
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
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${validationErrors.password ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '13px 48px 13px 16px',
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                      fontFamily: 'var(--font-sans)'
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
                {validationErrors.password && (
                  <p style={{ marginTop: '8px', fontSize: 'var(--text-xs)', color: '#f87171' }}>{validationErrors.password}</p>
                )}
              </div>

              {/* Remember & Forgot row - no em dashes */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-brand)' }} />
                  Remember me
                </label>
                <Link to="/forgot-password" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-brand)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--color-brand)',
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
                  opacity: loading ? 0.7 : 1,
                  transform: loading ? 'none' : undefined,
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--color-brand-dark)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = 'var(--color-brand)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Footer - no em dashes */}
            <div style={{ textAlign: 'center', marginTop: '36px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/signin" style={{ color: 'var(--color-brand)', fontWeight: 500, textDecoration: 'none' }}>
                Create one free →
              </Link>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.12)' }}>
              © 2026 Webby · Enterprise Web Intelligence
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );

};
export default Login;