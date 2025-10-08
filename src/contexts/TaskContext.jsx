import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { firebaseUtils, queryBuilders } from '../utils/firebaseUtils';
import { notificationService } from '../services/notificationService';

const TaskContext = createContext();

export const useTask = () => {
  return useContext(TaskContext);
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setTasks([]);
      return;
    }

    const unsubscribeProjects = firebaseUtils.subscribeToCollection('projects', (projectsData) => {
      let filteredProjects = projectsData;
      if (currentUser.role !== 'super_manager') {
        filteredProjects = projectsData.filter(project => {
          if (project.managerId === currentUser.uid) {
            return true;
          }
          
          if (project.teamMembers && Array.isArray(project.teamMembers)) {
            return project.teamMembers.some(memberId => 
              memberId === currentUser.uid || memberId === currentUser.email
            );
          }
          
          return false;
        });
      }
      
      setProjects(filteredProjects);

      const taskUnsubscribers = filteredProjects.map(project => {
        return firebaseUtils.subscribeToCollection(`projects/${project.id}/tasks`, (projectTasks) => {
          const tasksWithProjectId = projectTasks.map(task => ({
            ...task,
            projectId: project.id
          }));

          setTasks(prevTasks => {
            const otherProjectTasks = prevTasks.filter(task => task.projectId !== project.id);
            return [...otherProjectTasks, ...tasksWithProjectId];
          });
        });
      });

      return () => {
        taskUnsubscribers.forEach(unsubscribe => unsubscribe());
      };
    });

    return () => {
      unsubscribeProjects();
    };
  }, [currentUser]);

  const createProject = async (projectData) => {
    try {
      const projectId = await firebaseUtils.createDocument('projects', {
        ...projectData,
        managerId: currentUser.uid
      });

      if (projectData.teamMembers && projectData.teamMembers.length > 0) {
        try {
          const newProject = { id: projectId, ...projectData, managerId: currentUser.uid, createdAt: new Date().toISOString() };
          await notificationService.createProjectInvitationNotification(
            newProject,
            projectData.teamMembers,
            currentUser
          );
        } catch (notificationError) {
          console.error('Error sending project invitation notifications:', notificationError);
        }
      }

      return projectId;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      await firebaseUtils.updateDocument('projects', projectId, projectData);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await firebaseUtils.deleteDocument('projects', projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const createTask = async (projectId, taskData) => {
    try {
      const taskId = await firebaseUtils.createDocument(`projects/${projectId}/tasks`, taskData);

      if (taskData.assignee && taskData.assignee.length > 0) {
        try {
          const project = await firebaseUtils.getDocument('projects', projectId);
          
          if (project) {
            const assignedUsers = Array.isArray(taskData.assignee) ? taskData.assignee : [taskData.assignee];
            const validAssignedUsers = assignedUsers.filter(userId => userId && userId.trim() !== '');
            
            if (validAssignedUsers.length > 0) {
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
            }
          }
        } catch (notificationError) {
          console.error('Error sending assignment notifications:', notificationError);
        }
      }

      return taskId;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (projectId, taskId, taskData) => {
    try {
      await firebaseUtils.updateDocument(`projects/${projectId}/tasks`, taskId, taskData);

      if (taskData.assignee && taskData.assignee.length > 0) {
        try {
          const project = await firebaseUtils.getDocument('projects', projectId);
          
          if (project) {
            const assignedUsers = Array.isArray(taskData.assignee) ? taskData.assignee : [taskData.assignee];
            const validAssignedUsers = assignedUsers.filter(userId => userId && userId.trim() !== '');
            
            if (validAssignedUsers.length > 0) {
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
      await firebaseUtils.deleteDocument(`projects/${projectId}/tasks`, taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const accessibleTasks = useMemo(() => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'super_manager') {
      return tasks;
    }

    return tasks.filter(task => {
      const project = projects.find(p => p.id === task.projectId);
      if (!project) return false;

      if (project.managerId === currentUser.uid) {
        return true;
      }
      
      if (project.teamMembers && Array.isArray(project.teamMembers)) {
        return project.teamMembers.some(memberId => 
          memberId === currentUser.uid || memberId === currentUser.email
        );
      }
      
      return false;
    });
  }, [tasks, projects, currentUser]);

  const value = useMemo(() => ({
    tasks: accessibleTasks,
    projects,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask
  }), [accessibleTasks, projects]);

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}; 