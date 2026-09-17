import { formatISO, isSameDay } from 'date-fns';
import type { BudgetCategory, BudgetCycle, Transaction, WidgetSnapshot } from '../models/types';
import { cycleDayNumber, cycleLengthDays } from './calculateCycle';
import { calculateCategoryAllowances } from './calculateCategoryAllowance';
import { incomeToBudgetPaise, incomeToSavingsPaise, monthlySavedFromDailyBudgetsPaise, projectedSavingsPaise } from './calculateSavings';
import { calculateDailyLedger } from './calculateDailyLedger';

export function calculateWidgetSnapshot(
  cycle: BudgetCycle,
  categories: BudgetCategory[],
  transactions: Transaction[],
  now: Date = new Date(),
): WidgetSnapshot {
  const cycleDay = cycleDayNumber(cycle, now);
  const cycleLength = cycleLengthDays(cycle);
  const allowances = calculateCategoryAllowances(categories, transactions, cycleDay, cycleLength);

  const totalCategoryBudgetPaise = categories
    .filter((c) => c.enabled)
    .reduce((sum, c) => sum + c.allocatedPaise, 0);
  const totalVariableSpendPaise = allowances.reduce((sum, a) => sum + a.spentPaise, 0);
  const adHocIncome = incomeToBudgetPaise(transactions);
  const monthlySaved =
    monthlySavedFromDailyBudgetsPaise(totalCategoryBudgetPaise, totalVariableSpendPaise)
    + incomeToSavingsPaise(transactions);

  const categoryNameById = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const todaysTransactions = transactions
    .filter((t) => t.type === 'VARIABLE_EXPENSE' && t.direction === 'DEBIT' && isSameDay(t.timestamp, now))
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((t) => ({
      id: t.id,
      title: t.merchant || t.note || 'Transaction',
      categoryName: categoryNameById[t.categoryId] ?? 'Others',
      amountPaise: t.amountPaise,
      timestamp: t.timestamp,
    }));

  return {
    currentDate: formatISO(now, { representation: 'date' }),
    totalAvailableTodayPaise: allowances.reduce((sum, a) => sum + a.availablePaise, 0),
    monthlySavedFromDailyBudgetsPaise: monthlySaved,
    savingsTargetPaise: cycle.savingsTargetPaise,
    totalCategoryBudgetPaise,
    totalVariableSpendPaise,
    adHocIncomePaise: adHocIncome,
    projectedSavingsPaise: projectedSavingsPaise(cycle.savingsTargetPaise, monthlySaved),
    categories: allowances.map((a) => ({
      id: a.categoryId,
      name: a.name,
      accruedPaise: a.accruedPaise,
      spentPaise: a.spentPaise,
      availablePaise: a.availablePaise,
    })),
    days: calculateDailyLedger(cycle, categories, transactions, now).map((d) => ({
      dayOfCycle: d.dayOfCycle,
      savedPaise: d.savedPaise,
      spentPaise: d.spentPaise,
      isFuture: d.isFuture,
    })),
    todaysTransactions,
    updatedAt: Date.now(),
  };
}
