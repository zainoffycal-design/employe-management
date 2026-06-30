import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome,
  FiFolder,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiLayout,
  FiPlus,
  FiBarChart,
  FiUserPlus,
  FiUserCheck,
  FiCalendar,
  FiMessageSquare,
  FiCheckCircle,
  FiActivity
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import { userManagementService } from '../../services/firebaseService';
import { firebaseUtils } from '../../utils/firebaseUtils';
import { getRoleDisplayName, permissionUtils } from '../../utils/permissionUtils';
import { parseTextWithMentions } from '../../utils/uiUtils';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button';
import ProjectCard from '../../components/ProjectCard';
import './Dashboard.scss';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { tasks, projects } = useTask();
  const [users, setUsers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);


  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        const allUsers = await userManagementService.getAllUsers();
        if (isMounted) setUsers(allUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    
    const loadAllTasks = async () => {
      try {
        if (currentUser?.role === 'super_manager' || currentUser?.role === 'manager') {
          const allProjects = await firebaseUtils.getDocuments('projects');
          const allTasksData = await Promise.all(
            allProjects.map(async project => {
              const projectTasks = await firebaseUtils.getDocuments(`projects/${project.id}/tasks`);
              return projectTasks.map(task => ({ ...task, projectId: project.id }));
            })
          );
          if (isMounted) setAllTasks(allTasksData.flat());
        }
      } catch (error) {
        console.error('Error loading all tasks:', error);
      }
    };

    loadUsers();
    loadAllTasks();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const overdueTasks = useMemo(() => 
    tasks.filter(task => 
      task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'
    ), [tasks]
  );

  const dueSoonTasks = useMemo(() => 
    tasks.filter(task => {
      if (!task.deadline || task.status === 'done') return false;
      const deadline = new Date(task.deadline);
      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);
      return deadline > today && deadline <= threeDaysFromNow;
    }), [tasks]
  );

  const getRoleStats = useCallback(() => {
    const roles = ['designer', 'developer', 'bd'];
    return roles.map(role => {
      const roleMembers = users.filter(user => user.role === role && user.isActive);
      const totalRoleMembers = users.filter(user => user.role === role);
      
      const roleTasks = allTasks.filter(task => {
        const assigneeIds = Array.isArray(task.assignee) ? task.assignee : [task.assignee];
        return assigneeIds.some(assigneeId => {
          const assignee = users.find(user => user.id === assigneeId || user.uid === assigneeId);
          return assignee && assignee.role === role;
        });
      });
      
      const statusCounts = roleTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});
      
      const todoTasks = statusCounts.todo || 0;
      const inProgressTasks = statusCounts['in-progress'] || 0;
      const inReviewTasks = statusCounts['in-review'] || 0;
      const completedTasks = statusCounts.done || 0;
      
      return {
        role,
        activeMembers: roleMembers.length,
        totalMembers: totalRoleMembers.length,
        tasks: roleTasks.length,
        todo: todoTasks,
        inProgress: inProgressTasks,
        inReview: inReviewTasks,
        completed: completedTasks,
        status: roleMembers.length > 0 ? 'active' : 'inactive'
      };
    });
  }, [users, allTasks]);

  const getProjectHours = useCallback(() => {
    const projectHours = projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      
      // Calculate actual hours from time entries
      const actualHours = projectTasks.reduce((sum, task) => {
        if (task.timeEntries && task.timeEntries.length > 0) {
          const taskHours = task.timeEntries.reduce((entrySum, entry) => {
            return entrySum + (parseFloat(entry.hours) || 0);
          }, 0);
          return sum + taskHours;
        }
        // Fallback to totalHours if no time entries
        return sum + (parseFloat(task.totalHours) || 0);
      }, 0);
      
      // Calculate estimated hours
      const estimatedHours = projectTasks.reduce((sum, task) => {
        const estimated = task.estimatedHours || task.estimatedTimeData?.hours || 0;
        return sum + (parseFloat(estimated) || 0);
      }, 0);
      
      return {
        projectId: project.id,
        projectName: project.name,
        totalHours: actualHours,
        estimatedHours,
        taskCount: projectTasks.length
      };
    });
    
    const totalHours = projectHours.reduce((sum, p) => sum + p.totalHours, 0);
    const totalEstimatedHours = projectHours.reduce((sum, p) => sum + p.estimatedHours, 0);
    return { projectHours, totalHours, totalEstimatedHours };
  }, [projects, tasks]);

  const { totalHours, totalEstimatedHours } = useMemo(() => getProjectHours(), [getProjectHours]);

  const completedProjects = useMemo(() => 
    projects.filter(project => project.status === 'completed' || project.status === 'terminate'), [projects]
  );

  const activeTasks = useMemo(() => 
    tasks.filter(task => task.status !== 'done'), [tasks]
  );

  const recentActivities = useMemo(() => {
    if (!permissionUtils.isSuperManager(currentUser)) {
      return [];
    }

    const activities = [];

    const tasksWithProjects = tasks.map(task => {
      const project = projects.find(p => p.id === task.projectId);
      return {
        ...task,
        projectName: project?.name || 'Unknown Project'
      };
    });

    tasksWithProjects.forEach(task => {
      if (task.status !== 'done' && task.comments && task.comments.length > 0) {
        task.comments.forEach(comment => {
          activities.push({
            type: 'comment',
            id: `comment-${comment.id}-${task.id}`,
            timestamp: comment.createdAt || comment.updatedAt,
            taskId: task.id,
            taskTitle: task.title,
            projectId: task.projectId,
            projectName: task.projectName,
            authorId: comment.authorId,
            authorName: comment.authorName,
            authorAvatar: comment.authorAvatar,
            text: comment.text
          });
        });
      }
    });

    tasksWithProjects.forEach(task => {
      if (task.createdAt) {
        activities.push({
          type: 'task_created',
          id: `task-created-${task.id}`,
          timestamp: task.createdAt,
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          projectName: task.projectName,
          creatorId: task.createdBy || task.creatorId,
          status: task.status
        });
      }
    });

    tasksWithProjects.forEach(task => {
      if (task.status === 'done' && task.updatedAt) {
        activities.push({
          type: 'task_completed',
          id: `task-completed-${task.id}`,
          timestamp: task.updatedAt,
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          projectName: task.projectName,
          completedBy: task.completedBy || task.updatedBy
        });
      }
    });

    projects.forEach(project => {
      if ((project.status === 'completed' || project.status === 'terminate') && project.updatedAt) {
        activities.push({
          type: project.status === 'terminate' ? 'project_terminated' : 'project_completed',
          id: `project-${project.status}-${project.id}`,
          timestamp: project.updatedAt,
          projectId: project.id,
          projectName: project.name,
          completedBy: project.completedBy || project.updatedBy
        });
      }
    });

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);
  }, [tasks, projects, currentUser]);

  const stats = useMemo(() => {
    const timeEstimateText = totalEstimatedHours > 0 
      ? `${totalHours.toFixed(1)}h / ${totalEstimatedHours.toFixed(1)}h`
      : totalHours > 0 
        ? `${totalHours.toFixed(1)}h logged` 
        : 'No time tracked';
    
    const timeEstimateTrend = totalEstimatedHours > 0
      ? totalHours <= totalEstimatedHours 
        ? 'On track' 
        : 'Over estimate'
      : 'No estimate';

    return [
      {
        title: 'Total Projects',
        value: projects.length,
        icon: FiFolder,
        color: 'var(--primary-color)',
        trendUp: projects.length > 0,
        trend: projects.length > 0 ? `${projects.length} active` : 'No projects'
      },
      {
        title: 'Time Estimate',
        value: totalEstimatedHours > 0 ? totalEstimatedHours.toFixed(1) : '-',
        icon: FiBarChart,
        color: '#8B5CF6',
        trendUp: totalEstimatedHours > 0 && totalHours <= totalEstimatedHours,
        trend: timeEstimateText,
        subtitle: timeEstimateTrend
      },
      {
        title: 'Completed Projects',
        value: completedProjects.length,
        icon: FiUserCheck,
        color: 'var(--primary-light)',
        trendUp: completedProjects.length > 0,
        trend: completedProjects.length > 0 ? 
          `${Math.round((completedProjects.length / projects.length) * 100)}% of projects` : 
          'None completed'
      },
      {
        title: 'Active Tasks',
        value: activeTasks.length,
        icon: FiLayout,
        color: '#6366F1',
        trendUp: activeTasks.length > 0,
        trend: activeTasks.length > 0 
          ? `${activeTasks.length} active` 
          : 'No active tasks'
      }
    ];
  }, [projects, totalHours, totalEstimatedHours, completedProjects, activeTasks]);

  const getQuickActions = useCallback(() => {
    const baseActions = [
      {
        icon: FiFolder,
        title: 'Projects',
        description: 'Manage your projects',
        link: '/projects',
        color: 'var(--primary-color)'
      }
    ];

    if (currentUser?.role === 'super_manager') {
      return [
        ...baseActions,
        {
          icon: FiBarChart,
          title: 'Employee Performance',
          description: 'Track employee costs and profitability',
          link: '/employee-performance',
          color: '#6366F1'
        },
        {
          icon: FiUserPlus,
          title: 'User Management',
          description: 'Manage user accounts',
          link: '/users',
          color: '#F59E0B'
        }
      ];
    }

    if (currentUser?.role === 'manager') {
      return [
        ...baseActions,
        {
          icon: FiUserPlus,
          title: 'User Management',
          description: 'Manage user accounts',
          link: '/users',
          color: '#F59E0B'
        }
      ];
    }

    return [
      ...baseActions
    ];
  }, [currentUser]);

  return (
    <div className="page-container">
      <PageTitle 
        title="Dashboard"
        subtitle={`Welcome back, ${currentUser?.name}! Here's what's happening with your projects.`}
        icon={FiHome}
      />

      {(overdueTasks.length > 0 || dueSoonTasks.length > 0) && (
        <div className="deadline-alerts">
          {overdueTasks.length > 0 && (
            <div className="alert alert-danger">
              <FiAlertCircle size={16} />
              <span>{overdueTasks.length} task(s) overdue</span>
            </div>
          )}
          {dueSoonTasks.length > 0 && (
            <div className="alert alert-warning">
              <FiClock size={16} />
              <span>{dueSoonTasks.length} task(s) due soon</span>
            </div>
          )}
        </div>
      )}

      <div className="section-header">
        <div className="section-title">
          <FiLayout className="section-icon" />
          <h2>Quick Actions</h2>
        </div>
      </div>
      <div className="quick-actions">
        {getQuickActions().map((action, index) => (
          <motion.div
            key={action.title}
            className="action-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(action.link)}
          >
            <div className="action-icon" style={{ color: action.color }}>
              <action.icon size={24} />
            </div>
            <div className="action-content">
              <h3>{action.title}</h3>
              <p>{action.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="section-header">
        <div className="section-title">
          <FiBarChart className="section-icon" />
          <h2>Overview</h2>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="stat-icon" style={{ color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-title">{stat.title}</p>
              {stat.subtitle && (
                <p className="stat-subtitle">{stat.subtitle}</p>
              )}
              <div className={`stat-trend ${stat.trendUp ? 'up' : 'down'}`}>
                {stat.trendUp ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                <span>{stat.trend}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {(currentUser?.role === 'super_manager' || currentUser?.role === 'manager') && (
        <div className="section-header">
          <div className="section-title">
            <FiUserCheck className="section-icon" />
            <h2>Roles Overview</h2>
          </div>
        </div>
      )}
      {(currentUser?.role === 'super_manager' || currentUser?.role === 'manager') && (
        <div className="roles-overview-section">
          <div className="roles-grid">
            {getRoleStats().map((roleStat, index) => (
              <motion.div
                key={roleStat.role}
                className="role-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="role-header">
                  <div className="role-info">
                    <div className={`role-color ${roleStat.role}`} />
                    <span className="role-name">{getRoleDisplayName(roleStat.role)}</span>
                    <span className={`role-status ${roleStat.status}`}>
                      {roleStat.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="role-badges">
                    <span className="badge bg-primary">
                      <span className="badge-label">Active:</span>
                      {roleStat.activeMembers}
                    </span>
                    <span className="badge bg-info">
                      <span className="badge-label">Total:</span>
                      {roleStat.totalMembers}
                    </span>
                  </div>
                </div>
                
                <div className="role-stats">
                  <div className="stat-item">
                    <span className="stat-label todo">
                      <span className="dot"></span>To Do
                    </span>
                    <span className="stat-value">{roleStat.todo}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label in-progress">
                      <span className="dot"></span>In Progress
                    </span>
                    <span className="stat-value">{roleStat.inProgress}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label in-review">
                      <span className="dot"></span>In Review
                    </span>
                    <span className="stat-value">{roleStat.inReview}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label done">
                      <span className="dot"></span>Done
                    </span>
                    <span className="stat-value">{roleStat.completed}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="side-by-side-sections">
        <div className="section-half">
          <div className="section-header">
            <div className="section-title">
              <FiFolder className="section-icon" />
              <h2>Your Projects</h2>
            </div>
          </div>

          <div className="projects-card">
            <div className="projects-container">
              {projects.length > 0 ? (
                <>
                  <div className="projects-grid dashboard-projects-grid mb-3">
                    {projects
                      .sort((a, b) => {
                        const dateA = new Date(a.createdAt || 0);
                        const dateB = new Date(b.createdAt || 0);
                        return dateB - dateA;
                      })
                      .slice(0, 4).map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        tasks={tasks}
                        index={index}
                        variant="dashboard"
                        users={users}
                        isCompleted={project.status === 'completed' || project.status === 'terminate'}
                        isTerminated={project.status === 'terminate'}
                      />
                    ))}
                  </div>
                  <div className="card-footer">
                    <Button 
                      variant="primary"
                      onClick={() => navigate('/projects')}
                    >
                      <FiFolder size={16} />
                      View All Projects
                    </Button>
                  </div>
                </>
              ) : (
                <motion.div 
                  className="empty-state-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="empty-state-icon">
                    <FiFolder size={48} />
                  </div>
                  <h3>No Projects Available</h3>
                  <p>There are no projects in the system yet. Contact your manager to create projects.</p>
                  <Button 
                    variant="primary"
                    onClick={() => navigate('/projects')}
                  >
                    <FiFolder size={16} />
                    View Projects
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="section-half">
          <div className="section-header">
            <div className="section-title">
              <FiClock className="section-icon" />
              <h2>Recent Tasks</h2>
            </div>
          </div>

          <div className="tasks-card">
            <div className="tasks-container">
              {tasks.length > 0 ? (
                <div className="tasks-list">
                  {tasks.slice(0, 5).map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    return (
                      <motion.div
                        key={task.id}
                        className="task-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <div className="task-status" data-status={task.status}>
                          {task.status === 'todo' ? 'Todo' : 
                           task.status === 'in-progress' ? 'In Progress' :
                           task.status === 'in-review' ? 'In Review' :
                           task.status === 'done' ? 'Complete' : task.status}
                        </div>
                        <div className="task-content">
                          <h4>{task.title}</h4>
                          <p>{project?.name}</p>
                        </div>
                        <div className="task-meta">
                          {task.totalHours > 0 ? (
                            <span className="task-hours">
                              <FiClock size={12} />
                              {task.totalHours.toFixed(1)}h
                            </span>
                          ) : null}
                          {task.deadline && (
                            <span className="task-deadline">
                              <FiCalendar size={12} />
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => {
                            const isEndState = project?.status === 'completed' || project?.status === 'terminate';
                            const canAccess = !isEndState || currentUser?.role === 'super_manager';
                            if (canAccess) {
                              navigate(`/project/${task.projectId}/board`);
                            }
                          }}
                          title={(project?.status === 'completed' || project?.status === 'terminate') && currentUser?.role !== 'super_manager' ? "You don't have permission to access completed/terminated projects. Only super managers can access these project boards." : ""}
                          disabled={(project?.status === 'completed' || project?.status === 'terminate') && currentUser?.role !== 'super_manager'}
                        >
                          <FiLayout size={14} />
                          View Board
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div 
                  className="empty-state-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="empty-state-icon">
                    <FiClock size={48} />
                  </div>
                  <h3>No Tasks Yet</h3>
                  <p>Once you create projects and add tasks, your recent activity will appear here.</p>
                  <Button 
                    variant="primary"
                    onClick={() => navigate('/projects')}
                  >
                    <FiPlus size={16} />
                    Add Tasks
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {permissionUtils.isSuperManager(currentUser) && (
        <div className="recent-activities-section">
        <div className="section-header">
          <div className="section-title">
            <FiActivity className="section-icon" />
            <h2>Recent Activities</h2>
          </div>
        </div>

        <div className="activities-card">
          <div className="activities-container">
            {recentActivities.length > 0 ? (
              <div className="activities-list">
                {recentActivities.map((activity, index) => {
                  const user = users.find(u => 
                    u.id === activity.authorId || 
                    u.id === activity.creatorId || 
                    u.id === activity.completedBy ||
                    u.uid === activity.authorId || 
                    u.uid === activity.creatorId || 
                    u.uid === activity.completedBy
                  );
                  const project = projects.find(p => p.id === activity.projectId);

                  return (
                    <motion.div
                      key={activity.id}
                      className="activity-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="activity-icon">
                        {activity.type === 'comment' && <FiMessageSquare size={16} />}
                        {activity.type === 'task_created' && <FiPlus size={16} />}
                        {activity.type === 'task_completed' && <FiCheckCircle size={16} />}
                        {(activity.type === 'project_completed' || activity.type === 'project_terminated') && <FiFolder size={16} />}
                      </div>
                      <div className="activity-content">
                        <div className="activity-text">
                          {activity.type === 'comment' && (
                            <>
                              <strong>{activity.authorName || user?.name || 'Someone'}</strong> commented on{' '}
                              <strong>{activity.taskTitle}</strong> in <strong>{activity.projectName}</strong>
                            </>
                          )}
                          {activity.type === 'task_created' && (
                            <>
                              <strong>{activity.taskTitle}</strong> was created in{' '}
                              <strong>{activity.projectName}</strong>
                            </>
                          )}
                          {activity.type === 'task_completed' && (
                            <>
                              <strong>{activity.taskTitle}</strong> was completed in{' '}
                              <strong>{activity.projectName}</strong>
                            </>
                          )}
                          {activity.type === 'project_completed' && (
                            <>
                              <strong>{activity.projectName}</strong> project was completed
                            </>
                          )}
                          {activity.type === 'project_terminated' && (
                            <>
                              <strong>{activity.projectName}</strong> project was terminated
                            </>
                          )}
                        </div>
                        <div className="activity-meta">
                          <span className="activity-time">
                            {new Date(activity.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {activity.type === 'comment' && activity.text && (
                            <div className="activity-preview">
                              {(() => {
                                // Parse mentions properly to handle names with spaces
                                const parsedText = parseTextWithMentions(activity.text);
                                const parts = [];
                                
                                parsedText.forEach((part, idx) => {
                                  if (part.type === 'mention') {
                                    parts.push(
                                      <span key={idx} className="mention-tag">@{part.name}</span>
                                    );
                                  } else {
                                    parts.push(part.content);
                                  }
                                });
                                
                                // Join all parts to get full text for truncation
                                const fullText = parsedText.map(part => 
                                  part.type === 'mention' ? `@${part.name}` : part.content
                                ).join('');
                                
                                // Truncate if needed (but preserve mention structure)
                                if (fullText.length > 100) {
                                  // Find where to truncate while preserving mentions
                                  let charCount = 0;
                                  const truncatedParts = [];
                                  
                                  for (let i = 0; i < parsedText.length && charCount < 100; i++) {
                                    const part = parsedText[i];
                                    if (part.type === 'mention') {
                                      const mentionText = `@${part.name}`;
                                      if (charCount + mentionText.length <= 100) {
                                        truncatedParts.push(
                                          <span key={i} className="mention-tag">@{part.name}</span>
                                        );
                                        charCount += mentionText.length;
                                      } else {
                                        break;
                                      }
                                    } else {
                                      const remainingChars = 100 - charCount;
                                      if (part.content.length <= remainingChars) {
                                        truncatedParts.push(part.content);
                                        charCount += part.content.length;
                                      } else {
                                        truncatedParts.push(part.content.substring(0, remainingChars));
                                        charCount = 100;
                                        break;
                                      }
                                    }
                                  }
                                  
                                  return (
                                    <span className="comment-text">
                                      {truncatedParts}
                                      <span>...</span>
                                    </span>
                                  );
                                }
                                
                                return (
                                  <span className="comment-text">
                                    {parts}
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                      {(activity.type === 'task_created' || activity.type === 'task_completed' || activity.type === 'comment' || activity.type === 'project_completed' || activity.type === 'project_terminated') && (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => {
                            const project = projects.find(p => p.id === activity.projectId);
                            const isEndState = project?.status === 'completed' || project?.status === 'terminate';
                            const canAccess = !isEndState || currentUser?.role === 'super_manager';
                            if (canAccess) {
                              navigate(`/project/${activity.projectId}/board`);
                            }
                          }}
                          title={(project?.status === 'completed' || project?.status === 'terminate') && currentUser?.role !== 'super_manager' ? "You don't have permission to access completed/terminated projects." : "View Project Board"}
                          disabled={(project?.status === 'completed' || project?.status === 'terminate') && currentUser?.role !== 'super_manager'}
                        >
                          <FiLayout size={14} />
                          View
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div 
                className="empty-state-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="empty-state-icon">
                  <FiActivity size={48} />
                </div>
                <h3>No Recent Activities</h3>
                <p>Recent comments, task creations, and completions will appear here.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      )}

    </div>
  );
};

export default Dashboard; 