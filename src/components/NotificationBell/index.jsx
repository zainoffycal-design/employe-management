import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { 
  FiBell, 
  FiCheck, 
  FiX, 
  FiExternalLink, 
  FiFileText, 
  FiUsers, 
  FiZap, 
  FiFolder, 
  FiRefreshCw, 
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.scss';

const NotificationBell = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotification();
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await markAllAsRead();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assignment':
        return <FiFileText size={16} />;
      case 'project_invitation':
        return <FiFolder size={16} />;
      case 'task_completion':
        return <FiCheckCircle size={16} />;
      case 'comment_mention':
        return <FiUsers size={16} />;
      default:
        return <FiBell size={16} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'task_assignment':
        return 'var(--primary-color)';
      case 'project_invitation':
        return 'var(--estimate-color)';
      case 'task_completion':
        return 'var(--primary-dark)';
      case 'comment_mention':
        return 'var(--primary-color)';
      default:
        return 'var(--gray-600)';
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!currentUser) return null;

  return (
    <div className="notification-bell" ref={notificationRef}>
      <button 
        className="notification-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read"
                onClick={handleMarkAllAsRead}
                disabled={loading}
              >
                <FiCheck size={16} />
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <FiBell size={24} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon" style={{ color: getNotificationColor(notification.type) }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                      {!notification.read && <span className="unread-dot" />}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {notification.priority && (
                        <span className="notification-priority">
                          {notification.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="notification-actions">
                    <button
                      className="action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      title="Delete notification"
                    >
                      <FiX size={14} />
                    </button>
                    {notification.actionUrl && (
                      <button
                        className="action-btn external"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(notification.actionUrl, '_blank');
                        }}
                        title="Open in new tab"
                      >
                        <FiExternalLink size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell; 