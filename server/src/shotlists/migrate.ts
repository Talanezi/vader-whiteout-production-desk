import { Flows1793685600000 } from '../flows/flows.migration';
import 'reflect-metadata';
import { Storyboards1793512800000 } from '../storyboards/storyboards.migration';
import { DataSource } from 'typeorm';
import { ShotLists1793426400000 } from './shotlists.migration';

async function run() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const db = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway')
      ? { rejectUnauthorized: false }
      : false,
    synchronize: false,
    migrations: [ShotLists1793426400000, Storyboards1793512800000, Flows1793685600000],
    migrationsTableName: 'production_desk_migrations',
  });
  await db.initialize();
  try {
    if (process.argv.includes('--revert'))
      await db.undoLastMigration({ transaction: 'all' });
    else await db.runMigrations({ transaction: 'all' });
  } finally {
    await db.destroy();
  }
}
run().catch(() => {
  console.error(
    'Shot-list migration failed. Check database configuration and migration history.',
  );
  process.exitCode = 1;
});
