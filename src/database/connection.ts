import { open } from '@op-engineering/op-sqlite';

export const db = open({ name: 'budget_guard.db', location: 'default' });
