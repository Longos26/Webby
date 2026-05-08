import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const STYLES = `
  .notification-root {
    --color-brand: hsl(217, 91%, 60%);
    --color-brand-light: hsla(217, 91%, 60%, 0.12);
    --color-success: hsl(142, 76%, 36%);
    --color-error: hsl(0, 84%, 60%);
    --color-canvas: hsl(222, 47%, 5%);
    --color-surface: hsl(224, 35%, 8%);
    --color-surface-2: hsl(226, 30%, 12%);
    --color-text-primary: hsl(210, 20%, 98%);
    --color-text-secondary: hsl(216, 12%, 68%);
    --color-text-muted: hsl(218, 15%, 48%);
    --color-border: hsla(0, 0%, 100%, 0.08);
    --color-border-strong: hsla(0, 0%, 100%, 0.16);
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --radius-full: 9999px;
    --transition-fast: 120ms cubic-bezier(0.16, 1, 0.3, 1);
    --transition-base: 200ms cubic-bezier(0.16, 1, 0.3, 1);
    --font-sans: 'Inter', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(20px); }
  }
  @keyframes ring {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(10deg); }
    75% { transform: rotate(-10deg); }
  }

  .notification-bell-ring {
    animation: ring 0.4s ease-in-out;
  }
  .notification-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    background: #ef4444;
    color: white;
    font-size: 9px;
    font-weight: 700;
    font-family: var(--font-mono);
    min-width: 16px;
    height: 16px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 1.5px solid var(--color-canvas);
  }
  .notification-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 380px;
    max-height: 500px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.38);
    overflow: hidden;
    z-index: 100;
    display: flex;
    flex-direction: column;
  }
  .notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.02);
  gap: 12px;
}
  .notification-header h3 {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .notification-list {
    flex: 1;
    overflow-y: auto;
    max-height: 400px;
  }
  .notification-item {
    padding: 14px 18px;
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    transition: background var(--transition-fast);
    position: relative;
  }
  .notification-item:hover {
    background: rgba(255, 255, 255, 0.04);
  }
  .notification-item.unread {
    background: rgba(59, 130, 246, 0.06);
  }
  .notification-item.unread::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--color-brand);
  }
  .notification-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }
  .notification-message {
    font-size: 11px;
    color: var(--color-text-secondary);
    line-height: 1.4;
    margin-bottom: 6px;
  }
  .notification-time {
    font-size: 10px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }
  .notification-empty {
    padding: 48px 24px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 12px;
  }
  .notification-footer {
    padding: 12px 18px;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.02);
  }
  .notification-header button {
  border: 1px solid transparent;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
  .mark-read-btn {
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}

.mark-read-btn:hover {
  background: rgba(59, 130, 246, 0.12);
  color: var(--color-text-primary);
  border-color: rgba(59, 130, 246, 0.3);
}
  .clear-all-btn {
  background: rgba(239, 68, 68, 0.08);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.18);
}

.clear-all-btn:hover {
  background: rgba(239, 68, 68, 0.16);
  color: #ffffff;
  border-color: rgba(239, 68, 68, 0.35);
}
  @media (max-width: 480px) {
    .notification-dropdown {
      width: calc(100vw - 32px);
      right: -8px;
    }
  }
`;

function getNotificationIcon(type) {
  switch (type?.toLowerCase()) {
    case 'success':
    case 'job_completed':
      return <CheckCircle size={14} style={{ color: '#10b981' }} />;
    case 'error':
    case 'job_failed':
      return <AlertCircle size={14} style={{ color: '#ef4444' }} />;
    default:
      return <Bell size={14} style={{ color: '#3b82f6' }} />;
  }
}

function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      // FIXED: Removed /api prefix
      const response = await api.get('/notifications?limit=50');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      // FIXED: Removed /api prefix
      const response = await api.get('/notifications/unread/count');
      const newCount = response.data.unread_count || 0;
      const previousCount = unreadCount;
      setUnreadCount(newCount);

      if (newCount > previousCount && newCount > 0) {
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
        const bellElement = bellRef.current;
        if (bellElement) {
          bellElement.classList.add('notification-bell-ring');
          ringTimeoutRef.current = setTimeout(() => {
            bellElement.classList.remove('notification-bell-ring');
          }, 400);
        }
        
        // Optional: Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('New Notification', {
            body: `You have ${newCount} unread notification${newCount > 1 ? 's' : ''}`,
            icon: '/favicon.ico'
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [unreadCount]);

  // Request notification permission
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 15 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications();
      }
    }, 15000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    };
  }, [fetchNotifications, fetchUnreadCount, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      // FIXED: Removed /api prefix
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // FIXED: Removed /api prefix
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      // FIXED: Removed /api prefix
      await api.delete('/notifications/clear');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  // Inject styles
  if (typeof document !== 'undefined' && !document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  return (
    <div className="notification-root" style={{ position: 'relative' }}>
      <button
        ref={bellRef}
        className="notification-bell-button"
        onClick={handleBellClick}
        style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          color: 'var(--color-text-secondary)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            className="notification-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="notification-header">
              <h3>Notifications</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {unreadCount > 0 && (
                  <button className="mark-read-btn" onClick={markAllAsRead}>
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button className="clear-all-btn" onClick={clearAll}>
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="notification-list">
              {loading && notifications.length === 0 ? (
                <div className="notification-empty">
                  <div style={{
                    width: 24,
                    height: 24,
                    border: '2px solid var(--color-border)',
                    borderTopColor: 'var(--color-brand)',
                    borderRadius: '50%',
                    margin: '0 auto 12px',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div>No notifications yet</div>
                  <div style={{ fontSize: 10, marginTop: 4 }}>We'll notify you when your jobs complete</div>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`notification-item ${!notif.read ? 'unread' : ''}`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ marginTop: 1 }}>{getNotificationIcon(notif.type)}</div>
                      <div style={{ flex: 1 }}>
                        <div className="notification-title">{notif.title}</div>
                        <div className="notification-message">{notif.message}</div>
                        <div className="notification-time">{formatTimeAgo(notif.created_at)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="notification-footer">
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                {unreadCount} unread · {notifications.length} total
              </span>
              <button
                onClick={fetchNotifications}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 10,
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)'
                }}
              >
                Refresh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;