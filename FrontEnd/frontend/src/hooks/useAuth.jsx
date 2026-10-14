// frontend/src/hooks/useAuth.js
import { useSelector } from 'react-redux';

export function useAuth() {
  const { currentUser, token, authChecked } = useSelector((s) => s.user);

  const isAuthenticated = !!token && !!currentUser;
  const role = currentUser?.role || (isAuthenticated ? 'user' : 'guest');

  return {
    user: currentUser,
    token,
    authChecked,
    isAuthenticated,
    isGuest: !isAuthenticated,
    isUser: role === 'user',
    isAdmin: role === 'admin',
    role,
  };
}