export type BudgetCycle = {
  id: string;
  startDate: string; // ISO date, inclusive
  endDate: string; // ISO date, inclusive
  timezone: string;

  totalExpectedIncomePaise: number;
  totalReceivedIncomePaise: number;

  savingsTargetPaise: number;

  status: 'PLANNED' | 'ACTIVE' | 'CLOSED';
  cycleMode?: 'SALARY_DAY' | 'CUSTOM_DATES';
  recurrence?: 'SALARY_DAY' | 'DURATION';
};

export type IncomeSourceType = 'MONTHLY' | 'ONE_TIME' | 'VARIABLE';

/**
 * Money that arrives mid-cycle has to go somewhere. By default it raises the
 * spendable budget (landing in Others); sent to savings it is kept out of the
 * daily allowance instead.
 */
export type IncomeDestination = 'BUDGET' | 'SAVINGS';
export type IncomeStatus = 'EXPECTED' | 'RECEIVED';

export type IncomeSource = {
  id: string;
  cycleId: string;
  name: string;
  amountPaise: number;
  type: IncomeSourceType;
  expectedDate?: string;
  status: IncomeStatus;
  guaranteed: boolean;
};

export type FixedExpenseType = 'BILL' | 'EMI' | 'SUBSCRIPTION' | 'INVESTMENT' | 'OTHER';
export type FixedExpenseStatus = 'PLANNED' | 'PAID';

export type FixedExpense = {
  id: string;
  cycleId: string;
  name: string;
  amountPaise: number;
  dueDay?: number;
  recurring: boolean;
  type: FixedExpenseType;
  status: FixedExpenseStatus;
  linkedTransactionId?: string;
};

export type PlannedExpense = {
  id: string;
  cycleId: string;
  name: string;
  amountPaise: number;
  expectedDate?: string;
  paid: boolean;
  linkedTransactionId?: string;
};

export const OTHERS_CATEGORY_NAME = 'Others';

export type BudgetCategory = {
  id: string;
  cycleId: string;
  name: string;
  isSystemCategory: boolean;
  allocatedPaise: number;
  enabled: boolean;
};

export type TransactionDirection = 'DEBIT' | 'CREDIT' | 'REFUND' | 'TRANSFER';

export type TransactionType =
  | 'VARIABLE_EXPENSE'
  | 'FIXED_EXPENSE'
  | 'PLANNED_EXPENSE'
  | 'INCOME'
  | 'CREDIT_CARD_PAYMENT'
  | 'TRANSFER'
  | 'INVESTMENT'
  | 'UNKNOWN';

export type TransactionSource =
  | 'MANUAL'
  | 'BANK_NOTIFICATION'
  | 'SMS_NOTIFICATION'
  | 'UPI_NOTIFICATION'
  | 'EMAIL_NOTIFICATION';

export type Transaction = {
  id: string;
  cycleId: string;
  amountPaise: number;
  direction: TransactionDirection;
  type: TransactionType;
  categoryId: string;
  merchant?: string;
  note?: string;
  accountHint?: string;
  source: TransactionSource;
  sourcePackage?: string;
  timestamp: number;
  confidence: number;
  autoConfirmed: boolean;
  /** Income only. Defaults to BUDGET when unset. */
  incomeDestination?: IncomeDestination;
  rawNotificationId?: string;
  duplicateGroupId?: string;
};

export type WidgetSnapshot = {
  currentDate: string;
  totalAvailableTodayPaise: number;
  monthlySavedFromDailyBudgetsPaise: number;
  savingsTargetPaise: number;
  totalCategoryBudgetPaise: number;
  totalVariableSpendPaise: number;
  adHocIncomePaise: number;
  projectedSavingsPaise: number;

  categories: Array<{
    id: string;
    name: string;
    accruedPaise: number;
    spentPaise: number;
    availablePaise: number;
  }>;

  days: Array<{
    dayOfCycle: number;
    savedPaise: number;
    spentPaise: number;
    isFuture: boolean;
  }>;

  todaysTransactions: Array<{
    id: string;
    title: string;
    categoryName: string;
    amountPaise: number;
    timestamp: number;
  }>;

  updatedAt: number;
};

export type ThemeMode = 'system' | 'light' | 'dark';
