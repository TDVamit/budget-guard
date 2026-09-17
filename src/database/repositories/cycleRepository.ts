import { addDays, formatISO, subDays } from 'date-fns';
import { db } from '../connection';
import { newId } from '../../models/id';
import { OTHERS_CATEGORY_NAME, type BudgetCycle } from '../../models/types';

function fromRow(r: any): BudgetCycle {
  return {
    id: r.id,
    startDate: r.start_date,
    endDate: r.end_date,
    timezone: r.timezone,
    totalExpectedIncomePaise: r.total_expected_income_paise,
    totalReceivedIncomePaise: r.total_received_income_paise,
    savingsTargetPaise: r.savings_target_paise,
    status: r.status,
    cycleMode: r.cycle_mode ?? 'SALARY_DAY',
    recurrence: r.recurrence ?? 'SALARY_DAY',
  };
}

export async function getActiveCycle(): Promise<BudgetCycle | null> {
  const { rows } = await db.execute("SELECT * FROM budget_cycles WHERE status = 'ACTIVE' LIMIT 1");
  return rows.length ? fromRow(rows[0]) : null;
}

export async function getCycle(id: string): Promise<BudgetCycle | null> {
  const { rows } = await db.execute('SELECT * FROM budget_cycles WHERE id = ? LIMIT 1', [id]);
  return rows.length ? fromRow(rows[0]) : null;
}

/**
 * Creates a new active cycle running from startDate for cycleLengthDays,
 * and seeds the permanent Others category (spec §7: created on first launch,
 * always present, never deletable, may be ₹0).
 */
export async function createCycle(params: {
  startDate: string;
  endDate?: string;
  cycleLengthDays: number;
  savingsTargetPaise: number;
  timezone?: string;
  cycleMode?: 'SALARY_DAY' | 'CUSTOM_DATES';
  recurrence?: 'SALARY_DAY' | 'DURATION';
}): Promise<BudgetCycle> {
  const id = newId();
  const endDate = params.endDate ?? formatISO(subDays(addDays(new Date(params.startDate), params.cycleLengthDays), 1), {
    representation: 'date',
  });
  await db.execute(
    `INSERT INTO budget_cycles (id, start_date, end_date, timezone, total_expected_income_paise, total_received_income_paise, savings_target_paise, status, cycle_mode, recurrence)
     VALUES (?, ?, ?, ?, 0, 0, ?, 'ACTIVE', ?, ?)`,
    [id, params.startDate, endDate, params.timezone || 'Asia/Kolkata', params.savingsTargetPaise, params.cycleMode || 'SALARY_DAY', params.recurrence || 'SALARY_DAY'],
  );
  await db.execute(
    'INSERT INTO categories (id, cycle_id, name, is_system_category, allocated_paise, enabled) VALUES (?, ?, ?, 1, 0, 1)',
    [newId(), id, OTHERS_CATEGORY_NAME],
  );
  return (await getCycle(id))!;
}

export async function listClosedCycles(): Promise<BudgetCycle[]> {
  const { rows } = await db.execute("SELECT * FROM budget_cycles WHERE status = 'CLOSED' ORDER BY start_date DESC");
  return rows.map(fromRow);
}

export async function closeCycle(id: string): Promise<void> {
  await db.execute("UPDATE budget_cycles SET status = 'CLOSED' WHERE id = ?", [id]);
}

export async function updateSavingsTarget(id: string, savingsTargetPaise: number): Promise<void> {
  await db.execute('UPDATE budget_cycles SET savings_target_paise = ? WHERE id = ?', [savingsTargetPaise, id]);
}
