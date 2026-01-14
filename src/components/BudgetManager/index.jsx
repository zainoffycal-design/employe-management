import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiClock, FiPlus, FiTrash2, FiCalendar, FiEdit3 } from 'react-icons/fi';
import { formatCurrency } from '../../utils/uiUtils';
import './BudgetManager.scss';

const BudgetManager = ({ value, onChange, disabled = false }) => {
  const [budgetType, setBudgetType] = useState(value?.type || 'none');
  const [fixedBudget, setFixedBudget] = useState(value?.fixedBudget || '');
  const [hourlyRate, setHourlyRate] = useState(value?.hourlyRate || '');
  const [monthlyHours, setMonthlyHours] = useState(value?.monthlyHours || '');
  const [payments, setPayments] = useState(value?.payments || []);
  const [editingPaymentId, setEditingPaymentId] = useState(null);

  useEffect(() => {
    if (value) {
      setBudgetType(value.type || 'none');
      const fixedBudgetValue = value.fixedBudget;
      if (fixedBudgetValue !== undefined && fixedBudgetValue !== null && fixedBudgetValue !== '') {
        const num = parseFloat(fixedBudgetValue);
        if (!isNaN(num)) {
          const rounded = Math.round(num);
          setFixedBudget(rounded.toFixed(2));
        } else {
          setFixedBudget('');
        }
      } else {
        setFixedBudget('');
      }
      const hourlyRateValue = value.hourlyRate;
      if (hourlyRateValue !== undefined && hourlyRateValue !== null && hourlyRateValue !== '') {
        const num = parseFloat(hourlyRateValue);
        if (!isNaN(num)) {
          const rounded = Math.round(num);
          setHourlyRate(rounded.toFixed(2));
        } else {
          setHourlyRate('');
        }
      } else {
        setHourlyRate('');
      }
      const monthlyHoursValue = value.monthlyHours;
      if (monthlyHoursValue !== undefined && monthlyHoursValue !== null && monthlyHoursValue !== '') {
        setMonthlyHours(monthlyHoursValue.toString());
      } else {
        setMonthlyHours('');
      }
      setPayments(value.payments || []);
    }
  }, [value]);

  const handleBudgetTypeChange = (type) => {
    setBudgetType(type);
    const newValue = {
      type,
      fixedBudget: type === 'fixed' ? fixedBudget : '',
      hourlyRate: type === 'hourly' ? hourlyRate : '',
      monthlyHours: type === 'hourly' ? monthlyHours : '',
      payments: type === 'none' ? [] : payments
    };
    onChange(newValue);
  };

  const handleFixedBudgetChange = (e) => {
    let val = e.target.value;
    
    if (val && !isNaN(parseFloat(val))) {
      const num = parseFloat(val);
      const rounded = Math.round(num * 100) / 100;
      val = rounded.toString();
    }
    
    setFixedBudget(val);
    onChange({
      type: budgetType,
      fixedBudget: val,
      hourlyRate,
      monthlyHours,
      payments
    });
  };
  
  const handleFixedBudgetBlur = (e) => {
    let val = e.target.value;
    
    if (val && !isNaN(parseFloat(val))) {
      const num = parseFloat(val);
      const rounded = Math.round(num * 100) / 100;
      val = rounded.toFixed(2);
      setFixedBudget(val);
      onChange({
        type: budgetType,
        fixedBudget: val,
        hourlyRate,
        monthlyHours,
        payments
      });
    }
  };

  const handleHourlyRateChange = (e) => {
    let val = e.target.value;
    setHourlyRate(val);
    
    if (val && !isNaN(parseFloat(val))) {
      const num = parseFloat(val);
      const rounded = Math.round(num * 100) / 100;
      onChange({
        type: budgetType,
        fixedBudget,
        hourlyRate: rounded.toString(),
        monthlyHours,
        payments
      });
    } else {
      onChange({
        type: budgetType,
        fixedBudget,
        hourlyRate: val,
        monthlyHours,
        payments
      });
    }
  };
  
  const handleHourlyRateBlur = (e) => {
    let val = e.target.value;
    
    if (val && val.trim() !== '') {
      if (!isNaN(parseFloat(val))) {
        const num = parseFloat(val);
        const rounded = Math.round(num * 100) / 100;
        const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
        setHourlyRate(formatted);
        onChange({
          type: budgetType,
          fixedBudget,
          hourlyRate: formatted,
          monthlyHours,
          payments
        });
      } else {
        setHourlyRate('');
        onChange({
          type: budgetType,
          fixedBudget,
          hourlyRate: '',
          monthlyHours,
          payments
        });
      }
    }
  };

  const handleMonthlyHoursChange = (e) => {
    const val = e.target.value;
    setMonthlyHours(val);
    onChange({
      type: budgetType,
      fixedBudget,
      hourlyRate,
      monthlyHours: val,
      payments
    });
  };

  const handleAddPayment = () => {
    const newPayment = {
      id: Date.now().toString(),
      amount: '',
      receivedAt: new Date().toISOString().split('T')[0]
    };
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    setEditingPaymentId(newPayment.id);
    onChange({
      type: budgetType,
      fixedBudget,
      hourlyRate,
      monthlyHours,
      payments: updatedPayments
    });
  };

  const handleStartEdit = (paymentId) => {
    setEditingPaymentId(paymentId);
  };

  const handleFinishEdit = (paymentId) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment && payment.amount && parseFloat(payment.amount) > 0) {
      setEditingPaymentId(null);
    }
  };

  const handleRemovePayment = (paymentId) => {
    if (editingPaymentId === paymentId) {
      setEditingPaymentId(null);
    }
    const updatedPayments = payments.filter(p => p.id !== paymentId);
    setPayments(updatedPayments);
    onChange({
      type: budgetType,
      fixedBudget,
      hourlyRate,
      monthlyHours,
      payments: updatedPayments
    });
  };

  const handlePaymentChange = (paymentId, field, newValue) => {
    const updatedPayments = payments.map(payment =>
      payment.id === paymentId
        ? { ...payment, [field]: newValue }
        : payment
    );
    setPayments(updatedPayments);
    onChange({
      type: budgetType,
      fixedBudget,
      hourlyRate,
      monthlyHours,
      payments: updatedPayments
    });
  };

  const totalReceived = payments.reduce((sum, payment) => {
    return sum + (parseFloat(payment.amount) || 0);
  }, 0);

  const remainingBudget = parseFloat(fixedBudget) - totalReceived;

  const hasBudgetData = (budgetType === 'fixed' && (fixedBudget || payments.length > 0)) ||
                        (budgetType === 'hourly' && hourlyRate);
  
  const isBudgetTypeDisabled = disabled || hasBudgetData;

  return (
    <div className="budget-manager">
      <div className="budget-type-selector">
        <label className="budget-label">Budget Type</label>
        {hasBudgetData && (
          <small className="budget-type-note">
            Budget type cannot be changed once data is entered. Clear all data to change type.
          </small>
        )}
        <div className="budget-type-options">
          <button
            type="button"
            className={`budget-type-btn ${budgetType === 'none' ? 'active' : ''}`}
            onClick={() => handleBudgetTypeChange('none')}
            disabled={isBudgetTypeDisabled}
          >
            No Budget
          </button>
          <button
            type="button"
            className={`budget-type-btn ${budgetType === 'fixed' ? 'active' : ''}`}
            onClick={() => handleBudgetTypeChange('fixed')}
            disabled={isBudgetTypeDisabled}
          >
            <FiDollarSign size={16} />
            Fixed Budget
          </button>
          <button
            type="button"
            className={`budget-type-btn ${budgetType === 'hourly' ? 'active' : ''}`}
            onClick={() => handleBudgetTypeChange('hourly')}
            disabled={isBudgetTypeDisabled}
          >
            <FiClock size={16} />
            Hour-Based
          </button>
        </div>
      </div>

      {budgetType === 'fixed' && (
        <div className="budget-section">
          <div className="form-group">
            <label>Total Budget Amount</label>
            <div className="input-with-icon">
              <FiDollarSign className="input-icon" />
              <input
                type="number"
                className="form-control"
                value={fixedBudget}
                onChange={handleFixedBudgetChange}
                onBlur={handleFixedBudgetBlur}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={disabled}
              />
            </div>
          </div>

          {fixedBudget && (
            <div className="budget-summary">
              <div className="summary-item">
                <span className="summary-label">Total Budget:</span>
                <span className="summary-value">${formatCurrency(parseFloat(fixedBudget || 0))}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Received:</span>
                <span className="summary-value received">${formatCurrency(totalReceived)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{remainingBudget < 0 ? 'Bonus:' : 'Remaining:'}</span>
                <span className={`summary-value ${remainingBudget < 0 ? 'bonus' : ''}`}>
                  {remainingBudget < 0 ? `+$${formatCurrency(Math.abs(remainingBudget))}` : `$${formatCurrency(remainingBudget)}`}
                </span>
              </div>
            </div>
          )}

          <div className="payments-section">
            <div className="payments-header">
              <label>Payment Received</label>
              <button
                type="button"
                className="add-payment-btn"
                onClick={handleAddPayment}
                disabled={disabled}
              >
                <FiPlus size={14} />
                Add Payment
              </button>
            </div>

            {payments.length > 0 ? (
              <div className="payments-list">
                {payments.map((payment, index) => {
                  const isEditing = editingPaymentId === payment.id;
                  const hasAmount = payment.amount && parseFloat(payment.amount) > 0;
                  
                  return (
                    <div key={payment.id} className={`payment-item ${isEditing ? 'editing' : ''}`}>
                      {!isEditing && hasAmount ? (
                        <div className="payment-summary">
                          <div className="payment-amount-display">
                            <FiDollarSign size={14} />
                            <span className="amount-value">${formatCurrency(parseFloat(payment.amount || 0))}</span>
                            {payment.receivedAt && (
                              <span className="payment-date">
                                {new Date(payment.receivedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="payment-actions">
                            <button
                              type="button"
                              className="edit-payment-btn"
                              onClick={() => handleStartEdit(payment.id)}
                              disabled={disabled}
                              title="Edit payment"
                            >
                              <FiEdit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="remove-payment-btn"
                              onClick={() => handleRemovePayment(payment.id)}
                              disabled={disabled}
                              title="Remove payment"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="payment-row">
                            <div className="form-group-inline">
                              <label>Amount</label>
                              <div className="input-with-icon">
                                <FiDollarSign className="input-icon" />
                                <input
                                  type="number"
                                  className="form-control"
                                  value={payment.amount}
                                  onChange={(e) => handlePaymentChange(payment.id, 'amount', e.target.value)}
                                  onBlur={() => handleFinishEdit(payment.id)}
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                  disabled={disabled}
                                  autoFocus={isEditing && !hasAmount}
                                />
                              </div>
                            </div>
                            <div className="form-group-inline">
                              <label>Date Received</label>
                              <div className="input-with-icon">
                                <FiCalendar className="input-icon" />
                                <input
                                  type="date"
                                  className="form-control"
                                  value={payment.receivedAt}
                                  onChange={(e) => handlePaymentChange(payment.id, 'receivedAt', e.target.value)}
                                  disabled={disabled}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              className="remove-payment-btn"
                              onClick={() => handleRemovePayment(payment.id)}
                              disabled={disabled}
                              title="Remove payment"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-payments">
                <p>No payments recorded yet. Click "Add Payment" to track received payments.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {budgetType === 'hourly' && (
        <div className="budget-section">
          <div className="form-group">
            <label>Hourly Rate</label>
            <div className="input-with-icon">
              <FiDollarSign className="input-icon" />
              <input
                type="number"
                className="form-control"
                value={hourlyRate}
                onChange={handleHourlyRateChange}
                onBlur={handleHourlyRateBlur}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={disabled}
              />
            </div>
            <small className="form-text text-muted">
              Budget will be calculated based on total hours tracked × hourly rate
            </small>
          </div>

          <div className="form-group">
            <label>Monthly Hours</label>
            <div className="input-with-icon">
              <FiClock className="input-icon" />
              <input
                type="number"
                className="form-control"
                value={monthlyHours}
                onChange={handleMonthlyHoursChange}
                placeholder="0"
                min="0"
                step="1"
                disabled={disabled}
              />
            </div>
          </div>

          <div className="payments-section">
            <div className="payments-header">
              <label>Payment Received</label>
              <button
                type="button"
                className="add-payment-btn"
                onClick={handleAddPayment}
                disabled={disabled}
              >
                <FiPlus size={14} />
                Add Payment
              </button>
            </div>

            {payments.length > 0 ? (
              <div className="payments-list">
                {payments.map((payment, index) => {
                  const isEditing = editingPaymentId === payment.id;
                  const hasAmount = payment.amount && parseFloat(payment.amount) > 0;
                  
                  return (
                    <div key={payment.id} className={`payment-item ${isEditing ? 'editing' : ''}`}>
                      {!isEditing && hasAmount ? (
                        <div className="payment-summary">
                          <div className="payment-amount-display">
                            <FiDollarSign size={14} />
                            <span className="amount-value">${formatCurrency(parseFloat(payment.amount || 0))}</span>
                            {payment.receivedAt && (
                              <span className="payment-date">
                                {new Date(payment.receivedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="payment-actions">
                            <button
                              type="button"
                              className="edit-payment-btn"
                              onClick={() => handleStartEdit(payment.id)}
                              disabled={disabled}
                              title="Edit payment"
                            >
                              <FiEdit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="remove-payment-btn"
                              onClick={() => handleRemovePayment(payment.id)}
                              disabled={disabled}
                              title="Remove payment"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="payment-row">
                            <div className="form-group-inline">
                              <label>Amount</label>
                              <div className="input-with-icon">
                                <FiDollarSign className="input-icon" />
                                <input
                                  type="number"
                                  className="form-control"
                                  value={payment.amount}
                                  onChange={(e) => handlePaymentChange(payment.id, 'amount', e.target.value)}
                                  onBlur={() => handleFinishEdit(payment.id)}
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                  disabled={disabled}
                                  autoFocus={isEditing && !hasAmount}
                                />
                              </div>
                            </div>
                            <div className="form-group-inline">
                              <label>Date Received</label>
                              <div className="input-with-icon">
                                <FiCalendar className="input-icon" />
                                <input
                                  type="date"
                                  className="form-control"
                                  value={payment.receivedAt}
                                  onChange={(e) => handlePaymentChange(payment.id, 'receivedAt', e.target.value)}
                                  disabled={disabled}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              className="remove-payment-btn"
                              onClick={() => handleRemovePayment(payment.id)}
                              disabled={disabled}
                              title="Remove payment"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-payments">
                <p>No payments recorded yet. Click "Add Payment" to track received payments.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManager;

