export const PERMISSIONS = {
  EDIT_TASKS: 'edit_tasks',
  DELETE_TASKS: 'delete_tasks',
  MOVE_TASKS: 'move_tasks',
  MANAGE_TASKS: 'manage_tasks',
  VIEW_ANALYTICS: 'view_analytics',
  ASSIGN_TASKS: 'assign_tasks',
  MANAGE_USERS: 'manage_users',
  VIEW_OWN_TASKS: 'view_own_tasks',
  MANAGE_FINANCE: 'manage_finance',
  VIEW_BUDGET: 'view_budget',
  MANAGE_PROJECTS: 'manage_projects'
};

export const ROLES = {
  SUPER_MANAGER: 'super_manager',
  MANAGER: 'manager',
  DESIGNER: 'designer',
  DEVELOPER: 'developer',
  BD: 'bd'
};

export const MANAGER_TYPES = {
  DESIGNER: 'designer',
  DEVELOPER: 'developer',
  BD: 'bd'
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_MANAGER]: [
    PERMISSIONS.EDIT_TASKS,
    PERMISSIONS.DELETE_TASKS,
    PERMISSIONS.MOVE_TASKS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_OWN_TASKS,
    PERMISSIONS.MANAGE_FINANCE,
    PERMISSIONS.VIEW_BUDGET,
    PERMISSIONS.MANAGE_PROJECTS
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.EDIT_TASKS,
    PERMISSIONS.DELETE_TASKS,
    PERMISSIONS.MOVE_TASKS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.MANAGE_USERS
  ],
  [ROLES.DESIGNER]: [
    PERMISSIONS.MOVE_TASKS,
    PERMISSIONS.VIEW_OWN_TASKS,
    PERMISSIONS.ASSIGN_TASKS
  ],
  [ROLES.DEVELOPER]: [
    PERMISSIONS.MOVE_TASKS,
    PERMISSIONS.VIEW_OWN_TASKS,
    PERMISSIONS.ASSIGN_TASKS
  ],
  [ROLES.BD]: [
    PERMISSIONS.MOVE_TASKS,
    PERMISSIONS.VIEW_OWN_TASKS,
    PERMISSIONS.ASSIGN_TASKS,
    PERMISSIONS.VIEW_BUDGET
  ]
};

const isSuperManager = (user) => {
  return user?.role === ROLES.SUPER_MANAGER;
};

const isManager = (user) => {
  return user?.role === ROLES.MANAGER;
};

const isManagerOfType = (user, managerType) => {
  if (!isManager(user)) return false;
  const managerTypes = Array.isArray(user.managerType) 
    ? user.managerType 
    : (user.managerType ? [user.managerType] : []);
  return managerTypes.includes(managerType);
};

const hasManagerType = (user) => {
  if (!isManager(user)) return false;
  const managerTypes = Array.isArray(user.managerType) 
    ? user.managerType 
    : (user.managerType ? [user.managerType] : []);
  return managerTypes.length > 0;
};

export const permissionUtils = {
  hasPermission: (user, permission) => {
    if (!user || !user.role) return false;
    if (isSuperManager(user)) return true;
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  },

  hasAnyPermission: (user, permissions) => {
    return permissions.some(permission => permissionUtils.hasPermission(user, permission));
  },

  hasAllPermissions: (user, permissions) => {
    return permissions.every(permission => permissionUtils.hasPermission(user, permission));
  },

  getRolePermissions: (role) => {
    return ROLE_PERMISSIONS[role] || [];
  },

  isSuperManager: (user) => user?.role === ROLES.SUPER_MANAGER,
  isManager: (user) => user?.role === ROLES.MANAGER,
  isDesigner: (user) => user?.role === ROLES.DESIGNER,
  isDeveloper: (user) => user?.role === ROLES.DEVELOPER,
  isBD: (user) => user?.role === ROLES.BD,

  isManagerOfType: (user, managerType) => {
    if (user?.role === ROLES.SUPER_MANAGER) return true;
    if (!isManager(user)) return false;
    const managerTypes = Array.isArray(user.managerType) 
      ? user.managerType 
      : (user.managerType ? [user.managerType] : []);
    return managerTypes.includes(managerType);
  },
  hasManagerType: (user) => hasManagerType(user),

  canViewAllTasks: (user) => {
    return user?.role === ROLES.SUPER_MANAGER || user?.role === ROLES.MANAGER;
  },

  canManageUsers: (user) => {
    return user?.role === ROLES.SUPER_MANAGER || user?.role === ROLES.MANAGER;
  },

  canManageEmployees: (user) => {
    return user?.role === ROLES.SUPER_MANAGER || user?.role === ROLES.MANAGER;
  },

  canManageFinance: (user) => {
    return user?.role === ROLES.SUPER_MANAGER;
  },

  canViewBudget: (user) => {
    return isSuperManager(user) || permissionUtils.isManagerOfType(user, MANAGER_TYPES.BD);
  },

  canViewAnalytics: (user) => {
    return permissionUtils.hasPermission(user, PERMISSIONS.VIEW_ANALYTICS);
  },

  canManageProjects: (user) => {
    return permissionUtils.hasPermission(user, PERMISSIONS.MANAGE_PROJECTS);
  },

  canEditTasks: (user) => {
    return permissionUtils.hasPermission(user, PERMISSIONS.EDIT_TASKS);
  },

  canDeleteTasks: (user) => {
    return permissionUtils.hasPermission(user, PERMISSIONS.DELETE_TASKS);
  },

  canMoveTasks: (user) => {
    return permissionUtils.hasPermission(user, PERMISSIONS.MOVE_TASKS);
  },

  canManageTasks: (user) => {
    return permissionUtils.hasPermission(user, PERMISSIONS.MANAGE_TASKS);
  },

  canAssignTasks: (user) => {
    return permissionUtils.hasPermission(user, PERMISSIONS.ASSIGN_TASKS);
  },

  canViewOwnTasks: (user) => {
    return permissionUtils.hasPermission(user, PERMISSIONS.VIEW_OWN_TASKS);
  },

  canAccessRoute: (user, route) => {
    if (!user?.role) return false;

    const path = (route || '').split('?')[0].replace(/\/$/, '') || '/';

    if (path === '/' || path === '' || path === '/dashboard') return true;
    if (path === '/projects') return true;
    if (/^\/project\/[^/]+\/board$/.test(path)) return true;
    if (path === '/users') return permissionUtils.canManageUsers(user);
    if (path === '/analytics') return permissionUtils.canViewAnalytics(user);
    if (path === '/employee-performance') return permissionUtils.isSuperManager(user);
    if (path === '/calculator') return permissionUtils.isSuperManager(user);
    if (path === '/payments') return permissionUtils.canManageFinance(user);
    if (path.startsWith('/finance')) return permissionUtils.canManageFinance(user);

    return false;
  },

  getProjectsNavLabel: (user) => {
    if (permissionUtils.canManageProjects(user) || permissionUtils.isManager(user)) {
      return 'Project Management';
    }
    return 'My Projects';
  },

  getSidebarNavigation: (user) => {
    if (!user?.role) return [];

    const items = [];

    if (permissionUtils.canAccessRoute(user, '/dashboard')) {
      items.push({ path: '/dashboard', label: 'Dashboard', iconKey: 'home' });
    }

    if (permissionUtils.canAccessRoute(user, '/projects')) {
      items.push({
        path: '/projects',
        label: permissionUtils.getProjectsNavLabel(user),
        iconKey: 'folder'
      });
    }

    if (permissionUtils.canAccessRoute(user, '/users')) {
      items.push({ path: '/users', label: 'User Management', iconKey: 'users' });
    }

    if (permissionUtils.canAccessRoute(user, '/analytics')) {
      items.push({ path: '/analytics', label: 'Analytics', iconKey: 'analytics' });
    }

    if (permissionUtils.canAccessRoute(user, '/employee-performance')) {
      items.push({
        path: '/employee-performance',
        label: 'Employee Performance',
        iconKey: 'barChart'
      });
    }

    const financeSubItems = [
      { path: '/finance/overview', label: 'Financial Overview' },
      { path: '/finance/commissions', label: 'Commissions' }
    ].filter((sub) => permissionUtils.canAccessRoute(user, sub.path));

    if (financeSubItems.length > 0) {
      items.push({
        key: 'finance',
        label: 'Finance',
        iconKey: 'dollar',
        subItems: financeSubItems
      });
    }

    if (permissionUtils.canAccessRoute(user, '/calculator')) {
      items.push({ path: '/calculator', label: 'Project Calculator', iconKey: 'fileText' });
    }

    return items;
  },

  canEditUser: (currentUser, targetUser) => {
    if (currentUser?.role === ROLES.SUPER_MANAGER) {
      return targetUser?.role !== ROLES.SUPER_MANAGER || targetUser?.id === currentUser.uid;
    }
    if (currentUser?.role === ROLES.MANAGER) {
      return targetUser?.role !== ROLES.SUPER_MANAGER && 
             targetUser?.role !== ROLES.MANAGER;
    }
    return false;
  },

  canDeleteUser: (currentUser, targetUser) => {
    if (currentUser?.role === ROLES.SUPER_MANAGER) {
      return targetUser?.role !== ROLES.SUPER_MANAGER || targetUser?.id === currentUser.uid;
    }
    if (currentUser?.role === ROLES.MANAGER) {
      return targetUser?.role !== ROLES.SUPER_MANAGER && 
             targetUser?.role !== ROLES.MANAGER;
    }
    return false;
  },

  canCreateManager: (user) => {
    return user?.role === ROLES.SUPER_MANAGER;
  },

  canAssignManagerType: (user) => {
    return user?.role === ROLES.SUPER_MANAGER;
  }
};

export const getRoleDisplayName = (role) => {
  const roleNames = {
    [ROLES.SUPER_MANAGER]: 'Super Manager',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.DESIGNER]: 'Designer',
    [ROLES.DEVELOPER]: 'Developer',
    [ROLES.BD]: 'Business Developer'
  };
  return roleNames[role] || role;
};

export const getManagerTypeDisplayName = (managerType) => {
  const typeNames = {
    [MANAGER_TYPES.DESIGNER]: 'Designer Manager',
    [MANAGER_TYPES.DEVELOPER]: 'Developer Manager',
    [MANAGER_TYPES.BD]: 'Business Developer Manager'
  };
  return typeNames[managerType] || managerType;
};

export const canEditTasks = (user) => permissionUtils.canEditTasks(user);
export const canDeleteTasks = (user) => permissionUtils.canDeleteTasks(user);
export const canMoveTasks = (user) => permissionUtils.canMoveTasks(user);
export const canManageTasks = (user) => permissionUtils.canManageTasks(user);
export const canViewAnalytics = (user) => permissionUtils.canViewAnalytics(user);
export const canAssignTasks = (user) => permissionUtils.canAssignTasks(user);
export const canViewOwnTasks = (user) => permissionUtils.canViewOwnTasks(user);
