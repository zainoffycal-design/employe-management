import * as XLSX from 'xlsx-js-style';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const applyCellStyle = (ws, cellAddress, style) => {
  if (!ws[cellAddress]) {
    ws[cellAddress] = { t: 's', v: '' };
  }
  ws[cellAddress].s = style;
};

const createHeaderStyle = () => ({
  font: { bold: true, sz: 18, color: { rgb: 'FFFFFFFF' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FF15A970' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'medium', color: { rgb: 'FF10B981' } },
    bottom: { style: 'medium', color: { rgb: 'FF10B981' } },
    left: { style: 'medium', color: { rgb: 'FF10B981' } },
    right: { style: 'medium', color: { rgb: 'FF10B981' } }
  }
});

const createGeneratedStyle = () => ({
  font: { sz: 10, color: { rgb: 'FF6B7280' }, italic: true },
  alignment: { horizontal: 'left', vertical: 'center' }
});

const createSectionHeaderStyle = () => ({
  font: { bold: true, sz: 13, color: { rgb: 'FFFFFFFF' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FF475569' }, patternType: 'solid' },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'FF334155' } },
    bottom: { style: 'thin', color: { rgb: 'FF334155' } },
    left: { style: 'thin', color: { rgb: 'FF334155' } },
    right: { style: 'thin', color: { rgb: 'FF334155' } }
  }
});

const createLabelStyle = () => ({
  font: { bold: true, sz: 11, color: { rgb: 'FF374151' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FFF9FAFB' }, patternType: 'solid' },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { rgb: 'FFE5E7EB' } }
  }
});

const createValueStyle = () => ({
  font: { sz: 11, color: { rgb: 'FF111827' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FFFFFFFF' }, patternType: 'solid' },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { rgb: 'FFE5E7EB' } }
  },
  numFmt: '"$"#,##0.00'
});

const createExpenseHeaderStyle = () => ({
  font: { bold: true, sz: 11, color: { rgb: 'FFFFFFFF' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FF0F766E' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'FF0D9488' } },
    bottom: { style: 'thin', color: { rgb: 'FF0D9488' } },
    left: { style: 'thin', color: { rgb: 'FF0D9488' } },
    right: { style: 'thin', color: { rgb: 'FF0D9488' } }
  }
});

const createExpenseRowStyle = () => ({
  font: { sz: 11, color: { rgb: 'FF111827' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FFFFF7ED' }, patternType: 'solid' },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { rgb: 'FFE5E7EB' } }
  }
});

const createExpenseAmountStyle = () => ({
  font: { sz: 11, color: { rgb: 'FF111827' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FFFFF7ED' }, patternType: 'solid' },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { rgb: 'FFE5E7EB' } }
  },
  numFmt: '"$"#,##0.00'
});

const createSummaryRowStyle = () => ({
  font: { bold: true, sz: 11, color: { rgb: 'FF111827' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FFECFDF5' }, patternType: 'solid' },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'FFD1FAE5' } },
    bottom: { style: 'thin', color: { rgb: 'FFD1FAE5' } },
    left: { style: 'thin', color: { rgb: 'FFD1FAE5' } },
    right: { style: 'thin', color: { rgb: 'FFD1FAE5' } }
  }
});

const createSummaryValueStyle = () => ({
  font: { bold: true, sz: 11, color: { rgb: 'FF111827' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FFECFDF5' }, patternType: 'solid' },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'FFD1FAE5' } },
    bottom: { style: 'thin', color: { rgb: 'FFD1FAE5' } },
    left: { style: 'thin', color: { rgb: 'FFD1FAE5' } },
    right: { style: 'thin', color: { rgb: 'FFD1FAE5' } }
  },
  numFmt: '"$"#,##0.00'
});

const createTotalStyle = () => ({
  font: { bold: true, sz: 12, color: { rgb: 'FFFFFFFF' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FF15A970' }, patternType: 'solid' },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    top: { style: 'medium', color: { rgb: 'FF10B981' } },
    bottom: { style: 'medium', color: { rgb: 'FF10B981' } },
    left: { style: 'thin', color: { rgb: 'FF10B981' } },
    right: { style: 'thin', color: { rgb: 'FF10B981' } }
  }
});

const createTotalValueStyle = () => ({
  font: { bold: true, sz: 12, color: { rgb: 'FFFFFFFF' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FF15A970' }, patternType: 'solid' },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: {
    top: { style: 'medium', color: { rgb: 'FF10B981' } },
    bottom: { style: 'medium', color: { rgb: 'FF10B981' } },
    left: { style: 'thin', color: { rgb: 'FF10B981' } },
    right: { style: 'thin', color: { rgb: 'FF10B981' } }
  },
  numFmt: '"$"#,##0.00'
});

const createGrandTotalStyle = () => ({
  font: { bold: true, sz: 15, color: { rgb: 'FFFFFFFF' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FF059669' }, patternType: 'solid' },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    top: { style: 'thick', color: { rgb: 'FF047857' } },
    bottom: { style: 'thick', color: { rgb: 'FF047857' } },
    left: { style: 'thick', color: { rgb: 'FF047857' } },
    right: { style: 'thick', color: { rgb: 'FF047857' } }
  }
});

const createGrandTotalValueStyle = () => ({
  font: { bold: true, sz: 15, color: { rgb: 'FFFFFFFF' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'FF059669' }, patternType: 'solid' },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: {
    top: { style: 'thick', color: { rgb: 'FF047857' } },
    bottom: { style: 'thick', color: { rgb: 'FF047857' } },
    left: { style: 'thick', color: { rgb: 'FF047857' } },
    right: { style: 'thick', color: { rgb: 'FF047857' } }
  },
  numFmt: '"$"#,##0.00'
});

export const exportProjectCalculator = (data) => {
  const {
    projectTitle,
    type,
    costType,
    costAmount,
    monthlyHours,
    totalAmount,
    expenses,
    totalExpenses,
    grandTotal
  } = data;

  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const rows = [];

  rows.push(['PROJECT CALCULATOR REPORT']);
  rows.push(['']);
  rows.push(['Generated:', `${dateStr} at ${timeStr}`]);
  rows.push(['']);
  rows.push(['PROJECT INFORMATION']);
  rows.push(['']);
  rows.push(['Project Title', projectTitle]);
  rows.push(['Type', type]);
  rows.push(['']);
  rows.push(['COST INFORMATION']);
  rows.push(['']);
  rows.push(['Cost Type', costType === 'hourly' ? 'Hourly' : 'Fixed']);
  rows.push(['Cost Amount', parseFloat(costAmount) || 0]);
  rows.push(['Monthly Hours', parseFloat(monthlyHours) || 0]);
  rows.push(['Total Amount', totalAmount]);
  rows.push(['']);
  rows.push(['EXPENSES']);
  rows.push(['']);
  rows.push(['Title', 'Amount']);

  expenses.forEach(expense => {
    rows.push([
      expense.title || 'N/A',
      parseFloat(expense.amount) || 0
    ]);
  });

  rows.push(['']);
  rows.push(['SUMMARY']);
  rows.push(['']);
  rows.push(['Total Amount', totalAmount]);
  rows.push(['Total Expenses', totalExpenses]);
  rows.push(['GRAND TOTAL', grandTotal]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 28 },
    { wch: 22 }
  ];

  ws['!rows'] = [];
  for (let i = 0; i < rows.length; i++) {
    if (i === 0) {
      ws['!rows'][i] = { hpt: 30 };
    } else if (rows[i] && (rows[i][0] === 'PROJECT INFORMATION' || rows[i][0] === 'COST INFORMATION' || rows[i][0] === 'EXPENSES' || rows[i][0] === 'SUMMARY')) {
      ws['!rows'][i] = { hpt: 22 };
    } else if (rows[i] && rows[i][0] === 'GRAND TOTAL') {
      ws['!rows'][i] = { hpt: 28 };
    } else {
      ws['!rows'][i] = { hpt: 18 };
    }
  }

  const range = XLSX.utils.decode_range(ws['!ref']);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[cellAddress]) {
        ws[cellAddress] = { t: 's', v: '' };
      }

      const cellValue = rows[R] && rows[R][C];
      const isHeader = R === 0;
      const isGenerated = R === 2;
      const isProjectInfo = R === 4 && cellValue === 'PROJECT INFORMATION';
      const isCostInfo = R === 9 && cellValue === 'COST INFORMATION';
      const isExpenses = R === 15 && cellValue === 'EXPENSES';
      const isSummary = R === rows.length - 6 && cellValue === 'SUMMARY';
      const isGrandTotal = R === rows.length - 1;
      const expensesStartRow = rows.findIndex(row => row && row[0] === 'Title' && row[1] === 'Amount');
      const summaryStartRow = rows.findIndex(row => row && row[0] === 'SUMMARY');
      const isExpenseHeader = expensesStartRow !== -1 && R === expensesStartRow && (cellValue === 'Title' || cellValue === 'Amount');
      const isExpenseRow = expensesStartRow !== -1 && summaryStartRow !== -1 && R > expensesStartRow && R < summaryStartRow && rows[R] && rows[R][0] !== '' && rows[R][0] !== 'SUMMARY';
      const isSummaryRow = summaryStartRow !== -1 && R > summaryStartRow && R < rows.length - 1 && rows[R] && rows[R][0] !== '' && rows[R][0] !== 'SUMMARY' && rows[R][0] !== 'GRAND TOTAL';
      const isTotalRow = (R === rows.length - 3 || R === rows.length - 2);
      const isLabel = C === 0 && !isHeader && !isGenerated && !isProjectInfo && !isCostInfo && !isExpenses && !isSummary && !isGrandTotal && !isTotalRow && !isExpenseHeader && !isExpenseRow && !isSummaryRow;
      const isValue = C === 1 && typeof cellValue === 'number' && !isHeader && !isGenerated && !isExpenseHeader && !isExpenseRow;

      if (isHeader) {
        applyCellStyle(ws, cellAddress, createHeaderStyle());
      } else if (isGenerated) {
        if (C === 0) {
          applyCellStyle(ws, cellAddress, createGeneratedStyle());
        }
      } else if (isProjectInfo || isCostInfo || isExpenses || isSummary) {
        applyCellStyle(ws, cellAddress, createSectionHeaderStyle());
      } else if (isExpenseHeader) {
        applyCellStyle(ws, cellAddress, createExpenseHeaderStyle());
      } else if (isExpenseRow) {
        if (C === 0) {
          applyCellStyle(ws, cellAddress, createExpenseRowStyle());
        } else {
          applyCellStyle(ws, cellAddress, createExpenseAmountStyle());
        }
      } else if (isSummaryRow) {
        if (C === 0) {
          applyCellStyle(ws, cellAddress, createSummaryRowStyle());
        } else {
          applyCellStyle(ws, cellAddress, createSummaryValueStyle());
        }
      } else if (isGrandTotal) {
        if (C === 0) {
          applyCellStyle(ws, cellAddress, createGrandTotalStyle());
        } else {
          applyCellStyle(ws, cellAddress, createGrandTotalValueStyle());
        }
      } else if (isTotalRow) {
        if (C === 0) {
          applyCellStyle(ws, cellAddress, createTotalStyle());
        } else {
          applyCellStyle(ws, cellAddress, createTotalValueStyle());
        }
      } else if (isLabel) {
        applyCellStyle(ws, cellAddress, createLabelStyle());
      } else if (isValue) {
        applyCellStyle(ws, cellAddress, createValueStyle());
      } else if (C === 1 && rows[R] && rows[R][1] && typeof rows[R][1] === 'string') {
        const defaultStyle = {
          font: { sz: 11, color: { rgb: 'FF111827' }, name: 'Calibri' },
          fill: { fgColor: { rgb: 'FFFFFFFF' }, patternType: 'solid' },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { rgb: 'FFE5E7EB' } }
          }
        };
        applyCellStyle(ws, cellAddress, defaultStyle);
      }
    }
  }

  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
  
  const projectInfoRow = rows.findIndex(row => row[0] === 'PROJECT INFORMATION');
  if (projectInfoRow !== -1) {
    ws['!merges'].push({ s: { r: projectInfoRow, c: 0 }, e: { r: projectInfoRow, c: 1 } });
  }
  
  const costInfoRow = rows.findIndex(row => row[0] === 'COST INFORMATION');
  if (costInfoRow !== -1) {
    ws['!merges'].push({ s: { r: costInfoRow, c: 0 }, e: { r: costInfoRow, c: 1 } });
  }
  
  const expensesRow = rows.findIndex(row => row[0] === 'EXPENSES');
  if (expensesRow !== -1) {
    ws['!merges'].push({ s: { r: expensesRow, c: 0 }, e: { r: expensesRow, c: 1 } });
  }
  
  const summaryRow = rows.findIndex(row => row[0] === 'SUMMARY');
  if (summaryRow !== -1) {
    ws['!merges'].push({ s: { r: summaryRow, c: 0 }, e: { r: summaryRow, c: 1 } });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Project Calculator');

  const fileName = `${projectTitle.replace(/[^a-z0-9]/gi, '_')}_Calculator_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
