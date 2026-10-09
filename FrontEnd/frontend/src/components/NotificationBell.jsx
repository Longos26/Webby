import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X, Trash2, Info, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import api from '../api';

// ============================================================
// STYLES - inject once
// ============================================================
const STYLES = `
  .notif-root {
    --color-mdb-green: #00ED64;
    --color-mdb-green-dark: #00C355;
    --color-canvas: #0D1117;
    --color-surface: #161B22;
    --color-surface-elevated: #1C2128;
    --color-border: #30363D;
    --color-border-subtle: #21262D;
    --color-text-primary: #F0F6FC;
    --color-text-secondary: #9BA4B0;
    --color-text-muted: #6E7681;
    --color-error: #F85149;
    --color-success: #00ED64;
    --color-warning: #D29922;
    --color-info: #58A6FF;
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.35);
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 9999px;
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .notif-trigger {
    position: relative;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background var(--transition), border-color var(--transition), color var(--transition);
    color: var(--color-text-secondary);
    font-family: inherit;
  }

  .notif-trigger:hover {
    background: var(--color-surface-elevated);
    border-color: #484F58;
    color: var(--color-text-primary);
  }

  .notif-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--color-error);
    color: white;
    font-size: 10px;
    font-weight: 600;
    border-radius: var(--radius-full);
    min-width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    font-family: var(--font-sans);
    border: 2px solid var(--color-canvas);
  }

  .notif-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 400px;
    max-width: calc(100vw - 32px);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    overflow: hidden;
  }

  .notif-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  .notif-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .notif-mark-all {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: background var(--transition), color var(--transition);
  }

  .notif-mark-all:hover {
    background: var(--color-surface-elevated);
    color: var(--color-text-primary);
  }

  .notif-list {
    max-height: 420px;
    overflow-y: auto;
  }

  .notif-item {
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border-subtle);
    transition: background var(--transition);
    cursor: pointer;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .notif-item:last-child {
    border-bottom: none;
  }

  .notif-item:hover {
    background: var(--color-surface-elevated);
  }

  .notif-item.read {
    background: var(--color-surface);
  }

  .notif-item.unread {
    background: var(--color-canvas);
  }

  .notif-icon-wrap {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .notif-content {
    flex: 1;
    min-width: 0;
  }

  .notif-item-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 2px;
  }

  .notif-item-message {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin-bottom: 6px;
    word-break: break-word;
  }

  .notif-item-time {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .notif-delete {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition), color var(--transition);
    flex-shrink: 0;
  }

  .notif-delete:hover {
    background: var(--color-surface);
    color: var(--color-error);
  }

  .notif-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--color-text-muted);
    font-size: 13px;
  }

  .notif-footer {
    padding: 10px 20px;
    border-top: 1px solid var(--color-border);
    font-size: 11px;
    color: var(--color-text-muted);
    text-align: center;
    background: var(--color-surface);
  }

  @media (max-width: 480px) {
    .notif-dropdown {
      width: calc(100vw - 24px);
      right: -8px;
    }
  }
`;

function injectNotifStyles() {
  if (typeof document !== 'undefined' && !document.getElementById('notif-styles')) {
    const style = document.createElement('style');
    style.id = 'notif-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  injectNotifStyles();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.notifications.getNotifications(50, 0);
      const notificationsList = data.notifications || data || [];
      setNotifications(notificationsList);
      setUnreadCount(data.unread_count || notificationsList.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.notifications.deleteNotification(id);
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={14} />;
      case 'error': return <AlertCircle size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      default: return <Info size={14} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return '#00ED64';
      case 'error': return '#F85149';
      case 'warning': return '#D29922';
      default: return '#58A6FF';
    }
  };

  return (
    <div className="notif-root" style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        className="notif-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          {/* Header */}
          <div className="notif-header">
            <span className="notif-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllAsRead}>
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif-list">
            {loading && notifications.length === 0 ? (
              <div className="notif-empty">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">No notifications</div>
            ) : (
              notifications.map((notif) => {
                const iconColor = getTypeColor(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={`notif-item ${notif.read ? 'read' : 'unread'}`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    {/* Icon */}
                    <div
                      className="notif-icon-wrap"
                      style={{
                        background: `${iconColor}15`,
                        border: `1px solid ${iconColor}30`,
                        color: iconColor,
                      }}
                    >
                      {getTypeIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="notif-content">
                      <div className="notif-item-title">{notif.title}</div>
                      <div className="notif-item-message">{notif.message}</div>
                      <div className="notif-item-time">{getTimeAgo(notif.created_at)}</div>
                    </div>

                    {/* Delete */}
                    <button
                      className="notif-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      aria-label="Delete notification"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="notif-footer">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}