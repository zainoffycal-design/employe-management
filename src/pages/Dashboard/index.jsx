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
  FiPackage
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import { userManagementService } from '../../services/firebaseService';
import { firebaseUtils } from '../../utils/firebaseUtils';
import { getRoleDisplayName } from '../../utils/permissionUtils';
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
      const totalHours = projectTasks.reduce((sum, task) => sum + (task.totalHours || 0), 0);
      return {
        projectId: project.id,
        projectName: project.name,
        totalHours,
        taskCount: projectTasks.length
      };
    });
    
    const totalHours = projectHours.reduce((sum, p) => sum + p.totalHours, 0);
    return { projectHours, totalHours };
  }, [projects, tasks]);

  const { projectHours, totalHours } = useMemo(() => getProjectHours(), [getProjectHours]);

  const completedProjects = useMemo(() => 
    projects.filter(project => project.status === 'completed'), [projects]
  );

  const stats = useMemo(() => [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: FiFolder,
      color: '#15A970',
      trendUp: projects.length > 0,
      trend: projects.length > 0 ? `${projects.length} active` : 'No projects'
    },
    {
      title: 'Total Hours',
      value: totalHours.toFixed(1),
      icon: FiClock,
      color: '#F59E0B',
      trendUp: totalHours > 0,
      trend: totalHours > 0 ? `${totalHours.toFixed(1)}h logged` : 'No time tracked'
    },
    {
      title: 'Completed Projects',
      value: completedProjects.length,
      icon: FiUserCheck,
      color: '#10B981',
      trendUp: completedProjects.length > 0,
      trend: completedProjects.length > 0 ? 
        `${Math.round((completedProjects.length / projects.length) * 100)}% of projects` : 
        'None completed'
    },
    {
      title: 'Total Tasks',
      value: tasks.length,
      icon: FiLayout,
      color: '#6366F1',
      trendUp: tasks.length > 0,
      trend: tasks.length > 0 ? `${tasks.length} tasks` : 'No tasks'
    }
  ], [projects, totalHours, completedProjects, tasks]);

  const getQuickActions = useCallback(() => {
    const baseActions = [
      {
        icon: FiFolder,
        title: 'Projects',
        description: 'Manage your projects',
        link: '/projects',
        color: '#15A970'
      },
      {
        icon: FiPackage,
        title: 'Asset Manager',
        description: 'Manage your office assets',
        link: '/assets',
        color: '#8B5CF6'
      }
    ];

    if (currentUser?.role === 'super_manager') {
      return [
        ...baseActions,
        {
          icon: FiBarChart,
          title: 'Analytics',
          description: 'View performance metrics',
          link: '/analytics',
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
          icon: FiBarChart,
          title: 'Analytics',
          description: 'View performance metrics',
          link: '/analytics',
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

      {projectHours.length > 0 && totalHours > 0 && (
        <div className="section-header">
          <div className="section-title">
            <FiClock className="section-icon" />
            <h2>Project Hours</h2>
          </div>
        </div>
      )}
      {projectHours.length > 0 && totalHours > 0 && (
        <div className="project-hours-section">
          <div className="hours-grid">
            {projectHours
              .filter(p => p.totalHours > 0)
              .sort((a, b) => b.totalHours - a.totalHours)
              .slice(0, 4)
              .map((project, index) => (
              <motion.div
                key={project.projectId}
                className="hours-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="hours-header">
                  <h4>{project.projectName}</h4>
                  <span className="hours-badge">{project.totalHours.toFixed(1)}h</span>
                </div>
                <div className="hours-details">
                  <span className="task-count">{project.taskCount} tasks</span>
                  <div className="hours-bar">
                    <div 
                      className="hours-progress" 
                      style={{ 
                        width: `${Math.min((project.totalHours / Math.max(...projectHours.map(p => p.totalHours))) * 100, 100)}%` 
                      }}
                    />
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
                  <div className="projects-grid mb-3">
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
                          onClick={() => navigate(`/project/${task.projectId}/board`)}
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

    </div>
  );
};

export default Dashboard; 