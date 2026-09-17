import type { Scalar } from '@op-engineering/op-sqlite';
import { db } from '../connection';
import { newId } from '../../models/id';
import type { Transaction } from '../../models/types';

function fromRow(r: any): Transaction {
  return {
    id: r.id,
    cycleId: r.cycle_id,
    amountPaise: r.amount_paise,
    direction: r.direction,
    type: r.type,
    categoryId: r.category_id,
    merchant: r.merchant ?? undefined,
    note: r.note ?? undefined,
    accountHint: r.account_hint ?? undefined,
    source: r.source,
    sourcePackage: r.source_package ?? undefined,
    timestamp: r.timestamp,
    confidence: r.confidence,
    autoConfirmed: !!r.auto_confirmed,
    rawNotificationId: r.raw_notification_id ?? undefined,
    duplicateGroupId: r.duplicate_group_id ?? undefined,
    incomeDestination: r.income_destination ?? undefined,
  };
}

/**
 * ponytail: caps the in-memory working set rather than paginating the store.
 * A cycle is one month, so this is thousands of transactions' headroom; if a
 * cycle ever exceeds it, totals would drift and real pagination is the fix.
 */
export const CYCLE_TRANSACTION_LIMIT = 5000;

export async function listTransactions(cycleId: string): Promise<Transaction[]> {
  const { rows } = await db.execute(
    'SELECT * FROM transactions WHERE cycle_id = ? ORDER BY timestamp DESC LIMIT ?',
    [cycleId, CYCLE_TRANSACTION_LIMIT],
  );
  return rows.map(fromRow);
}

export async function listTransactionsInRange(cycleId: string, startMs: number, endMs: number): Promise<Transaction[]> {
  const { rows } = await db.execute(
    'SELECT * FROM transactions WHERE cycle_id = ? AND timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
    [cycleId, startMs, endMs],
  );
  return rows.map(fromRow);
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const { rows } = await db.execute('SELECT * FROM transactions WHERE id = ?', [id]);
  return rows.length ? fromRow(rows[0]) : null;
}

export async function addTransaction(t: Omit<Transaction, 'id'>): Promise<Transaction> {
  const id = newId();
  await db.execute(
    `INSERT INTO transactions (id, cycle_id, amount_paise, direction, type, category_id, merchant, note, account_hint, source, source_package, timestamp, confidence, auto_confirmed, raw_notification_id, duplicate_group_id, income_destination)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, t.cycleId, t.amountPaise, t.direction, t.type, t.categoryId, t.merchant ?? null, t.note ?? null,
      t.accountHint ?? null, t.source, t.sourcePackage ?? null, t.timestamp, t.confidence, t.autoConfirmed ? 1 : 0,
      t.rawNotificationId ?? null, t.duplicateGroupId ?? null, t.incomeDestination ?? null,
    ],
  );
  return { ...t, id };
}

export async function updateTransaction(id: string, patch: Partial<Omit<Transaction, 'id' | 'cycleId'>>): Promise<void> {
  const columnMap: Record<string, string> = {
    amountPaise: 'amount_paise', direction: 'direction', type: 'type', categoryId: 'category_id', merchant: 'merchant',
    note: 'note', accountHint: 'account_hint', source: 'source', sourcePackage: 'source_package', timestamp: 'timestamp',
    confidence: 'confidence', autoConfirmed: 'auto_confirmed', rawNotificationId: 'raw_notification_id', duplicateGroupId: 'duplicate_group_id',
    incomeDestination: 'income_destination',
  };
  const fields: string[] = [];
  const values: Scalar[] = [];
  for (const [key, column] of Object.entries(columnMap)) {
    if (key in patch) {
      fields.push(`${column} = ?`);
      const value = (patch as any)[key];
      values.push(key === 'autoConfirmed' ? (value ? 1 : 0) : value);
    }
  }
  if (!fields.length) return;
  values.push(id);
  await db.execute(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.execute('DELETE FROM transactions WHERE id = ?', [id]);
}

/** Candidate duplicate per spec §45: same amount + direction within 5 minutes. */
export async function findDuplicateCandidate(t: Pick<Transaction, 'cycleId' | 'amountPaise' | 'direction' | 'timestamp'>): Promise<Transaction | null> {
  const windowMs = 5 * 60 * 1000;
  const { rows } = await db.execute(
    `SELECT * FROM transactions WHERE cycle_id = ? AND amount_paise = ? AND direction = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp DESC LIMIT 1`,
    [t.cycleId, t.amountPaise, t.direction, t.timestamp - windowMs, t.timestamp + windowMs],
  );
  return rows.length ? fromRow(rows[0]) : null;
}
