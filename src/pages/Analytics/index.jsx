import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiAlertCircle, FiFolder } from 'react-icons/fi';
import { startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementService } from '../../services/firebaseService';
import { getRoleDisplayName } from '../../utils/permissionUtils';
import { reactSelectStyles } from '../../utils/uiUtils';
import PageTitle from '../../components/PageTitle';
import Avatar from '../../components/Avatar';
import Select from 'react-select';
import './Analytics.scss';

const Analytics = () => {
  const { tasks, projects } = useTask();
  const { canViewAnalytics } = useAuth();
  const [users, setUsers] = useState([]);
  const [timeRange, setTimeRange] = useState('day');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedRole, setSelectedRole] = useState(null);
  const [customMonth, setCustomMonth] = useState(new Date().getMonth());
  const [customYear, setCustomYear] = useState(new Date().getFullYear());

  useEffect(() => {
    let isMounted = true;
    const loadUsers = async () => {
      try {
        const allUsers = await userManagementService.getAllUsers();
        if (isMounted) {
          setUsers(allUsers);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
    return () => { isMounted = false; };
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

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'custom-month':
        const customDate = new Date(customYear, customMonth, 1);
        return { start: startOfMonth(customDate), end: endOfMonth(customDate) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [timeRange, customMonth, customYear]);

  const getPeriodTitle = useCallback(() => {
    switch (timeRange) {
      case 'day':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'custom-month':
        const customDate = new Date(customYear, customMonth, 1);
        return customDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return 'Period';
    }
  }, [timeRange, customMonth, customYear]);

  const roleFilterOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'manager', label: 'Managers' },
    { value: 'bd', label: 'Business Developer' },
    { value: 'designer', label: 'Designers' },
    { value: 'developer', label: 'Developers' }
  ];


  const expectedHours = useMemo(() => {
    const workingDaysPerWeek = 5;
    const hoursPerDay = 8;
    
    switch (timeRange) {
      case 'day':
        return hoursPerDay;
      case 'week':
        return workingDaysPerWeek * hoursPerDay;
      case 'month':
        const daysInMonth = endOfMonth(dateRange.start).getDate();
        const workingDaysInMonth = Math.floor(daysInMonth * (workingDaysPerWeek / 7));
        return workingDaysInMonth * hoursPerDay;
      case 'custom-month':
        const customDaysInMonth = endOfMonth(dateRange.start).getDate();
        const customWorkingDaysInMonth = Math.floor(customDaysInMonth * (workingDaysPerWeek / 7));
        return customWorkingDaysInMonth * hoursPerDay;
      default:
        return workingDaysPerWeek * hoursPerDay;
    }
  }, [timeRange, dateRange]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const taskAssignees = Array.isArray(task.assignee) ? task.assignee : (task.assignee ? [task.assignee] : []);
      const isUserMatch = selectedUser === 'all' || taskAssignees.includes(selectedUser);
      return isUserMatch && taskAssignees.length > 0;
    });
  }, [tasks, selectedUser]);

  const employeeAnalytics = useMemo(() => {
    const employeeStats = users
      .filter(user => {
        const isActive = user.isActive && user.role !== 'super_manager';
        const matchesRole = !selectedRole || selectedRole.value === 'all' || user.role === selectedRole.value;
        const matchesUser = selectedUser === 'all' || user.id === selectedUser;
        return isActive && matchesRole && matchesUser;
      })
      .map(user => {
        const allTasksForUser = filteredTasks.filter(task => {
          const taskAssignees = Array.isArray(task.assignee) ? task.assignee : (task.assignee ? [task.assignee] : []);
          return taskAssignees.includes(user.id);
        });

        const userTasks = allTasksForUser.filter(task => {
          const hasTimeData = (task.timeEntries && task.timeEntries.length > 0) || (task.totalHours && task.totalHours > 0);
          const isNotCompleted = task.status !== 'done';
          return hasTimeData && isNotCompleted;
        });
        
        const userHours = allTasksForUser.reduce((sum, task) => {
          const userTimeEntries = task.timeEntries?.filter(entry => {
            const isUserMatch = entry.userId === user.id || entry.userId === user.uid;
            if (!isUserMatch) return false;
            const entryDate = new Date(entry.date);
            return isWithinInterval(entryDate, { start: dateRange.start, end: dateRange.end });
          }) || [];
          const userTaskHours = userTimeEntries.reduce((entrySum, entry) => entrySum + (entry.hours || 0), 0);
          return sum + userTaskHours;
        }, 0);

        const allUserTasks = tasks.filter(task => {
          const taskAssignees = Array.isArray(task.assignee) ? task.assignee : (task.assignee ? [task.assignee] : []);
          return taskAssignees.includes(user.id);
        });

        const totalUserHours = allUserTasks.reduce((sum, task) => {
          const userTimeEntries = task.timeEntries?.filter(entry => 
            entry.userId === user.id || entry.userId === user.uid
          ) || [];
          const userTaskHours = userTimeEntries.reduce((entrySum, entry) => entrySum + (entry.hours || 0), 0);
          return sum + userTaskHours;
        }, 0);

        const totalUserTasks = allUserTasks.filter(task => {
          const hasTimeData = (task.timeEntries && task.timeEntries.length > 0) || (task.totalHours && task.totalHours > 0);
          return hasTimeData;
        }).length;
        
        const projectBreakdown = projects.map(project => {
          const projectTasks = allTasksForUser.filter(task => task.projectId === project.id);
          const projectHours = projectTasks.reduce((sum, task) => {
            const userTimeEntries = task.timeEntries?.filter(entry => {
              const isUserMatch = entry.userId === user.id || entry.userId === user.uid;
              if (!isUserMatch) return false;
              const entryDate = new Date(entry.date);
              return isWithinInterval(entryDate, { start: dateRange.start, end: dateRange.end });
            }) || [];
            const userTaskHours = userTimeEntries.reduce((entrySum, entry) => entrySum + (entry.hours || 0), 0);
            return sum + userTaskHours;
          }, 0);
          
          return {
            projectId: project.id,
            projectName: project.name,
            tasks: projectTasks.length,
            hours: projectHours
          };
        }).filter(p => p.tasks > 0);
        
        const taskBreakdown = userTasks.map(task => {
          const project = projects.find(p => p.id === task.projectId);
          return {
            taskId: task.id,
            taskTitle: task.title,
            projectName: project?.name || 'Unknown Project',
            hours: task.totalHours || 0,
            status: task.status,
            completed: task.status === 'done'
          };
        }).filter(t => t.hours > 0);
        
        const utilizationRate = expectedHours > 0 ? Math.round((userHours / expectedHours) * 100) : 0;
        
        return {
          id: user.id,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          expectedHours,
          actualHours: userHours,
          totalHours: totalUserHours,
          utilizationRate,
          totalTasks: userTasks.length,
          totalUserTasks: totalUserTasks,
          projectBreakdown,
          taskBreakdown
        };
      })
      .sort((a, b) => b.actualHours - a.actualHours);

    const totalExpectedHours = employeeStats.reduce((sum, emp) => sum + emp.expectedHours, 0);
    const totalActualHours = employeeStats.reduce((sum, emp) => sum + emp.actualHours, 0);
    const overallUtilization = totalExpectedHours > 0 ? Math.round((totalActualHours / totalExpectedHours) * 100) : 0;

    const roleOrder = ['manager', 'bd', 'designer', 'developer'];
    const groupedEmployees = roleOrder.reduce((acc, role) => {
      acc[role] = employeeStats.filter(emp => emp.role === role && emp.actualHours > 0);
      return acc;
    }, {});

    const topPerformers = employeeStats
      .filter(emp => emp.actualHours > 0)
      .sort((a, b) => b.actualHours - a.actualHours)
      .slice(0, 4);

    return {
      employeeStats,
      groupedEmployees,
      topPerformers,
      totalExpectedHours,
      totalActualHours,
      overallUtilization,
      totalEmployees: employeeStats.length,
      expectedHours
    };
  }, [filteredTasks, users, projects, dateRange, expectedHours, selectedRole, selectedUser]);

  return (
    <motion.div className="page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageTitle 
        title="Employee Time Analytics"
        subtitle="Track employee performance, time utilization, and project progress"
        icon={FiUsers}
        showBackButton={true}
        backTo="/dashboard"
      />
      
      <div className="analytics-filters">
        <div className="filter-group">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom-month">Custom Month</option>
          </select>
        </div>
        
        {timeRange === 'custom-month' && (
          <>
            <div className="filter-group">
              <label>Month:</label>
              <select value={customMonth} onChange={(e) => setCustomMonth(parseInt(e.target.value))}>
                <option value={0}>January</option>
                <option value={1}>February</option>
                <option value={2}>March</option>
                <option value={3}>April</option>
                <option value={4}>May</option>
                <option value={5}>June</option>
                <option value={6}>July</option>
                <option value={7}>August</option>
                <option value={8}>September</option>
                <option value={9}>October</option>
                <option value={10}>November</option>
                <option value={11}>December</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Year:</label>
              <select value={customYear} onChange={(e) => setCustomYear(parseInt(e.target.value))}>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>{year}</option>
                  );
                })}
              </select>
            </div>
          </>
        )}
        
        <div className="filter-group">
          <label>Role:</label>
          <Select
            options={roleFilterOptions}
            value={selectedRole}
            onChange={setSelectedRole}
            placeholder="Filter by role"
            isClearable
            styles={reactSelectStyles}
          />
        </div>
        
        <div className="filter-group">
          <label>Employee:</label>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="all">All Employees</option>
            {users
              .filter(user => {
                const isActive = user.isActive && user.role !== 'super_manager';
                const matchesRole = !selectedRole || selectedRole.value === 'all' || user.role === selectedRole.value;
                return isActive && matchesRole;
              })
              .map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))
            }
          </select>
        </div>
        
      </div>

      <div className="top-performers-section">
        <h3>Top 4 Performers ({getPeriodTitle()})</h3>
        {employeeAnalytics.topPerformers.length > 0 ? (
          <div className="top-performers-grid">
            {employeeAnalytics.topPerformers.map((performer, index) => (
              <motion.div 
                key={performer.id}
                className="top-performer-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="performer-rank">#{index + 1}</div>
                <div className="performer-info">
                  <Avatar 
                    src={performer.avatar}
                    name={performer.name}
                    size="medium"
                  />
                  <div className="performer-details">
                    <h4>{performer.name}</h4>
                    <span className="performer-role">{performer.role}</span>
                  </div>
                </div>
                <div className="performer-stats">
                  <div className="stat">
                    <span className="stat-value">{performer.totalUserTasks}</span>
                    <span className="stat-label">Tasks</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{performer.totalHours.toFixed(1)}h</span>
                    <span className="stat-label">Hours</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="no-data-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="no-data-icon">
              <FiUsers size={48} />
            </div>
            <h4>No Data Available</h4>
            <p>No time entries found for {getPeriodTitle().toLowerCase()}.</p>
          </motion.div>
        )}
      </div>

      <div className="analytics-sections">
        <motion.div 
          className="analytics-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3>Employee Performance Overview</h3>
          <div className="employee-performance">
            {(() => {
              const hasAnyEmployees = Object.values(employeeAnalytics.groupedEmployees).some(employees => employees.length > 0);
              
              if (!hasAnyEmployees) {
                return (
                  <motion.div 
                    className="no-data-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="no-data-icon">
                      <FiUsers size={48} />
                    </div>
                    <h4>No Employees Found</h4>
                    <p>No employees found for the selected filters and time period.</p>
                  </motion.div>
                );
              }
              
              return ['manager', 'bd', 'designer', 'developer'].map(role => {
                const roleEmployees = employeeAnalytics.groupedEmployees[role] || [];
                if (roleEmployees.length === 0) return null;
                
                const roleDisplayName = getRoleDisplayName(role);
                
                return (
                  <div key={role} className="role-group">
                    <h4 className="role-title">{roleDisplayName}s ({roleEmployees.length})</h4>
                    <div className="employee-grid">
                      {roleEmployees.map((employee) => (
                        <div key={employee.id} className="employee-card">
                          <div className="employee-header">
                            <div className="employee-info">
                              <Avatar 
                                src={employee.avatar}
                                name={employee.name}
                                size="medium"
                              />
                              <div className="employee-details">
                                <h4>{employee.name}</h4>
                                <span className="employee-role">{employee.role}</span>
                              </div>
                            </div>
                            <div className="utilization-badge">
                              <span className={`utilization-rate ${employee.utilizationRate >= 80 ? 'high' : employee.utilizationRate >= 60 ? 'medium' : 'low'}`}>
                                {employee.utilizationRate}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="employee-metrics">
                            <div className="metric-row">
                              <div className="metric">
                                <span className="label">Hours Logged:</span>
                                <span className="value">{employee.actualHours.toFixed(1)}h</span>
                              </div>
                              <div className="metric">
                                <span className="label">Expected:</span>
                                <span className="value">{employee.expectedHours.toFixed(1)}h</span>
                              </div>
                            </div>
                            <div className="metric-row">
                              <div className="metric">
                                <span className="label">Active Tasks:</span>
                                <span className="value">{employee.totalTasks}</span>
                              </div>
                              <div className="metric">
                                <span className="label">Total Hours:</span>
                                <span className="value">{employee.totalHours.toFixed(1)}h</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="utilization-bar">
                            <div 
                              className="utilization-fill" 
                              style={{ width: `${Math.min(employee.utilizationRate, 100)}%` }}
                            />
                          </div>
                          
                          {employee.projectBreakdown.length > 0 && (
                            <div className="project-breakdown">
                              <h5>Project Breakdown:</h5>
                              <div className="project-list">
                                {employee.projectBreakdown.slice(0, 3).map(project => (
                                  <div key={project.projectId} className="project-item">
                                    <span className="project-name">{project.projectName}</span>
                                    <span className="project-hours">{project.hours.toFixed(1)}h</span>
                                  </div>
                                ))}
                                {employee.projectBreakdown.length > 3 && (
                                  <div className="project-more">+{employee.projectBreakdown.length - 3} more</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Analytics; 