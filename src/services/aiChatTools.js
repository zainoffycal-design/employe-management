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

const normalizeStatus = (status) => {
  if (!status) return status;
  const s = String(status).toLowerCase().trim().replace(/\s+/g, '-');
  const map = {
    todo: 'todo',
    'to-do': 'todo',
    tod: 'todo',
    'in-progress': 'in-progress',
    inprogress: 'in-progress',
    progress: 'in-progress',
    'in-review': 'in-review',
    inreview: 'in-review',
    review: 'in-review',
    done: 'done',
    complete: 'done',
    completed: 'done'
  };
  return map[s] || s;
};

const resolveTask = (tasks, projects, args) => {
  const project = findProject(projects, args);
  const projectId = project?.id || args.projectId;

  let pool = projectId ? tasks.filter((t) => t.projectId === projectId) : [...tasks];

  if (args.taskId) {
    const task = pool.find((t) => t.id === args.taskId);
    if (!task) return { error: 'Task not found with that ID.' };
    return { task };
  }

  if (args.taskTitle) {
    const term = args.taskTitle.toLowerCase();
    pool = pool.filter((t) => (t.title || '').toLowerCase().includes(term));
  }

  if (args.status) {
    const normalized = normalizeStatus(args.status);
    pool = pool.filter((t) => t.status === normalized);
  }

  if (args.taskIndex != null && args.taskIndex !== '') {
    const idx = Number(args.taskIndex) - 1;
    if (idx >= 0 && idx < pool.length) {
      return { task: pool[idx] };
    }
    return { error: `No task at position ${args.taskIndex} in the matching list.` };
  }

  if (pool.length === 0) {
    return { error: 'Task not found. Use list_tasks to see available tasks, or provide projectName/status to narrow down.' };
  }

  if (pool.length === 1) {
    return { task: pool[0] };
  }

  return {
    error: 'Multiple tasks match. Specify status, projectName, taskId, or taskIndex (1-based from a list_tasks result).',
    matches: pool.slice(0, 10).map((t, i) => ({
      index: i + 1,
      id: t.id,
      title: t.title,
      status: t.status,
      projectName: projects.find((p) => p.id === t.projectId)?.name
    }))
  };
};

const resolveAssigneeIds = async (assigneeName, assigneeNames) => {
  const users = await userManagementService.getAllUsers();
  const activeUsers = users.filter((u) => u.isActive !== false && u.status !== 'invited');
  const names = assigneeNames?.length ? assigneeNames : assigneeName ? [assigneeName] : [];

  if (!names.length) {
    return { error: 'Provide assigneeName or assigneeNames.' };
  }

  const ids = [];

  for (const name of names) {
    const term = name.toLowerCase();
    const matches = activeUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
    );

    if (matches.length === 0) {
      return { error: `No active user found matching "${name}".` };
    }

    if (matches.length > 1) {
      return {
        error: `Multiple users match "${name}". Be more specific.`,
        matches: matches.slice(0, 5).map((u) => ({ name: u.name, email: u.email }))
      };
    }

    ids.push(matches[0].id || matches[0].uid);
  }

  return { ids: [...new Set(ids)] };
};

const taskToolParams = {
  projectId: { type: 'string' },
  projectName: { type: 'string' },
  taskId: { type: 'string' },
  taskTitle: { type: 'string', description: 'Find task by title (partial match)' },
  status: { type: 'string', description: 'Filter by current status when multiple tasks share a title' },
  taskIndex: { type: 'number', description: '1-based index from list_tasks when disambiguating' }
};

export const AI_TOOL_DEFINITIONS = [
  {
    name: 'navigate_to',
    description: 'Navigate the user to an app route they can access',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Route path e.g. /, /projects, /users' }
      },
      required: ['path']
    }
  },
  {
    name: 'open_project_board',
    description: 'Open a project Kanban board by project id or name',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        projectName: { type: 'string' }
      }
    }
  },
  {
    name: 'get_dashboard_summary',
    description: 'Get summary counts for projects, tasks, overdue items',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'list_projects',
    description: 'List projects the user can see',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        status: { type: 'string', enum: ['active', 'completed', 'all'] }
      }
    }
  },
  {
    name: 'list_tasks',
    description: 'List tasks with optional filters. Use to disambiguate tasks with the same title.',
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
  },
  {
    name: 'create_task',
    description: 'Create a new task in a project. Can assign users by name on creation.',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        projectName: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        status: { type: 'string', enum: ['todo', 'in-progress', 'in-review', 'done'] },
        assigneeName: { type: 'string', description: 'Assign to user by name or email (partial match)' },
        assigneeNames: { type: 'array', items: { type: 'string' }, description: 'Assign multiple users by name' }
      },
      required: ['title']
    }
  },
  {
    name: 'update_task_status',
    description: 'Move a task to a new status. Find by taskTitle (and optional status/projectName to disambiguate).',
    parameters: {
      type: 'object',
      properties: {
        ...taskToolParams,
        newStatus: {
          type: 'string',
          enum: ['todo', 'in-progress', 'in-review', 'done'],
          description: 'Target status (also accepts aliases like progress, tod, review)'
        }
      },
      required: ['newStatus']
    }
  },
  {
    name: 'assign_task',
    description: 'Assign a task to one or more users by name. Find task by taskTitle with optional status/projectName.',
    parameters: {
      type: 'object',
      properties: {
        ...taskToolParams,
        assigneeName: { type: 'string' },
        assigneeNames: { type: 'array', items: { type: 'string' } },
        replaceAssignees: { type: 'boolean', description: 'If false, add to existing assignees. Default true.' }
      },
      required: ['assigneeName']
    }
  },
  {
    name: 'delete_task',
    description: 'Permanently delete a task. Find by taskTitle. Requires confirm:true after user explicitly confirms.',
    parameters: {
      type: 'object',
      properties: {
        ...taskToolParams,
        confirm: { type: 'boolean', description: 'Must be true after user confirms deletion' }
      },
      required: ['confirm']
    }
  },
  {
    name: 'get_my_permissions',
    description: 'Explain what the current user can access and do',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'list_users',
    description: 'List team users (managers only)',
    parameters: {
      type: 'object',
      properties: {
        role: { type: 'string' },
        activeOnly: { type: 'boolean' }
      }
    }
  },
  {
    name: 'get_notifications_summary',
    description: 'Get unread and recent notifications for the user',
    parameters: { type: 'object', properties: {} }
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
    updateTask,
    deleteTask
  } = ctx;

  switch (name) {
    case 'navigate_to': {
      let path = (args.path || '').split('?')[0];
      if (path === '/' || path === '') path = '/dashboard';
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
      if (args.status) list = list.filter((t) => t.status === normalizeStatus(args.status));
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
      const users = await userManagementService.getAllUsers();
      return {
        count: list.length,
        tasks: list.slice(0, limit).map((t, i) => {
          const proj = projects.find((p) => p.id === t.projectId);
          const assignees = Array.isArray(t.assignee) ? t.assignee : t.assignee ? [t.assignee] : [];
          const assigneeNames = assignees
            .map((id) => users.find((u) => u.id === id || u.uid === id)?.name)
            .filter(Boolean);
          return {
            index: i + 1,
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            deadline: t.deadline,
            projectId: t.projectId,
            projectName: proj?.name,
            assignees: assigneeNames.length ? assigneeNames : undefined
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

      let assignee = [];
      if (args.assigneeName || args.assigneeNames?.length) {
        if (!permissionUtils.canAssignTasks(currentUser)) {
          return { error: 'You do not have permission to assign tasks' };
        }
        const resolved = await resolveAssigneeIds(args.assigneeName, args.assigneeNames);
        if (resolved.error) return resolved;
        assignee = resolved.ids;
      }

      const taskId = await createTask(project.id, {
        title: args.title,
        description: args.description || '',
        status: normalizeStatus(args.status) || 'todo',
        priority: args.priority || 'medium',
        assignee,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid
      });

      return {
        success: true,
        taskId,
        projectId: project.id,
        projectName: project.name,
        title: args.title,
        assignees: assignee.length ? assignee : undefined
      };
    }

    case 'update_task_status': {
      if (!permissionUtils.canMoveTasks(currentUser)) {
        return { error: 'You do not have permission to move tasks' };
      }
      const newStatus = normalizeStatus(args.newStatus || args.status);
      if (!['todo', 'in-progress', 'in-review', 'done'].includes(newStatus)) {
        return { error: `Invalid status "${args.newStatus}". Use todo, in-progress, in-review, or done.` };
      }

      const resolved = resolveTask(tasks, projects, args);
      if (resolved.error) {
        return resolved.matches ? { error: resolved.error, matches: resolved.matches } : { error: resolved.error };
      }

      const { task } = resolved;
      await updateTask(task.projectId, task.id, { status: newStatus });
      return {
        success: true,
        taskId: task.id,
        title: task.title,
        previousStatus: task.status,
        status: newStatus,
        projectName: projects.find((p) => p.id === task.projectId)?.name
      };
    }

    case 'assign_task': {
      if (!permissionUtils.canAssignTasks(currentUser)) {
        return { error: 'You do not have permission to assign tasks' };
      }

      const resolved = resolveTask(tasks, projects, args);
      if (resolved.error) {
        return resolved.matches ? { error: resolved.error, matches: resolved.matches } : { error: resolved.error };
      }

      const assigneeResult = await resolveAssigneeIds(args.assigneeName, args.assigneeNames);
      if (assigneeResult.error) return assigneeResult;

      const { task } = resolved;
      const existing = Array.isArray(task.assignee) ? task.assignee : task.assignee ? [task.assignee] : [];
      const assignee = args.replaceAssignees === false
        ? [...new Set([...existing, ...assigneeResult.ids])]
        : assigneeResult.ids;

      await updateTask(task.projectId, task.id, { assignee });

      const users = await userManagementService.getAllUsers();
      const assigneeNames = assignee
        .map((id) => users.find((u) => u.id === id || u.uid === id)?.name)
        .filter(Boolean);

      return {
        success: true,
        taskId: task.id,
        title: task.title,
        assignees: assigneeNames,
        projectName: projects.find((p) => p.id === task.projectId)?.name
      };
    }

    case 'delete_task': {
      if (!permissionUtils.canDeleteTasks(currentUser)) {
        return { error: 'You do not have permission to delete tasks' };
      }
      if (!args.confirm) {
        return {
          error: 'Deletion requires user confirmation. Ask the user to confirm, then call delete_task again with confirm: true.'
        };
      }

      const resolved = resolveTask(tasks, projects, args);
      if (resolved.error) {
        return resolved.matches ? { error: resolved.error, matches: resolved.matches } : { error: resolved.error };
      }

      const { task } = resolved;
      await deleteTask(task.projectId, task.id);
      return {
        success: true,
        taskId: task.id,
        title: task.title,
        message: `Deleted task "${task.title}"`
      };
    }

    case 'get_my_permissions': {
      const routes = permissionUtils.getSidebarNavigation(currentUser);
      return {
        role: getRoleDisplayName(currentUser.role),
        pages: routes.map((r) => r.label || r.key),
        canManageUsers: permissionUtils.canManageUsers(currentUser),
        canManageTasks: permissionUtils.canManageTasks(currentUser),
        canMoveTasks: permissionUtils.canMoveTasks(currentUser),
        canAssignTasks: permissionUtils.canAssignTasks(currentUser),
        canDeleteTasks: permissionUtils.canDeleteTasks(currentUser),
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
