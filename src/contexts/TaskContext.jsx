import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

const TaskContext = createContext();

export const useTask = () => {
  return useContext(TaskContext);
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const { currentUser } = useAuth();

  // Fetch projects and their tasks
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) return;

      try {
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

        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProjects(projectsData);

        // Fetch tasks for each project
        const tasksPromises = projectsData.map(async project => {
          const tasksRef = collection(db, `projects/${project.id}/tasks`);
          const tasksSnapshot = await getDocs(tasksRef);
          return tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            projectId: project.id,
            ...doc.data()
          }));
        });

        const allTasks = (await Promise.all(tasksPromises)).flat();
        setTasks(allTasks);
      } catch (error) {
        console.error('Error fetching projects and tasks:', error);
      }
    };

    fetchProjects();
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
      
      setProjects(prev => [...prev, { id: docRef.id, ...projectData, managerId: currentUser.uid, createdAt: new Date().toISOString() }]);
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
      
      setProjects(prev =>
        prev.map(project =>
          project.id === projectId
            ? { ...project, ...projectData }
            : project
        )
      );
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);
      
      setProjects(prev => prev.filter(project => project.id !== projectId));
      setTasks(prev => prev.filter(task => task.projectId !== projectId));
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
      
      const newTask = { 
        id: docRef.id, 
        projectId, 
        ...taskData,
        createdAt: new Date().toISOString()
      };
      
      setTasks(prev => [...prev, newTask]);
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
      
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? { ...task, ...taskData }
            : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (projectId, taskId) => {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await deleteDoc(taskRef);
      
      setTasks(prev => prev.filter(task => task.id !== taskId));
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