import { startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';

export const calculateAfterTax = (amount, taxPercent) => {
  if (!amount || amount === 0 || amount === '' || isNaN(parseFloat(amount))) return 0;
  const amt = parseFloat(amount);
  const taxPct = parseFloat(taxPercent) || 0;
  if (taxPct <= 0) return Math.round(amt);
  const taxAmount = (amt * taxPct) / 100;
  return Math.round(amt - taxAmount);
};

export const calculateMonthlyFinance = (projects, tasks, selectedDate, monthlyBudget = 0) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const projectPayments = projects
    .filter(project => project.budget && project.budget.type !== 'none')
    .map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const totalProjectHours = projectTasks.reduce((sum, task) => {
        if (task.timeEntries && task.timeEntries.length > 0) {
          const taskHours = task.timeEntries.reduce((entrySum, entry) => {
            return entrySum + (parseFloat(entry.hours) || 0);
          }, 0);
          return sum + taskHours;
        }
        return sum + (parseFloat(task.totalHours) || 0);
      }, 0);

      if (project.budget.type === 'fixed') {
        const allPayments = (project.budget.payments || []).filter(payment => {
          if (!payment.receivedAt || !payment.amount) return false;
          const paymentDate = new Date(payment.receivedAt);
          return paymentDate <= monthEnd;
        });

        const thisMonthPayments = allPayments.filter(payment => {
          const paymentDate = new Date(payment.receivedAt);
          return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
        });

        const previousMonthPayments = allPayments.filter(payment => {
          const paymentDate = new Date(payment.receivedAt);
          return paymentDate < monthStart;
        });

        const previousMonths = [...new Set(previousMonthPayments.map(payment => {
          const paymentDate = new Date(payment.receivedAt);
          return format(paymentDate, 'MMMM yyyy');
        }))].sort();

        let tax = parseFloat(project.budget.tax);
        if (isNaN(tax) || tax === null || tax === undefined) {
          tax = project.projectType === 'freelance' ? 10 : 0;
        }
        const receivedBeforeTax = allPayments.reduce((sum, payment) => {
          const amount = parseFloat(payment.amount) || 0;
          return sum + amount;
        }, 0);

        const thisMonthReceivedBeforeTax = thisMonthPayments.reduce((sum, payment) => {
          const amount = parseFloat(payment.amount) || 0;
          return sum + amount;
        }, 0);

        const totalBudgetBeforeTax = parseFloat(project.budget.fixedBudget || 0);
        const totalBudget = calculateAfterTax(totalBudgetBeforeTax, tax);
        const received = calculateAfterTax(receivedBeforeTax, tax);
        const thisMonthReceived = calculateAfterTax(thisMonthReceivedBeforeTax, tax);

        return {
          projectId: project.id,
          projectName: project.name,
          budgetType: 'fixed',
          totalBudget,
          received,
          thisMonthReceived,
          paymentCount: allPayments.length,
          thisMonthPaymentCount: thisMonthPayments.length,
          hasPreviousPayments: previousMonthPayments.length > 0,
          previousMonths,
          payments: allPayments
        };
      }

      if (project.budget.type === 'hourly') {
        const hourlyRate = parseFloat(project.budget.hourlyRate || 0);
        
        if (!hourlyRate || hourlyRate <= 0) {
          return null;
        }

        const allPayments = (project.budget.payments || []).filter(payment => {
          if (!payment.receivedAt || !payment.amount) return false;
          const paymentDate = new Date(payment.receivedAt);
          return paymentDate <= monthEnd;
        });

        const thisMonthPayments = allPayments.filter(payment => {
          const paymentDate = new Date(payment.receivedAt);
          return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
        });

        const previousMonthPayments = allPayments.filter(payment => {
          const paymentDate = new Date(payment.receivedAt);
          return paymentDate < monthStart;
        });

        const previousMonths = [...new Set(previousMonthPayments.map(payment => {
          const paymentDate = new Date(payment.receivedAt);
          return format(paymentDate, 'MMMM yyyy');
        }))].sort();

        let tax = parseFloat(project.budget.tax);
        if (isNaN(tax) || tax === null || tax === undefined) {
          tax = project.projectType === 'freelance' ? 10 : 0;
        }
        const hourlyRateBeforeTax = hourlyRate;
        const hourlyRateAfterTax = calculateAfterTax(hourlyRateBeforeTax, tax);
        const estimatedBudget = totalProjectHours * hourlyRateAfterTax;
        
        const receivedBeforeTax = allPayments.reduce((sum, payment) => {
          const amount = parseFloat(payment.amount) || 0;
          return sum + amount;
        }, 0);

        const thisMonthReceivedBeforeTax = thisMonthPayments.reduce((sum, payment) => {
          const amount = parseFloat(payment.amount) || 0;
          return sum + amount;
        }, 0);

        const received = calculateAfterTax(receivedBeforeTax, tax);
        const thisMonthReceived = calculateAfterTax(thisMonthReceivedBeforeTax, tax);

        return {
          projectId: project.id,
          projectName: project.name,
          budgetType: 'hourly',
          hourlyRate: hourlyRateAfterTax,
          totalHours: totalProjectHours,
          estimatedBudget,
          received,
          thisMonthReceived,
          paymentCount: allPayments.length,
          thisMonthPaymentCount: thisMonthPayments.length,
          hasPreviousPayments: previousMonthPayments.length > 0,
          previousMonths,
          payments: allPayments
        };
      }

      return null;
    })
    .filter(p => p !== null && p.received > 0)
    .sort((a, b) => (b.received || 0) - (a.received || 0));

  const projectsWithThisMonthPayments = projectPayments.filter(p => p.thisMonthPaymentCount > 0);
  const hasThisMonthPayments = projectsWithThisMonthPayments.length > 0;

  const grandTotalReceived = projectPayments.reduce((sum, p) => sum + (p.received || 0), 0);
  const grandTotalThisMonthReceived = projectsWithThisMonthPayments.reduce((sum, p) => sum + (p.thisMonthReceived || 0), 0);
  
  const monthlyCalculatedEstimated = projectsWithThisMonthPayments.reduce((sum, p) => {
    if (p.budgetType === 'fixed') {
      return sum + (p.totalBudget || 0);
    } else {
      const hourlyRate = p.hourlyRate || 0;
      const projectTasks = tasks.filter(task => task.projectId === p.projectId);
      const thisMonthHours = projectTasks.reduce((hoursSum, task) => {
        if (!task.timeEntries || task.timeEntries.length === 0) return hoursSum;
        const thisMonthEntries = task.timeEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return isWithinInterval(entryDate, { start: monthStart, end: monthEnd });
        });
        const taskHours = thisMonthEntries.reduce((entrySum, entry) => entrySum + (entry.hours || 0), 0);
        return hoursSum + taskHours;
      }, 0);
      return sum + (thisMonthHours * hourlyRate);
    }
  }, 0);

  const projectsThisMonthOnly = projectsWithThisMonthPayments.filter(p => !p.hasPreviousPayments);
  const monthlyBudgetThisMonthOnly = projectsThisMonthOnly.reduce((sum, p) => {
    if (p.budgetType === 'fixed') {
      return sum + (p.totalBudget || 0);
    } else {
      const hourlyRate = p.hourlyRate || 0;
      const projectTasks = tasks.filter(task => task.projectId === p.projectId);
      const thisMonthHours = projectTasks.reduce((hoursSum, task) => {
        if (!task.timeEntries || task.timeEntries.length === 0) return hoursSum;
        const thisMonthEntries = task.timeEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return isWithinInterval(entryDate, { start: monthStart, end: monthEnd });
        });
        const taskHours = thisMonthEntries.reduce((entrySum, entry) => entrySum + (entry.hours || 0), 0);
        return hoursSum + taskHours;
      }, 0);
      return sum + (thisMonthHours * hourlyRate);
    }
  }, 0);

  return {
    projectPayments: hasThisMonthPayments ? projectsWithThisMonthPayments : projectPayments,
    grandTotalReceived: hasThisMonthPayments ? grandTotalThisMonthReceived : grandTotalReceived,
    grandTotalEstimated: monthlyCalculatedEstimated,
    calculatedEstimated: monthlyCalculatedEstimated,
    monthlyBudgetThisMonthOnly,
    monthlyBudget,
    hasThisMonthPayments
  };
};

