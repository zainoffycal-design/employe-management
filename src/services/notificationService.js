import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export const notificationService = {
  async createTaskAssignmentNotification(taskData, assignedUsers, projectData, assignedBy) {
    try {
      const batch = writeBatch(db);
      const notificationsRef = collection(db, 'notifications');
      
      assignedUsers.forEach((userId) => {
        const notificationRef = doc(notificationsRef);
        const notificationData = {
          userId,
          type: 'task_assignment',
          title: 'New Task Assigned',
          message: `You have been assigned to "${taskData.title}" in project "${projectData.name}"`,
          taskId: taskData.id,
          projectId: projectData.id,
          projectName: projectData.name,
          taskTitle: taskData.title,
          priority: taskData.priority,
          deadline: taskData.deadline,
          assignedBy: assignedBy.uid,
          assignedByName: assignedBy.name,
          read: false,
          createdAt: serverTimestamp(),
          actionUrl: `/project/${projectData.id}/board`
        };
        
        batch.set(notificationRef, notificationData);
      });

      await batch.commit();
      
      return true;
    } catch (error) {
      console.error('Error creating task assignment notifications:', error);
      throw error;
    }
  },

  async createManagerNotification(taskData, projectData, assignedBy, assignedUsers) {
    try {
      const notificationsRef = collection(db, 'notifications');
      
      const managerNotificationData = {
        userId: projectData.managerId,
        type: 'task_assignment_manager',
        title: 'Task Assignment Summary',
        message: `${assignedBy.name} assigned "${taskData.title}" to ${assignedUsers.length} team member(s)`,
        taskId: taskData.id,
        projectId: projectData.id,
        projectName: projectData.name,
        taskTitle: taskData.title,
        priority: taskData.priority,
        deadline: taskData.deadline,
        assignedBy: assignedBy.uid,
        assignedByName: assignedBy.name,
        assignedUsers: assignedUsers,
        read: false,
        createdAt: serverTimestamp(),
        actionUrl: `/project/${projectData.id}/board`
      };

      await addDoc(notificationsRef, managerNotificationData);
      
      return true;
    } catch (error) {
      console.error('Error creating manager notification:', error);
      throw error;
    }
  },

  async createSuperManagerNotification(taskData, projectData, assignedBy, assignedUsers) {
    try {
      const notificationsRef = collection(db, 'notifications');
      
      const usersRef = collection(db, 'users');
      const superManagersQuery = query(usersRef, where('role', '==', 'super_manager'));
      const superManagersSnapshot = await getDocs(superManagersQuery);
      
      const superManagerNotifications = superManagersSnapshot.docs.map(doc => {
        const superManagerData = doc.data();
        return {
          userId: doc.id,
          type: 'task_assignment_super_manager',
          title: 'High Priority Task Assignment',
          message: `Task "${taskData.title}" with ${taskData.priority} priority assigned in project "${projectData.name}"`,
          taskId: taskData.id,
          projectId: projectData.id,
          projectName: projectData.name,
          taskTitle: taskData.title,
          priority: taskData.priority,
          deadline: taskData.deadline,
          assignedBy: assignedBy.uid,
          assignedByName: assignedBy.name,
          assignedUsers: assignedUsers,
          read: false,
          createdAt: serverTimestamp(),
          actionUrl: `/project/${projectData.id}/board`
        };
      });

      const notificationPromises = superManagerNotifications.map(notificationData =>
        addDoc(notificationsRef, notificationData)
      );

      await Promise.all(notificationPromises);
      
      return true;
    } catch (error) {
      console.error('Error creating super manager notification:', error);
      throw error;
    }
  },

  async getUserNotifications(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      notifications.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return bTime - aTime;
      });
      
      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  },

  async markNotificationAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllNotificationsAsRead(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return;
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnapshot => {
        batch.update(docSnapshot.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  async cleanupOldNotifications(notificationsToDelete) {
    try {
      if (notificationsToDelete.length === 0) return;
      
      const batch = writeBatch(db);
      notificationsToDelete.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.delete(notificationRef);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  },

  subscribeToNotifications(userId, callback) {
    const notificationsRef = collection(db, 'notifications');
    
    const q = query(
      notificationsRef,
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, async (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      notifications.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return bTime - aTime;
      });
      
      if (notifications.length > 25) {
        const notificationsToDelete = notifications.slice(25);
        await this.cleanupOldNotifications(notificationsToDelete);
      }
      
      callback(notifications);
    }, (error) => {
      console.error('Error in notification subscription:', error);
    });
  },

  async createProjectInvitationNotification(projectData, invitedUsers, createdBy) {
    try {
      const notificationsRef = collection(db, 'notifications');
      
      const notificationPromises = invitedUsers.map(async (userId) => {
        const notificationData = {
          userId,
          type: 'project_invitation',
          title: 'Project Invitation',
          message: `You have been invited to join project "${projectData.name}" by ${createdBy.name}`,
          projectId: projectData.id,
          projectName: projectData.name,
          invitedBy: createdBy.uid,
          invitedByName: createdBy.name,
          read: false,
          createdAt: serverTimestamp(),
          actionUrl: `/project/${projectData.id}/board`
        };

        return addDoc(notificationsRef, notificationData);
      });

      await Promise.all(notificationPromises);
      
      return true;
    } catch (error) {
      console.error('Error creating project invitation notifications:', error);
      throw error;
    }
  },

  async createTaskCompletionNotification(taskData, projectData, completedBy, oldStatus, newStatus) {
    try {
      const notificationsRef = collection(db, 'notifications');
      
      const usersToNotify = new Set();
      
      if (projectData.managerId && projectData.managerId !== completedBy.uid) {
        usersToNotify.add(projectData.managerId);
      }
      
      if (taskData.priority === 'high') {
        const usersRef = collection(db, 'users');
        const superManagersQuery = query(usersRef, where('role', '==', 'super_manager'));
        const superManagersSnapshot = await getDocs(superManagersQuery);
        
        superManagersSnapshot.docs.forEach(doc => {
          if (doc.id !== completedBy.uid && doc.id !== projectData.managerId) {
            usersToNotify.add(doc.id);
          }
        });
      }
      
      const notificationPromises = Array.from(usersToNotify).map(userId => {
        const notificationData = {
          userId,
          type: 'task_completion',
          title: 'Task Completed',
          message: `${completedBy.name} completed task "${taskData.title}" in project "${projectData.name}"`,
          taskId: taskData.id,
          projectId: projectData.id,
          projectName: projectData.name,
          taskTitle: taskData.title,
          priority: taskData.priority,
          completedBy: completedBy.uid,
          completedByName: completedBy.name,
          read: false,
          createdAt: serverTimestamp(),
          actionUrl: `/project/${projectData.id}/board`
        };
        
        return addDoc(notificationsRef, notificationData);
      });

      await Promise.all(notificationPromises);
      
      return true;
    } catch (error) {
      console.error('Error creating task completion notifications:', error);
      throw error;
    }
  },

  async testNotificationCreation(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const testNotification = {
        userId,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification',
        read: false,
        createdAt: serverTimestamp(),
        actionUrl: '/'
      };

      const docRef = await addDoc(notificationsRef, testNotification);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating test notification:', error);
      throw error;
    }
  },

  async cleanupUserNotifications(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      notifications.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return bTime - aTime;
      });
      
      if (notifications.length > 25) {
        const notificationsToDelete = notifications.slice(25);
        await this.cleanupOldNotifications(notificationsToDelete);
      }
      
      return true;
    } catch (error) {
      console.error('Error cleaning up user notifications:', error);
      throw error;
    }
  },

  async createNotification(notificationData) {
    try {
      const notificationsRef = collection(db, 'notifications');
      
      const notification = {
        userId: notificationData.userId,
        type: notificationData.type || 'general',
        title: notificationData.title,
        message: notificationData.message,
        read: false,
        createdAt: serverTimestamp(),
        actionUrl: notificationData.actionUrl || '/',
        ...notificationData.data
      };

      const docRef = await addDoc(notificationsRef, notification);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async createCommentMentionNotification(mentionedUsers, commentData, taskData, projectData, mentionedBy) {
    try {
      const batch = writeBatch(db);
      const notificationsRef = collection(db, 'notifications');
      
      mentionedUsers.forEach((userId) => {
        if (userId === mentionedBy.uid) return;
        
        const notificationRef = doc(notificationsRef);
        const notificationData = {
          userId,
          type: 'comment_mention',
          title: 'You were mentioned in a comment',
          message: `${mentionedBy.name} mentioned you in a comment on task "${taskData.title}"`,
          taskId: taskData.id,
          projectId: projectData.id,
          projectName: projectData.name,
          taskTitle: taskData.title,
          commentId: commentData.id,
          mentionedBy: mentionedBy.uid,
          mentionedByName: mentionedBy.name,
          read: false,
          createdAt: serverTimestamp(),
          actionUrl: `/project/${projectData.id}/board`
        };
        
        batch.set(notificationRef, notificationData);
      });

      await batch.commit();
      
      return true;
    } catch (error) {
      console.error('Error creating comment mention notifications:', error);
      throw error;
    }
  }
}; 