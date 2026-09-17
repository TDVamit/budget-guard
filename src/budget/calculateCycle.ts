import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { BudgetCycle } from '../models/types';

/** Total number of calendar days in the cycle, inclusive of both ends. */
export function cycleLengthDays(cycle: Pick<BudgetCycle, 'startDate' | 'endDate'>): number {
  const start = parseISO(cycle.startDate);
  const end = parseISO(cycle.endDate);
  return differenceInCalendarDays(end, start) + 1;
}

/**
 * Current day number within the cycle, starting at 1.
 * Clamped to [1, cycleLengthDays] so a stale "now" never produces an
 * accrual outside the cycle's own bounds.
 */
export function cycleDayNumber(
  cycle: Pick<BudgetCycle, 'startDate' | 'endDate'>,
  now: Date = new Date(),
): number {
  const start = parseISO(cycle.startDate);
  const day = differenceInCalendarDays(now, start) + 1;
  return Math.min(Math.max(day, 1), cycleLengthDays(cycle));
}

export function daysUntilCycleEnd(
  cycle: Pick<BudgetCycle, 'startDate' | 'endDate'>,
  now: Date = new Date(),
): number {
  const end = parseISO(cycle.endDate);
  return Math.max(differenceInCalendarDays(end, now), 0);
}
