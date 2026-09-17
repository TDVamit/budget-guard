// Ordered list of migrations. Each entry runs once, tracked via PRAGMA
// user_version. Append new migrations to the end; never edit past ones.
export const migrations: string[][] = [
  // v1: initial schema
  [
    `CREATE TABLE IF NOT EXISTS budget_cycles (
      id TEXT PRIMARY KEY,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      timezone TEXT NOT NULL,
      total_expected_income_paise INTEGER NOT NULL DEFAULT 0,
      total_received_income_paise INTEGER NOT NULL DEFAULT 0,
      savings_target_paise INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS income_sources (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount_paise INTEGER NOT NULL,
      type TEXT NOT NULL,
      expected_date TEXT,
      status TEXT NOT NULL,
      guaranteed INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS fixed_expenses (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount_paise INTEGER NOT NULL,
      due_day INTEGER,
      recurring INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      linked_transaction_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS planned_expenses (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount_paise INTEGER NOT NULL,
      expected_date TEXT,
      paid INTEGER NOT NULL DEFAULT 0,
      linked_transaction_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_system_category INTEGER NOT NULL DEFAULT 0,
      allocated_paise INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL,
      amount_paise INTEGER NOT NULL,
      direction TEXT NOT NULL,
      type TEXT NOT NULL,
      category_id TEXT NOT NULL,
      merchant TEXT,
      note TEXT,
      account_hint TEXT,
      source TEXT NOT NULL,
      source_package TEXT,
      timestamp INTEGER NOT NULL,
      confidence REAL NOT NULL DEFAULT 1,
      auto_confirmed INTEGER NOT NULL DEFAULT 1,
      raw_notification_id TEXT,
      duplicate_group_id TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_cycle ON transactions(cycle_id)`,
    `CREATE TABLE IF NOT EXISTS raw_notification_events (
      id TEXT PRIMARY KEY,
      package_name TEXT NOT NULL,
      title TEXT,
      text TEXT,
      big_text TEXT,
      sub_text TEXT,
      timestamp INTEGER NOT NULL,
      notification_key TEXT,
      processed INTEGER NOT NULL DEFAULT 0,
      classification TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_raw_notifications_timestamp ON raw_notification_events(timestamp)`,
  ],

  // v2: where an income transaction's money goes — the spendable budget
  // (default) or straight to savings.
  [
    `ALTER TABLE transactions ADD COLUMN income_destination TEXT`,
  ],
  // v3: preserve how the main cycle should recur.
  [
    `ALTER TABLE budget_cycles ADD COLUMN cycle_mode TEXT NOT NULL DEFAULT 'SALARY_DAY'`,
    `ALTER TABLE budget_cycles ADD COLUMN recurrence TEXT NOT NULL DEFAULT 'SALARY_DAY'`,
  ],
];
