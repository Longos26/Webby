// src/components/ExportGateModal.jsx
import { Link } from 'react-router-dom';
import { Lock, X, UserPlus, LogIn, ArrowRight } from 'lucide-react';

const ExportGateModal = ({ open, onClose, onContinueExploring }) => {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(13, 17, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#161B22',
        border: '1px solid #30363D',
        borderRadius: 16,
        maxWidth: 480, width: '100%',
        padding: 32, position: 'relative',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', color: '#6E7681',
            cursor: 'pointer', padding: 4,
          }}
        >
          <X size={20} />
        </button>

        <div style={{
          width: 56, height: 56, borderRadius: 12,
          background: 'rgba(0, 237, 100, 0.1)',
          border: '1px solid rgba(0, 237, 100, 0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#00ED64', marginBottom: 20,
        }}>
          <Lock size={26} />
        </div>

        <h2 style={{
          fontSize: 22, fontWeight: 600, color: '#F0F6FC',
          margin: '0 0 12px', letterSpacing: '-0.01em',
        }}>
          Unlock Your Dataset
        </h2>

        <p style={{ fontSize: 15, color: '#9BA4B0', lineHeight: 1.6, marginBottom: 28 }}>
          Your scraping and AI parsing results are ready! Create a free Webby
          account or log in to export your structured dataset.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            to="/register"
            state={{ from: '/playground', preserve: true }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#00ED64', color: '#0D1117',
              border: 'none', borderRadius: 8,
              padding: '12px 16px', fontWeight: 600, fontSize: 14,
              textDecoration: 'none',
            }}
          >
            <UserPlus size={16} /> Create Free Account
          </Link>

          <Link
            to="/login"
            state={{ from: '/playground', preserve: true }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'transparent', color: '#F0F6FC',
              border: '1px solid #30363D', borderRadius: 8,
              padding: '12px 16px', fontWeight: 600, fontSize: 14,
              textDecoration: 'none',
            }}
          >
            <LogIn size={16} /> Log In
          </Link>

          <button
            onClick={onContinueExploring}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'none', color: '#9BA4B0',
              border: 'none', padding: '10px 16px',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            Continue Exploring <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportGateModal;