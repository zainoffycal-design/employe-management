import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiAlertCircle, FiPlus, FiTrash2, FiDownload } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import { permissionUtils } from '../../utils/permissionUtils';
import { reactSelectStyles } from '../../utils/uiUtils';
import { calculateAfterTax } from '../../utils/financeCalculations';
import Select from 'react-select';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button';
import { exportProjectCalculator } from '../../utils/excelExport';
import './ProjectCalculator.scss';

const fixedSelectStyles = {
  ...reactSelectStyles,
  control: (base, state) => ({
    ...base,
    minHeight: '48px',
    backgroundColor: 'white',
    borderColor: '#d1d5db',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    boxShadow: 'none',
    opacity: 1,
    cursor: 'default'
  }),
  singleValue: (base) => ({
    ...base,
    color: '#334155'
  })
};

const PROJECT_TYPE_OPTIONS = [
  { value: 'contract', label: 'Contract' },
  { value: 'full-time', label: 'Full Time' },
  { value: '1099', label: '1099' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internal', label: 'Internal' }
];

const ProjectCalculator = () => {
  const { currentUser } = useAuth();
  const { projects } = useTask();
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [type, setType] = useState('');
  const [costType, setCostType] = useState('hourly');
  const [costAmount, setCostAmount] = useState('');
  const [monthlyHours, setMonthlyHours] = useState('');
  const [expenses, setExpenses] = useState([
    { id: 1, title: 'Tax', amount: '' }
  ]);

  const projectOptions = useMemo(() => {
    return projects.map(project => ({
      value: project.id,
      label: project.name
    }));
  }, [projects]);

  const handleProjectChange = (selectedOption) => {
    setSelectedProject(selectedOption);
    if (selectedOption) {
      const project = projects.find(p => p.id === selectedOption.value);
      if (project) {
        setProjectTitle(project.name);
        if (project.projectType) {
          setType(project.projectType);
        }
        const budgetType = project.budget?.type;
        
        let tax = parseFloat(project.budget?.tax);
        if (isNaN(tax) || tax === null || tax === undefined) {
          tax = project.projectType === 'freelance' ? 10 : 0;
        }

        if (budgetType === 'hourly' || budgetType === 'fixed') {
          setCostType(budgetType);
          if (budgetType === 'hourly' && project.budget?.hourlyRate !== undefined && project.budget?.hourlyRate !== null && project.budget?.hourlyRate !== '') {
            const hourlyRateValue = project.budget.hourlyRate;
            const hourlyRateAfterTax = calculateAfterTax(hourlyRateValue, tax);
            if (typeof hourlyRateValue === 'string') {
              const num = hourlyRateAfterTax;
              if (!isNaN(num) && isFinite(num)) {
                setCostAmount(num.toString());
              } else {
                setCostAmount(hourlyRateAfterTax.toString());
              }
            } else {
              setCostAmount(hourlyRateAfterTax.toString());
            }
            if (project.budget?.monthlyHours !== undefined && project.budget?.monthlyHours !== null && project.budget?.monthlyHours !== '') {
              setMonthlyHours(project.budget.monthlyHours.toString());
            } else {
              setMonthlyHours('');
            }
          } else if (budgetType === 'fixed' && project.budget?.fixedBudget !== undefined && project.budget?.fixedBudget !== null && project.budget?.fixedBudget !== '') {
            const fixedBudgetValue = project.budget.fixedBudget;
            const fixedBudgetAfterTax = calculateAfterTax(fixedBudgetValue, tax);
            if (typeof fixedBudgetValue === 'string') {
              const num = fixedBudgetAfterTax;
              if (!isNaN(num) && isFinite(num)) {
                setCostAmount(num.toString());
              } else {
                setCostAmount(fixedBudgetAfterTax.toString());
              }
            } else {
              setCostAmount(fixedBudgetAfterTax.toString());
            }
            setMonthlyHours('');
          } else {
            setMonthlyHours('');
          }
        } else {
          setMonthlyHours('');
        }
      }
    } else {
      setProjectTitle('');
      setType('');
      setCostType('hourly');
      setCostAmount('');
      setMonthlyHours('');
    }
  };

  const selectedProjectData = useMemo(() => {
    if (!selectedProject) return null;
    return projects.find(p => p.id === selectedProject.value);
  }, [selectedProject, projects]);

  const isProjectTypeFixed = selectedProjectData?.projectType ? true : false;
  const isCostTypeFixed = selectedProjectData?.budget?.type === 'hourly' || selectedProjectData?.budget?.type === 'fixed';
  const isCostAmountFixed = isCostTypeFixed && (
    (selectedProjectData?.budget?.type === 'hourly' && selectedProjectData?.budget?.hourlyRate) ||
    (selectedProjectData?.budget?.type === 'fixed' && selectedProjectData?.budget?.fixedBudget)
  );

  if (!permissionUtils.isSuperManager(currentUser)) {
    return (
      <motion.div className="page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="access-denied">
          <FiAlertCircle size={48} />
          <h3>Access Denied</h3>
          <p>Only Super Managers can access Project Calculator.</p>
        </div>
      </motion.div>
    );
  }

  const roundCurrency = (value) => {
    if (isNaN(value) || !isFinite(value)) return 0;
    return Math.round(value * 100) / 100;
  };

  const parseNumber = (value) => {
    if (!value || value === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const totalAmount = useMemo(() => {
    const cost = parseNumber(costAmount);
    const hours = parseNumber(monthlyHours);
    
    if (costType === 'hourly') {
      const result = cost * hours;
      return roundCurrency(result);
    } else {
      return roundCurrency(cost);
    }
  }, [costAmount, monthlyHours, costType]);

  const totalExpenses = useMemo(() => {
    const sum = expenses.reduce((acc, expense) => {
      const amount = parseNumber(expense.amount);
      return acc + amount;
    }, 0);
    return roundCurrency(sum);
  }, [expenses]);

  const grandTotal = useMemo(() => {
    return roundCurrency(totalAmount - totalExpenses);
  }, [totalAmount, totalExpenses]);

  const handleAddExpense = () => {
    const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
    setExpenses([...expenses, { id: newId, title: '', amount: '' }]);
  };

  const handleRemoveExpense = (id) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter(expense => expense.id !== id));
    }
  };

  const handleExpenseChange = (id, field, value) => {
    setExpenses(expenses.map(expense => 
      expense.id === id ? { ...expense, [field]: value } : expense
    ));
  };

  const handleCostAmountChange = (e) => {
    if (isCostAmountFixed) return;
    setCostAmount(e.target.value);
  };

  const handleMonthlyHoursChange = (e) => {
    setMonthlyHours(e.target.value);
  };

  const handleExpenseAmountChange = (id, value) => {
    handleExpenseChange(id, 'amount', value);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleExportToExcel = () => {
    if (!projectTitle.trim()) {
      alert('Please enter a Project Title before exporting.');
      return;
    }

    exportProjectCalculator({
      projectTitle,
      type,
      costType,
      costAmount,
      monthlyHours,
      totalAmount,
      expenses,
      totalExpenses,
      grandTotal
    });
  };

  return (
    <motion.div className="page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageTitle 
        title="Project Calculator"
        subtitle="Calculate project costs and expenses"
        icon={FiFileText}
        showBackButton={true}
        backTo="/"
        actions={
          <Button
            variant="primary"
            onClick={handleExportToExcel}
            disabled={!projectTitle.trim()}
          >
            <FiDownload size={16} />
            Export to Excel
          </Button>
        }
      />

      <div className="project-calculator-page">
        <div className="calculator-form">
          <div className="form-section">
            <h3 className="section-title">Project Information</h3>
            
            <div className="form-group">
              <label htmlFor="projectTitle">Project Title</label>
              <Select
                options={projectOptions}
                value={selectedProject}
                onChange={handleProjectChange}
                styles={reactSelectStyles}
                placeholder="Select a project..."
                isClearable
                isSearchable
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Project Type</label>
              <Select
                options={PROJECT_TYPE_OPTIONS}
                value={PROJECT_TYPE_OPTIONS.find(option => option.value === type)}
                onChange={(selected) => setType(selected?.value || '')}
                styles={isProjectTypeFixed ? fixedSelectStyles : reactSelectStyles}
                placeholder="Select project type..."
                isClearable
                isDisabled={isProjectTypeFixed}
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Cost Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="costType">Cost Type</label>
                <select
                  id="costType"
                  value={costType}
                  onChange={(e) => setCostType(e.target.value)}
                  className="form-select"
                  disabled={isCostTypeFixed}
                >
                  <option value="hourly">Hourly</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="costAmount">Cost Amount</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">$</span>
                  <input
                    type="text"
                    id="costAmount"
                    value={costAmount}
                    onChange={handleCostAmountChange}
                    onBlur={(e) => {
                      if (isCostAmountFixed) return;
                      const val = e.target.value.trim();
                      if (val === '') {
                        setCostAmount('');
                        return;
                      }
                      const num = parseFloat(val);
                      if (!isNaN(num) && isFinite(num) && num >= 0) {
                        if (Number.isInteger(num)) {
                          setCostAmount(num.toString());
                        } else {
                          const rounded = roundCurrency(num);
                          setCostAmount(rounded.toString());
                        }
                      }
                    }}
                    placeholder="0.00"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    className="form-input"
                    disabled={isCostAmountFixed}
                    readOnly={isCostAmountFixed}
                  />
                </div>
              </div>
            </div>

            {costType === 'hourly' && (
              <div className="form-group">
                <label htmlFor="monthlyHours">Monthly Hours</label>
                <input
                  type="text"
                  id="monthlyHours"
                  value={monthlyHours}
                  onChange={handleMonthlyHoursChange}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val === '') {
                      setMonthlyHours('');
                      return;
                    }
                    const num = parseFloat(val);
                    if (!isNaN(num) && isFinite(num) && num >= 0) {
                      if (Number.isInteger(num)) {
                        setMonthlyHours(num.toString());
                      } else {
                        const rounded = roundCurrency(num);
                        setMonthlyHours(rounded.toString());
                      }
                    }
                  }}
                  placeholder="0"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  className="form-input"
                />
              </div>
            )}

            <div className="calculated-field">
              <label>Total Amount</label>
              <div className="calculated-value">
                ${formatCurrency(totalAmount)}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">Expenses</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddExpense}
              >
                <FiPlus size={14} />
                Add Expense
              </Button>
            </div>

            <div className="expenses-list">
              {expenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  className="expense-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="expense-number">Expense {String(index + 1).padStart(2, '0')}</div>
                  <div className="expense-fields">
                    <div className="form-group">
                      <input
                        type="text"
                        value={expense.title}
                        onChange={(e) => handleExpenseChange(expense.id, 'title', e.target.value)}
                        placeholder="Expense title"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <div className="input-with-prefix">
                        <span className="input-prefix">$</span>
                        <input
                          type="text"
                          value={expense.amount}
                          onChange={(e) => handleExpenseAmountChange(expense.id, e.target.value)}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val === '') {
                              handleExpenseChange(expense.id, 'amount', '');
                              return;
                            }
                            const num = parseFloat(val);
                            if (!isNaN(num) && isFinite(num) && num >= 0) {
                              if (Number.isInteger(num)) {
                                handleExpenseChange(expense.id, 'amount', num.toString());
                              } else {
                                const rounded = roundCurrency(num);
                                handleExpenseChange(expense.id, 'amount', rounded.toString());
                              }
                            }
                          }}
                          placeholder="0.00"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          className="form-input"
                        />
                      </div>
                    </div>
                    {expenses.length > 1 && (
                      <button
                        type="button"
                        className="remove-expense-btn"
                        onClick={() => handleRemoveExpense(expense.id)}
                        title="Remove expense"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="form-section summary-section">
            <div className="summary-row">
              <span className="summary-label">Total Amount:</span>
              <span className="summary-value">${formatCurrency(totalAmount)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Total Expenses:</span>
              <span className="summary-value expense">-${formatCurrency(totalExpenses)}</span>
            </div>
            <div className="summary-row grand-total">
              <span className="summary-label">Grand Total:</span>
              <span className="summary-value grand">${formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCalculator;
