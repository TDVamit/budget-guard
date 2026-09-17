import type { FixedExpense, IncomeSource, PlannedExpense, Transaction } from '../models/types';

function isIncome(t: Transaction): boolean {
  return t.type === 'INCOME' && t.direction === 'CREDIT';
}

/** All income that arrived mid-cycle, wherever the user sent it. */
export function adHocIncomePaise(transactions: Transaction[]): number {
  return transactions.filter(isIncome).reduce((sum, t) => sum + t.amountPaise, 0);
}

/**
 * Income raises the spendable budget by default — money in hand is money you
 * can use — so it flows into the discretionary total and lands in Others.
 */
export function incomeToBudgetPaise(transactions: Transaction[]): number {
  return transactions
    .filter((t) => isIncome(t) && (t.incomeDestination ?? 'BUDGET') === 'BUDGET')
    .reduce((sum, t) => sum + t.amountPaise, 0);
}

/** Income the user chose to keep out of the daily allowance. */
export function incomeToSavingsPaise(transactions: Transaction[]): number {
  return transactions
    .filter((t) => isIncome(t) && t.incomeDestination === 'SAVINGS')
    .reduce((sum, t) => sum + t.amountPaise, 0);
}

/** Income that can be safely relied on right now: received, or guaranteed. */
export function safeIncomePaise(sources: IncomeSource[]): number {
  return sources
    .filter((s) => s.status === 'RECEIVED' || s.guaranteed)
    .reduce((sum, s) => sum + s.amountPaise, 0);
}

export function totalExpectedIncomePaise(sources: IncomeSource[]): number {
  return sources.reduce((sum, s) => sum + s.amountPaise, 0);
}

export function totalFixedExpensePaise(expenses: FixedExpense[]): number {
  return expenses.reduce((sum, e) => sum + e.amountPaise, 0);
}

export function totalPlannedExpensePaise(expenses: PlannedExpense[]): number {
  return expenses.reduce((sum, e) => sum + e.amountPaise, 0);
}

/**
 * Core planning equation (spec §6):
 * income - fixed - planned - savings target = discretionary budget.
 * Uses safe (received/guaranteed) income by default so the plan never
 * assumes uncertain money is already available.
 */
export function discretionaryBudgetPaise(params: {
  incomeSources: IncomeSource[];
  fixedExpenses: FixedExpense[];
  plannedExpenses: PlannedExpense[];
  savingsTargetPaise: number;
  useSafeIncome?: boolean;
  /** Mid-cycle income the user is letting the budget spend. */
  extraBudgetIncomePaise?: number;
}): number {
  const income = params.useSafeIncome === false
    ? totalExpectedIncomePaise(params.incomeSources)
    : safeIncomePaise(params.incomeSources);
  return (
    income
    + (params.extraBudgetIncomePaise ?? 0)
    - totalFixedExpensePaise(params.fixedExpenses)
    - totalPlannedExpensePaise(params.plannedExpenses)
    - params.savingsTargetPaise
  );
}

/**
 * Widget "monthly saved" (spec §13): money still saved from the
 * discretionary/daily category budgets. Distinct from the savings target.
 */
export function monthlySavedFromDailyBudgetsPaise(
  totalCategoryBudgetPaise: number,
  totalVariableSpendPaise: number,
): number {
  return totalCategoryBudgetPaise - totalVariableSpendPaise;
}

/**
 * Projected savings (spec §14): the savings target plus whatever of the
 * category budgets goes unspent (or minus overspend, since monthlySavedPaise
 * already goes negative in that case) — money you'll actually end up with by
 * cycle end if the current pace holds.
 */
export function projectedSavingsPaise(savingsTargetPaise: number, monthlySavedPaise: number): number {
  return savingsTargetPaise + monthlySavedPaise;
}
