import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseUtils } from '../utils/firebaseUtils';
import { userManagementService } from '../services/firebaseService';
import { permissionUtils, PERMISSIONS } from '../utils/permissionUtils';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = firebaseUtils.onAuthStateChanged(async (user) => {
      if (user) {
        let userData = await firebaseUtils.getDocument('users', user.uid);
        
        if (!userData) {
          userData = await firebaseUtils.getDocument('users', user.email);
        }
        
        if (userData) {
          const userWithUid = { 
            uid: user.uid, 
            email: user.email, 
            ...userData 
          };
          setCurrentUser(userWithUid);
          
          await userManagementService.ensureUserUid(user.uid, user.email);
        } else {
          setCurrentUser({ uid: user.uid, email: user.email });
        }
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const register = async (userData) => {
    try {
      setIsFormSubmitting(true);
      const { email, password, ...profile } = userData;
      
      const user = await firebaseUtils.createUser({ email, password, ...profile });
      
      setCurrentUser({ uid: user.uid, email: user.email, ...profile });
      setIsAuthenticated(true);
      return { success: true, user: { uid: user.uid, email: user.email, ...profile } };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsFormSubmitting(true);
      const user = await firebaseUtils.signIn(email, password);
      
      let userData = await firebaseUtils.getDocument('users', user.uid);
      
      if (!userData) {
        userData = await firebaseUtils.getDocument('users', user.email);
      }
      
      if (userData) {
        const userWithUid = { 
          uid: user.uid, 
          email: user.email, 
          ...userData 
        };
        setCurrentUser(userWithUid);
      } else {
        setCurrentUser({ uid: user.uid, email: user.email });
      }
      setIsAuthenticated(true);
      return { success: true, user: { uid: user.uid, email: user.email, ...userData } };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const logout = async () => {
    await firebaseUtils.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission) => {
    return permissionUtils.hasPermission(currentUser, permission);
  };
  
  const canEditTasks = () => hasPermission(PERMISSIONS.EDIT_TASKS);
  const canDeleteTasks = () => hasPermission(PERMISSIONS.DELETE_TASKS);
  const canMoveTasks = () => hasPermission(PERMISSIONS.MOVE_TASKS);
  const canManageTasks = () => hasPermission(PERMISSIONS.MANAGE_TASKS);
  const canManageEmployees = () => permissionUtils.canManageEmployees(currentUser);
  const canManageUsers = () => permissionUtils.canManageUsers(currentUser);
  const canViewAnalytics = () => hasPermission(PERMISSIONS.VIEW_ANALYTICS);
  const canAssignTasks = () => hasPermission(PERMISSIONS.ASSIGN_TASKS);
  const canViewOwnTasks = () => hasPermission(PERMISSIONS.VIEW_OWN_TASKS);

  const canViewAllTasks = () => {
    return permissionUtils.canViewAllTasks(currentUser);
  };

  const value = {
    isAuthenticated,
    currentUser,
    loading,
    isFormSubmitting,
    login,
    logout,
    register,
    hasPermission,
    canEditTasks,
    canDeleteTasks,
    canMoveTasks,
    canManageTasks,
    canManageEmployees,
    canManageUsers,
    canViewAnalytics,
    canAssignTasks,
    canViewOwnTasks,
    canViewAllTasks
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loading && !isFormSubmitting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <LoadingSpinner size="large" text="Loading..." />
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 