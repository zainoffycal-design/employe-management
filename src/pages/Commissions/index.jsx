import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiCalendar, FiUser, FiFolder, FiEye, FiEyeOff } from 'react-icons/fi';
import { startOfMonth, endOfMonth, format, parse, isWithinInterval, isValid, addMonths, subMonths, isBefore, isAfter } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import { userManagementService, commissionPaymentService } from '../../services/firebaseService';
import { sumPaymentAmountsNetAfterTax } from '../../utils/financeCalculations';
import PageTitle from '../../components/PageTitle';
import Avatar from '../../components/Avatar';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { formatCurrency } from '../../utils/uiUtils';
import toast from 'react-hot-toast';
import './Commissions.scss';

const EXCHANGE_RATE = 280;

const Commissions = () => {
  const { currentUser } = useAuth();
  const { projects, tasks } = useTask();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const currentMonthStr = format(startOfMonth(new Date()), 'yyyy-MM');
  const [viewMode, setViewMode] = useState('current'); // 'current' | 'range'
  const [fromDate, setFromDate] = useState(currentMonthStr);
  const [toDate, setToDate] = useState(currentMonthStr);
  const [visibleUserIds, setVisibleUserIds] = useState(new Set());
  const [paymentStatusByUserMonth, setPaymentStatusByUserMonth] = useState({});
  const [markingPaidUserId, setMarkingPaidUserId] = useState(null);
  const [markingUnpaidUserId, setMarkingUnpaidUserId] = useState(null);
  const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState(false);
  const [confirmMarkPaidUserComm, setConfirmMarkPaidUserComm] = useState(null);
  const [showMarkUnpaidConfirm, setShowMarkUnpaidConfirm] = useState(false);
  const [confirmMarkUnpaidUserComm, setConfirmMarkUnpaidUserComm] = useState(null);


  const getMonthsInRange = useCallback((fromYYYYMM, toYYYYMM) => {
    const months = [];
    let d = parse(fromYYYYMM + '-01', 'yyyy-MM-dd', new Date());
    let end = parse(toYYYYMM + '-01', 'yyyy-MM-dd', new Date());
    if (!isValid(d) || !isValid(end)) return months;
    if (isAfter(d, end)) [d, end] = [end, d];
    while (!isAfter(d, end)) {
      months.push(format(d, 'yyyy-MM'));
      d = addMonths(d, 1);
    }
    return months;
  }, []);

  const getPreviousMonthsList = useCallback((fromYYYYMM, count) => {
    const months = [];
    let d = parse(fromYYYYMM + '-01', 'yyyy-MM-dd', new Date());
    if (!isValid(d)) return months;
    for (let i = 1; i <= count; i++) {
      d = subMonths(d, 1);
      months.push(format(d, 'yyyy-MM'));
    }
    return months;
  }, []);

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

  const monthsForPaymentStatus = useMemo(() => {
    const rangeMonths = getMonthsInRange(fromDate, toDate);
    const prevMonths = getPreviousMonthsList(fromDate, 12);
    return [...prevMonths, ...rangeMonths];
  }, [fromDate, toDate, getMonthsInRange, getPreviousMonthsList]);

  useEffect(() => {
    if (!users.length || !monthsForPaymentStatus.length) {
      setPaymentStatusByUserMonth({});
      return;
    }
    const loadPaymentStatus = async () => {
      try {
        const userIds = users.map(u => u.id);
        const status = await commissionPaymentService.getPaymentStatusBatch(userIds, monthsForPaymentStatus);
        setPaymentStatusByUserMonth(status);
      } catch (error) {
        console.error('Error loading commission payment status:', error);
      }
    };
    loadPaymentStatus();
  }, [users, monthsForPaymentStatus]);

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

    const paymentsInRange = project.budget.payments.filter((payment) => {
      if (!payment.receivedAt || !payment.amount) return false;
      try {
        const paymentDate = new Date(payment.receivedAt);
        if (!isValid(paymentDate)) return false;
        return isWithinInterval(paymentDate, monthRange);
      } catch {
        return false;
      }
    });
    return sumPaymentAmountsNetAfterTax(paymentsInRange, tax);
  }, []);

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

  const rangeMonths = useMemo(() => getMonthsInRange(fromDate, toDate), [fromDate, toDate, getMonthsInRange]);
  const previousMonthsList = useMemo(() => getPreviousMonthsList(fromDate, 12), [fromDate, getPreviousMonthsList]);

  const commissionPerUserPerMonth = useMemo(() => {
    if (!users.length || !projects.length) return {};
    const result = {};
    monthsForPaymentStatus.forEach(monthStr => {
      const d = parse(monthStr + '-01', 'yyyy-MM-dd', new Date());
      if (!isValid(d)) return;
      const singleMonthRange = { start: startOfMonth(d), end: endOfMonth(d) };
      users.forEach(user => {
        let usd = 0;
        let pkr = 0;
        projects.forEach(project => {
          const commissionInfo = project.commissionData?.[user.id];
          if (!commissionInfo?.isActive) return;
          if (!isCommissionInRange(commissionInfo, singleMonthRange)) return;
          const commissionPercentage = commissionInfo.percentage || 0;
          const receivedAmount = calculateReceivedPayments(project, singleMonthRange);
          const commissionUSD = (receivedAmount * commissionPercentage) / 100;
          const isRecurring = commissionInfo.type === 'recurring';
          if (commissionUSD > 0 || isRecurring) {
            usd += commissionUSD;
            pkr += commissionUSD * EXCHANGE_RATE;
          }
        });
        if (!result[user.id]) result[user.id] = {};
        result[user.id][monthStr] = { usd, pkr };
      });
    });
    return result;
  }, [users, projects, monthsForPaymentStatus, calculateReceivedPayments, isCommissionInRange]);

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
          const isRecurring = commissionInfo.type === 'recurring';
          const showRow = commissionUSD > 0 || isRecurring;

          if (showRow) {
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

        let carryOverUSD = 0;
        let carryOverPKR = 0;
        const unpaidMonthsToMark = [];
        previousMonthsList.forEach(prevMonth => {
          const key = `${user.id}_${prevMonth}`;
          if (paymentStatusByUserMonth[key] !== true) {
            const perMonth = commissionPerUserPerMonth[user.id]?.[prevMonth] || { usd: 0, pkr: 0 };
            carryOverUSD += perMonth.usd;
            carryOverPKR += perMonth.pkr;
            unpaidMonthsToMark.push(prevMonth);
          }
        });
        rangeMonths.forEach(m => {
          const key = `${user.id}_${m}`;
          if (paymentStatusByUserMonth[key] !== true) unpaidMonthsToMark.push(m);
        });
        const isPeriodPaid = rangeMonths.length > 0 && rangeMonths.every(m => paymentStatusByUserMonth[`${user.id}_${m}`] === true);
        const totalDisplayUSD = totalCommissionUSD + carryOverUSD;
        const totalDisplayPKR = totalCommissionPKR + carryOverPKR;

        return {
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          totalCommissionUSD,
          totalCommissionPKR,
          totalDisplayUSD,
          totalDisplayPKR,
          carryOverUSD,
          carryOverPKR,
          isPeriodPaid,
          unpaidMonthsToMark,
          projectCommissions
        };
      })
      .filter(userComm => userComm.totalCommissionUSD > 0 || userComm.projectCommissions.length > 0 || userComm.carryOverUSD > 0);
  }, [users, projects, monthRange, rangeMonths, previousMonthsList, paymentStatusByUserMonth, commissionPerUserPerMonth, calculateReceivedPayments, isCommissionInRange]);

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

  const handleMarkAsPaid = useCallback(async (e, userComm) => {
    e?.stopPropagation?.();
    if (!userComm?.unpaidMonthsToMark?.length || markingPaidUserId) return;
    setMarkingPaidUserId(userComm.userId);
    try {
      await commissionPaymentService.setPaidBatch(
        userComm.unpaidMonthsToMark.map(month => ({ userId: userComm.userId, month, paid: true }))
      );
      const userIds = users.map(u => u.id);
      const status = await commissionPaymentService.getPaymentStatusBatch(userIds, monthsForPaymentStatus);
      setPaymentStatusByUserMonth(status);
      toast.success('Marked as paid');
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      toast.error('Failed to mark as paid');
    } finally {
      setMarkingPaidUserId(null);
    }
  }, [users, monthsForPaymentStatus, markingPaidUserId]);

  const handleMarkAsUnpaid = useCallback(async (e, userComm) => {
    e?.stopPropagation?.();
    if (!userComm || markingUnpaidUserId || markingPaidUserId) return;
    if (rangeMonths.length === 0) return;
    setMarkingUnpaidUserId(userComm.userId);
    try {
      await commissionPaymentService.setPaidBatch(
        rangeMonths.map(month => ({ userId: userComm.userId, month, paid: false }))
      );
      const userIds = users.map(u => u.id);
      const status = await commissionPaymentService.getPaymentStatusBatch(userIds, monthsForPaymentStatus);
      setPaymentStatusByUserMonth(status);
      toast.success('Marked as unpaid');
    } catch (error) {
      console.error('Error marking commission as unpaid:', error);
      toast.error('Failed to mark as unpaid');
    } finally {
      setMarkingUnpaidUserId(null);
    }
  }, [users, monthsForPaymentStatus, rangeMonths, markingPaidUserId, markingUnpaidUserId]);

  const openMarkPaidConfirm = useCallback((e, userComm) => {
    e?.stopPropagation?.();
    setConfirmMarkPaidUserComm(userComm);
    setShowMarkPaidConfirm(true);
  }, []);

  const openMarkUnpaidConfirm = useCallback((e, userComm) => {
    e?.stopPropagation?.();
    setConfirmMarkUnpaidUserComm(userComm);
    setShowMarkUnpaidConfirm(true);
  }, []);

  const confirmMarkAsPaid = useCallback(async () => {
    if (!confirmMarkPaidUserComm) return;
    await handleMarkAsPaid(null, confirmMarkPaidUserComm);
    setShowMarkPaidConfirm(false);
    setConfirmMarkPaidUserComm(null);
  }, [confirmMarkPaidUserComm, handleMarkAsPaid]);

  const confirmMarkAsUnpaid = useCallback(async () => {
    if (!confirmMarkUnpaidUserComm) return;
    await handleMarkAsUnpaid(null, confirmMarkUnpaidUserComm);
    setShowMarkUnpaidConfirm(false);
    setConfirmMarkUnpaidUserComm(null);
  }, [confirmMarkUnpaidUserComm, handleMarkAsUnpaid]);

  return (
    <motion.div className="commissions-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageTitle
        title="Commissions"
        subtitle="View commission details by user and project"
        icon={FiDollarSign}
      />

      <div className="commissions-filters commissions-filters--single-row">
        <div className="filter-left">
          <span className="filter-row-label">View by</span>
          <div className="filter-mode-toggle" role="group" aria-label="Date view mode">
            <button
              type="button"
              className={`mode-btn ${viewMode === 'current' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('current');
                setToDate(fromDate);
              }}
              aria-pressed={viewMode === 'current'}
            >
              <FiCalendar size={16} />
              Month
            </button>
            <button
              type="button"
              className={`mode-btn ${viewMode === 'range' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('range');
                if (fromDate === toDate) {
                  const from = parse(fromDate + '-01', 'yyyy-MM-dd', new Date());
                  if (isValid(from)) setToDate(format(addMonths(from, 1), 'yyyy-MM'));
                }
              }}
              aria-pressed={viewMode === 'range'}
            >
              <FiCalendar size={16} />
              Date range
            </button>
          </div>
        </div>
        <div className="filter-right">
        {viewMode === 'current' ? (
          <div className="filter-group filter-group--single">
            <label htmlFor="currentMonth">
              <FiCalendar size={16} />
              Month
            </label>
            <input
              type="month"
              id="currentMonth"
              value={fromDate}
              onChange={(e) => {
                const val = e.target.value;
                setFromDate(val);
                setToDate(val);
              }}
            />
          </div>
        ) : (
          <>
            <div className="filter-group">
              <label htmlFor="fromDate">
                <FiCalendar size={16} />
                From month
              </label>
              <input
                type="month"
                id="fromDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="filter-group filter-group--to">
              <label htmlFor="toDate">
                <FiCalendar size={16} />
                To month
              </label>
              <input
                type="month"
                id="toDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </>
        )}
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
                const hasCarryOver = (userComm.carryOverUSD || 0) > 0;
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
                            <span className="amount-usd">${formatCurrency(userComm.totalDisplayUSD, 0, true)}</span>
                            <span className="amount-pkr">PKR {formatCurrency(userComm.totalDisplayPKR, 0, true)}</span>
                            {hasCarryOver && (
                              <span className="carry-over-note" title="Includes previous unpaid">+prev</span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="amount-usd">***</span>
                            <span className="amount-pkr">***</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="commission-status-row" onClick={(e) => e.stopPropagation()}>
                      {userComm.isPeriodPaid && (
                        <span className="status-badge paid">Paid</span>
                      )}
                      {!userComm.isPeriodPaid ? (
                        <button
                          type="button"
                          className="mark-paid-btn"
                          onClick={(e) => openMarkPaidConfirm(e, userComm)}
                          disabled={markingPaidUserId === userComm.userId}
                          title="Mark as paid"
                        >
                          {markingPaidUserId === userComm.userId ? '...' : 'Paid'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="mark-unpaid-btn"
                          onClick={(e) => openMarkUnpaidConfirm(e, userComm)}
                          disabled={markingUnpaidUserId === userComm.userId}
                          title="Mark as unpaid"
                        >
                          {markingUnpaidUserId === userComm.userId ? '...' : 'Unpaid'}
                        </button>
                      )}
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
            <>
              {(selectedUserCommissions.carryOverUSD || 0) > 0 && (
                <div className="previous-unpaid-summary">
                  <span className="previous-label">Previous (unpaid):</span>
                  <span className="previous-amount">${formatCurrency(selectedUserCommissions.carryOverUSD, 0, true)}</span>
                  <span className="previous-amount-pkr">PKR {formatCurrency(selectedUserCommissions.carryOverPKR, 0, true)}</span>
                </div>
              )}
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
                        <span className="detail-value">${formatCurrency(projectComm.receivedAmount, 2, true)}</span>
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
            </>
          ) : (
            <div className="empty-state">
              <p>Select a user from the list to view project-level commission details.</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showMarkPaidConfirm}
        onClose={() => {
          setShowMarkPaidConfirm(false);
          setConfirmMarkPaidUserComm(null);
        }}
        title="Mark as paid"
      >
        <div className="commission-confirm-content">
          {confirmMarkPaidUserComm && (
            <>
              <p>
                Mark commission as <strong>paid</strong> for{' '}
                <strong>{users.find(u => u.id === confirmMarkPaidUserComm.userId)?.displayName || 'this user'}</strong>?
              </p>
              <p className="commission-confirm-sub">
                This will mark all unpaid months in the selected period (and any carry-over) as paid.
              </p>
            </>
          )}
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowMarkPaidConfirm(false);
                setConfirmMarkPaidUserComm(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmMarkAsPaid}
              loading={markingPaidUserId === confirmMarkPaidUserComm?.userId}
              loadingText="Marking..."
            >
              Mark as paid
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showMarkUnpaidConfirm}
        onClose={() => {
          setShowMarkUnpaidConfirm(false);
          setConfirmMarkUnpaidUserComm(null);
        }}
        title="Mark as unpaid"
      >
        <div className="commission-confirm-content">
          {confirmMarkUnpaidUserComm && (
            <>
              <p>
                Mark commission as <strong>unpaid</strong> for{' '}
                <strong>{users.find(u => u.id === confirmMarkUnpaidUserComm.userId)?.displayName || 'this user'}</strong>?
              </p>
              <p className="commission-confirm-sub">
                This will mark all months in the selected period as unpaid. Carry-over will be recalculated.
              </p>
            </>
          )}
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowMarkUnpaidConfirm(false);
                setConfirmMarkUnpaidUserComm(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmMarkAsUnpaid}
              loading={markingUnpaidUserId === confirmMarkUnpaidUserComm?.userId}
              loadingText="Marking..."
            >
              Mark as unpaid
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default Commissions;
