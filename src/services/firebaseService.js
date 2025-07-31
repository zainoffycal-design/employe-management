import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { generateAvatarUrl } from '../utils/avatarUtils';

// Project Management
export const projectService = {
  async createProject(projectData) {
    try {
      const projectsRef = collection(db, 'projects');
      const docRef = await addDoc(projectsRef, {
        ...projectData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: []
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  async updateProject(projectId, projectData) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...projectData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  async deleteProject(projectId) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  async getProjectsByManager(managerId) {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('managerId', '==', managerId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting projects by manager:', error);
      throw error;
    }
  },

  async getProjectsByTeamMember(userId) {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('teamMembers', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting projects by team member:', error);
      throw error;
    }
  }
};

// Task Management
export const taskService = {
  async createTask(projectId, taskData) {
    try {
      const tasksRef = collection(db, `projects/${projectId}/tasks`);
      const docRef = await addDoc(tasksRef, {
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: taskData.status || 'todo'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  async updateTask(projectId, taskId, taskData) {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await updateDoc(taskRef, {
        ...taskData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  async deleteTask(projectId, taskId) {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  async getProjectTasks(projectId) {
    try {
      const tasksRef = collection(db, `projects/${projectId}/tasks`);
      const q = query(tasksRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting project tasks:', error);
      throw error;
    }
  }
};



// User Management Service
export const userManagementService = {
  getAllUsers: async () => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  getUserById: async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  },

  updateUserRole: async (userId, role, permissions) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role,
      permissions,
      updatedAt: serverTimestamp()
    });
  },

  updateUserProfile: async (userId, userData) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      name: userData.name,
      role: userData.role,
      permissions: userData.permissions,
      avatar: generateAvatarUrl(userData.name),
      updatedAt: serverTimestamp()
    });
  },

  // Update user to ensure uid field is present
  ensureUserUid: async (uid, email) => {
    try {
      // Check if user exists with UID
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Add uid field if missing
        if (!userData.uid) {
          await updateDoc(userRef, {
            uid: uid
          });
        }
      } else {
        // Check if user exists with email
        const emailUserRef = doc(db, 'users', email);
        const emailUserDoc = await getDoc(emailUserRef);
        
        if (emailUserDoc.exists()) {
          const userData = emailUserDoc.data();
          // Create new document with UID and add uid field
          await setDoc(doc(db, 'users', uid), {
            ...userData,
            uid: uid
          });
          // Delete email-based document
          await deleteDoc(emailUserRef);
        }
      }
    } catch (error) {
      console.error('Error ensuring user UID:', error);
    }
  },

  createUser: async (userData) => {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );

    const userProfile = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions,
      avatar: generateAvatarUrl(userData.name),
      isActive: true,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
    return userCredential.user;
  },

  createUserWithoutSignIn: async (userData) => {
    const auth = getAuth();
    
    // Store current user info before creating new user
    const currentUser = auth.currentUser;
    
    // Create the new user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );

    const userProfile = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions,
      avatar: generateAvatarUrl(userData.name),
      isActive: true,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
    
    // Sign out the newly created user
    await signOut(auth);
    
    // Show success message
    toast.success('User created successfully! You have been signed out. Please sign back in.');
    
    return userCredential.user;
  },

  deleteUser: async (userId) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  }
};

// Auth Service
export const authService = {
  signIn: async (email, password) => {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  signUp: async (email, password, name) => {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile
    await updateProfile(userCredential.user, {
      displayName: name
    });

    return userCredential.user;
  },

  signOut: async () => {
    const auth = getAuth();
    await signOut(auth);
  },

  onAuthStateChanged: (callback) => {
    const auth = getAuth();
    return onAuthStateChanged(auth, callback);
  }
}; 