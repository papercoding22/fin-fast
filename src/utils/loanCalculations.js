/**
 * Core loan calculation utilities - declining balance (dư nợ giảm dần)
 */

/**
 * Determine annual interest rate for a given month index (1-based)
 */
export function getMonthlyRate(monthIndex, fixedRate, fixedMonths, floatingRate) {
  const annualRate = monthIndex <= fixedMonths ? fixedRate : floatingRate;
  return annualRate / 12 / 100;
}

/**
 * Build full amortization schedule for a bank / loan combo.
 * Returns array of monthly payment objects.
 */
export function buildSchedule(loanAmount, loanTermMonths, fixedRate, fixedMonths, floatingRate) {
  const monthlyPrincipal = loanAmount / loanTermMonths;
  const schedule = [];
  let remaining = loanAmount;

  for (let month = 1; month <= loanTermMonths; month++) {
    const rate = getMonthlyRate(month, fixedRate, fixedMonths, floatingRate);
    const interest = remaining * rate;
    const principal = Math.min(monthlyPrincipal, remaining);
    const totalPayment = principal + interest;
    remaining = Math.max(0, remaining - principal);

    schedule.push({
      month,
      principal,
      interest,
      totalPayment,
      remainingAfter: remaining,
      annualRate: month <= fixedMonths ? fixedRate : floatingRate,
    });
  }

  return schedule;
}

/**
 * Get the prepayment penalty rate (%) for a given month index based on bank's fee table.
 * feeTable: array of { year, rate } sorted by year ascending.
 * year: the year number in which the prepayment occurs (1-based, ceil(month/12)).
 */
export function getPrepaymentFeeRate(feeTable, monthIndex) {
  const year = Math.ceil(monthIndex / 12);
  // Find matching row: feeTable entries use { upToYear, rate } or { year, rate }
  // We'll support: array sorted by year, last matching entry wins
  let rate = 0;
  for (const row of feeTable) {
    if (year <= row.upToYear) {
      rate = row.rate;
      break;
    }
  }
  return rate; // percentage, e.g. 4.5 means 4.5%
}

/**
 * Calculate total cost of a scenario (pay until month N, then settle remaining balance).
 * If settleMonth >= loanTermMonths, it means holding to full term (no prepayment penalty).
 */
export function calcScenario(schedule, settleMonth, feeTable, additionalCosts) {
  const loanTermMonths = schedule.length;
  const isFullTerm = settleMonth >= loanTermMonths;
  const effectiveSettle = isFullTerm ? loanTermMonths : settleMonth;

  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;

  for (let i = 0; i < effectiveSettle; i++) {
    totalPrincipalPaid += schedule[i].principal;
    totalInterestPaid += schedule[i].interest;
  }

  const remainingBalance = isFullTerm ? 0 : schedule[effectiveSettle - 1].remainingAfter;

  let prepaymentFee = 0;
  let prepaymentFeeRate = 0;
  if (!isFullTerm && remainingBalance > 0) {
    prepaymentFeeRate = getPrepaymentFeeRate(feeTable, effectiveSettle);
    prepaymentFee = remainingBalance * (prepaymentFeeRate / 100);
  }

  const totalAdditional = additionalCosts.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Total cost = all principal (loan amount) + interest paid + prepayment fee + additional costs
  const loanAmount = schedule[0].principal * loanTermMonths;
  const totalCost = loanAmount + totalInterestPaid + prepaymentFee + totalAdditional;

  return {
    settleMonth: effectiveSettle,
    isFullTerm,
    totalPrincipalPaid,
    totalInterestPaid,
    remainingBalance,
    prepaymentFeeRate,
    prepaymentFee,
    totalAdditional,
    totalCost,
    // cost excluding principal repayment (the "real" extra cost)
    costExcludingPrincipal: totalInterestPaid + prepaymentFee + totalAdditional,
  };
}

/**
 * Get payment details at specific months for summary table.
 */
export function getPaymentAt(schedule, month) {
  if (month < 1 || month > schedule.length) return null;
  return schedule[month - 1];
}

/**
 * Format number as VND currency string.
 */
export function formatVND(value) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Format a plain number with thousand separators.
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Resolve additional costs for a bank, computing amounts from percentages.
 * Called with live carPrice and loanAmount so display stays in sync.
 */
export function resolveAdditionalCosts(bank, carPrice, loanAmount) {
  return bank.additionalCosts.map((cost) => {
    let amount = cost.amount;
    if (cost.type === "percent_car") amount = (carPrice * cost.percent) / 100;
    if (cost.type === "percent_loan") amount = (loanAmount * cost.percent) / 100;
    return { ...cost, amount };
  });
}

/**
 * Compute simple weighted-average effective annual rate over the full loan term.
 */
export function calcEffectiveRate(fixedRate, fixedMonths, floatingRate, loanTermMonths) {
  const floatingMonths = Math.max(0, loanTermMonths - fixedMonths);
  return (
    (fixedRate * Math.min(fixedMonths, loanTermMonths) + floatingRate * floatingMonths) /
    loanTermMonths
  );
}

/**
 * Compute the effective floating rate for a bank.
 * If floatingRateMode === 'formula': rate = referenceIndex.currentValue + spread (+ optional offset for stress test)
 * If floatingRateMode === 'direct' or mode is absent: return bank.floatingRate as-is.
 */
export function computeFloatingRate(bank, referenceIndexes, stressOffset = 0) {
  if (bank.floatingRateMode === "formula" && bank.refIndexId) {
    const ref = referenceIndexes.find((r) => r.id === bank.refIndexId);
    if (ref) {
      return parseFloat((ref.currentValue + (bank.spread ?? 0) + stressOffset).toFixed(4));
    }
  }
  // Direct mode or fallback
  return bank.floatingRate + stressOffset;
}

/**
 * Run a full scenario calculation with an optional stress-test offset on the floating rate.
 * Returns the scenario result object.
 */
export function calcScenarioWithStress(
  loanAmount,
  loanTermMonths,
  bank,
  referenceIndexes,
  settleMonth,
  additionalCosts,
  stressOffset = 0
) {
  const floatingRate = computeFloatingRate(bank, referenceIndexes, stressOffset);
  const schedule = buildSchedule(
    loanAmount,
    loanTermMonths,
    bank.fixedRate,
    bank.fixedMonths,
    floatingRate
  );
  return {
    floatingRate,
    ...calcScenario(schedule, settleMonth, bank.prepaymentFees, additionalCosts),
  };
}

/**
 * Export an amortization schedule as a CSV string, with optional floating-rate formula metadata.
 */
export function scheduleToCSV(schedule, bankName, floatingRateMeta = null) {
  const metaLines = floatingRateMeta
    ? [
        `Công thức lãi thả nổi: ${floatingRateMeta.formula}`,
        `Chỉ số tham chiếu: ${floatingRateMeta.refName} = ${floatingRateMeta.refValue}%/năm (hiệu lực ${floatingRateMeta.effectiveDate})`,
        `Biên độ: +${floatingRateMeta.spread}%`,
        `Tần suất điều chỉnh: ${floatingRateMeta.adjustmentFrequency}`,
        `Lưu ý: Lãi suất thả nổi có thể thay đổi theo thị trường - số liệu chỉ mang tính tham khảo`,
        "",
      ]
    : [];

  const header = [
    "Tháng",
    "Lãi suất (%/năm)",
    "Dư nợ đầu kỳ (đ)",
    "Gốc trả (đ)",
    "Lãi trả (đ)",
    "Tổng trả (đ)",
    "Dư nợ cuối kỳ (đ)",
  ];
  const rows = schedule.map((row, i) => {
    const openingBalance =
      i === 0 ? row.principal * schedule.length : schedule[i - 1].remainingAfter;
    return [
      row.month,
      row.annualRate,
      Math.round(openingBalance),
      Math.round(row.principal),
      Math.round(row.interest),
      Math.round(row.totalPayment),
      Math.round(row.remainingAfter),
    ];
  });
  const totalPrincipal = schedule.reduce((s, r) => s + r.principal, 0);
  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
  const totalPayment = schedule.reduce((s, r) => s + r.totalPayment, 0);
  rows.push([
    "TỔNG",
    "",
    "",
    Math.round(totalPrincipal),
    Math.round(totalInterest),
    Math.round(totalPayment),
    0,
  ]);
  const csvLines = [header, ...rows].map((r) => r.join(",")).join("\n");
  return `﻿${bankName} - Lịch trả nợ\n${metaLines.join("\n")}${csvLines}`;
}
