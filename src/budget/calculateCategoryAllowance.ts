import { OTHERS_CATEGORY_NAME, type BudgetCategory, type Transaction } from '../models/types';
import { accruedAllowancePaise } from './calculateAccrual';

/**
 * Others is the catch-all: it always absorbs whatever of the discretionary
 * budget hasn't been claimed by other categories, rather than needing to be
 * set/synced by hand. Adding ₹2k to Fuel shrinks Others by ₹2k automatically.
 */
export function applyOthersRemainder(
  categories: BudgetCategory[],
  discretionaryBudgetPaise: number,
): BudgetCategory[] {
  const others = categories.find((c) => c.isSystemCategory && c.name === OTHERS_CATEGORY_NAME);
  if (!others) return categories;
  const restTotal = categories
    .filter((c) => c.id !== others.id)
    .reduce((sum, c) => sum + c.allocatedPaise, 0);
  const remainder = discretionaryBudgetPaise - restTotal;
  return categories.map((c) => (c.id === others.id ? { ...c, allocatedPaise: remainder } : c));
}

export type CategoryAllowance = {
  categoryId: string;
  name: string;
  accruedPaise: number;
  spentPaise: number;
  availablePaise: number;
};

/**
 * Spend that counts against a category's daily allowance: variable
 * expenses only. Refunds reduce spend; fixed/planned/income/transfer/
 * credit-card-payment transactions never touch category pacing.
 */
export function categorySpendPaise(transactions: Transaction[], categoryId: string): number {
  return transactions
    .filter((t) => t.categoryId === categoryId && t.type === 'VARIABLE_EXPENSE')
    .reduce((sum, t) => {
      if (t.direction === 'DEBIT') return sum + t.amountPaise;
      if (t.direction === 'REFUND') return sum - t.amountPaise;
      return sum;
    }, 0);
}

export function calculateCategoryAllowances(
  categories: BudgetCategory[],
  transactions: Transaction[],
  cycleDay: number,
  cycleLength: number,
): CategoryAllowance[] {
  return categories
    .filter((c) => c.enabled)
    .map((c) => {
      const accruedPaise = accruedAllowancePaise(c.allocatedPaise, cycleDay, cycleLength);
      const spentPaise = categorySpendPaise(transactions, c.id);
      return {
        categoryId: c.id,
        name: c.name,
        accruedPaise,
        spentPaise,
        availablePaise: accruedPaise - spentPaise,
      };
    });
}
