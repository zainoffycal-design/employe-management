import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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

  const register = useCallback(async (userData) => {
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
  }, []);

  const login = useCallback(async (email, password) => {
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
  }, []);

  const logout = useCallback(async () => {
    await firebaseUtils.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const hasPermission = useCallback((permission) => {
    return permissionUtils.hasPermission(currentUser, permission);
  }, [currentUser]);
  
  const canEditTasks = useCallback(() => hasPermission(PERMISSIONS.EDIT_TASKS), [hasPermission]);
  const canDeleteTasks = useCallback(() => hasPermission(PERMISSIONS.DELETE_TASKS), [hasPermission]);
  const canMoveTasks = useCallback(() => hasPermission(PERMISSIONS.MOVE_TASKS), [hasPermission]);
  const canManageTasks = useCallback(() => hasPermission(PERMISSIONS.MANAGE_TASKS), [hasPermission]);
  const canManageEmployees = useCallback(() => permissionUtils.canManageEmployees(currentUser), [currentUser]);
  const canManageUsers = useCallback(() => permissionUtils.canManageUsers(currentUser), [currentUser]);
  const canViewAnalytics = useCallback(() => hasPermission(PERMISSIONS.VIEW_ANALYTICS), [hasPermission]);
  const canAssignTasks = useCallback(() => hasPermission(PERMISSIONS.ASSIGN_TASKS), [hasPermission]);
  const canViewOwnTasks = useCallback(() => hasPermission(PERMISSIONS.VIEW_OWN_TASKS), [hasPermission]);
  const canViewAllTasks = useCallback(() => permissionUtils.canViewAllTasks(currentUser), [currentUser]);

  const value = useMemo(() => ({
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
  }), [isAuthenticated, currentUser, loading, isFormSubmitting, login, logout, register, hasPermission, canEditTasks, canDeleteTasks, canMoveTasks, canManageTasks, canManageEmployees, canManageUsers, canViewAnalytics, canAssignTasks, canViewOwnTasks, canViewAllTasks]);

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