import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/migrator';
import * as schema from '../src/lib/db/schema';
import { join } from 'path';

const sqlite = new Database(join(process.cwd(), 'local.db'));
const db = drizzle(sqlite, { schema });

async function runMigrations() {
	console.log('Running migrations...');
	try {
		await migrate(db, {
			migrationsFolder: join(process.cwd(), 'migrations')
		});
		console.log('Migrations completed successfully');
	} catch (error) {
		console.error('Error running migrations:', error);
		process.exit(1);
	} finally {
		sqlite.close();
	}
}

runMigrations();
