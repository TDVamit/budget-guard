import type { Scalar } from '@op-engineering/op-sqlite';
import { db } from '../connection';
import { newId } from '../../models/id';
import type { FixedExpense } from '../../models/types';

function fromRow(r: any): FixedExpense {
  return {
    id: r.id,
    cycleId: r.cycle_id,
    name: r.name,
    amountPaise: r.amount_paise,
    dueDay: r.due_day ?? undefined,
    recurring: !!r.recurring,
    type: r.type,
    status: r.status,
    linkedTransactionId: r.linked_transaction_id ?? undefined,
  };
}

export async function listFixedExpenses(cycleId: string): Promise<FixedExpense[]> {
  const { rows } = await db.execute('SELECT * FROM fixed_expenses WHERE cycle_id = ? ORDER BY rowid ASC', [cycleId]);
  return rows.map(fromRow);
}

export async function addFixedExpense(expense: Omit<FixedExpense, 'id'>): Promise<FixedExpense> {
  const id = newId();
  await db.execute(
    'INSERT INTO fixed_expenses (id, cycle_id, name, amount_paise, due_day, recurring, type, status, linked_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, expense.cycleId, expense.name, expense.amountPaise, expense.dueDay ?? null, expense.recurring ? 1 : 0, expense.type, expense.status, expense.linkedTransactionId ?? null],
  );
  return { ...expense, id };
}

export async function updateFixedExpense(id: string, patch: Partial<Omit<FixedExpense, 'id' | 'cycleId'>>): Promise<void> {
  const fields: string[] = [];
  const values: Scalar[] = [];
  const map: Record<string, string> = {
    name: 'name', amountPaise: 'amount_paise', dueDay: 'due_day', recurring: 'recurring',
    type: 'type', status: 'status', linkedTransactionId: 'linked_transaction_id',
  };
  for (const [key, column] of Object.entries(map)) {
    if (key in patch) {
      fields.push(`${column} = ?`);
      const value = (patch as any)[key];
      values.push(key === 'recurring' ? (value ? 1 : 0) : value);
    }
  }
  if (!fields.length) return;
  values.push(id);
  await db.execute(`UPDATE fixed_expenses SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function markFixedExpensePaid(id: string, linkedTransactionId: string): Promise<void> {
  await db.execute("UPDATE fixed_expenses SET status = 'PAID', linked_transaction_id = ? WHERE id = ?", [linkedTransactionId, id]);
}

export async function deleteFixedExpense(id: string): Promise<void> {
  await db.execute('DELETE FROM fixed_expenses WHERE id = ?', [id]);
}
