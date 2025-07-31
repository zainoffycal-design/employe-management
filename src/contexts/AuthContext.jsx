import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { userManagementService } from '../services/firebaseService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // First try to fetch user profile using UID
        let userRef = doc(db, 'users', user.uid);
        let snapshot = await getDoc(userRef);
        
        // If not found with UID, try with email (for invited users)
        if (!snapshot.exists()) {
          userRef = doc(db, 'users', user.email);
          snapshot = await getDoc(userRef);
        }
        
        if (snapshot.exists()) {
          const userData = snapshot.data();
          // Ensure uid field is present for consistency
          const userWithUid = { 
            uid: user.uid, 
            email: user.email, 
            ...userData 
          };
          setCurrentUser(userWithUid);
          
          // Ensure user has uid field in database
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

  // Register new user
  const register = async (userData) => {
    try {
      const auth = getAuth();
      const { email, password, ...profile } = userData;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store profile in Firestore
      await setDoc(doc(db, 'users', user.uid), profile);
      
      setCurrentUser({ uid: user.uid, email: user.email, ...profile });
      setIsAuthenticated(true);
      return { success: true, user: { uid: user.uid, email: user.email, ...profile } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Login
  const login = async (email, password) => {
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // First try to fetch user profile using UID
      let userRef = doc(db, 'users', user.uid);
      let snapshot = await getDoc(userRef);
      
      // If not found with UID, try with email (for invited users)
      if (!snapshot.exists()) {
        userRef = doc(db, 'users', user.email);
        snapshot = await getDoc(userRef);
      }
      
      if (snapshot.exists()) {
        const userData = snapshot.data();
        // Ensure uid field is present for consistency
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
      return { success: true, user: { uid: user.uid, email: user.email, ...snapshot.data() } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Permissions based on user role
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    // Super manager has all permissions
    if (currentUser.role === 'super_manager') return true;
    
    // Manager permissions
    if (currentUser.role === 'manager') {
      return [
        'edit_tasks',
        'delete_tasks',
        'move_tasks',
        'manage_tasks',
        'view_analytics',
        'assign_tasks',
        'manage_users'  // Added permission for user management
      ].includes(permission);
    }
    
    // Designer permissions
    if (currentUser.role === 'designer') {
      return ['move_tasks', 'view_own_tasks', 'assign_tasks'].includes(permission);
    }
    
    // Developer permissions
    if (currentUser.role === 'developer') {
      return ['move_tasks', 'view_own_tasks', 'assign_tasks'].includes(permission);
    }
    
    // Business Developer permissions
    if (currentUser.role === 'bd') {
      return ['move_tasks', 'view_own_tasks', 'assign_tasks'].includes(permission);
    }
    
    return false;
  };
  
  const canEditTasks = () => hasPermission('edit_tasks');
  const canDeleteTasks = () => hasPermission('delete_tasks');
  const canMoveTasks = () => hasPermission('move_tasks');
  const canManageTasks = () => hasPermission('manage_tasks');
  const canManageEmployees = () => currentUser?.role === 'super_manager' || currentUser?.role === 'manager';
  const canManageUsers = () => currentUser?.role === 'super_manager' || currentUser?.role === 'manager';
  const canViewAnalytics = () => hasPermission('view_analytics');
  const canAssignTasks = () => hasPermission('assign_tasks');
  const canViewOwnTasks = () => hasPermission('view_own_tasks');

  // Check if user can view all tasks or only their own
  const canViewAllTasks = () => {
    return currentUser?.role === 'super_manager' || currentUser?.role === 'manager';
  };

  const value = {
    isAuthenticated,
    currentUser,
    loading,
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
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 