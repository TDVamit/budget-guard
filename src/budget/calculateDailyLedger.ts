import { addDays, isSameDay, startOfDay } from 'date-fns';
import type { BudgetCategory, BudgetCycle, Transaction } from '../models/types';
import { cycleDayNumber, cycleLengthDays } from './calculateCycle';

export type DayResult = {
  date: Date;
  dayOfCycle: number;
  /** Daily share of the budget for that day. */
  allowancePaise: number;
  spentPaise: number;
  /** Positive when under the day's allowance, negative when over. */
  savedPaise: number;
  isFuture: boolean;
};

/**
 * Per-day saved/overspent for the cycle: each day gets an equal share of the
 * category budget, and whatever variable spend landed that day is set against it.
 */
export function calculateDailyLedger(
  cycle: BudgetCycle,
  categories: BudgetCategory[],
  transactions: Transaction[],
  now: Date = new Date(),
): DayResult[] {
  const length = cycleLengthDays(cycle);
  const today = cycleDayNumber(cycle, now);
  const totalBudget = categories.filter((c) => c.enabled).reduce((sum, c) => sum + c.allocatedPaise, 0);
  const allowancePaise = length > 0 ? Math.round(totalBudget / length) : 0;
  const start = startOfDay(new Date(cycle.startDate));

  const spends = transactions.filter((t) => t.type === 'VARIABLE_EXPENSE');

  return Array.from({ length }, (_, i) => {
    const date = addDays(start, i);
    const spentPaise = spends.reduce((sum, t) => {
      if (!isSameDay(t.timestamp, date)) return sum;
      if (t.direction === 'DEBIT') return sum + t.amountPaise;
      if (t.direction === 'REFUND') return sum - t.amountPaise;
      return sum;
    }, 0);
    return {
      date,
      dayOfCycle: i + 1,
      allowancePaise,
      spentPaise,
      savedPaise: allowancePaise - spentPaise,
      isFuture: i + 1 > today,
    };
  });
}
