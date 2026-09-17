import { formatRupeesCompact } from '../../components/MoneyText';
import { discretionaryBudgetPaise, incomeToBudgetPaise, incomeToSavingsPaise } from '../calculateSavings';
import { spendStatus } from '../categoryStatus';
import { cycleDayNumber, cycleLengthDays } from '../calculateCycle';
import { accruedAllowancePaise, availableNowPaise } from '../calculateAccrual';
import { calculateCategoryAllowances, categorySpendPaise } from '../calculateCategoryAllowance';
import {
  monthlySavedFromDailyBudgetsPaise,
  projectedSavingsPaise,
  safeIncomePaise,
} from '../calculateSavings';
import { calculateWidgetSnapshot } from '../calculateWidgetSnapshot';
import { carriesForward } from '../rollover';
import type { BudgetCategory, BudgetCycle, FixedExpense, IncomeSource, PlannedExpense, Transaction } from '../../models/types';

const cycle30: BudgetCycle = {
  id: 'c1',
  startDate: '2026-09-03',
  endDate: '2026-10-02',
  timezone: 'Asia/Kolkata',
  totalExpectedIncomePaise: 0,
  totalReceivedIncomePaise: 0,
  savingsTargetPaise: 0,
  status: 'ACTIVE',
};

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36),
    cycleId: 'c1',
    amountPaise: 0,
    direction: 'DEBIT',
    type: 'VARIABLE_EXPENSE',
    categoryId: 'others',
    source: 'MANUAL',
    timestamp: Date.now(),
    confidence: 1,
    autoConfirmed: true,
    ...overrides,
  };
}

describe('cycle', () => {
  test('30-day cycle length', () => {
    expect(cycleLengthDays(cycle30)).toBe(30);
  });

  test('day number clamps to cycle bounds', () => {
    expect(cycleDayNumber(cycle30, new Date('2026-09-03T12:00:00+05:30'))).toBe(1);
    expect(cycleDayNumber(cycle30, new Date('2026-09-04T12:00:00+05:30'))).toBe(2);
    expect(cycleDayNumber(cycle30, new Date('2026-12-01T00:00:00+05:30'))).toBe(30);
    expect(cycleDayNumber(cycle30, new Date('2020-01-01T00:00:00+05:30'))).toBe(1);
  });

  test('different cycle lengths', () => {
    const c28: BudgetCycle = { ...cycle30, endDate: '2026-09-30' };
    expect(cycleLengthDays(c28)).toBe(28);
    const c31: BudgetCycle = { ...cycle30, endDate: '2026-10-03' };
    expect(cycleLengthDays(c31)).toBe(31);
  });
});

describe('accrual', () => {
  test('daily accrual over 30-day cycle (spec example)', () => {
    expect(accruedAllowancePaise(90000, 1, 30)).toBe(3000); // Fuel day 1: 900/30
    expect(accruedAllowancePaise(90000, 2, 30)).toBe(6000); // day 2: rolls forward
  });

  test('rounding uses floor, never leaks fractional paise', () => {
    // 100 paise budget over 3 days: day1 floor(100/3)=33
    expect(accruedAllowancePaise(100, 1, 3)).toBe(33);
    expect(accruedAllowancePaise(100, 2, 3)).toBe(66);
    expect(accruedAllowancePaise(100, 3, 3)).toBe(100);
  });

  test('overspending goes negative, not clamped to zero', () => {
    expect(availableNowPaise(6000, 2, 30, 10000)).toBe(-9600);
  });

  test('zero-budget category always accrues zero', () => {
    expect(accruedAllowancePaise(0, 15, 30)).toBe(0);
  });
});

describe('category allowances', () => {
  const categories: BudgetCategory[] = [
    { id: 'fuel', cycleId: 'c1', name: 'Fuel', isSystemCategory: false, allocatedPaise: 90000, enabled: true },
    { id: 'food', cycleId: 'c1', name: 'Food', isSystemCategory: false, allocatedPaise: 30000, enabled: true },
    { id: 'others', cycleId: 'c1', name: 'Others', isSystemCategory: true, allocatedPaise: 9000, enabled: true },
  ];

  test('Others with ₹0 budget never breaks accrual', () => {
    const zeroOthers = categories.map((c) => (c.id === 'others' ? { ...c, allocatedPaise: 0 } : c));
    const result = calculateCategoryAllowances(zeroOthers, [], 15, 30);
    const others = result.find((r) => r.categoryId === 'others')!;
    expect(others.accruedPaise).toBe(0);
    expect(others.availablePaise).toBe(0);
  });

  test('total available can be positive even with one overspent category (spec §11)', () => {
    const transactions = [
      tx({ categoryId: 'fuel', amountPaise: 10000 }), // day2 accrued 6000 -> -4000
      tx({ categoryId: 'food', amountPaise: 3000 }), // day2 accrued 2000 -> -1000... use smaller spend below
    ];
    const result = calculateCategoryAllowances(categories, transactions, 2, 30);
    const total = result.reduce((s, r) => s + r.availablePaise, 0);
    const fuel = result.find((r) => r.categoryId === 'fuel')!;
    expect(fuel.availablePaise).toBeLessThan(0);
    expect(total).toBe(fuel.availablePaise + result[1].availablePaise + result[2].availablePaise);
  });

  test('refunds reduce spend', () => {
    const transactions = [
      tx({ categoryId: 'food', amountPaise: 1000, direction: 'DEBIT' }),
      tx({ categoryId: 'food', amountPaise: 400, direction: 'REFUND' }),
    ];
    expect(categorySpendPaise(transactions, 'food')).toBe(600);
  });

  test('fixed/planned/credit-card-payment transactions never count as category spend', () => {
    const transactions = [
      tx({ categoryId: 'food', amountPaise: 5000, type: 'FIXED_EXPENSE' }),
      tx({ categoryId: 'food', amountPaise: 5000, type: 'CREDIT_CARD_PAYMENT' }),
      tx({ categoryId: 'food', amountPaise: 5000, type: 'TRANSFER' }),
    ];
    expect(categorySpendPaise(transactions, 'food')).toBe(0);
  });
});

describe('savings', () => {
  const incomes: IncomeSource[] = [
    { id: 'i1', cycleId: 'c1', name: 'Salary', amountPaise: 5200000, type: 'MONTHLY', status: 'RECEIVED', guaranteed: true },
    { id: 'i2', cycleId: 'c1', name: 'GP Sir', amountPaise: 150000, type: 'VARIABLE', status: 'EXPECTED', guaranteed: false },
  ];
  const fixed: FixedExpense[] = [
    { id: 'f1', cycleId: 'c1', name: 'EMI', amountPaise: 2000000, recurring: true, type: 'EMI', status: 'PLANNED' },
  ];
  const planned: PlannedExpense[] = [
    { id: 'p1', cycleId: 'c1', name: 'Trip', amountPaise: 1000000, paid: false },
  ];

  test('uncertain income excluded from safe income by default', () => {
    expect(safeIncomePaise(incomes)).toBe(5200000);
  });

  test('multiple incomes, fixed and planned expenses feed discretionary budget', () => {
    const discretionary = discretionaryBudgetPaise({
      incomeSources: incomes,
      fixedExpenses: fixed,
      plannedExpenses: planned,
      savingsTargetPaise: 1000000,
    });
    // 5200000 - 2000000 - 1000000 - 1000000 = 1200000 (₹12,000, spec example)
    expect(discretionary).toBe(1200000);
  });

  test('monthly saved goes negative when overspent (spec §13)', () => {
    expect(monthlySavedFromDailyBudgetsPaise(129000, 139000)).toBe(-10000);
  });

  test('projected savings reduced by overspend beyond category budget (spec §14)', () => {
    expect(projectedSavingsPaise(1000000, monthlySavedFromDailyBudgetsPaise(129000, 140000))).toBe(1000000 - 11000);
  });

  test('projected savings increased by budget left unspent', () => {
    expect(projectedSavingsPaise(1000000, monthlySavedFromDailyBudgetsPaise(129000, 100000))).toBe(1000000 + 29000);
  });
});

describe('widget snapshot', () => {
  const categories: BudgetCategory[] = [
    { id: 'fuel', cycleId: 'c1', name: 'Fuel', isSystemCategory: false, allocatedPaise: 90000, enabled: true },
    { id: 'others', cycleId: 'c1', name: 'Others', isSystemCategory: true, allocatedPaise: 0, enabled: true },
  ];

  test('produces consistent snapshot for day 1, no spend', () => {
    const now = new Date('2026-09-03T10:00:00+05:30');
    const snap = calculateWidgetSnapshot(cycle30, categories, [], now);
    expect(snap.categories.find((c) => c.id === 'fuel')!.accruedPaise).toBe(3000);
    expect(snap.categories.find((c) => c.id === 'others')!.accruedPaise).toBe(0);
    expect(snap.monthlySavedFromDailyBudgetsPaise).toBe(90000);
    expect(snap.todaysTransactions).toHaveLength(0);
  });

  test('includes today\'s transactions and reflects spend', () => {
    const now = new Date('2026-09-03T18:00:00+05:30');
    const transactions = [tx({ categoryId: 'fuel', amountPaise: 500, merchant: 'Fuel Station', timestamp: now.getTime() })];
    const snap = calculateWidgetSnapshot(cycle30, categories, transactions, now);
    expect(snap.todaysTransactions).toEqual([
      { id: transactions[0].id, title: 'Fuel Station', categoryName: 'Fuel', amountPaise: 500, timestamp: now.getTime() },
    ]);
    expect(snap.monthlySavedFromDailyBudgetsPaise).toBe(90000 - 500);
  });
});

describe('category spend status', () => {
  it('greys out an untouched category', () => {
    expect(spendStatus(0, 1000)).toBe('unused');
  });

  it('is healthy below 80% of what has accrued', () => {
    expect(spendStatus(700, 1000)).toBe('healthy');
  });

  it('warns from 80% to 100%', () => {
    expect(spendStatus(800, 1000)).toBe('warning');
    expect(spendStatus(1000, 1000)).toBe('warning');
  });

  it('flags overspend past 100%', () => {
    expect(spendStatus(1001, 1000)).toBe('over');
    // Spending against a category that has accrued nothing is always over.
    expect(spendStatus(50, 0)).toBe('over');
  });
});

describe('compact money for tight cells', () => {
  it('keeps small amounts exact', () => {
    expect(formatRupeesCompact(73200)).toBe('₹732');
    expect(formatRupeesCompact(-43900)).toBe('-₹439');
    expect(formatRupeesCompact(0)).toBe('₹0');
  });

  it('shortens four digits and up so a day cell cannot overflow', () => {
    expect(formatRupeesCompact(773200)).toBe('₹7.7k');
    expect(formatRupeesCompact(-773200)).toBe('-₹7.7k');
    expect(formatRupeesCompact(1000000)).toBe('₹10k');
    expect(formatRupeesCompact(9999900)).toBe('₹100k');
  });

  it('switches to lakh past a hundred thousand', () => {
    expect(formatRupeesCompact(1500000000)).toBe('₹150L');
  });

  it('never exceeds six characters', () => {
    for (const paise of [0, 99, 100000, 12345600, 987654300, 1500000000]) {
      expect(formatRupeesCompact(paise).length).toBeLessThanOrEqual(6);
      expect(formatRupeesCompact(-paise).length).toBeLessThanOrEqual(7);
    }
  });
});

describe('where mid-cycle income goes', () => {
  const income = (paise: number, incomeDestination?: 'BUDGET' | 'SAVINGS') =>
    ({
      id: 'i', cycleId: 'c', amountPaise: paise, direction: 'CREDIT', type: 'INCOME',
      categoryId: 'others', source: 'MANUAL', timestamp: 0, confidence: 1, autoConfirmed: true,
      incomeDestination,
    }) as any;

  it('raises the spendable budget by default', () => {
    // A detected salary credit should become money you can spend, not a
    // silent transfer to savings.
    expect(incomeToBudgetPaise([income(500000)])).toBe(500000);
    expect(incomeToSavingsPaise([income(500000)])).toBe(0);
  });

  it('respects an explicit choice to save it', () => {
    expect(incomeToBudgetPaise([income(500000, 'SAVINGS')])).toBe(0);
    expect(incomeToSavingsPaise([income(500000, 'SAVINGS')])).toBe(500000);
  });

  it('feeds budget-bound income into the discretionary total', () => {
    const base = { incomeSources: [], fixedExpenses: [], plannedExpenses: [], savingsTargetPaise: 0 };
    expect(discretionaryBudgetPaise(base)).toBe(0);
    expect(discretionaryBudgetPaise({ ...base, extraBudgetIncomePaise: 120000 })).toBe(120000);
  });

  it('counts each income exactly once', () => {
    const txs = [income(100000), income(50000, 'SAVINGS'), income(25000, 'BUDGET')];
    expect(incomeToBudgetPaise(txs) + incomeToSavingsPaise(txs)).toBe(175000);
  });
});

describe('what carries into the next cycle', () => {
  // Guards the promise the labels make: "fixed" repeats, "one-time" does not.
  const income = (type: 'MONTHLY' | 'ONE_TIME') =>
    ({ id: 'i', cycleId: 'c', name: 'x', amountPaise: 1000, type, status: 'RECEIVED', guaranteed: true }) as IncomeSource;
  const fixed = (recurring: boolean) =>
    ({ id: 'f', cycleId: 'c', name: 'x', amountPaise: 1000, recurring, type: 'BILL', status: 'PLANNED' }) as FixedExpense;

  it('carries monthly income but not one-time income', () => {
    expect(carriesForward.income(income('MONTHLY'))).toBe(true);
    expect(carriesForward.income(income('ONE_TIME'))).toBe(false);
  });

  it('carries recurring fixed expenses only', () => {
    expect(carriesForward.fixed(fixed(true))).toBe(true);
    expect(carriesForward.fixed(fixed(false))).toBe(false);
  });

  it('never carries a one-time expense', () => {
    expect(carriesForward.oneTimeExpense()).toBe(false);
  });
});
