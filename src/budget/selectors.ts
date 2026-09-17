import type { BudgetCategory, BudgetCycle, FixedExpense, IncomeSource, PlannedExpense, Transaction } from '../models/types';
import { cycleDayNumber, cycleLengthDays, daysUntilCycleEnd } from './calculateCycle';
import { calculateCategoryAllowances, categorySpendPaise } from './calculateCategoryAllowance';
import {
  discretionaryBudgetPaise,
  incomeToBudgetPaise,
  incomeToSavingsPaise,
  monthlySavedFromDailyBudgetsPaise,
  projectedSavingsPaise,
} from './calculateSavings';

export function calculateDashboard(
  cycle: BudgetCycle,
  categories: BudgetCategory[],
  transactions: Transaction[],
  incomeSources: IncomeSource[],
  fixedExpenses: FixedExpense[],
  plannedExpenses: PlannedExpense[],
  now: Date = new Date(),
) {
  const cycleDay = cycleDayNumber(cycle, now);
  const cycleLength = cycleLengthDays(cycle);
  const enabledCategories = categories.filter((c) => c.enabled);

  const allowances = calculateCategoryAllowances(enabledCategories, transactions, cycleDay, cycleLength);
  const totalAvailableTodayPaise = allowances.reduce((sum, a) => sum + a.availablePaise, 0);

  const totalCategoryBudgetPaise = enabledCategories.reduce((sum, c) => sum + c.allocatedPaise, 0);
  const totalVariableSpendPaise = enabledCategories.reduce(
    (sum, c) => sum + categorySpendPaise(transactions, c.id),
    0,
  );
  const budgetRemainingPaise = totalCategoryBudgetPaise - totalVariableSpendPaise;

  // Income raises the budget by default, so it is already inside the category
  // totals via Others; only income sent to savings is added on top here.
  const adHocIncome = incomeToBudgetPaise(transactions);
  const incomeSavedPaise = incomeToSavingsPaise(transactions);
  const monthlySavedPaise =
    monthlySavedFromDailyBudgetsPaise(totalCategoryBudgetPaise, totalVariableSpendPaise) + incomeSavedPaise;
  const projectedSavings = projectedSavingsPaise(cycle.savingsTargetPaise, monthlySavedPaise);

  const discretionaryBudget = discretionaryBudgetPaise({
    incomeSources,
    fixedExpenses,
    plannedExpenses,
    savingsTargetPaise: cycle.savingsTargetPaise,
    extraBudgetIncomePaise: adHocIncome,
  });
  const allocatedTotal = totalCategoryBudgetPaise;
  const unallocatedBufferPaise = discretionaryBudget - allocatedTotal;

  const incomeTotalPaise = incomeSources.reduce((sum, i) => sum + i.amountPaise, 0);
  const fixedTotalPaise = fixedExpenses.reduce((sum, f) => sum + f.amountPaise, 0);
  const plannedTotalPaise = plannedExpenses.reduce((sum, p) => sum + p.amountPaise, 0);

  return {
    cycleDay,
    cycleLength,
    daysUntilNextSalary: daysUntilCycleEnd(cycle, now),
    allowances,
    totalAvailableTodayPaise,
    totalCategoryBudgetPaise,
    totalVariableSpendPaise,
    adHocIncomePaise: adHocIncome,
    incomeSavedPaise,
    budgetRemainingPaise,
    monthlySavedPaise,
    projectedSavings,
    discretionaryBudget,
    unallocatedBufferPaise,
    incomeTotalPaise,
    fixedTotalPaise,
    plannedTotalPaise,
    savingsTargetPaise: cycle.savingsTargetPaise,
  };
}
