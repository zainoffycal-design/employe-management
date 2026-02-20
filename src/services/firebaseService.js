import { firebaseUtils, queryBuilders } from '../utils/firebaseUtils';
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, updateDoc, writeBatch, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { generateAvatarUrl } from '../utils/avatarUtils';
import { removeUsersFromProjects } from './projectCleanupService';

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
  },

  async clearProjectTypeFromAllProjects() {
    try {
      const projectsRef = collection(db, 'projects');
      const snapshot = await getDocs(projectsRef);
      
      if (snapshot.empty) {
        toast.success('No projects found');
        return { success: true, count: 0 };
      }

      const projectsToUpdate = snapshot.docs.filter(docSnapshot => 
        docSnapshot.data().projectType !== undefined
      );

      if (projectsToUpdate.length === 0) {
        toast.success('No projects with projectType found');
        return { success: true, count: 0 };
      }

      const BATCH_LIMIT = 500;
      const batches = [];
      let currentBatch = writeBatch(db);
      let currentCount = 0;

      projectsToUpdate.forEach((docSnapshot) => {
        currentBatch.update(docSnapshot.ref, {
          projectType: deleteField()
        });
        currentCount++;

        if (currentCount >= BATCH_LIMIT) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          currentCount = 0;
        }
      });

      if (currentCount > 0) {
        batches.push(currentBatch);
      }

      await Promise.all(batches.map(b => b.commit()));
      toast.success(`Cleared projectType from ${projectsToUpdate.length} project(s)`);

      return { success: true, count: projectsToUpdate.length };
    } catch (error) {
      console.error('Error clearing projectType from projects:', error);
      toast.error('Failed to clear projectType from projects');
      throw error;
    }
  }
};

export const taskService = {
  async createTask(projectId, taskData) {
    return firebaseUtils.createDocument(`projects/${projectId}/tasks`, {
      ...taskData,
      status: taskData.status || 'todo',
      totalHours: taskData.totalHours || 0,
      timeEntries: taskData.timeEntries || []
    });
  },

  async updateTask(projectId, taskId, taskData) {
    return firebaseUtils.updateDocument(`projects/${projectId}/tasks`, taskId, taskData);
  },

  async updateTaskTime(projectId, taskId, timeData) {
    return firebaseUtils.updateDocument(`projects/${projectId}/tasks`, taskId, {
      totalHours: timeData.totalHours,
      timeEntries: timeData.timeEntries,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteTask(projectId, taskId) {
    return firebaseUtils.deleteDocument(`projects/${projectId}/tasks`, taskId);
  },

  async getProjectTasks(projectId) {
    return firebaseUtils.getDocuments(`projects/${projectId}/tasks`, [queryBuilders.orderBy('createdAt')]);
  },

  async getProjectHours(projectId) {
    const tasks = await this.getProjectTasks(projectId);
    return tasks.reduce((total, task) => total + (task.totalHours || 0), 0);
  },

  async getAllProjectHours() {
    const projects = await firebaseUtils.getDocuments('projects');
    const projectHours = await Promise.all(
      projects.map(async (project) => {
        const hours = await this.getProjectHours(project.id);
        return {
          projectId: project.id,
          projectName: project.name,
          totalHours: hours
        };
      })
    );
    return projectHours;
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
    const updateData = {};

    if (userData.name !== undefined) {
      updateData.name = userData.name;
      updateData.avatar = generateAvatarUrl(userData.name);
    }

    if (userData.role !== undefined) {
      updateData.role = userData.role;
    }

    if (userData.permissions !== undefined) {
      updateData.permissions = userData.permissions;
    }

    if (userData.managerType !== undefined) {
      if (Array.isArray(userData.managerType)) {
        updateData.managerType = userData.managerType.length > 0 ? userData.managerType : null;
      } else {
        updateData.managerType = userData.managerType || null;
      }
    }

    if (userData.monthlySalary !== undefined) {
      updateData.monthlySalary = userData.monthlySalary;
    }

    if (userData.monthlyHours !== undefined) {
      updateData.monthlyHours = userData.monthlyHours;
    }

    if (userData.hasCommission !== undefined) {
      updateData.hasCommission = userData.hasCommission;
    }

    if (userData.commissionPercentage !== undefined) {
      updateData.commissionPercentage = userData.commissionPercentage;
    }

    if (userData.commissionType !== undefined) {
      updateData.commissionType = userData.commissionType;
    }

    return firebaseUtils.updateDocument('users', userId, updateData);
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
    const user = await firebaseUtils.createUser({ ...userData, avatar: generateAvatarUrl(userData.name) });
    await firebaseUtils.signOut();
    toast.success('User created successfully! You have been signed out. Please sign back in.');
    return user;
  },

  deleteUser: async (userId) => {
    try {
      const userData = await firebaseUtils.getDocument('users', userId);
      if (userData) {
        await firebaseUtils.deleteDocument('users', userId);
        
        if (userData.email) {
          const invitationsRef = collection(db, 'user_invitations');
          const invitationsQuery = query(invitationsRef, where('email', '==', userData.email));
          const invitationsSnapshot = await getDocs(invitationsQuery);
          
          await Promise.all(invitationsSnapshot.docs.map(doc => deleteDoc(doc.ref)));
        }

        const identifiers = [userId];
        if (userData.email) {
          identifiers.push(userData.email);
        }

        await removeUsersFromProjects(identifiers);
      } else {
        await removeUsersFromProjects([userId]);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  deactivateUser: async (userId) => {
    try {
      await firebaseUtils.updateDocument('users', userId, { 
        isActive: false,
        status: 'inactive',
        deactivatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  },

  activateUser: async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: true,
        status: 'active',
        deactivatedAt: deleteField(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  },

  subscribeToAllUsers(callback) {
    return firebaseUtils.subscribeToCollection('users', callback, [
      queryBuilders.orderBy('createdAt')
    ]);
  }

};

export const assetService = {
  async createAsset(assetData) {
    const asset = {
      ...assetData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!asset.status) {
      asset.status = asset.assignedTo ? 'assigned' : 'available';
    }
    
    if (!asset.assignedAt && asset.assignedTo) {
      asset.assignedAt = new Date().toISOString();
    }
    
    return firebaseUtils.createDocument('assets', asset);
  },

  async updateAsset(assetId, assetData) {
    return firebaseUtils.updateDocument('assets', assetId, assetData);
  },

  async deleteAsset(assetId) {
    return firebaseUtils.deleteDocument('assets', assetId);
  },

  async getAllAssets() {
    return firebaseUtils.getDocuments('assets');
  },

  async getAssetsByUser(userId) {
    return firebaseUtils.getDocuments('assets', [
      queryBuilders.where('assignedTo', '==', userId)
    ]);
  },

  async getAvailableAssets() {
    return firebaseUtils.getDocuments('assets', [
      queryBuilders.where('status', '==', 'available')
    ]);
  },

  async assignAsset(assetId, userId, assignedBy) {
    const assetData = {
      assignedTo: userId,
      assignedAt: new Date().toISOString(),
      assignedBy: assignedBy,
      status: 'assigned'
    };
    return firebaseUtils.updateDocument('assets', assetId, assetData);
  },

  async unassignAsset(assetId) {
    const assetData = {
      assignedTo: null,
      assignedAt: null,
      assignedBy: null,
      status: 'available'
    };
    return firebaseUtils.updateDocument('assets', assetId, assetData);
  },

  async createAssetRequest(requestData) {
    return firebaseUtils.createDocument('asset_requests', {
      ...requestData,
      status: 'pending',
      requestedAt: new Date().toISOString()
    });
  },

  async getAllAssetRequests() {
    return firebaseUtils.getDocuments('asset_requests');
  },

  async getAssetRequestsByUser(userId) {
    return firebaseUtils.getDocuments('asset_requests', [
      queryBuilders.where('requestedBy', '==', userId)
    ]);
  },

  async updateAssetRequest(requestId, requestData) {
    return firebaseUtils.updateDocument('asset_requests', requestId, requestData);
  },

  async deleteAssetRequest(requestId) {
    return firebaseUtils.deleteDocument('asset_requests', requestId);
  },

  subscribeToAllAssets(callback) {
    return firebaseUtils.subscribeToCollection('assets', callback);
  },

  subscribeToUserAssets(userId, callback) {
    return firebaseUtils.subscribeToCollection('assets', callback, [
      queryBuilders.where('assignedTo', '==', userId)
    ]);
  },

  subscribeToAllAssetRequests(callback) {
    return firebaseUtils.subscribeToCollection('asset_requests', callback);
  },

  subscribeToUserAssetRequests(userId, callback) {
    return firebaseUtils.subscribeToCollection('asset_requests', callback, [
      queryBuilders.where('requestedBy', '==', userId)
    ]);
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

export const budgetService = {
  async setMonthlyBudget(userId, year, month, amount) {
    try {
      const budgetId = `${year}-${String(month).padStart(2, '0')}`;
      const budgetRef = doc(db, 'monthly_budgets', budgetId);
      const existingBudget = await firebaseUtils.getDocument('monthly_budgets', budgetId);
      
      const budgetData = {
        userId,
        year,
        month,
        amount: parseFloat(amount) || 0,
        updatedAt: new Date().toISOString()
      };
      
      if (existingBudget) {
        await setDoc(budgetRef, budgetData, { merge: true });
      } else {
        budgetData.createdAt = new Date().toISOString();
        await setDoc(budgetRef, budgetData);
      }
      
      return budgetId;
    } catch (error) {
      console.error('Error setting monthly budget:', error);
      throw error;
    }
  },

  async getMonthlyBudget(userId, year, month) {
    try {
      const budgetId = `${year}-${String(month).padStart(2, '0')}`;
      const budget = await firebaseUtils.getDocument('monthly_budgets', budgetId);
      if (budget && budget.userId === userId) {
        return budget.amount || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting monthly budget:', error);
      return 0;
    }
  },

  async getAllBudgets(userId) {
    try {
      const budgets = await firebaseUtils.getDocuments('monthly_budgets', [
        queryBuilders.where('userId', '==', userId)
      ]);
      return budgets;
    } catch (error) {
      console.error('Error getting all budgets:', error);
      return [];
    }
  }
};

const COMMISSION_PAYMENTS_COLLECTION = 'commission_payments';

export const commissionPaymentService = {
  getDocId(userId, month) {
    return `${userId}_${month}`;
  },

  async getPaymentStatus(userId, month) {
    try {
      const docId = commissionPaymentService.getDocId(userId, month);
      const data = await firebaseUtils.getDocument(COMMISSION_PAYMENTS_COLLECTION, docId);
      return data?.paid === true;
    } catch (error) {
      console.error('Error getting commission payment status:', error);
      return false;
    }
  },

  async getPaymentStatusBatch(userIds, months) {
    try {
      const status = {};
      await Promise.all(
        userIds.flatMap(uid =>
          months.map(async (month) => {
            const docId = commissionPaymentService.getDocId(uid, month);
            const data = await firebaseUtils.getDocument(COMMISSION_PAYMENTS_COLLECTION, docId);
            status[`${uid}_${month}`] = data?.paid === true;
          })
        )
      );
      return status;
    } catch (error) {
      console.error('Error getting commission payment status batch:', error);
      return {};
    }
  },

  async setPaid(userId, month, paid = true) {
    try {
      const docId = commissionPaymentService.getDocId(userId, month);
      const ref = doc(db, COMMISSION_PAYMENTS_COLLECTION, docId);
      await setDoc(ref, {
        userId,
        month,
        paid,
        paidAt: paid ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error setting commission payment status:', error);
      throw error;
    }
  },

  async setPaidBatch(entries) {
    try {
      await Promise.all(
        entries.map(({ userId, month, paid }) =>
          commissionPaymentService.setPaid(userId, month, paid)
        )
      );
    } catch (error) {
      console.error('Error setting commission payment batch:', error);
      throw error;
    }
  }
}; 