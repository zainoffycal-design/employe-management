import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiCalendar, FiUser, FiFolder, FiEye, FiEyeOff } from 'react-icons/fi';
import { startOfMonth, endOfMonth, format, parse, isWithinInterval, isValid, addMonths } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import { userManagementService } from '../../services/firebaseService';
import { calculateAfterTax } from '../../utils/financeCalculations';
import PageTitle from '../../components/PageTitle';
import Avatar from '../../components/Avatar';
import { formatCurrency } from '../../utils/uiUtils';
import './Commissions.scss';

const EXCHANGE_RATE = 280;

const Commissions = () => {
  const { currentUser } = useAuth();
  const { projects, tasks } = useTask();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM'));
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM'));
  const [visibleUserIds, setVisibleUserIds] = useState(new Set());

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await userManagementService.getAllUsers();
        const commissionUsers = allUsers.filter(user => user.hasCommission && user.commissionPercentage);
        setUsers(commissionUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  const monthRange = useMemo(() => {
    try {
      const from = parse(fromDate + '-01', 'yyyy-MM-dd', new Date());
      const to = parse(toDate + '-01', 'yyyy-MM-dd', new Date());
      
      if (!isValid(from) || !isValid(to)) {
        const now = new Date();
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      }
      
      const start = startOfMonth(from);
      const end = endOfMonth(to);
      
      return start > end ? { start: end, end: start } : { start, end };
    } catch {
      const now = new Date();
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    }
  }, [fromDate, toDate]);

  const calculateReceivedPayments = useCallback((project, monthRange) => {
    if (!project.budget?.payments || !Array.isArray(project.budget.payments)) return 0;

    let tax = parseFloat(project.budget?.tax);
    if (isNaN(tax) || tax === null || tax === undefined) {
      tax = project.projectType === 'freelance' ? 10 : 0;
    }

    return project.budget.payments.reduce((sum, payment) => {
      if (!payment.receivedAt || !payment.amount) return sum;
      try {
        const paymentDate = new Date(payment.receivedAt);
        if (!isValid(paymentDate)) return sum;
        if (isWithinInterval(paymentDate, monthRange)) {
          const paymentAmount = parseFloat(payment.amount) || 0;
          const paymentAfterTax = calculateAfterTax(paymentAmount, tax);
          return sum + paymentAfterTax;
        }
      } catch {
        return sum;
      }
      return sum;
    }, 0);
  }, [calculateAfterTax]);

  const isCommissionInRange = useCallback((commissionInfo, monthRange) => {
    if (!commissionInfo.startMonth) return false;

    try {
      const startMonth = parse(commissionInfo.startMonth + '-01', 'yyyy-MM-dd', new Date());
      if (!isValid(startMonth)) return false;

      const commissionStart = startOfMonth(startMonth);
      const commissionEndMonth = endOfMonth(startMonth);
      const rangeStart = monthRange.start;
      const rangeEnd = monthRange.end;

      if (commissionInfo.type === 'fixed') {
        return commissionStart <= rangeEnd && commissionEndMonth >= rangeStart;
      }

      if (commissionInfo.type === 'recurring' && commissionInfo.recurringMonths) {
        const recurringEnd = endOfMonth(
          new Date(commissionStart.getFullYear(), commissionStart.getMonth() + (commissionInfo.recurringMonths - 1), 1)
        );
        return commissionStart <= rangeEnd && recurringEnd >= rangeStart;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  const userCommissions = useMemo(() => {
    if (!users.length || !projects.length) return [];

    return users
      .map(user => {
        let totalCommissionUSD = 0;
        let totalCommissionPKR = 0;
        const projectCommissions = [];

        projects.forEach(project => {
          const commissionInfo = project.commissionData?.[user.id];
          if (!commissionInfo?.isActive) return;

          if (!isCommissionInRange(commissionInfo, monthRange)) return;

          const commissionPercentage = commissionInfo.percentage || 0;
          const receivedAmount = calculateReceivedPayments(project, monthRange);
          const commissionUSD = (receivedAmount * commissionPercentage) / 100;

          if (commissionUSD > 0) {
            const commissionPKR = commissionUSD * EXCHANGE_RATE;
            totalCommissionUSD += commissionUSD;
            totalCommissionPKR += commissionPKR;

            let endMonth = null;
            if (commissionInfo.startMonth) {
              try {
                const startDate = parse(commissionInfo.startMonth + '-01', 'yyyy-MM-dd', new Date());
                if (isValid(startDate)) {
                  if (commissionInfo.type === 'fixed') {
                    endMonth = commissionInfo.startMonth;
                  } else if (commissionInfo.type === 'recurring' && commissionInfo.recurringMonths) {
                    const endDate = addMonths(startDate, commissionInfo.recurringMonths - 1);
                    endMonth = format(endDate, 'yyyy-MM');
                  }
                }
              } catch {
                endMonth = null;
              }
            }

            projectCommissions.push({
              projectId: project.id,
              projectName: project.name,
              commissionUSD,
              commissionPKR,
              commissionPercentage,
              commissionType: commissionInfo.type || 'fixed',
              recurringMonths: commissionInfo.recurringMonths || null,
              receivedAmount,
              startMonth: commissionInfo.startMonth,
              endMonth
            });
          }
        });

        return {
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          totalCommissionUSD,
          totalCommissionPKR,
          projectCommissions
        };
      })
      .filter(userComm => userComm.totalCommissionUSD > 0);
  }, [users, projects, monthRange, calculateReceivedPayments, isCommissionInRange]);

  if (currentUser?.role !== 'super_manager') {
    return (
      <motion.div className="commissions-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="access-denied">
          <FiDollarSign size={48} />
          <h3>Access Denied</h3>
          <p>You don't have permission to view commissions.</p>
        </div>
      </motion.div>
    );
  }

  const selectedUserCommissions = useMemo(() => {
    if (!selectedUser) return null;
    return userCommissions.find(uc => uc.userId === selectedUser);
  }, [selectedUser, userCommissions]);

  const handleUserClick = useCallback((userId) => {
    setSelectedUser(userId);
    setVisibleUserIds(prev => {
      const newSet = new Set();
      if (prev.has(userId)) {
        return newSet;
      } else {
        newSet.add(userId);
        return newSet;
      }
    });
  }, []);

  const handleToggleAllAmounts = useCallback((e) => {
    e.stopPropagation();
    setVisibleUserIds(prev => {
      if (prev.size === userCommissions.length) {
        return new Set();
      } else {
        return new Set(userCommissions.map(uc => uc.userId));
      }
    });
  }, [userCommissions]);

  return (
    <motion.div className="commissions-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageTitle
        title="Commissions"
        subtitle="View commission details by user and project"
        icon={FiDollarSign}
      />

      <div className="commissions-filters">
        <div className="filter-group">
          <label htmlFor="fromDate">
            <FiCalendar size={16} />
            From Month
          </label>
          <input
            type="month"
            id="fromDate"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="toDate">
            <FiCalendar size={16} />
            To Month
          </label>
          <input
            type="month"
            id="toDate"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      <div className="commissions-layout">
        <div className="commissions-list">
          <div className="section-header-with-toggle">
            <h3 className="section-title">
              <FiUser size={20} />
              Users & Commission Amount
            </h3>
            <button
              type="button"
              className="toggle-amounts-btn"
              onClick={handleToggleAllAmounts}
              title={visibleUserIds.size === userCommissions.length ? 'Hide all amounts' : 'Show all amounts'}
            >
              {visibleUserIds.size === userCommissions.length ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <div className="users-list">
            {userCommissions.length === 0 ? (
              <div className="empty-state">
                <p>No commissions found for the selected period.</p>
              </div>
            ) : (
              userCommissions.map(userComm => {
                const isSelected = selectedUser === userComm.userId;
                const isVisible = visibleUserIds.has(userComm.userId);
                return (
                  <div
                    key={userComm.userId}
                    className={`user-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handleUserClick(userComm.userId)}
                  >
                    <Avatar src={userComm.userAvatar} name={userComm.userName} size="medium" />
                    <div className="user-info">
                      <div className="user-name">{userComm.userName}</div>
                      <div className="commission-amount">
                        {isVisible ? (
                          <>
                            <span className="amount-usd">${formatCurrency(userComm.totalCommissionUSD, 0, true)}</span>
                            <span className="amount-pkr">PKR {formatCurrency(userComm.totalCommissionPKR, 0, true)}</span>
                          </>
                        ) : (
                          <>
                            <span className="amount-usd">***</span>
                            <span className="amount-pkr">***</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="commissions-details">
          <h3 className="section-title">
            <FiFolder size={20} />
            Project Level Commission
          </h3>
          {selectedUserCommissions ? (
            <div className="projects-list">
              {selectedUserCommissions.projectCommissions.length === 0 ? (
                <div className="empty-state">
                  <p>No project commissions found for this user.</p>
                </div>
              ) : (
                selectedUserCommissions.projectCommissions.map(projectComm => (
                  <div key={projectComm.projectId} className="project-item">
                    <div className="project-header">
                      <h4 className="project-name">{projectComm.projectName}</h4>
                      <div className="project-commission-type">
                        {projectComm.commissionType === 'fixed' ? 'Fixed' : `Recurring (${projectComm.recurringMonths || 'N/A'} months)`}
                      </div>
                    </div>
                    <div className="project-details">
                      <div className="detail-row">
                        <span className="detail-label">Commission Percentage:</span>
                        <span className="detail-value">{projectComm.commissionPercentage}%</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Received Amount:</span>
                        <span className="detail-value">${formatCurrency(projectComm.receivedAmount, 0, true)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Commission (USD):</span>
                        <span className="detail-value commission">${formatCurrency(projectComm.commissionUSD, 0, true)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Commission (PKR):</span>
                        <span className="detail-value commission">PKR {formatCurrency(projectComm.commissionPKR, 0, true)}</span>
                      </div>
                      {projectComm.startMonth && (() => {
                        const startDate = parse(projectComm.startMonth + '-01', 'yyyy-MM-dd', new Date());
                        if (!isValid(startDate)) return null;
                        return (
                          <>
                            <div className="detail-row">
                              <span className="detail-label">Started:</span>
                              <span className="detail-value">
                                {format(startDate, 'MMMM yyyy')}
                              </span>
                            </div>
                            {projectComm.endMonth && (() => {
                              const endDate = parse(projectComm.endMonth + '-01', 'yyyy-MM-dd', new Date());
                              if (!isValid(endDate)) return null;
                              return (
                                <div className="detail-row">
                                  <span className="detail-label">End Month:</span>
                                  <span className="detail-value">
                                    {format(endDate, 'MMMM yyyy')}
                                  </span>
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>Select a user from the list to view project-level commission details.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Commissions;
