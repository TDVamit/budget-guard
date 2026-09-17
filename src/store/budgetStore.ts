import { create } from 'zustand';
import { addDays, formatISO } from 'date-fns';
import type { BudgetCategory, BudgetCycle, FixedExpense, IncomeSource, PlannedExpense, Transaction } from '../models/types';
import { runMigrations } from '../database/migrations/migrate';
import * as cycleRepo from '../database/repositories/cycleRepository';
import * as categoryRepo from '../database/repositories/categoryRepository';
import * as incomeRepo from '../database/repositories/incomeRepository';
import * as fixedRepo from '../database/repositories/fixedExpenseRepository';
import * as plannedRepo from '../database/repositories/plannedExpenseRepository';
import * as txRepo from '../database/repositories/transactionRepository';
import { rolloverCycleIfNeeded } from '../budget/rollover';
import { requestWidgetUpdate } from '../widgets/updateWidget';
import { showLocalNotification } from '../native/localNotification';
import { applyOthersRemainder } from '../budget/calculateCategoryAllowance';
import { discretionaryBudgetPaise, incomeToBudgetPaise } from '../budget/calculateSavings';

type BudgetState = {
  loading: boolean;
  cycle: BudgetCycle | null;
  categories: BudgetCategory[];
  incomeSources: IncomeSource[];
  fixedExpenses: FixedExpense[];
  plannedExpenses: PlannedExpense[];
  transactions: Transaction[];

  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;

  startFirstCycle: (params: { startDate: string; endDate?: string; savingsTargetPaise: number; cycleMode?: 'SALARY_DAY' | 'CUSTOM_DATES' }) => Promise<void>;
  updateSavingsTarget: (paise: number) => Promise<void>;

  addIncome: (source: Omit<IncomeSource, 'id' | 'cycleId'>) => Promise<void>;
  updateIncome: (id: string, patch: Partial<Omit<IncomeSource, 'id' | 'cycleId'>>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  addFixedExpense: (expense: Omit<FixedExpense, 'id' | 'cycleId' | 'status'>) => Promise<void>;
  updateFixedExpense: (id: string, patch: Partial<Omit<FixedExpense, 'id' | 'cycleId'>>) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;

  addPlannedExpense: (expense: Omit<PlannedExpense, 'id' | 'cycleId' | 'paid'>) => Promise<void>;
  updatePlannedExpense: (id: string, patch: Partial<Omit<PlannedExpense, 'id' | 'cycleId'>>) => Promise<void>;
  deletePlannedExpense: (id: string) => Promise<void>;

  addCategory: (name: string, allocatedPaise: number) => Promise<void>;
  updateCategoryAllocation: (id: string, allocatedPaise: number) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addTransaction: (t: Omit<Transaction, 'id' | 'cycleId'>) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id' | 'cycleId'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
};

export const useBudgetStore = create<BudgetState>((set, get) => ({
  loading: true,
  cycle: null,
  categories: [],
  incomeSources: [],
  fixedExpenses: [],
  plannedExpenses: [],
  transactions: [],

  bootstrap: async () => {
    await runMigrations();
    let cycle = await cycleRepo.getActiveCycle();
    if (cycle) {
      const previousCycleId = cycle.id;
      cycle = await rolloverCycleIfNeeded(cycle);
      if (cycle.id !== previousCycleId) {
        showLocalNotification(
          'New budget cycle started',
          "We've carried forward your income sources and recurring fixed expenses from last month. Edit or remove anything that's changed in Settings.",
        );
      }
    }
    set({ cycle, loading: false });
    if (cycle) await get().refresh();
  },

  refresh: async () => {
    const { cycle } = get();
    if (!cycle) return;
    const [rawCategories, incomeSources, fixedExpenses, plannedExpenses, transactions] = await Promise.all([
      categoryRepo.listCategories(cycle.id),
      incomeRepo.listIncomeSources(cycle.id),
      fixedRepo.listFixedExpenses(cycle.id),
      plannedRepo.listPlannedExpenses(cycle.id),
      txRepo.listTransactions(cycle.id),
    ]);
    const discretionary = discretionaryBudgetPaise({
      incomeSources, fixedExpenses, plannedExpenses, savingsTargetPaise: cycle.savingsTargetPaise,
      extraBudgetIncomePaise: incomeToBudgetPaise(transactions),
    });
    const categories = applyOthersRemainder(rawCategories, discretionary);
    set({ categories, incomeSources, fixedExpenses, plannedExpenses, transactions });
    requestWidgetUpdate({ cycle, categories, transactions });
  },

  startFirstCycle: async (params) => {
    const { startDate, savingsTargetPaise } = params;
    const cycle = await cycleRepo.createCycle({ startDate, endDate: params.endDate, cycleLengthDays: params.endDate ? Math.max(1, Math.round((new Date(params.endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1) : 30, savingsTargetPaise, cycleMode: params.cycleMode, recurrence: params.cycleMode === 'CUSTOM_DATES' ? 'DURATION' : 'SALARY_DAY' });
    set({ cycle });
    await get().refresh();
  },

  updateSavingsTarget: async (paise) => {
    const cycle = get().cycle!;
    await cycleRepo.updateSavingsTarget(cycle.id, paise);
    set({ cycle: { ...cycle, savingsTargetPaise: paise } });
    await get().refresh();
  },

  addIncome: async (source) => {
    const cycle = get().cycle!;
    await incomeRepo.addIncomeSource({ ...source, cycleId: cycle.id });
    await get().refresh();
  },

  updateIncome: async (id, patch) => {
    await incomeRepo.updateIncomeSource(id, patch);
    await get().refresh();
  },

  deleteIncome: async (id) => {
    await incomeRepo.deleteIncomeSource(id);
    await get().refresh();
  },

  addFixedExpense: async (expense) => {
    const cycle = get().cycle!;
    await fixedRepo.addFixedExpense({ ...expense, cycleId: cycle.id, status: 'PLANNED' });
    await get().refresh();
  },

  updateFixedExpense: async (id, patch) => {
    await fixedRepo.updateFixedExpense(id, patch);
    await get().refresh();
  },

  deleteFixedExpense: async (id) => {
    await fixedRepo.deleteFixedExpense(id);
    await get().refresh();
  },

  addPlannedExpense: async (expense) => {
    const cycle = get().cycle!;
    await plannedRepo.addPlannedExpense({ ...expense, cycleId: cycle.id, paid: false });
    await get().refresh();
  },

  updatePlannedExpense: async (id, patch) => {
    await plannedRepo.updatePlannedExpense(id, patch);
    await get().refresh();
  },

  deletePlannedExpense: async (id) => {
    await plannedRepo.deletePlannedExpense(id);
    await get().refresh();
  },

  addCategory: async (name, allocatedPaise) => {
    const cycle = get().cycle!;
    const capped = Math.max(0, Math.min(allocatedPaise, remainingForNewAllocationPaise(get())));
    await categoryRepo.createCategory({ cycleId: cycle.id, name, allocatedPaise: capped });
    await get().refresh();
  },

  updateCategoryAllocation: async (id, allocatedPaise) => {
    const capped = Math.max(0, Math.min(allocatedPaise, remainingForNewAllocationPaise(get(), id)));
    await categoryRepo.updateCategoryAllocation(id, capped);
    await get().refresh();
  },

  deleteCategory: async (id) => {
    await categoryRepo.deleteCategory(id);
    await get().refresh();
  },

  addTransaction: async (t) => {
    const cycle = get().cycle!;
    const created = await txRepo.addTransaction({ ...t, cycleId: cycle.id });
    await linkToPlannedItemIfMatching(cycle.id, created);
    await get().refresh();
  },

  updateTransaction: async (id, patch) => {
    await txRepo.updateTransaction(id, patch);
    await get().refresh();
  },

  deleteTransaction: async (id) => {
    await txRepo.deleteTransaction(id);
    await get().refresh();
  },
}));

/** Others absorbs whatever's unallocated; a category can never claim more than that, so Others can't go negative. */
function remainingForNewAllocationPaise(state: BudgetState, excludingCategoryId?: string): number {
  const { cycle, categories, incomeSources, fixedExpenses, plannedExpenses, transactions } = state;
  const discretionary = discretionaryBudgetPaise({
    incomeSources, fixedExpenses, plannedExpenses, savingsTargetPaise: cycle!.savingsTargetPaise,
    extraBudgetIncomePaise: incomeToBudgetPaise(transactions),
  });
  const restTotal = categories
    .filter((c) => !c.isSystemCategory && c.id !== excludingCategoryId)
    .reduce((sum, c) => sum + c.allocatedPaise, 0);
  return discretionary - restTotal;
}

/**
 * If an expense matches a configured fixed/planned expense, link rather than
 * double count (spec §4). Both the amount and the name must match: matching on
 * amount alone quietly reclassified a hand-entered Rs 200 fuel spend as a fixed
 * expense, so it vanished from every total. A manual entry is never guessed at
 * either — the user already picked the category on the form.
 */
async function linkToPlannedItemIfMatching(cycleId: string, t: Transaction) {
  if (t.type !== 'VARIABLE_EXPENSE' || t.direction !== 'DEBIT') return;
  if (t.source === 'MANUAL' || !t.merchant) return;
  const merchant = t.merchant.toLowerCase();
  const fixed = await fixedRepo.listFixedExpenses(cycleId);
  const match = fixed.find(
    (f) => f.status === 'PLANNED' && f.amountPaise === t.amountPaise
      && (f.name.toLowerCase().includes(merchant) || merchant.includes(f.name.toLowerCase())),
  );
  if (match) {
    await fixedRepo.markFixedExpensePaid(match.id, t.id);
    await txRepo.updateTransaction(t.id, { type: 'FIXED_EXPENSE' });
  }
}

export function firstCycleStartDateFromSalaryDay(salaryDayOfMonth: number, now: Date = new Date()): string {
  const candidate = new Date(now.getFullYear(), now.getMonth(), salaryDayOfMonth);
  const start = candidate <= now ? candidate : addDays(candidate, -30);
  return formatISO(start, { representation: 'date' });
}
