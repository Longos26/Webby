// frontend/src/components/ProtectedRoutes.jsx
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader } from 'lucide-react';

const ProtectedRoutes = ({ children, adminOnly = false }) => {
  const { currentUser, token, authChecked } = useSelector((s) => s.user);
  const location = useLocation();

  if (!authChecked) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0D1117', color: '#00ED64', gap: 12,
      }}>
        <Loader className="spin" />
        <span>Verifying session…</span>
      </div>
    );
  }

  if (!token || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoutes;