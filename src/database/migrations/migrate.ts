import { db } from '../connection';
import { migrations } from './migrations';

export async function runMigrations() {
  const [{ user_version: version }] = (await db.execute('PRAGMA user_version')).rows as unknown as { user_version: number }[];
  for (let i = version; i < migrations.length; i++) {
    for (const statement of migrations[i]) {
      await db.execute(statement);
    }
    await db.execute(`PRAGMA user_version = ${i + 1}`);
  }
}
