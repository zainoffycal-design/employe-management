import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { notificationService } from '../services/notificationService';

const TaskContext = createContext();

export const useTask = () => {
  return useContext(TaskContext);
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const { currentUser } = useAuth();

  // Real-time listeners for projects and tasks
  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setTasks([]);
      return;
    }



    // Set up real-time listener for projects
    const projectsRef = collection(db, 'projects');
    let projectsQuery;

    if (currentUser.role === 'super_manager') {
      projectsQuery = query(projectsRef);
    } else if (currentUser.role === 'manager') {
      projectsQuery = query(
        projectsRef,
        where('managerId', '==', currentUser.uid)
      );
    } else {
      // For normal users (designer, developer, bd), only show projects they are members of
      projectsQuery = query(
        projectsRef,
        where('teamMembers', 'array-contains', currentUser.uid)
      );
    }

    const unsubscribeProjects = onSnapshot(projectsQuery, (projectsSnapshot) => {
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setProjects(projectsData);

      // Set up real-time listeners for tasks in each project
      const taskUnsubscribers = projectsData.map(project => {
        const tasksRef = collection(db, `projects/${project.id}/tasks`);
        return onSnapshot(tasksRef, (tasksSnapshot) => {
          const projectTasks = tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            projectId: project.id,
            ...doc.data()
          }));

          setTasks(prevTasks => {
            // Remove old tasks for this project and add new ones
            const otherProjectTasks = prevTasks.filter(task => task.projectId !== project.id);
            return [...otherProjectTasks, ...projectTasks];
          });
        }, (error) => {
          console.error(`Error listening to tasks for project ${project.id}:`, error);
        });
      });

      // Cleanup function for task listeners
      return () => {
        taskUnsubscribers.forEach(unsubscribe => unsubscribe());
      };
    }, (error) => {
      console.error('Error listening to projects:', error);
    });

    // Cleanup function for project listener
    return () => {
      unsubscribeProjects();
    };
  }, [currentUser]);

  // Project management functions
  const createProject = async (projectData) => {
    try {
      const projectsRef = collection(db, 'projects');
      const docRef = await addDoc(projectsRef, {
        ...projectData,
        createdAt: new Date().toISOString(),
        managerId: currentUser.uid
      });
      
      // Don't add to state immediately - let the real-time listener handle it
      // This prevents duplicate projects when the listener fires

      // Send notifications for project invitation
      if (projectData.teamMembers && projectData.teamMembers.length > 0) {
        try {
          const newProject = { id: docRef.id, ...projectData, managerId: currentUser.uid, createdAt: new Date().toISOString() };
          await notificationService.createProjectInvitationNotification(
            newProject,
            projectData.teamMembers,
            currentUser
          );
        } catch (notificationError) {
          console.error('Error sending project invitation notifications:', notificationError);
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, projectData);
      
      // Don't update state immediately - let the real-time listener handle it
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);
      
      // Don't update state immediately - let the real-time listener handle it
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  // Task management functions
  const createTask = async (projectId, taskData) => {
    try {
      const tasksRef = collection(db, `projects/${projectId}/tasks`);
      const docRef = await addDoc(tasksRef, {
        ...taskData,
        createdAt: new Date().toISOString()
      });
      
      // Don't add to state immediately - let the real-time listener handle it
      // This prevents duplicate tasks when the listener fires

      // Send notifications for task assignment to assigned users
      if (taskData.assignee && taskData.assignee.length > 0) {
        try {
          // Get project data directly from Firestore
          const projectRef = doc(db, 'projects', projectId);
          const projectDoc = await getDoc(projectRef);
          
          if (projectDoc.exists()) {
            const project = { id: projectDoc.id, ...projectDoc.data() };
            const assignedUsers = Array.isArray(taskData.assignee) ? taskData.assignee : [taskData.assignee];
            
            // Filter out any invalid user IDs
            const validAssignedUsers = assignedUsers.filter(userId => userId && userId.trim() !== '');
            
            if (validAssignedUsers.length > 0) {
              // Create task data for notification
              const taskForNotification = {
                id: docRef.id,
                projectId,
                ...taskData,
                createdAt: new Date().toISOString()
              };
              
              await notificationService.createTaskAssignmentNotification(
                taskForNotification,
                validAssignedUsers,
                project,
                currentUser
              );
            }
          }
        } catch (notificationError) {
          console.error('Error sending assignment notifications:', notificationError);
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (projectId, taskId, taskData) => {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await updateDoc(taskRef, taskData);
      
      // Don't update state immediately - let the real-time listener handle it

      // Send notifications for task assignment changes
      if (taskData.assignee && taskData.assignee.length > 0) {
        try {
          // Get project data directly from Firestore
          const projectRef = doc(db, 'projects', projectId);
          const projectDoc = await getDoc(projectRef);
          
          if (projectDoc.exists()) {
            const project = { id: projectDoc.id, ...projectDoc.data() };
            const assignedUsers = Array.isArray(taskData.assignee) ? taskData.assignee : [taskData.assignee];
            
            // Filter out any invalid user IDs
            const validAssignedUsers = assignedUsers.filter(userId => userId && userId.trim() !== '');
            
            if (validAssignedUsers.length > 0) {
              // Create task data for notification
              const taskForNotification = {
                id: taskId,
                projectId,
                ...taskData,
                createdAt: new Date().toISOString()
              };
              
              await notificationService.createTaskAssignmentNotification(
                taskForNotification,
                validAssignedUsers,
                project,
                currentUser
              );

              if (project.managerId && project.managerId !== currentUser.uid) {
                await notificationService.createManagerNotification(
                  taskForNotification,
                  project,
                  currentUser,
                  validAssignedUsers
                );
              }

              if (currentUser.role === 'super_manager' || taskData.priority === 'high') {
                await notificationService.createSuperManagerNotification(
                  taskForNotification,
                  project,
                  currentUser,
                  validAssignedUsers
                );
              }
            }
          }
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
        }
      } else {
        console.log('No assignees found in updated task data:', taskData);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (projectId, taskId) => {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await deleteDoc(taskRef);
      
      // Don't update state immediately - let the real-time listener handle it
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  // Filter tasks based on user role and project membership
  const getAccessibleTasks = () => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'super_manager') {
      return tasks;
    }

    return tasks.filter(task => {
      const project = projects.find(p => p.id === task.projectId);
      if (!project) return false;

      return (
        project.managerId === currentUser.uid ||
        project.teamMembers.includes(currentUser.uid)
      );
    });
  };

  const value = {
    tasks: getAccessibleTasks(),
    projects,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}; 