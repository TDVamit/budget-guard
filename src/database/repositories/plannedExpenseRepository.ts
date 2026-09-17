import type { Scalar } from '@op-engineering/op-sqlite';
import { db } from '../connection';
import { newId } from '../../models/id';
import type { PlannedExpense } from '../../models/types';

function fromRow(r: any): PlannedExpense {
  return {
    id: r.id,
    cycleId: r.cycle_id,
    name: r.name,
    amountPaise: r.amount_paise,
    expectedDate: r.expected_date ?? undefined,
    paid: !!r.paid,
    linkedTransactionId: r.linked_transaction_id ?? undefined,
  };
}

export async function listPlannedExpenses(cycleId: string): Promise<PlannedExpense[]> {
  const { rows } = await db.execute('SELECT * FROM planned_expenses WHERE cycle_id = ? ORDER BY rowid ASC', [cycleId]);
  return rows.map(fromRow);
}

export async function addPlannedExpense(expense: Omit<PlannedExpense, 'id'>): Promise<PlannedExpense> {
  const id = newId();
  await db.execute(
    'INSERT INTO planned_expenses (id, cycle_id, name, amount_paise, expected_date, paid, linked_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, expense.cycleId, expense.name, expense.amountPaise, expense.expectedDate ?? null, expense.paid ? 1 : 0, expense.linkedTransactionId ?? null],
  );
  return { ...expense, id };
}

export async function updatePlannedExpense(id: string, patch: Partial<Omit<PlannedExpense, 'id' | 'cycleId'>>): Promise<void> {
  const fields: string[] = [];
  const values: Scalar[] = [];
  const map: Record<string, string> = {
    name: 'name', amountPaise: 'amount_paise', expectedDate: 'expected_date', paid: 'paid', linkedTransactionId: 'linked_transaction_id',
  };
  for (const [key, column] of Object.entries(map)) {
    if (key in patch) {
      fields.push(`${column} = ?`);
      const value = (patch as any)[key];
      values.push(key === 'paid' ? (value ? 1 : 0) : value);
    }
  }
  if (!fields.length) return;
  values.push(id);
  await db.execute(`UPDATE planned_expenses SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function markPlannedExpensePaid(id: string, linkedTransactionId: string): Promise<void> {
  await db.execute('UPDATE planned_expenses SET paid = 1, linked_transaction_id = ? WHERE id = ?', [linkedTransactionId, id]);
}

export async function deletePlannedExpense(id: string): Promise<void> {
  await db.execute('DELETE FROM planned_expenses WHERE id = ?', [id]);
}
