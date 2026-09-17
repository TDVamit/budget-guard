import { db } from '../connection';
import { newId } from '../../models/id';
import { OTHERS_CATEGORY_NAME, type BudgetCategory } from '../../models/types';

function fromRow(r: any): BudgetCategory {
  return {
    id: r.id,
    cycleId: r.cycle_id,
    name: r.name,
    isSystemCategory: !!r.is_system_category,
    allocatedPaise: r.allocated_paise,
    enabled: !!r.enabled,
  };
}

export async function listCategories(cycleId: string): Promise<BudgetCategory[]> {
  const { rows } = await db.execute('SELECT * FROM categories WHERE cycle_id = ? ORDER BY is_system_category DESC, name ASC', [cycleId]);
  return rows.map(fromRow);
}

export async function createCategory(params: {
  cycleId: string;
  name: string;
  allocatedPaise: number;
}): Promise<BudgetCategory> {
  const id = newId();
  await db.execute(
    'INSERT INTO categories (id, cycle_id, name, is_system_category, allocated_paise, enabled) VALUES (?, ?, ?, 0, ?, 1)',
    [id, params.cycleId, params.name, params.allocatedPaise],
  );
  const { rows } = await db.execute('SELECT * FROM categories WHERE id = ?', [id]);
  return fromRow(rows[0]);
}

export async function updateCategoryAllocation(id: string, allocatedPaise: number): Promise<void> {
  await db.execute('UPDATE categories SET allocated_paise = ? WHERE id = ?', [allocatedPaise, id]);
}

export async function renameCategory(id: string, name: string): Promise<void> {
  await db.execute('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
}

/** Others is permanent and can never be deleted (spec §7). */
export async function deleteCategory(id: string): Promise<void> {
  const { rows } = await db.execute('SELECT name, is_system_category FROM categories WHERE id = ?', [id]);
  if (!rows.length) return;
  if (rows[0].is_system_category || rows[0].name === OTHERS_CATEGORY_NAME) {
    throw new Error('The Others category cannot be deleted.');
  }
  await db.execute('DELETE FROM categories WHERE id = ?', [id]);
}
