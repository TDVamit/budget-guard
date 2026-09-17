/**
 * Exact accrual formula (spec §10). Integer paise only, floor-rounded,
 * so partial-paise remainders never leak into the UI.
 *
 * accruedAllowance = floor(B * D / N)
 * availableNow     = accruedAllowance - actualSpend
 */
export function accruedAllowancePaise(
  totalBudgetPaise: number,
  cycleDay: number,
  cycleLength: number,
): number {
  return Math.floor((totalBudgetPaise * cycleDay) / cycleLength);
}

export function availableNowPaise(
  totalBudgetPaise: number,
  cycleDay: number,
  cycleLength: number,
  actualSpendPaise: number,
): number {
  return accruedAllowancePaise(totalBudgetPaise, cycleDay, cycleLength) - actualSpendPaise;
}
