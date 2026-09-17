import { addDays, addMonths, endOfMonth, formatISO, isAfter, parseISO, setDate } from 'date-fns';
import type { BudgetCycle } from '../models/types';
import * as cycleRepo from '../database/repositories/cycleRepository';
import type { FixedExpense, IncomeSource } from '../models/types';
import * as categoryRepo from '../database/repositories/categoryRepository';
import * as incomeRepo from '../database/repositories/incomeRepository';
import * as fixedRepo from '../database/repositories/fixedExpenseRepository';
import { cycleLengthDays } from './calculateCycle';

/**
 * At the next salary date, close the old cycle and open a new one,
 * carrying forward recurring items but not one-time planned expenses
 * (spec §50). Idempotent — safe to call on every app boot.
 */
export async function rolloverCycleIfNeeded(cycle: BudgetCycle, now: Date = new Date()): Promise<BudgetCycle> {
  if (!isAfter(now, parseISO(cycle.endDate))) return cycle;

  const length = cycleLengthDays(cycle);
  const previousStart = parseISO(cycle.startDate);
  const nextMonth = addMonths(previousStart, 1);
  const nextStart = cycle.recurrence === 'SALARY_DAY'
    ? setDate(nextMonth, Math.min(previousStart.getDate(), endOfMonth(nextMonth).getDate()))
    : addDays(parseISO(cycle.endDate), 1);
  const nextStartDate = formatISO(nextStart, { representation: 'date' });

  const [categories, incomeSources, fixedExpenses] = await Promise.all([
    categoryRepo.listCategories(cycle.id),
    incomeRepo.listIncomeSources(cycle.id),
    fixedRepo.listFixedExpenses(cycle.id),
  ]);

  await cycleRepo.closeCycle(cycle.id);
  const next = await cycleRepo.createCycle({
    startDate: nextStartDate,
    cycleLengthDays: length,
    savingsTargetPaise: cycle.savingsTargetPaise,
    timezone: cycle.timezone,
    cycleMode: cycle.cycleMode,
    recurrence: cycle.recurrence,
  });

  // Others already exists from createCycle; carry forward the rest.
  for (const c of categories) {
    if (c.isSystemCategory) continue;
    await categoryRepo.createCategory({ cycleId: next.id, name: c.name, allocatedPaise: c.allocatedPaise });
  }
  for (const s of incomeSources) {
    // One-time income is exactly that: it must not reappear next cycle.
    if (!carriesForward.income(s)) continue;
    await incomeRepo.addIncomeSource({
      cycleId: next.id, name: s.name, amountPaise: s.amountPaise, type: s.type,
      expectedDate: undefined, status: 'EXPECTED', guaranteed: s.guaranteed,
    });
  }
  for (const f of fixedExpenses) {
    if (!carriesForward.fixed(f)) continue;
    await fixedRepo.addFixedExpense({
      cycleId: next.id, name: f.name, amountPaise: f.amountPaise, dueDay: f.dueDay,
      recurring: f.recurring, type: f.type, status: 'PLANNED', linkedTransactionId: undefined,
    });
  }
  // One-time expenses are intentionally not carried forward either.

  return next;
}

/**
 * The carry-forward rules, in one place so they can be tested without a
 * database and so the labels ("fixed" vs "one-time") can't drift from
 * behaviour.
 */
export const carriesForward = {
  income: (s: IncomeSource) => s.type !== 'ONE_TIME',
  fixed: (f: FixedExpense) => f.recurring,
  oneTimeExpense: () => false,
};
