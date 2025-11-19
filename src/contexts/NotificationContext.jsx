import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import toast from 'react-hot-toast';
import soundManager from '../utils/soundUtils';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();
  const previousNotificationsRef = useRef([]);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      previousNotificationsRef.current = [];
      return;
    }

    previousNotificationsRef.current = [];
    notificationService.cleanupUserNotifications(currentUser.uid);

    const unsubscribe = notificationService.subscribeToNotifications(
      currentUser.uid,
      (newNotifications) => {
        const previousNotifications = previousNotificationsRef.current;
        const previousIds = new Set(previousNotifications.map(n => n.id));
        
        const newNotificationsList = newNotifications.filter(n => !previousIds.has(n.id));
        
        setNotifications(newNotifications);
        const unread = newNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        
        const newNotificationsCount = newNotificationsList.filter(n => {
          if (n.read) return false;
          if (!n.createdAt) return false;
          
          const createdAt = n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt);
          const timeDiff = new Date().getTime() - createdAt.getTime();
          return timeDiff < 5000;
        }).length;
        
        if (newNotificationsCount > 0) {
          soundManager.playMove();
          toast.success(`${newNotificationsCount} new notification${newNotificationsCount > 1 ? 's' : ''} received!`);
        }
        
        previousNotificationsRef.current = newNotifications;
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      await notificationService.markAllNotificationsAsRead(currentUser.uid);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  }, [currentUser]);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, []);

  const cleanupOldNotifications = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      await notificationService.cleanupUserNotifications(currentUser.uid);
      toast.success('Old notifications cleaned up');
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      toast.error('Failed to clean up notifications');
    }
  }, [currentUser]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    cleanupOldNotifications
  }), [notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, cleanupOldNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 