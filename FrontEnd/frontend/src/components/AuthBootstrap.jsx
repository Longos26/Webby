// frontend/src/components/AuthBootstrap.jsx
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { signInSuccess, signInFailure } from '../redux/user/userSlice';
import api from '../api';

const AuthBootstrap = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
      dispatch(signInFailure(null));
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
        dispatch(signInSuccess({ user: freshUser, token }));
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        dispatch(signInFailure(null));
      }
    })();
  }, [dispatch]);

  return children;
};

export default AuthBootstrap;