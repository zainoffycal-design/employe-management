import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUsers, 
  FiDollarSign, 
  FiClock, 
  FiEdit2, 
  FiSave,
  FiX,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiSettings,
  FiSearch,
  FiCalendar
} from 'react-icons/fi';
import { startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { permissionUtils } from '../../utils/permissionUtils';
import { userManagementService } from '../../services/firebaseService';
import { getRoleDisplayName } from '../../utils/permissionUtils';
import { formatCurrency, reactSelectStyles } from '../../utils/uiUtils';
import { calculateAfterTax } from '../../utils/financeCalculations';
import Select from 'react-select';
import PageTitle from '../../components/PageTitle';
import Avatar from '../../components/Avatar';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import './EmployeePerformance.scss';

const DEFAULT_MONTHLY_HOURS = 160;
const DEFAULT_EXCHANGE_RATE = 280;

const EmployeePerformance = () => {
  const { tasks, projects } = useTask();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  const [formData, setFormData] = useState({
    monthlySalary: '',
    monthlyHours: DEFAULT_MONTHLY_HOURS
  });

  const fetchExchangeRate = async () => {
    try {
      setExchangeRateLoading(true);
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      if (data.rates && data.rates.PKR) {
        const rate = data.rates.PKR;
        setExchangeRate(rate);
        localStorage.setItem('pkrToUsdRate', rate.toString());
        localStorage.setItem('pkrToUsdRateLastUpdate', new Date().toISOString());
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      const savedRate = localStorage.getItem('pkrToUsdRate');
      if (savedRate) {
        setExchangeRate(parseFloat(savedRate));
      }
    } finally {
      setExchangeRateLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allUsers = await userManagementService.getAllUsers();
        const activeUsers = allUsers.filter(user => user.isActive !== false && user.status !== 'inactive');
        setUsers(activeUsers);
        
        const lastUpdate = localStorage.getItem('pkrToUsdRateLastUpdate');
        const savedRate = localStorage.getItem('pkrToUsdRate');
        
        if (savedRate) {
          setExchangeRate(parseFloat(savedRate));
        }
        
        const shouldFetch = !lastUpdate || 
          (new Date().getTime() - new Date(lastUpdate).getTime()) > 24 * 60 * 60 * 1000;
        
        if (shouldFetch) {
          await fetchExchangeRate();
        } else if (savedRate) {
          setExchangeRate(parseFloat(savedRate));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (!permissionUtils.isSuperManager(currentUser)) {
    return (
      <motion.div className="page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="access-denied">
          <FiAlertCircle size={48} />
          <h3>Access Denied</h3>
          <p>Only Super Managers can access Employee Performance.</p>
        </div>
      </motion.div>
    );
  }

  const monthRange = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthDate = new Date(year, month - 1, 1);
    return {
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate)
    };
  }, [selectedMonth]);

  const projectOptions = useMemo(() => {
    return projects
      .filter(project => {
        if (!projectSearchTerm.trim()) return true;
        const searchLower = projectSearchTerm.toLowerCase();
        return project.name.toLowerCase().includes(searchLower) ||
               project.description?.toLowerCase().includes(searchLower);
      })
      .map(project => ({
        value: project.id,
        label: project.name,
        project: project
      }));
  }, [projects, projectSearchTerm]);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (selectedProject) {
      const project = projects.find(p => p.id === selectedProject.value);
      if (project) {
        const projectTeamMembers = project.teamMembers || [];
        const projectTaskAssignees = tasks
          .filter(task => task.projectId === project.id)
          .flatMap(task => {
            const assignees = Array.isArray(task.assignee) ? task.assignee : [task.assignee];
            return assignees.filter(Boolean);
          });
        
        const allProjectUserIds = new Set([
          ...projectTeamMembers,
          ...projectTaskAssignees
        ]);

        filtered = filtered.filter(user => 
          allProjectUserIds.has(user.id) || allProjectUserIds.has(user.uid)
        );
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [users, searchQuery, selectedProject, projects, tasks]);

  const groupedUsers = useMemo(() => {
    const groups = {
      designer: [],
      developer: [],
      bd: [],
      manager: [],
      other: []
    };

    filteredUsers.forEach(user => {
      if (user.role === 'designer') {
        groups.designer.push(user);
      } else if (user.role === 'developer') {
        groups.developer.push(user);
      } else if (user.role === 'bd') {
        groups.bd.push(user);
      } else if (user.role === 'manager') {
        groups.manager.push(user);
      } else if (user.role !== 'super_manager') {
        groups.other.push(user);
      }
    });

    return groups;
  }, [filteredUsers]);

  const calculateEmployeeStats = useCallback((user, filterByProject = null) => {
    const monthlySalary = parseFloat(user.monthlySalary || 0);
    const monthlyHours = parseFloat(user.monthlyHours || DEFAULT_MONTHLY_HOURS);
    const hourlyRatePKR = monthlyHours > 0 ? monthlySalary / monthlyHours : 0;
    const hourlyRateUSD = hourlyRatePKR / exchangeRate;

    const userTasks = tasks.filter(task => {
      const assignees = Array.isArray(task.assignee) ? task.assignee : [task.assignee];
      return assignees.includes(user.id) || assignees.includes(user.uid);
    });

    const projectsToProcess = filterByProject 
      ? projects.filter(p => p.id === filterByProject.value)
      : projects;

    const projectStats = projectsToProcess.map(project => {
      const hasCommission = project.commissionData && project.commissionData[user.id] && project.commissionData[user.id].isActive;
      const hasRevenue = project.budget && (project.budget.type === 'fixed' || project.budget.type === 'hourly');
      
      const projectTasks = userTasks.filter(task => task.projectId === project.id);
      
      let projectHours = 0;
      projectTasks.forEach(task => {
        const userTimeEntries = (task.timeEntries || []).filter(entry => {
          const isUserMatch = entry.userId === user.id || entry.userId === user.uid;
          if (!isUserMatch) return false;
          if (entry.date) {
            const entryDate = new Date(entry.date);
            return isWithinInterval(entryDate, { start: monthRange.start, end: monthRange.end });
          }
          return true; // If no date, include it (backward compatibility)
        });
        const taskHours = userTimeEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
        projectHours += taskHours;
      });

      if (projectHours === 0 && !hasCommission && !hasRevenue) return null;

      const projectCostPKR = projectHours * hourlyRatePKR;
      const projectCostUSD = projectCostPKR / exchangeRate;

      let projectRevenueUSD = 0;
      let projectRevenuePKR = 0;
      let profitUSD = 0;
      let profitPKR = 0;
      let profitMargin = 0;
      let bonusUSD = 0;
      let commissionUSD = 0;
      let commissionPKR = 0;

      let tax = parseFloat(project.budget?.tax);
      if (isNaN(tax) || tax === null || tax === undefined) {
        tax = project.projectType === 'freelance' ? 10 : 0;
      }
      
      const totalReceivedBeforeTax = (project.budget?.payments || []).filter(payment => {
        if (!payment.receivedAt || !payment.amount) return false;
        try {
          const paymentDate = new Date(payment.receivedAt);
          return isWithinInterval(paymentDate, { start: monthRange.start, end: monthRange.end });
        } catch {
          return false;
        }
      }).reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
      
      const totalReceived = calculateAfterTax(totalReceivedBeforeTax, tax);

      let commissionType = null;
      let recurringMonths = null;
      if (project.commissionData && project.commissionData[user.id] && project.commissionData[user.id].isActive) {
        const commissionInfo = project.commissionData[user.id];
        const commissionPercentage = commissionInfo.percentage || 0;
        commissionUSD = (totalReceived * commissionPercentage) / 100;
        commissionPKR = commissionUSD * exchangeRate;
        commissionType = commissionInfo.type || 'fixed';
        recurringMonths = commissionInfo.recurringMonths || null;
      }

      if (project.budget && project.budget.type === 'hourly') {
        const projectHourlyRateBeforeTax = parseFloat(project.budget.hourlyRate || 0);
        const projectHourlyRate = calculateAfterTax(projectHourlyRateBeforeTax, tax);
        const budgetRevenueUSD = projectHours * projectHourlyRate;
        const allProjectTasks = tasks.filter(t => t.projectId === project.id);
        let totalProjectHours = 0;
        
        allProjectTasks.forEach(task => {
          const allTimeEntries = (task.timeEntries || []).filter(entry => {
            if (entry.date) {
              const entryDate = new Date(entry.date);
              return isWithinInterval(entryDate, { start: monthRange.start, end: monthRange.end });
            }
            return true;
          });
          const taskTotalHours = allTimeEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
          totalProjectHours += taskTotalHours;
        });
        
        if (totalProjectHours > 0) {
          const estimatedBudget = totalProjectHours * projectHourlyRate;
          const userShare = projectHours / totalProjectHours;
          const userBudgetShare = budgetRevenueUSD;
          const userReceivedShare = totalReceived * userShare;
          
          if (userReceivedShare > userBudgetShare) {
            bonusUSD = userReceivedShare - userBudgetShare;
          }
          
          projectRevenueUSD = userBudgetShare + bonusUSD;
          projectRevenuePKR = projectRevenueUSD * exchangeRate;
          profitUSD = projectRevenueUSD - projectCostUSD - commissionUSD;
          profitPKR = projectRevenuePKR - projectCostPKR - commissionPKR;
          profitMargin = projectRevenueUSD > 0 ? (profitUSD / projectRevenueUSD) * 100 : 0;
        } else {
          projectRevenueUSD = budgetRevenueUSD;
          projectRevenuePKR = projectRevenueUSD * exchangeRate;
          profitUSD = projectRevenueUSD - projectCostUSD - commissionUSD;
          profitPKR = projectRevenuePKR - projectCostPKR - commissionPKR;
          profitMargin = projectRevenueUSD > 0 ? (profitUSD / projectRevenueUSD) * 100 : 0;
        }
      } else if (project.budget && project.budget.type === 'fixed') {
        const allProjectTasks = tasks.filter(t => t.projectId === project.id);
        let totalProjectHours = 0;
        
        allProjectTasks.forEach(task => {
          const allTimeEntries = (task.timeEntries || []).filter(entry => {
            if (entry.date) {
              const entryDate = new Date(entry.date);
              return isWithinInterval(entryDate, { start: monthRange.start, end: monthRange.end });
            }
            return true;
          });
          const taskTotalHours = allTimeEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
          totalProjectHours += taskTotalHours;
        });
        
        if (totalProjectHours > 0) {
          const fixedBudgetBeforeTax = parseFloat(project.budget.fixedBudget || 0);
          const fixedBudget = calculateAfterTax(fixedBudgetBeforeTax, tax);
          const userShare = projectHours / totalProjectHours;
          const userBudgetShare = fixedBudget * userShare;
          const userReceivedShare = totalReceived * userShare;
          
          if (userReceivedShare > userBudgetShare) {
            bonusUSD = userReceivedShare - userBudgetShare;
          }
          
          projectRevenueUSD = userBudgetShare + bonusUSD;
          projectRevenuePKR = projectRevenueUSD * exchangeRate;
          profitUSD = projectRevenueUSD - projectCostUSD - commissionUSD;
          profitPKR = projectRevenuePKR - projectCostPKR - commissionPKR;
          profitMargin = projectRevenueUSD > 0 ? (profitUSD / projectRevenueUSD) * 100 : 0;
        }
      }

      return {
        projectId: project.id,
        projectName: project.name,
        hours: projectHours,
        costPKR: projectCostPKR,
        costUSD: projectCostUSD,
        revenueUSD: projectRevenueUSD,
        revenuePKR: projectRevenuePKR,
        profitUSD: profitUSD,
        profitPKR: profitPKR,
        profitMargin: profitMargin,
        commissionUSD: commissionUSD,
        commissionPKR: commissionPKR,
        commissionType: commissionType,
        recurringMonths: recurringMonths,
        budgetType: project.budget?.type || 'none'
      };
    }).filter(Boolean);

    const totalHours = projectStats.reduce((sum, p) => sum + p.hours, 0);
    const totalCostPKR = projectStats.reduce((sum, p) => sum + p.costPKR, 0);
    const totalCostUSD = projectStats.reduce((sum, p) => sum + p.costUSD, 0);
    const totalRevenueUSD = projectStats.reduce((sum, p) => sum + p.revenueUSD, 0);
    const totalRevenuePKR = projectStats.reduce((sum, p) => sum + p.revenuePKR, 0);
    const totalCommissionUSD = projectStats.reduce((sum, p) => sum + p.commissionUSD, 0);
    const totalCommissionPKR = projectStats.reduce((sum, p) => sum + p.commissionPKR, 0);
    const totalProfitUSD = projectStats.reduce((sum, p) => sum + p.profitUSD, 0);
    const totalProfitPKR = projectStats.reduce((sum, p) => sum + p.profitPKR, 0);
    const overallProfitMargin = totalRevenueUSD > 0 ? (totalProfitUSD / totalRevenueUSD) * 100 : 0;

    const monthlySalaryUSD = monthlySalary / exchangeRate;

    return {
      monthlySalary,
      monthlySalaryUSD,
      monthlyHours,
      hourlyRatePKR,
      hourlyRateUSD,
      projectStats,
      totalHours,
      totalCostPKR,
      totalCostUSD,
      totalRevenueUSD,
      totalRevenuePKR,
      totalCommissionUSD,
      totalCommissionPKR,
      totalProfitUSD,
      totalProfitPKR,
      overallProfitMargin
    };
  }, [tasks, projects, exchangeRate, monthRange]);

  const projectStats = useMemo(() => {
    if (!selectedProject) return null;

    const project = projects.find(p => p.id === selectedProject.value);
    if (!project) return null;

    const projectTasks = tasks.filter(task => task.projectId === project.id);
    
    let totalSpentHours = 0;
    projectTasks.forEach(task => {
      const allTimeEntries = (task.timeEntries || []).filter(entry => {
        if (entry.date) {
          const entryDate = new Date(entry.date);
          return isWithinInterval(entryDate, { start: monthRange.start, end: monthRange.end });
        }
        return true;
      });
      const taskHours = allTimeEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
      totalSpentHours += taskHours;
    });

    let tax = parseFloat(project.budget?.tax);
    if (isNaN(tax) || tax === null || tax === undefined) {
      tax = project.projectType === 'freelance' ? 10 : 0;
    }
    
    let totalProjectBudget = 0;
    if (project.budget && project.budget.type === 'fixed') {
      const fixedBudgetBeforeTax = parseFloat(project.budget.fixedBudget || 0);
      totalProjectBudget = calculateAfterTax(fixedBudgetBeforeTax, tax);
    } else if (project.budget && project.budget.type === 'hourly') {
      const hourlyRateBeforeTax = parseFloat(project.budget.hourlyRate || 0);
      const hourlyRate = calculateAfterTax(hourlyRateBeforeTax, tax);
      totalProjectBudget = totalSpentHours * hourlyRate;
    }

    const totalReceivedBeforeTax = (project.budget?.payments || []).filter(payment => {
      if (!payment.receivedAt || !payment.amount) return false;
      try {
        const paymentDate = new Date(payment.receivedAt);
        return isWithinInterval(paymentDate, { start: monthRange.start, end: monthRange.end });
      } catch {
        return false;
      }
    }).reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
    
    const totalReceived = calculateAfterTax(totalReceivedBeforeTax, tax);

    const bonus = totalReceived > totalProjectBudget ? totalReceived - totalProjectBudget : 0;
    const totalRevenue = totalProjectBudget + bonus;

    let totalCost = 0;
    const projectTeamMembers = project.teamMembers || [];
    const projectTaskAssignees = projectTasks
      .flatMap(task => {
        const assignees = Array.isArray(task.assignee) ? task.assignee : [task.assignee];
        return assignees.filter(Boolean);
      });
    
    const allProjectUserIds = new Set([
      ...projectTeamMembers,
      ...projectTaskAssignees
    ]);

    const projectUsers = users.filter(user => 
      allProjectUserIds.has(user.id) || allProjectUserIds.has(user.uid)
    );

    projectUsers.forEach(user => {
      const stats = calculateEmployeeStats(user, selectedProject);
      totalCost += stats.totalCostUSD;
    });

    let totalCommission = 0;
    let totalCommissionPKR = 0;
    const commissionDetails = [];
    
    if (project.commissionData) {
      Object.keys(project.commissionData).forEach(memberId => {
        const commissionInfo = project.commissionData[memberId];
        if (commissionInfo.isActive && commissionInfo.percentage) {
          const commissionPercentage = commissionInfo.percentage || 0;
          const memberCommission = (totalReceived * commissionPercentage) / 100;
          totalCommission += memberCommission;
          commissionDetails.push({
            percentage: commissionPercentage,
            type: commissionInfo.type || 'fixed',
            recurringMonths: commissionInfo.recurringMonths || null
          });
        }
      });
    }
    
    totalCommissionPKR = totalCommission * exchangeRate;
    const profit = totalReceived - totalCost - totalCommission;
    const totalProjectBudgetPKR = totalProjectBudget * exchangeRate;
    const totalReceivedPKR = totalReceived * exchangeRate;
    const totalRevenuePKR = totalRevenue * exchangeRate;
    const totalCostPKR = totalCost * exchangeRate;
    const profitPKR = profit * exchangeRate;

    return {
      totalProjectBudget,
      totalProjectBudgetPKR,
      totalReceived,
      totalReceivedPKR,
      bonus,
      totalRevenue,
      totalRevenuePKR,
      totalCost,
      totalCostPKR,
      totalCommission,
      totalCommissionPKR,
      commissionDetails,
      totalSpentHours,
      profit,
      profitPKR
    };
  }, [selectedProject, projects, tasks, monthRange, users, calculateEmployeeStats, exchangeRate]);

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      monthlySalary: user.monthlySalary || '',
      monthlyHours: user.monthlyHours || DEFAULT_MONTHLY_HOURS
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const updateData = {
        monthlySalary: parseFloat(formData.monthlySalary) || 0,
        monthlyHours: parseFloat(formData.monthlyHours) || DEFAULT_MONTHLY_HOURS
      };

      await userManagementService.updateUserProfile(editingUser.id, updateData);
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...updateData }
            : user
        )
      );

      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };


  const renderUserCard = (user) => {
    const stats = calculateEmployeeStats(user, selectedProject);
    
    return (
      <motion.div
        key={user.id}
        className="employee-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="employee-header">
          <Avatar src={user.avatar} name={user.name} size="medium" />
          <div className="employee-info">
            <h3>{user.name}</h3>
            <p className="employee-role">{getRoleDisplayName(user.role)}</p>
          </div>
          <button
            className="edit-btn"
            onClick={() => handleEditUser(user)}
            title="Edit Salary & Hours"
          >
            <FiEdit2 />
          </button>
        </div>

        <div className="employee-stats">
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Monthly Salary (PKR)</span>
              <span className="stat-value">
                {stats.monthlySalary > 0 ? `PKR ${formatCurrency(stats.monthlySalary, 2, true)}` : 'Not Set'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Monthly Salary (USD)</span>
              <span className="stat-value">
                {stats.monthlySalary > 0 ? `$${formatCurrency(stats.monthlySalaryUSD, 2, true)}` : 'Not Set'}
              </span>
            </div>
          </div>
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Monthly Hours</span>
              <span className="stat-value">{stats.monthlyHours}h</span>
            </div>
          </div>

          {stats.monthlySalary > 0 && (
            <>
              <div className="stat-row">
                <div className="stat-item">
                  <span className="stat-label">Hourly Rate (PKR)</span>
                  <span className="stat-value">PKR {formatCurrency(stats.hourlyRatePKR, 2, true)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Hourly Rate (USD)</span>
                  <span className="stat-value">${formatCurrency(stats.hourlyRateUSD, 2, true)}</span>
                </div>
              </div>

              {stats.totalHours > 0 && (
                <>
                  <div className="stat-row">
                    <div className="stat-item">
                      <span className="stat-label">Total Hours</span>
                      <span className="stat-value">{stats.totalHours.toFixed(2)}h</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Cost (USD)</span>
                      <span className="stat-value">${formatCurrency(stats.totalCostUSD, 2, true)}</span>
                    </div>
                  </div>
                  <div className="stat-row">
                    <div className="stat-item">
                      <span className="stat-label">Total Cost (PKR)</span>
                      <span className="stat-value">PKR {formatCurrency(stats.totalCostPKR, 2, true)}</span>
                    </div>
                  </div>
                </>
              )}

              {stats.totalRevenueUSD > 0 && (
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">Total Revenue (USD)</span>
                    <span className="stat-value revenue">${formatCurrency(stats.totalRevenueUSD, 2, true)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Revenue (PKR)</span>
                    <span className="stat-value revenue">PKR {formatCurrency(stats.totalRevenuePKR, 2, true)}</span>
                  </div>
                </div>
              )}
              {stats.totalCommissionUSD > 0 && (
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">Commission (USD)</span>
                    <span className="stat-value commission">${formatCurrency(stats.totalCommissionUSD, 2, true)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Commission (PKR)</span>
                    <span className="stat-value commission">PKR {formatCurrency(stats.totalCommissionPKR, 2, true)}</span>
                  </div>
                </div>
              )}
              {stats.totalRevenueUSD > 0 && (
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">Total Profit (USD)</span>
                    <span className={`stat-value ${stats.totalProfitUSD >= 0 ? 'profit' : 'loss'}`}>
                      ${formatCurrency(stats.totalProfitUSD, 2, true)}
                      {stats.overallProfitMargin !== 0 && (
                        <span className="margin"> ({stats.overallProfitMargin.toFixed(2)}%)</span>
                      )}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Profit (PKR)</span>
                    <span className={`stat-value ${stats.totalProfitPKR >= 0 ? 'profit' : 'loss'}`}>
                      PKR {formatCurrency(stats.totalProfitPKR, 2, true)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </motion.div>
    );
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Loading Employee Performance..." />;
  }

  return (
    <motion.div className="employee-performance-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageTitle
        title="Employee Performance"
        subtitle="Track employee costs, revenue, and profitability"
        icon={FiUsers}
        showBackButton={true}
        backTo="/dashboard"
        actions={
          <Button
            variant="secondary"
            onClick={fetchExchangeRate}
            loading={exchangeRateLoading}
            loadingText="Updating..."
            title="Click to refresh exchange rate"
          >
            Exchange Rate: {exchangeRate.toFixed(2)} PKR/USD
          </Button>
        }
      />

      <div className="filters-container">
        <div className="project-filter">
          <Select
            options={projectOptions}
            value={selectedProject}
            onChange={setSelectedProject}
            onInputChange={setProjectSearchTerm}
            placeholder="Search and select a project..."
            isClearable
            isSearchable
            styles={reactSelectStyles}
          />
        </div>
        <div className={`search-box ${searchQuery.trim() ? 'search-active' : ''}`}>
          <FiSearch size={16} />
          <input
            type="text"
            placeholder="Search employees by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.trim() && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: 'var(--gray-500)',
                padding: '2px'
              }}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <div className="month-filter">
          <FiCalendar className="calendar-icon" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-input"
          />
          <span className="month-label">
            {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
          </span>
        </div>
      </div>

      {selectedProject && projectStats && (
        <div className="project-stats-section">
          <div className="project-stats-grid">
            {[
              {
                key: 'budget',
                icon: FiDollarSign,
                label: 'Total Project Budget',
                value: `$${formatCurrency(projectStats.totalProjectBudget, 2, true)}`,
                valuePkr: `PKR ${formatCurrency(projectStats.totalProjectBudgetPKR, 2, true)}`,
                show: true
              },
              {
                key: 'received',
                icon: FiDollarSign,
                label: 'Total Received',
                value: `$${formatCurrency(projectStats.totalReceived, 2, true)}`,
                valuePkr: `PKR ${formatCurrency(projectStats.totalReceivedPKR, 2, true)}`,
                bonus: projectStats.bonus > 0 ? `+$${formatCurrency(projectStats.bonus, 2, true)} bonus` : null,
                show: true,
                positive: true
              },
              {
                key: 'cost',
                icon: FiDollarSign,
                label: 'Total Cost',
                value: `$${formatCurrency(projectStats.totalCost, 2, true)}`,
                valuePkr: `PKR ${formatCurrency(projectStats.totalCostPKR, 2, true)}`,
                show: true
              },
              {
                key: 'hours',
                icon: FiClock,
                label: 'Total Spent Hours',
                value: `${projectStats.totalSpentHours.toFixed(2)}h`,
                show: true
              },
              {
                key: 'commission',
                icon: FiDollarSign,
                label: 'Commission',
                value: `$${formatCurrency(projectStats.totalCommission, 2, true)}`,
                valuePkr: `PKR ${formatCurrency(projectStats.totalCommissionPKR, 2, true)}`,
                show: projectStats.totalCommission > 0
              },
              {
                key: 'profit',
                icon: FiDollarSign,
                label: 'Total Profit',
                value: `$${formatCurrency(projectStats.profit, 2, true)}`,
                valuePkr: `PKR ${formatCurrency(projectStats.profitPKR, 2, true)}`,
                show: true,
                positive: projectStats.profit >= 0
              }
            ].filter(card => card.show).map(card => (
              <div key={card.key} className="project-stat-card">
                <div className={`stat-icon ${card.key}`}>
                  <card.icon size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">{card.label}</span>
                  {card.value && (
                    <span className={`stat-value ${card.positive !== undefined ? (card.positive ? 'positive' : 'negative') : ''} ${card.key === 'commission' ? 'commission' : ''}`}>
                      {card.value}
                    </span>
                  )}
                  {card.valuePkr && (
                    <span className={`stat-value-pkr ${card.positive !== undefined ? (card.positive ? 'positive' : 'negative') : ''} ${card.key === 'commission' ? 'commission' : ''}`}>
                      {card.valuePkr}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="employee-categories">
        {['designer', 'developer', 'bd', 'manager'].map(category => {
          const categoryUsers = groupedUsers[category];
          if (categoryUsers.length === 0) return null;

          return (
            <div key={category} className="category-section">
              <h2 className="category-title">
                {category.charAt(0).toUpperCase() + category.slice(1)}s
                <span className="count-badge">{categoryUsers.length}</span>
              </h2>
              <div className="employees-grid">
                {categoryUsers.map(user => renderUserCard(user))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        title={`Edit Salary & Hours - ${editingUser?.name}`}
        size="medium"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }}>
          <div className="form-group">
            <label>Monthly Salary (PKR)</label>
            <input
              type="number"
              value={formData.monthlySalary}
              onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
              placeholder="Enter monthly salary"
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>Monthly Hours</label>
            <input
              type="number"
              value={formData.monthlyHours}
              onChange={(e) => setFormData({ ...formData, monthlyHours: e.target.value })}
              placeholder="Enter monthly hours"
              min="1"
              step="0.1"
            />
            <small>Default: {DEFAULT_MONTHLY_HOURS} hours</small>
          </div>
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setEditingUser(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <FiSave /> Save
            </Button>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
};

export default EmployeePerformance;


