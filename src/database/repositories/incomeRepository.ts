import type { Scalar } from '@op-engineering/op-sqlite';
import { db } from '../connection';
import { newId } from '../../models/id';
import type { IncomeSource } from '../../models/types';

function fromRow(r: any): IncomeSource {
  return {
    id: r.id,
    cycleId: r.cycle_id,
    name: r.name,
    amountPaise: r.amount_paise,
    type: r.type,
    expectedDate: r.expected_date ?? undefined,
    status: r.status,
    guaranteed: !!r.guaranteed,
  };
}

export async function listIncomeSources(cycleId: string): Promise<IncomeSource[]> {
  const { rows } = await db.execute('SELECT * FROM income_sources WHERE cycle_id = ? ORDER BY rowid ASC', [cycleId]);
  return rows.map(fromRow);
}

export async function addIncomeSource(source: Omit<IncomeSource, 'id'>): Promise<IncomeSource> {
  const id = newId();
  await db.execute(
    'INSERT INTO income_sources (id, cycle_id, name, amount_paise, type, expected_date, status, guaranteed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, source.cycleId, source.name, source.amountPaise, source.type, source.expectedDate ?? null, source.status, source.guaranteed ? 1 : 0],
  );
  return { ...source, id };
}

export async function updateIncomeSource(id: string, patch: Partial<Omit<IncomeSource, 'id' | 'cycleId'>>): Promise<void> {
  const fields: string[] = [];
  const values: Scalar[] = [];
  const map: Record<string, string> = {
    name: 'name', amountPaise: 'amount_paise', type: 'type', expectedDate: 'expected_date', status: 'status', guaranteed: 'guaranteed',
  };
  for (const [key, column] of Object.entries(map)) {
    if (key in patch) {
      fields.push(`${column} = ?`);
      const value = (patch as any)[key];
      values.push(key === 'guaranteed' ? (value ? 1 : 0) : value);
    }
  }
  if (!fields.length) return;
  values.push(id);
  await db.execute(`UPDATE income_sources SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteIncomeSource(id: string): Promise<void> {
  await db.execute('DELETE FROM income_sources WHERE id = ?', [id]);
}
