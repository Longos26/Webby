import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X, Trash2, Info, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import api from '../api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

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
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: '#161B22',
          border: '1px solid #30363D',
          borderRadius: '8px',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          color: '#8B949E',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#00ED64';
          e.currentTarget.style.color = '#00ED64';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#30363D';
          e.currentTarget.style.color = '#8B949E';
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#F85149',
              color: 'white',
              fontSize: 10,
              fontWeight: 600,
              borderRadius: '20px',
              minWidth: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              fontFamily: "'Inter', monospace",
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 400,
            maxWidth: 'calc(100vw - 32px)',
            background: '#161B22',
            border: '1px solid #30363D',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid #30363D',
              background: '#0D1117',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#F0F6FC' }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'transparent',
                  border: 'none',
                  color: '#8B949E',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#21262D';
                  e.currentTarget.style.color = '#00ED64';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#8B949E';
                }}
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8B949E', fontSize: 13 }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8B949E', fontSize: 13 }}>
                No notifications
              </div>
            ) : (
              notifications.map((notif) => {
                const iconColor = getTypeColor(notif.type);
                return (
                  <div
                    key={notif.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid #21262D',
                      background: notif.read ? '#161B22' : '#0D1117',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1C2128';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notif.read ? '#161B22' : '#0D1117';
                    }}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {/* Icon container */}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '8px',
                          background: `${iconColor}12`,
                          border: `1px solid ${iconColor}28`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: iconColor,
                        }}
                      >
                        {getTypeIcon(notif.type)}
                      </div>
                      
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F6FC', marginBottom: 2 }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.4, marginBottom: 6 }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: 11, color: '#6E7681' }}>
                          {getTimeAgo(notif.created_at)}
                        </div>
                      </div>
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#6E7681',
                          cursor: 'pointer',
                          padding: 4,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#21262D';
                          e.currentTarget.style.color = '#F85149';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6E7681';
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 20px',
              borderTop: '1px solid #30363D',
              fontSize: 11,
              color: '#6E7681',
              textAlign: 'center',
              background: '#0D1117',
              fontWeight: 400,
            }}
          >
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}