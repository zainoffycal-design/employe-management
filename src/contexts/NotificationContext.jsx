import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    notificationService.cleanupUserNotifications(currentUser.uid);

    const unsubscribe = notificationService.subscribeToNotifications(
      currentUser.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        const unread = newNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        
        const newNotificationsCount = newNotifications.filter(n => {
          const isNew = !n.read && n.createdAt && 
            new Date().getTime() - n.createdAt.toDate().getTime() < 5000;
          return isNew;
        }).length;
        
        if (newNotificationsCount > 0) {
          toast.success(`${newNotificationsCount} new notification${newNotificationsCount > 1 ? 's' : ''} received!`);
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      await notificationService.markAllNotificationsAsRead(currentUser.uid);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const cleanupOldNotifications = async () => {
    if (!currentUser) return;
    
    try {
      await notificationService.cleanupUserNotifications(currentUser.uid);
      toast.success('Old notifications cleaned up');
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      toast.error('Failed to clean up notifications');
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    cleanupOldNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 