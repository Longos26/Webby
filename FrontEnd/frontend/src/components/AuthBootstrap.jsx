// frontend/src/components/AuthBootstrap.jsx
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { signInSuccess, signInFailure, authCheckComplete } from '../redux/user/userSlice';
import api from '../api';

const AuthBootstrap = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
      dispatch(authCheckComplete());
      return;
    }

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Optimistically hydrate from localStorage so UI isn't blank
    let cachedUser = null;
    try {
      cachedUser = userStr ? JSON.parse(userStr) : null;
    } catch {
      cachedUser = null;
    }
    if (cachedUser) {
      dispatch(signInSuccess({ user: cachedUser, token }));
    }

    // Then verify + refresh with the server (gets role, active status, etc.)
    (async () => {
      try {
        const { data } = await api.get('/api/auth/me');
        const freshUser = data.user ?? data;

        // Merge so we never lose fields the /me endpoint omits (like role)
        const mergedUser = { ...(cachedUser || {}), ...freshUser };

        dispatch(signInSuccess({ user: mergedUser, token }));
        localStorage.setItem('user', JSON.stringify(mergedUser));
      } catch (err) {
        const status = err?.response?.status;

        // Only wipe auth on a real auth failure. Transient network/5xx errors
        // should NOT log the user out or downgrade their role.
        if (status === 401 || status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
          dispatch(signInFailure(null));
        } else {
          // Keep cached user (with role) so admin stays admin
          dispatch(authCheckComplete());
        }
      }
    })();
  }, [dispatch]);

  return children;
};

export default AuthBootstrap;