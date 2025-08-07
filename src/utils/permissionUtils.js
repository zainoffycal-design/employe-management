export const PERMISSIONS = {
  EDIT_TASKS: 'edit_tasks',
  DELETE_TASKS: 'delete_tasks',
  MOVE_TASKS: 'move_tasks',
  MANAGE_TASKS: 'manage_tasks',
  VIEW_ANALYTICS: 'view_analytics',
  ASSIGN_TASKS: 'assign_tasks',
  MANAGE_USERS: 'manage_users',
  VIEW_OWN_TASKS: 'view_own_tasks'
};

const ROLE_PERMISSIONS = {
  super_manager: [
    PERMISSIONS.EDIT_TASKS,
    PERMISSIONS.DELETE_TASKS,
    PERMISSIONS.MOVE_TASKS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_OWN_TASKS
  ],
  manager: [
    PERMISSIONS.EDIT_TASKS,
    PERMISSIONS.DELETE_TASKS,
    PERMISSIONS.MOVE_TASKS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.MANAGE_USERS
  ],
  designer: [
    PERMISSIONS.MOVE_TASKS,
    PERMISSIONS.VIEW_OWN_TASKS,
    PERMISSIONS.ASSIGN_TASKS
  ],
  developer: [
    PERMISSIONS.MOVE_TASKS,
    PERMISSIONS.VIEW_OWN_TASKS,
    PERMISSIONS.ASSIGN_TASKS
  ],
  bd: [
    PERMISSIONS.MOVE_TASKS,
    PERMISSIONS.VIEW_OWN_TASKS,
    PERMISSIONS.ASSIGN_TASKS
  ]
};

export const permissionUtils = {
  hasPermission: (user, permission) => {
    if (!user || !user.role) return false;
    
    // Super manager has all permissions
    if (user.role === 'super_manager') return true;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  },

  canViewAllTasks: (user) => {
    return user?.role === 'super_manager' || user?.role === 'manager';
  },

  canManageEmployees: (user) => {
    return user?.role === 'super_manager' || user?.role === 'manager';
  },

  canManageUsers: (user) => {
    return user?.role === 'super_manager' || user?.role === 'manager';
  },

  getRolePermissions: (role) => {
    return ROLE_PERMISSIONS[role] || [];
  },

  hasAnyPermission: (user, permissions) => {
    return permissions.some(permission => permissionUtils.hasPermission(user, permission));
  },

  hasAllPermissions: (user, permissions) => {
    return permissions.every(permission => permissionUtils.hasPermission(user, permission));
  }
};

export const canEditTasks = (user) => permissionUtils.hasPermission(user, PERMISSIONS.EDIT_TASKS);
export const canDeleteTasks = (user) => permissionUtils.hasPermission(user, PERMISSIONS.DELETE_TASKS);
export const canMoveTasks = (user) => permissionUtils.hasPermission(user, PERMISSIONS.MOVE_TASKS);
export const canManageTasks = (user) => permissionUtils.hasPermission(user, PERMISSIONS.MANAGE_TASKS);
export const canViewAnalytics = (user) => permissionUtils.hasPermission(user, PERMISSIONS.VIEW_ANALYTICS);
export const canAssignTasks = (user) => permissionUtils.hasPermission(user, PERMISSIONS.ASSIGN_TASKS);
export const canViewOwnTasks = (user) => permissionUtils.hasPermission(user, PERMISSIONS.VIEW_OWN_TASKS); 