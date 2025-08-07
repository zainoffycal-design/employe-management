import { firebaseUtils, queryBuilders } from '../utils/firebaseUtils';
import toast from 'react-hot-toast';
import { generateAvatarUrl } from '../utils/avatarUtils';

export const projectService = {
  async createProject(projectData) {
    return firebaseUtils.createDocument('projects', { ...projectData, tasks: [] });
  },

  async updateProject(projectId, projectData) {
    return firebaseUtils.updateDocument('projects', projectId, projectData);
  },

  async deleteProject(projectId) {
    return firebaseUtils.deleteDocument('projects', projectId);
  },

  async getProjectsByManager(managerId) {
    return firebaseUtils.getDocuments('projects', queryBuilders.byManager(managerId));
  },

  async getProjectsByTeamMember(userId) {
    return firebaseUtils.getDocuments('projects', queryBuilders.byTeamMember(userId));
  }
};

export const taskService = {
  async createTask(projectId, taskData) {
    return firebaseUtils.createDocument(`projects/${projectId}/tasks`, {
      ...taskData,
      status: taskData.status || 'todo'
    });
  },

  async updateTask(projectId, taskId, taskData) {
    return firebaseUtils.updateDocument(`projects/${projectId}/tasks`, taskId, taskData);
  },

  async deleteTask(projectId, taskId) {
    return firebaseUtils.deleteDocument(`projects/${projectId}/tasks`, taskId);
  },

  async getProjectTasks(projectId) {
    return firebaseUtils.getDocuments(`projects/${projectId}/tasks`, [queryBuilders.orderBy('createdAt')]);
  }
};

export const userManagementService = {
  getAllUsers: async () => {
    return firebaseUtils.getDocuments('users', [queryBuilders.orderBy('createdAt')]);
  },

  getUserById: async (userId) => {
    return firebaseUtils.getDocument('users', userId);
  },

  updateUserRole: async (userId, role, permissions) => {
    return firebaseUtils.updateDocument('users', userId, { role, permissions });
  },

  updateUserProfile: async (userId, userData) => {
    return firebaseUtils.updateDocument('users', userId, {
      name: userData.name,
      role: userData.role,
      permissions: userData.permissions,
      avatar: generateAvatarUrl(userData.name)
    });
  },

  ensureUserUid: async (uid, email) => {
    return firebaseUtils.ensureUserUid(uid, email);
  },

  createUser: async (userData) => {
    const userProfile = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions,
      avatar: generateAvatarUrl(userData.name),
      isActive: true
    };
    return firebaseUtils.createUser({ ...userData, avatar: generateAvatarUrl(userData.name) });
  },

  createUserWithoutSignIn: async (userData) => {
    const userProfile = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions,
      avatar: generateAvatarUrl(userData.name),
      isActive: true
    };
    
    const user = await firebaseUtils.createUser({ ...userData, avatar: generateAvatarUrl(userData.name) });
    await firebaseUtils.signOut();
    toast.success('User created successfully! You have been signed out. Please sign back in.');
    return user;
  },

  deleteUser: async (userId) => {
    return firebaseUtils.updateDocument('users', userId, { isActive: false });
  }
};

export const authService = {
  signIn: async (email, password) => {
    return firebaseUtils.signIn(email, password);
  },

  signUp: async (email, password, name) => {
    return firebaseUtils.signUp(email, password, name);
  },

  signOut: async () => {
    return firebaseUtils.signOut();
  },

  onAuthStateChanged: (callback) => {
    return firebaseUtils.onAuthStateChanged(callback);
  }
}; 