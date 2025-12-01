import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiAlertCircle, FiClock, FiTrendingUp, FiCalendar, FiSettings } from 'react-icons/fi';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import PageTitle from '../../components/PageTitle';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { calculateMonthlyFinance } from '../../utils/financeCalculations';
import { budgetService } from '../../services/firebaseService';
import toast from 'react-hot-toast';
import './FinanceManagement.scss';

const FinanceManagement = () => {
  const { currentUser } = useAuth();
  const { projects, tasks } = useTask();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [loadingBudget, setLoadingBudget] = useState(false);

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
    return calculateMonthlyFinance(projects, tasks, selectedDate, monthlyBudget);
  }, [projects, tasks, selectedDate, monthlyBudget]);

  const currentMonth = format(selectedDate, 'MMMM yyyy');
  const currentYear = selectedDate.getFullYear();
  const currentMonthNum = selectedDate.getMonth() + 1;
  
  useEffect(() => {
    const loadBudget = async () => {
      if (currentUser?.uid) {
        try {
          const budget = await budgetService.getMonthlyBudget(currentUser.uid, currentYear, currentMonthNum);
          setMonthlyBudget(budget);
        } catch (error) {
          console.error('Error loading budget:', error);
        }
      }
    };
    loadBudget();
  }, [currentUser, currentYear, currentMonthNum]);
  
  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const [year, month] = dateValue.split('-');
      setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, 1));
    }
  };

  const handleOpenBudgetModal = async () => {
    if (currentUser?.uid) {
      try {
        const budget = await budgetService.getMonthlyBudget(currentUser.uid, currentYear, currentMonthNum);
        setBudgetAmount(budget > 0 ? budget.toString() : '');
        setShowBudgetModal(true);
      } catch (error) {
        console.error('Error loading budget:', error);
        setBudgetAmount('');
        setShowBudgetModal(true);
      }
    }
  };

  const handleSaveBudget = async () => {
    if (!currentUser?.uid) return;
    
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    setLoadingBudget(true);
    try {
      await budgetService.setMonthlyBudget(currentUser.uid, currentYear, currentMonthNum, amount);
      setMonthlyBudget(amount);
      setShowBudgetModal(false);
      toast.success('Budget saved successfully');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget');
    } finally {
      setLoadingBudget(false);
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
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleOpenBudgetModal}
          >
            <FiSettings size={16} />
            Set Budget
          </button>
        </div>
        {monthlyBudget > 0 ? (
          <motion.div 
            className="budget-progress-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="budget-progress-header">
              <span className="budget-progress-label">Budget Progress</span>
              <span className="budget-progress-percentage">
                {monthlyBudget > 0 ? ((monthlyPayments.grandTotalReceived / monthlyBudget) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="payment-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${monthlyBudget > 0 ? Math.min((monthlyPayments.grandTotalReceived / monthlyBudget) * 100, 100) : 0}%` 
                  }}
                />
              </div>
              <div className="progress-stats">
                <span>${monthlyPayments.grandTotalReceived.toFixed(2)} received</span>
                <span>of ${monthlyBudget.toFixed(2)} budget</span>
              </div>
            </div>
          </motion.div>
        ) : null}
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
                      <span className="summary-subtitle">From Projects</span>
                    </div>
                  </div>
                  <div className="summary-amount">${monthlyPayments.grandTotalEstimated.toFixed(2)}</div>
                </motion.div>
              )}
              {monthlyBudget > 0 && (
                <motion.div 
                  className="summary-card budget"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="summary-header">
                    <FiSettings size={24} />
                    <div className="summary-title">
                      <span className="summary-label">Total Budget</span>
                      <span className="summary-subtitle">Set Budget</span>
                    </div>
                  </div>
                  <div className="summary-amount">${monthlyBudget.toFixed(2)}</div>
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

      <Modal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title={`Set Budget for ${currentMonth}`}
        size="small"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveBudget(); }}>
          <div className="input-wrapper">
            <FiDollarSign className="input-icon" />
            <input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => setShowBudgetModal(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveBudget}
              loading={loadingBudget}
              loadingText="Saving..."
              type="button"
            >
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default FinanceManagement;

