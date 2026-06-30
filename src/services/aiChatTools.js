import { permissionUtils, getRoleDisplayName } from '../utils/permissionUtils';
import { userManagementService } from './firebaseService';

const findProject = (projects, { projectId, projectName }) => {
  if (projectId) {
    return projects.find((p) => p.id === projectId);
  }
  if (projectName) {
    const term = projectName.toLowerCase();
    return projects.find((p) => (p.name || '').toLowerCase().includes(term));
  }
  return null;
};

const findTask = (tasks, { taskId, taskTitle, projectId }) => {
  let pool = tasks;
  if (projectId) pool = pool.filter((t) => t.projectId === projectId);
  if (taskId) return pool.find((t) => t.id === taskId);
  if (taskTitle) {
    const term = taskTitle.toLowerCase();
    return pool.find((t) => (t.title || '').toLowerCase().includes(term));
  }
  return null;
};

export const AI_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigate the user to an app route they can access',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Route path e.g. /, /projects, /users' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'open_project_board',
      description: 'Open a project Kanban board by project id or name',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          projectName: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_summary',
      description: 'Get summary counts for projects, tasks, overdue items',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_projects',
      description: 'List projects the user can see',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          status: { type: 'string', enum: ['active', 'completed', 'all'] }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'List tasks with optional filters',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          projectName: { type: 'string' },
          status: { type: 'string' },
          assignedToMe: { type: 'boolean' },
          overdueOnly: { type: 'boolean' },
          limit: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task in a project',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          projectName: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          status: { type: 'string', enum: ['todo', 'in-progress', 'in-review', 'done'] }
        },
        required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_task_status',
      description: 'Move a task to a new status on the board',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          taskId: { type: 'string' },
          taskTitle: { type: 'string' },
          status: { type: 'string', enum: ['todo', 'in-progress', 'in-review', 'done'] }
        },
        required: ['status']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_permissions',
      description: 'Explain what the current user can access and do',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_users',
      description: 'List team users (managers only)',
      parameters: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          activeOnly: { type: 'boolean' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_notifications_summary',
      description: 'Get unread and recent notifications for the user',
      parameters: { type: 'object', properties: {} }
    }
  }
];

export const executeAITool = async (name, args, ctx) => {
  const {
    currentUser,
    projects,
    tasks,
    notifications,
    navigate,
    createTask,
    updateTask
  } = ctx;

  switch (name) {
    case 'navigate_to': {
      const path = (args.path || '').split('?')[0];
      if (!permissionUtils.canAccessRoute(currentUser, path)) {
        return { error: `You do not have access to ${path}` };
      }
      navigate(path);
      return { success: true, message: `Navigated to ${path}` };
    }

    case 'open_project_board': {
      const project = findProject(projects, args);
      if (!project) return { error: 'Project not found' };
      const path = `/project/${project.id}/board`;
      navigate(path);
      return { success: true, project: { id: project.id, name: project.name }, path };
    }

    case 'get_dashboard_summary': {
      const now = new Date();
      const active = projects.filter((p) => p.status !== 'completed');
      const overdue = tasks.filter(
        (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'done'
      );
      const byStatus = tasks.reduce((acc, t) => {
        acc[t.status || 'todo'] = (acc[t.status || 'todo'] || 0) + 1;
        return acc;
      }, {});
      const myTasks = tasks.filter((t) => {
        const assignees = Array.isArray(t.assignee) ? t.assignee : t.assignee ? [t.assignee] : [];
        return assignees.some((a) => a === currentUser.uid || a === currentUser.email);
      });
      return {
        projects: { total: projects.length, active: active.length },
        tasks: { total: tasks.length, byStatus, assignedToMe: myTasks.length },
        overdue: overdue.length,
        overdueTasks: overdue.slice(0, 5).map((t) => ({
          id: t.id,
          title: t.title,
          projectId: t.projectId,
          deadline: t.deadline
        }))
      };
    }

    case 'list_projects': {
      let list = [...projects];
      const status = args.status || 'all';
      if (status === 'active') list = list.filter((p) => p.status !== 'completed');
      if (status === 'completed') list = list.filter((p) => p.status === 'completed');
      if (args.search) {
        const term = args.search.toLowerCase();
        list = list.filter((p) => (p.name || '').toLowerCase().includes(term));
      }
      return {
        count: list.length,
        projects: list.slice(0, 15).map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          priority: p.priority,
          teamSize: p.teamMembers?.length || 0
        }))
      };
    }

    case 'list_tasks': {
      let list = [...tasks];
      const project = findProject(projects, args);
      if (project) list = list.filter((t) => t.projectId === project.id);
      if (args.status) list = list.filter((t) => t.status === args.status);
      if (args.assignedToMe) {
        list = list.filter((t) => {
          const assignees = Array.isArray(t.assignee) ? t.assignee : t.assignee ? [t.assignee] : [];
          return assignees.some((a) => a === currentUser.uid || a === currentUser.email);
        });
      }
      if (args.overdueOnly) {
        const now = new Date();
        list = list.filter(
          (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'done'
        );
      }
      const limit = Math.min(args.limit || 10, 20);
      return {
        count: list.length,
        tasks: list.slice(0, limit).map((t) => {
          const proj = projects.find((p) => p.id === t.projectId);
          return {
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            deadline: t.deadline,
            projectId: t.projectId,
            projectName: proj?.name
          };
        })
      };
    }

    case 'create_task': {
      const canCreate =
        permissionUtils.canManageTasks(currentUser) ||
        permissionUtils.canEditTasks(currentUser) ||
        permissionUtils.canAssignTasks(currentUser);
      if (!canCreate) {
        return { error: 'You do not have permission to create tasks' };
      }
      const project = findProject(projects, args);
      if (!project) return { error: 'Project not found. Provide projectId or projectName.' };
      const taskId = await createTask(project.id, {
        title: args.title,
        description: args.description || '',
        status: args.status || 'todo',
        priority: args.priority || 'medium',
        assignee: [],
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid
      });
      return { success: true, taskId, projectId: project.id, title: args.title };
    }

    case 'update_task_status': {
      if (!permissionUtils.canMoveTasks(currentUser)) {
        return { error: 'You do not have permission to move tasks' };
      }
      const project = findProject(projects, args);
      const task = findTask(tasks, { ...args, projectId: project?.id || args.projectId });
      if (!task) return { error: 'Task not found' };
      await updateTask(task.projectId, task.id, { status: args.status });
      return { success: true, taskId: task.id, title: task.title, status: args.status };
    }

    case 'get_my_permissions': {
      const routes = permissionUtils.getSidebarNavigation(currentUser);
      return {
        role: getRoleDisplayName(currentUser.role),
        pages: routes.map((r) => r.label || r.key),
        canManageUsers: permissionUtils.canManageUsers(currentUser),
        canManageTasks: permissionUtils.canManageTasks(currentUser),
        canMoveTasks: permissionUtils.canMoveTasks(currentUser),
        canViewAnalytics: permissionUtils.canViewAnalytics(currentUser),
        canManageFinance: permissionUtils.canManageFinance(currentUser),
        canManageProjects: permissionUtils.canManageProjects(currentUser)
      };
    }

    case 'list_users': {
      if (!permissionUtils.canManageUsers(currentUser)) {
        return { error: 'You do not have permission to list users' };
      }
      let users = await userManagementService.getAllUsers();
      if (args.activeOnly !== false) {
        users = users.filter((u) => u.isActive !== false);
      }
      if (args.role) users = users.filter((u) => u.role === args.role);
      return {
        count: users.length,
        users: users.slice(0, 20).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: getRoleDisplayName(u.role),
          status: u.status || (u.isActive === false ? 'inactive' : 'active')
        }))
      };
    }

    case 'get_notifications_summary': {
      const unread = notifications.filter((n) => !n.read);
      return {
        total: notifications.length,
        unread: unread.length,
        recent: notifications.slice(0, 5).map((n) => ({
          title: n.title,
          message: n.message,
          read: n.read,
          type: n.type
        }))
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
};
