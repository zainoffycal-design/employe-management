import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiAlertCircle, FiClock, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import PageTitle from '../../components/PageTitle';
import { calculateMonthlyFinance } from '../../utils/financeCalculations';
import './FinanceManagement.scss';

const FinanceManagement = () => {
  const { currentUser } = useAuth();
  const { projects, tasks } = useTask();
  const [selectedDate, setSelectedDate] = useState(new Date());

  if (currentUser?.role !== 'super_manager') {
    return (
      <motion.div className="page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="access-denied">
          <FiAlertCircle size={48} />
          <h3>Access Denied</h3>
          <p>You don't have permission to view finance management.</p>
        </div>
      </motion.div>
    );
  }

  const monthlyPayments = useMemo(() => {
    return calculateMonthlyFinance(projects, tasks, selectedDate);
  }, [projects, tasks, selectedDate]);

  const currentMonth = format(selectedDate, 'MMMM yyyy');
  
  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const [year, month] = dateValue.split('-');
      setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, 1));
    }
  };

  return (
    <motion.div className="page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageTitle 
        title="Finance Management"
        subtitle={`Financial overview for ${currentMonth}`}
        icon={FiDollarSign}
        showBackButton={true}
        backTo="/"
      />

      <div className="finance-management-page">
        <div className="date-selector">
          <label htmlFor="month-picker">
            <FiCalendar size={18} />
            <span>Select Month</span>
          </label>
          <input
            id="month-picker"
            type="month"
            value={format(selectedDate, 'yyyy-MM')}
            onChange={handleDateChange}
            className="month-input"
          />
        </div>
        {monthlyPayments.hasThisMonthPayments && monthlyPayments.projectPayments.length > 0 ? (
          <>
            <div className="payments-summary">
              <motion.div 
                className="summary-card received"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="summary-header">
                  <FiDollarSign size={24} />
                  <div className="summary-title">
                    <span className="summary-label">Total Received</span>
                    <span className="summary-subtitle">This Month</span>
                  </div>
                </div>
                <div className="summary-amount">${monthlyPayments.grandTotalReceived.toFixed(2)}</div>
              </motion.div>
              {monthlyPayments.grandTotalEstimated > 0 && (
                <motion.div 
                  className="summary-card estimated"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="summary-header">
                    <FiTrendingUp size={24} />
                    <div className="summary-title">
                      <span className="summary-label">Total Estimated</span>
                      <span className="summary-subtitle">This Month</span>
                    </div>
                  </div>
                  <div className="summary-amount">${monthlyPayments.grandTotalEstimated.toFixed(2)}</div>
                </motion.div>
              )}
            </div>
            <div className="payments-grid">
              {monthlyPayments.projectPayments.map((project, index) => {
                const estimated = project.budgetType === 'fixed' ? project.totalBudget : project.estimatedBudget;
                const receivedPercentage = estimated > 0 
                  ? Math.min((project.received / estimated) * 100, 100) 
                  : 0;

                return (
                  <motion.div
                    key={project.projectId}
                    className="payment-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (index * 0.05) }}
                  >
                    <div className="payment-header">
                      <div className="payment-title-section">
                        <h4>{project.projectName}</h4>
                        {project.budgetType === 'hourly' && (
                          <span className="budget-type-badge">
                            <FiClock size={12} />
                            Hourly
                          </span>
                        )}
                        {project.budgetType === 'fixed' && (
                          <span className="budget-type-badge fixed">
                            <FiDollarSign size={12} />
                            Fixed
                          </span>
                        )}
                      </div>
                      <div className="payment-amount-section">
                        <div className="amount-received">${project.received.toFixed(2)}</div>
                        {estimated > 0 && (
                          <div className="amount-estimated">of ${estimated.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                    
                    {estimated > 0 && (
                      <div className="payment-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${receivedPercentage}%` }}
                          />
                        </div>
                        <div className="progress-stats">
                          <span className="progress-percentage">{receivedPercentage.toFixed(1)}%</span>
                          {project.budgetType === 'hourly' && project.hourlyRate && (
                            <span className="hourly-rate">
                              ${project.hourlyRate.toFixed(2)}/hr
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="payment-details">
                      <div className="detail-item">
                        <span className="detail-label">Received</span>
                        <span className="detail-value received">
                          ${project.received.toFixed(2)}
                        </span>
                      </div>
                      {project.hasPreviousPayments && project.thisMonthReceived > 0 && (
                        <div className="detail-item">
                          <span className="detail-label">This Month</span>
                          <span className="detail-value received">
                            +${project.thisMonthReceived.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {estimated > 0 && (
                        <div className="detail-item">
                          <span className="detail-label">{project.budgetType === 'fixed' ? 'Budget' : 'Estimated'}</span>
                          <span className="detail-value estimated">${estimated.toFixed(2)}</span>
                        </div>
                      )}
                      {project.paymentCount > 0 && (
                        <div className="detail-item">
                          <span className="detail-label">Payments</span>
                          <span className="detail-value">
                            {project.paymentCount}
                            {project.hasPreviousPayments && (
                              <span className="payment-note" title={`${project.thisMonthPaymentCount} this month, ${project.paymentCount - project.thisMonthPaymentCount} from previous months`}>
                                *
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {project.hasPreviousPayments && project.previousMonths && project.previousMonths.length > 0 && (
                        <div className="detail-item note">
                          <span className="detail-label note-text">
                            * Includes {project.paymentCount - project.thisMonthPaymentCount} payment{project.paymentCount - project.thisMonthPaymentCount !== 1 ? 's' : ''} from {project.previousMonths.length === 1 ? project.previousMonths[0] : `${project.previousMonths.slice(0, -1).join(', ')} and ${project.previousMonths[project.previousMonths.length - 1]}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          <motion.div 
            className="empty-state-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="empty-state-icon">
              <FiDollarSign size={48} />
            </div>
            <h3>No Payments This Month</h3>
            <p>No payments have been received in {currentMonth} for any project.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default FinanceManagement;

