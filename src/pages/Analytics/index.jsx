import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiUsers, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle,
  FiCalendar,
  FiDownload
} from 'react-icons/fi';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementService } from '../../services/firebaseService';
import { dateUtils } from '../../utils/dateUtils';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import './Analytics.scss';

const Analytics = () => {
  const navigate = useNavigate();
  const { tasks, currentUser } = useTask();
  const { canViewAnalytics } = useAuth();
  const [users, setUsers] = useState([]);
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter, year
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await userManagementService.getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  if (!canViewAnalytics()) {
    return (
      <motion.div className="page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="access-denied">
          <FiAlertCircle size={48} />
          <h3>Access Denied</h3>
          <p>You don't have permission to view analytics.</p>
        </div>
      </motion.div>
    );
  }

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return { start: subDays(now, 7), end: now };
      case 'month':
        return { start: startOfMonth(now), end: now };
      case 'quarter':
        return { start: subDays(now, 90), end: now };
      case 'year':
        return { start: subDays(now, 365), end: now };
      default:
        return { start: startOfMonth(now), end: now };
    }
  };

  const dateRange = getDateRange();

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const taskDate = task.createdAt?.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
      const isInDateRange = isWithinInterval(taskDate, { start: dateRange.start, end: dateRange.end });
      
      const taskAssignees = Array.isArray(task.assignee) ? task.assignee : (task.assignee ? [task.assignee] : []);
      const assigneeUsers = taskAssignees.map(assigneeId => users.find(user => user.id === assigneeId)).filter(Boolean);
      
      const isRoleMatch = selectedRole === 'all' || assigneeUsers.some(user => user.role === selectedRole);
      const isUserMatch = selectedUser === 'all' || taskAssignees.includes(selectedUser);
      
      return isInDateRange && isRoleMatch && isUserMatch;
    });
  }, [tasks, dateRange, selectedRole, selectedUser, users]);

  const analytics = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const taskStatusCounts = filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    
    const completedTasks = taskStatusCounts.done || 0;
    const todoTasks = taskStatusCounts.todo || 0;
    const inProgressTasks = taskStatusCounts['in-progress'] || 0;
    
    const activeUsers = users.filter(user => user.isActive).length;
    const totalUsers = users.length;

    const roles = ['designer', 'developer', 'bd'];
    const roleStats = roles.map(role => {
      const roleUsers = users.filter(user => user.role === role && user.isActive);
      const roleTasks = filteredTasks.filter(task => {
        const taskAssignees = Array.isArray(task.assignee) ? task.assignee : (task.assignee ? [task.assignee] : []);
        return taskAssignees.some(assigneeId => {
          const assignee = users.find(user => user.id === assigneeId);
          return assignee && assignee.role === role;
        });
      });
      const completedTasks = roleTasks.filter(t => t.status === 'done').length;
      return {
        role,
        users: roleUsers.length,
        tasks: roleTasks.length,
        completed: completedTasks,
        completionRate: roleTasks.length > 0 ? Math.round((completedTasks / roleTasks.length) * 100) : 0
      };
    }).filter(stat => stat.users > 0);

    const userStats = users
      .filter(user => user.isActive)
      .map(user => {
        const userTasks = filteredTasks.filter(task => {
          const taskAssignees = Array.isArray(task.assignee) ? task.assignee : (task.assignee ? [task.assignee] : []);
          return taskAssignees.includes(user.id);
        });
        const completedUserTasks = userTasks.filter(t => t.status === 'done').length;
        return {
          id: user.id,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          totalTasks: userTasks.length,
          completedTasks: completedUserTasks,
          completionRate: userTasks.length > 0 ? Math.round((completedUserTasks / userTasks.length) * 100) : 0
        };
      })
      .filter(stat => stat.totalTasks > 0)
      .sort((a, b) => b.completionRate - a.completionRate);



    return {
      totalTasks,
      completedTasks,
      todoTasks,
      inProgressTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      activeUsers,
      totalUsers,
      roleStats,
      userStats
    };
  }, [filteredTasks, users]);

  const exportAnalytics = () => {
    const data = {
      timeRange,
      dateRange: {
        start: format(dateRange.start, 'yyyy-MM-dd'),
        end: format(dateRange.end, 'yyyy-MM-dd')
      },
      filters: {
        role: selectedRole,
        user: selectedUser
      },
      analytics
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateUtils.getCurrentDate().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div className="page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageTitle 
        title="Analytics"
        subtitle="Track your team's performance and project metrics"
        icon={FiBarChart2}
        showBackButton={true}
        backTo="/dashboard"
        actions={
          <Button 
            variant="secondary"
            onClick={exportAnalytics}
          >
            <FiDownload size={16} />
            Export Data
          </Button>
        }
      />
      
      {/* Filters */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Role:</label>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="designer">Designer</option>
            <option value="developer">Developer</option>
            <option value="bd">Business Development</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>User:</label>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="all">All Users</option>
            {users
              .filter(user => user.isActive)
              .filter(user => selectedRole === 'all' || user.role === selectedRole)
              .map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))
            }
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="analytics-grid">
        <motion.div 
          className="analytics-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-header">
            <h3>Tasks Completed</h3>
            <FiCheckCircle size={24} className="card-icon" />
          </div>
          <div className="analytics-metric">
            <span className="metric-value">{analytics.completedTasks}</span>
            <span className="metric-total">/ {analytics.totalTasks}</span>
          </div>
          <div className="metric-progress">
            <div 
              className="progress-bar" 
              style={{ width: `${analytics.completionRate}%` }}
            />
          </div>
          <p className="metric-label">{analytics.completionRate}% completion rate</p>
        </motion.div>

        <motion.div 
          className="analytics-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <h3>Active Team</h3>
            <FiUsers size={24} className="card-icon" />
          </div>
          <div className="analytics-metric">
            <span className="metric-value">{analytics.activeUsers}</span>
            <span className="metric-total">/ {analytics.totalUsers}</span>
          </div>
          <div className="metric-progress">
            <div 
              className="progress-bar" 
              style={{ width: `${Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}%` }}
            />
          </div>
          <p className="metric-label">Active team members</p>
        </motion.div>



        <motion.div 
          className="analytics-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <h3>Avg. Completion Time</h3>
            <FiClock size={24} className="card-icon" />
          </div>
          <div className="analytics-metric">
            <span className="metric-value">
              {analytics.totalTasks > 0 ? Math.round(analytics.totalTasks / analytics.completedTasks) : 0}
            </span>
          </div>
          <p className="metric-label">days per task</p>
        </motion.div>
      </div>

      {/* Role-based Analytics */}
      <div className="analytics-sections">
        <motion.div 
          className="analytics-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3>Performance by Role</h3>
          <div className="role-analytics">
            {analytics.roleStats.map((roleStat, index) => (
              <div key={roleStat.role} className="role-stat-card">
                <div className="role-header">
                  <span className="role-name">{roleStat.role.replace('_', ' ')}</span>
                  <span className="role-count">{roleStat.users} members</span>
                </div>
                <div className="role-metrics">
                  <div className="metric">
                    <span className="label">Tasks:</span>
                    <span className="value">{roleStat.tasks}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Completed:</span>
                    <span className="value">{roleStat.completed}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Rate:</span>
                    <span className="value">{roleStat.completionRate}%</span>
                  </div>
                </div>
                <div className="role-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${roleStat.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Performers */}
        <motion.div 
          className="analytics-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3>Top Performers</h3>
          <div className="top-performers">
            {analytics.userStats.map((userStat, index) => (
              <div key={userStat.id} className="performer-card">
                <div className="performer-rank">#{index + 1}</div>
                <div className="performer-info">
                  <div className="performer-avatar">
                    <Avatar 
                      src={userStat.avatar}
                      name={userStat.name}
                      size="medium"
                    />
                  </div>
                  <div className="performer-details">
                    <h4>{userStat.name}</h4>
                    <span className="performer-role">{userStat.role}</span>
                  </div>
                </div>
                <div className="performer-stats">
                  <div className="stat">
                    <span className="stat-value">{userStat.completionRate}%</span>
                    <span className="stat-label">Success Rate</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{userStat.completedTasks}</span>
                    <span className="stat-label">Completed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Task Status Distribution */}
        <motion.div 
          className="analytics-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3>Task Status Distribution</h3>
          <div className="status-distribution">
            <div className="status-item todo">
              <div className="status-info">
                <span className="status-name">To Do</span>
                <span className="status-count">{analytics.todoTasks}</span>
              </div>
              <div className="status-bar">
                <div 
                  className="status-progress" 
                  style={{ width: `${analytics.totalTasks > 0 ? (analytics.todoTasks / analytics.totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="status-item in-progress">
              <div className="status-info">
                <span className="status-name">In Progress</span>
                <span className="status-count">{analytics.inProgressTasks}</span>
              </div>
              <div className="status-bar">
                <div 
                  className="status-progress" 
                  style={{ width: `${analytics.totalTasks > 0 ? (analytics.inProgressTasks / analytics.totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="status-item done">
              <div className="status-info">
                <span className="status-name">Completed</span>
                <span className="status-count">{analytics.completedTasks}</span>
              </div>
              <div className="status-bar">
                <div 
                  className="status-progress" 
                  style={{ width: `${analytics.totalTasks > 0 ? (analytics.completedTasks / analytics.totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Analytics; 