// src/pages/SignUp.jsx - CLEAN ENTERPRISE DESIGN
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import { Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react';
import api from '../api';
import { authService } from '../api';
import React from 'react';
import logo from '../newlogo.png';

// ============================================================
// STYLES - CLEAN UNTITLED UI AESTHETIC
// ============================================================

const STYLES = `
  .signup-root {
    --bg-canvas: #0D1117;
    --bg-surface: #161B22;
    --bg-surface-elevated: #1C2128;
    --border-default: #30363D;
    --border-subtle: #21262D;
    --text-primary: #F0F6FC;
    --text-secondary: #9BA4B0;
    --text-muted: #6E7681;
    --text-link: #58A6FF;
    --accent-green: #00ED64;
    --accent-green-dark: #00C255;
    --status-success: #00ED64;
    --status-warning: #D29922;
    --status-error: #F85149;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --font-sans: "Inter", "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .signup-root * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .signup-root {
    min-height: 100vh;
    background: var(--bg-canvas);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
    font-family: var(--font-sans);
    font-size: 15px;
    color: var(--text-primary);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }

  .signup-container {
    width: 100%;
    max-width: 460px;
  }

  .signup-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 32px;
  }

  .signup-logo img {
    height: 100px;
    width: auto;
  }

  .signup-header {
    margin-bottom: 32px;
    text-align: center;
  }

  .signup-header h2 {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin-bottom: 8px;
    line-height: 1.2;
  }

  .signup-header p {
    font-size: 15px;
    color: var(--text-secondary);
  }

  .signup-error {
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

  .signup-name-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .signup-field {
    margin-bottom: 20px;
  }

  .signup-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .signup-input-wrap {
    position: relative;
  }

  .signup-input {
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

  .signup-input::placeholder {
    color: var(--text-muted);
  }

  .signup-input:focus {
    border-color: var(--accent-green);
    box-shadow: 0 0 0 3px rgba(0, 237, 100, 0.08);
  }

  .signup-input.has-error {
    border-color: var(--status-error);
  }

  .signup-input.has-error:focus {
    box-shadow: 0 0 0 3px rgba(248, 81, 73, 0.12);
  }

  .signup-input.with-toggle {
    padding-right: 40px;
  }

  .signup-toggle {
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

  .signup-toggle:hover {
    color: var(--text-primary);
  }

  .signup-field-error {
    margin-top: 6px;
    font-size: 12px;
    color: #FF7B72;
  }

  /* ---------- Password strength ---------- */
  .signup-strength {
    margin-top: 8px;
  }

  .signup-strength-bars {
    display: flex;
    gap: 4px;
    margin-bottom: 6px;
  }

  .signup-strength-bar {
    flex: 1;
    height: 3px;
    border-radius: var(--radius-sm);
    background: var(--border-default);
    transition: background var(--transition);
  }

  .signup-strength-bar.weak { background: var(--status-error); }
  .signup-strength-bar.fair { background: var(--status-warning); }
  .signup-strength-bar.strong { background: var(--accent-green); }

  .signup-strength-label {
    font-size: 12px;
    font-weight: 500;
  }

  .signup-strength-label.weak { color: var(--status-error); }
  .signup-strength-label.fair { color: var(--status-warning); }
  .signup-strength-label.strong { color: var(--accent-green); }

  /* ---------- Terms ---------- */
  .signup-terms {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 24px;
  }

  .signup-terms input {
    width: 16px;
    height: 16px;
    margin-top: 2px;
    accent-color: var(--accent-green);
    cursor: pointer;
    flex-shrink: 0;
  }

  .signup-terms label {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
    cursor: pointer;
  }

  .signup-terms a {
    color: var(--text-link);
    text-decoration: none;
    transition: color var(--transition);
  }

  .signup-terms a:hover {
    color: #79B8FF;
  }

  .signup-terms-error {
    margin-top: -18px;
    margin-bottom: 16px;
    font-size: 12px;
    color: #FF7B72;
  }

  /* ---------- Submit ---------- */
  .signup-submit {
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

  .signup-submit:hover:not(:disabled) {
    background: var(--accent-green-dark);
  }

  .signup-submit:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .signup-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(13, 17, 23, 0.3);
    border-top-color: #0D1117;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* ---------- Divider ---------- */
  .signup-divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 28px 0 20px;
  }

  .signup-divider-line {
    flex: 1;
    height: 1px;
    background: var(--border-subtle);
  }

  .signup-divider span {
    font-size: 12px;
    color: var(--text-muted);
  }

  .signup-footer {
    text-align: center;
  }

  .signup-footer a {
    color: var(--accent-green);
    font-weight: 500;
    text-decoration: none;
    font-size: 14px;
    transition: color var(--transition);
  }

  .signup-footer a:hover {
    color: var(--accent-green-dark);
  }

  .signup-copyright {
    text-align: center;
    margin-top: 32px;
    font-size: 12px;
    color: var(--text-muted);
  }

  /* ---------- Skeleton ---------- */
  .signup-skeleton {
    min-height: 100vh;
    background: var(--bg-canvas);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
    font-family: var(--font-sans);
  }

  .signup-skeleton-inner {
    width: 100%;
    max-width: 460px;
  }

  .skeleton {
    background: var(--bg-surface);
    border-radius: var(--radius-sm);
    animation: pulse 1.6s ease-in-out infinite;
  }

  @media (max-width: 480px) {
    .signup-root {
      padding: 32px 20px;
    }

    .signup-header h2 {
      font-size: 24px;
    }

    .signup-logo img {
      height: 72px;
    }

    .signup-name-grid {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .signup-name-grid > div {
      margin-bottom: 20px;
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

const SignUpSkeleton = () => (
  <div className="signup-skeleton">
    <div className="signup-skeleton-inner">
      {/* Logo */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: 120, height: 100 }} />
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div className="skeleton" style={{ width: '60%', height: 32, margin: '0 auto 8px' }} />
        <div className="skeleton" style={{ width: '50%', height: 18, margin: '0 auto' }} />
      </div>

      {/* Names */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div className="skeleton" style={{ width: '40%', height: 16, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '100%', height: 44 }} />
        </div>
        <div>
          <div className="skeleton" style={{ width: '40%', height: 16, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '100%', height: 44 }} />
        </div>
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

      {/* Confirm */}
      <div style={{ marginBottom: 24 }}>
        <div className="skeleton" style={{ width: '40%', height: 16, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '100%', height: 44 }} />
      </div>

      {/* Button */}
      <div className="skeleton" style={{ width: '100%', height: 48, marginBottom: 28 }} />
    </div>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

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

  injectStyles('signup-styles', STYLES);

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
    <div className="signup-root">
      <div className="signup-container">
        {/* Logo */}
        <div className="signup-logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src={logo} alt="Webby" />
          </Link>
        </div>

        {/* Header */}
        <div className="signup-header">
          <h2>Create account</h2>
          <p>Start your 14-day free trial. No credit card required.</p>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="signup-error">
            <AlertCircle size={16} />
            <span>{typeof errorMessage === 'string' ? errorMessage : 'Registration failed'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Names */}
          <div className="signup-name-grid">
            <div>
              <label htmlFor="firstName" className="signup-label">First name</label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                className={`signup-input ${validationErrors.firstName ? 'has-error' : ''}`}
              />
              {validationErrors.firstName && (
                <p className="signup-field-error">{validationErrors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="signup-label">Last name</label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                className={`signup-input ${validationErrors.lastName ? 'has-error' : ''}`}
              />
              {validationErrors.lastName && (
                <p className="signup-field-error">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="signup-field">
            <label htmlFor="email" className="signup-label">Work email</label>
            <input
              type="email"
              id="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className={`signup-input ${validationErrors.email ? 'has-error' : ''}`}
            />
            {validationErrors.email && (
              <p className="signup-field-error">{validationErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="signup-field">
            <label htmlFor="password" className="signup-label">Password</label>
            <div className="signup-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                className={`signup-input with-toggle ${validationErrors.password ? 'has-error' : ''}`}
              />
              <button
                type="button"
                className="signup-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {formData.password && (
              <div className="signup-strength">
                <div className="signup-strength-bars">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={`signup-strength-bar ${strength.score >= n ? strength.cls : ''}`}
                    />
                  ))}
                </div>
                <span className={`signup-strength-label ${strength.cls}`}>
                  {strength.label}
                </span>
              </div>
            )}

            {validationErrors.password && (
              <p className="signup-field-error">{validationErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="signup-field">
            <label htmlFor="confirmPassword" className="signup-label">Confirm password</label>
            <div className="signup-input-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className={`signup-input with-toggle ${validationErrors.confirmPassword ? 'has-error' : ''}`}
              />
              <button
                type="button"
                className="signup-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="signup-field-error">{validationErrors.confirmPassword}</p>
            )}
          </div>

          {/* Terms */}
          <div className="signup-terms">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="terms">
              I agree to Webby's{' '}
              <Link to="/terms">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy">Privacy Policy</Link>
            </label>
          </div>
          {validationErrors.terms && (
            <p className="signup-terms-error">{validationErrors.terms}</p>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="signup-submit">
            {loading ? (
              <>
                <div className="signup-spinner" />
                Creating account…
              </>
            ) : (
              <>
                Create account <UserPlus size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="signup-divider">
          <div className="signup-divider-line" />
          <span>Already have an account</span>
          <div className="signup-divider-line" />
        </div>

        <div className="signup-footer">
          <Link to="/login">Sign in →</Link>
        </div>

        <div className="signup-copyright">
          © 2026 Webby · Enterprise Web Intelligence
        </div>
      </div>
    </div>
  );
};

export default SignUp;