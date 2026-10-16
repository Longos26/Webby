// src/pages/SignUp.jsx - CLEAN ENTERPRISE DESIGN + TERMS MODAL
import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import { Eye, EyeOff, AlertCircle, UserPlus, X, FileText, Check } from 'lucide-react';
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

  @keyframes termsFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes termsSlideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
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
    user-select: none;
  }

  .signup-terms .terms-link {
    color: var(--text-link);
    text-decoration: none;
    transition: color var(--transition);
    cursor: pointer;
  }

  .signup-terms .terms-link:hover {
    color: #79B8FF;
    text-decoration: underline;
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

  /* ============================================================
     TERMS MODAL STYLES
     ============================================================ */

  .terms-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(13, 17, 23, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    z-index: 1000;
    animation: termsFadeIn 0.2s ease;
  }

  .terms-modal-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 16px;
    max-width: 680px;
    width: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.02);
    animation: termsSlideUp 0.25s ease;
  }

  .terms-modal-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .terms-modal-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
  }

  .terms-modal-header h3 svg {
    color: var(--accent-green);
    flex-shrink: 0;
  }

  .terms-modal-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--transition), background var(--transition);
  }

  .terms-modal-close:hover {
    color: var(--text-primary);
    background: var(--border-subtle);
  }

  .terms-modal-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.6;
    scrollbar-width: thin;
    scrollbar-color: var(--border-default) var(--bg-surface);
  }

  .terms-modal-body::-webkit-scrollbar {
    width: 6px;
  }

  .terms-modal-body::-webkit-scrollbar-track {
    background: var(--bg-surface);
  }

  .terms-modal-body::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: 8px;
  }

  .terms-modal-body h4 {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 600;
    margin: 20px 0 8px;
    letter-spacing: -0.01em;
  }

  .terms-modal-body h4:first-of-type {
    margin-top: 0;
  }

  .terms-modal-body p {
    margin-bottom: 12px;
  }

  .terms-modal-body ul {
    margin: 8px 0 16px 20px;
  }

  .terms-modal-body li {
    margin-bottom: 6px;
  }

  .terms-modal-body strong {
    color: var(--text-primary);
    font-weight: 500;
  }

  .terms-modal-body a {
    color: var(--text-link);
    text-decoration: none;
  }

  .terms-modal-body a:hover {
    text-decoration: underline;
  }

  .terms-modal-divider {
    height: 1px;
    background: var(--border-subtle);
    margin: 24px 0 16px;
    border: none;
  }

  .terms-modal-footer {
    padding: 16px 24px 20px;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .terms-modal-agree {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
    line-height: 1.4;
    user-select: none;
  }

  .terms-modal-agree input {
    width: 16px;
    height: 16px;
    accent-color: var(--accent-green);
    cursor: pointer;
    flex-shrink: 0;
  }

  .terms-modal-actions {
    display: flex;
    gap: 12px;
  }

  .terms-btn-secondary {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background var(--transition), color var(--transition);
  }

  .terms-btn-secondary:hover {
    background: var(--border-subtle);
    color: var(--text-primary);
  }

  .terms-btn-primary {
    background: var(--accent-green);
    color: #0D1117;
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background var(--transition);
    white-space: nowrap;
  }

  .terms-btn-primary:hover:not(:disabled) {
    background: var(--accent-green-dark);
  }

  .terms-btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

    .terms-modal-overlay {
      padding: 16px;
    }

    .terms-modal-card {
      max-height: 92vh;
      border-radius: 12px;
    }

    .terms-modal-header {
      padding: 16px 18px 12px;
    }

    .terms-modal-body {
      padding: 18px;
      font-size: 13px;
    }

    .terms-modal-footer {
      padding: 14px 18px 18px;
      flex-direction: column-reverse;
      align-items: stretch;
    }

    .terms-modal-agree {
      justify-content: center;
    }

    .terms-modal-actions {
      flex-direction: column-reverse;
    }

    .terms-btn-primary,
    .terms-btn-secondary {
      width: 100%;
      justify-content: center;
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
// TERMS MODAL COMPONENT
// ============================================================

const TermsModal = ({ isOpen, onClose, onAccept }) => {
  const [agreed, setAgreed] = useState(false);
  const modalBodyRef = useRef(null);

  // Reset checkbox + scroll to top when opening
  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAccept = () => {
    if (!agreed) return;
    onAccept();
  };

  return (
    <div
      className="terms-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      <div className="terms-modal-card">
        {/* Header */}
        <div className="terms-modal-header">
          <h3 id="terms-modal-title">
            <FileText size={20} />
            Terms of Service &amp; Privacy Policy
          </h3>
          <button
            type="button"
            className="terms-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="terms-modal-body" ref={modalBodyRef}>
          <h4>1. Acceptance of Terms</h4>
          <p>
            By creating a Webby account, accessing our platform, or using any of
            our services, you agree to be bound by these Terms of Service and our
            Privacy Policy. If you do not agree to these terms, you must not use
            our services.
          </p>

          <h4>2. Description of Service</h4>
          <p>
            Webby provides enterprise web intelligence tools, analytics, and
            related services. We reserve the right to modify, suspend, or
            discontinue any part of the service at any time without prior notice.
          </p>

          <h4>3. Account Responsibilities</h4>
          <ul>
            <li>You must provide accurate and complete registration information.</li>
            <li>
              You are responsible for maintaining the confidentiality of your
              account credentials.
            </li>
            <li>
              You agree to notify us immediately of any unauthorized use of your
              account.
            </li>
            <li>
              You may not use the service for any illegal or unauthorized purpose.
            </li>
          </ul>

          <h4>4. Data Collection &amp; Privacy</h4>
          <p>
            We collect information you provide directly, such as your name, email
            address, and usage data. This information is used to operate,
            maintain, and improve our services, and to communicate with you.
          </p>
          <p>
            <strong>We do not sell your personal data.</strong> We may share
            anonymized, aggregated data for analytics and business purposes. For
            full details, please review our full Privacy Policy.
          </p>

          <h4>5. Cookies &amp; Tracking</h4>
          <p>
            Webby uses cookies and similar tracking technologies to enhance your
            experience, analyze trends, and administer the platform. You can
            control cookie preferences through your browser settings.
          </p>

          <h4>6. Intellectual Property</h4>
          <p>
            All content, trademarks, logos, and software associated with Webby are
            the property of Webby or its licensors. You may not reproduce,
            distribute, or create derivative works without express written
            permission.
          </p>

          <h4>7. Limitation of Liability</h4>
          <p>
            To the maximum extent permitted by law, Webby shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages
            arising out of or relating to your use of the service.
          </p>

          <h4>8. Termination</h4>
          <p>
            We reserve the right to suspend or terminate your account at our sole
            discretion, without notice, for conduct that we believe violates these
            terms or is harmful to other users, us, or third parties.
          </p>

          <h4>9. Changes to Terms</h4>
          <p>
            We may update these terms from time to time. We will notify you of any
            material changes by posting the new terms on this page or via email.
            Your continued use of the service after changes constitutes
            acceptance.
          </p>

          <hr className="terms-modal-divider" />

          <h4>Privacy Policy Summary</h4>
          <p>
            <strong>What we collect:</strong> Name, email, usage data, and
            technical information (IP address, browser type).
            <br />
            <strong>How we use it:</strong> To provide and improve the service,
            communicate with you, and ensure security.
            <br />
            <strong>Your rights:</strong> You may request access, correction, or
            deletion of your personal data at any time by contacting
            privacy@webby.com.
            <br />
            <strong>Data retention:</strong> We retain your data as long as your
            account is active or as needed to comply with legal obligations.
          </p>
          <p>
            For the complete Privacy Policy, please visit{' '}
            <a href="/privacy" onClick={(e) => e.preventDefault()}>
              webby.com/privacy
            </a>
            .
          </p>
        </div>

        {/* Footer */}
        <div className="terms-modal-footer">
          <label className="terms-modal-agree">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            I have read and agree to the Terms of Service and Privacy Policy
          </label>

          <div className="terms-modal-actions">
            <button
              type="button"
              className="terms-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="terms-btn-primary"
              disabled={!agreed}
              onClick={handleAccept}
            >
              Accept &amp; Continue
              <Check size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const Register = () => {
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
  const [showTermsModal, setShowTermsModal] = useState(false);
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
      const data = await authService.signup({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      if (data?.access_token) {
        // Do NOT auto-login. Do NOT save token. Do NOT set axios header.
        // Send the user to the login page with a success hint + prefilled email.
        navigate('/login', {
          replace: true,
          state: {
            justRegistered: true,
            email: formData.email,
          },
        });
        return;
      }

      // Fallback if backend didn't return a token for some reason
      navigate('/login', {
        replace: true,
        state: { justRegistered: true, email: formData.email },
      });
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
              readOnly
              onClick={() => setShowTermsModal(true)}
            />
            <label htmlFor="terms" onClick={() => setShowTermsModal(true)}>
              I agree to Webby's{' '}
              <span
                className="terms-link"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTermsModal(true);
                }}
              >
                Terms of Service
              </span>
              {' '}and{' '}
              <span
                className="terms-link"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTermsModal(true);
                }}
              >
                Privacy Policy
              </span>
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

      {/* Terms & Privacy Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setAgreed(true);
          setShowTermsModal(false);
          setValidationErrors(prev => ({ ...prev, terms: '' }));
        }}
      />
    </div>
  );
};

export default Register;