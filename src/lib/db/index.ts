import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { join } from 'path';

// Check if we're in a browser or server environment
const isDev = typeof window === 'undefined' 
    ? process.env.NODE_ENV === 'development'
    : false;

const dbPath = isDev 
    ? './local.db' 
    : join(process.cwd(), 'local.db');

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export * from './schema';
