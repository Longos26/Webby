import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoutes = ({ children }) => {
  const { currentUser, token } = useSelector((state) => state.user);
  
  // Check both user and token
  if (!currentUser || !token) {
    return <Navigate to="/signin" replace />;
  }
  
  return children;
};

export default ProtectedRoutes;
