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
          if (userData.isActive === false) {
            setCurrentUser(null);
            setIsAuthenticated(false);
            await firebaseUtils.signOut();
          } else {
            const userWithUid = { 
              uid: user.uid, 
              email: user.email, 
              ...userData 
            };
            setCurrentUser(userWithUid);
            setIsAuthenticated(true);
            await userManagementService.ensureUserUid(user.uid, user.email);
          }
        } else {
          // User exists in Firebase Auth but not in Firestore - sign them out
          setCurrentUser(null);
          setIsAuthenticated(false);
          await firebaseUtils.signOut();
        }
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
        if (userData.isActive === false) {
          await firebaseUtils.signOut();
          setCurrentUser(null);
          setIsAuthenticated(false);
          return { success: false, error: 'Your account has been deactivated. Please contact your administrator.' };
        }
        const userWithUid = { 
          uid: user.uid, 
          email: user.email, 
          ...userData 
        };
        setCurrentUser(userWithUid);
        setIsAuthenticated(true);
        return { success: true, user: userWithUid };
      } else {
        // User exists in Firebase Auth but not in Firestore - sign them out
        await firebaseUtils.signOut();
        setCurrentUser(null);
        setIsAuthenticated(false);
        return { success: false, error: 'User account has been deleted or deactivated.' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsFormSubmitting(false);
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      setIsFormSubmitting(true);
      await firebaseUtils.resetPassword(email);
      return { success: true };
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
  
  const canEditTasks = useCallback(() => permissionUtils.canEditTasks(currentUser), [currentUser]);
  const canDeleteTasks = useCallback(() => permissionUtils.canDeleteTasks(currentUser), [currentUser]);
  const canMoveTasks = useCallback(() => permissionUtils.canMoveTasks(currentUser), [currentUser]);
  const canManageTasks = useCallback(() => permissionUtils.canManageTasks(currentUser), [currentUser]);
  const canManageEmployees = useCallback(() => permissionUtils.canManageEmployees(currentUser), [currentUser]);
  const canManageUsers = useCallback(() => permissionUtils.canManageUsers(currentUser), [currentUser]);
  const canViewAnalytics = useCallback(() => permissionUtils.canViewAnalytics(currentUser), [currentUser]);
  const canAssignTasks = useCallback(() => permissionUtils.canAssignTasks(currentUser), [currentUser]);
  const canViewOwnTasks = useCallback(() => permissionUtils.canViewOwnTasks(currentUser), [currentUser]);
  const canViewAllTasks = useCallback(() => permissionUtils.canViewAllTasks(currentUser), [currentUser]);
  const canManageAssets = useCallback(() => permissionUtils.canManageAssets(currentUser), [currentUser]);
  const canViewAllAssets = useCallback(() => permissionUtils.canViewAllAssets(currentUser), [currentUser]);
  const canManageFinance = useCallback(() => permissionUtils.canManageFinance(currentUser), [currentUser]);
  const canViewBudget = useCallback(() => permissionUtils.canViewBudget(currentUser), [currentUser]);
  const canManageProjects = useCallback(() => permissionUtils.canManageProjects(currentUser), [currentUser]);

  const value = useMemo(() => ({
    isAuthenticated,
    currentUser,
    loading,
    isFormSubmitting,
    login,
    logout,
    register,
    resetPassword,
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
    canViewAllTasks,
    canManageAssets,
    canViewAllAssets,
    canManageFinance,
    canViewBudget,
    canManageProjects
  }), [isAuthenticated, currentUser, loading, isFormSubmitting, login, logout, register, resetPassword, hasPermission, canEditTasks, canDeleteTasks, canMoveTasks, canManageTasks, canManageEmployees, canManageUsers, canViewAnalytics, canAssignTasks, canViewOwnTasks, canViewAllTasks, canManageAssets, canViewAllAssets, canManageFinance, canViewBudget, canManageProjects]);

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