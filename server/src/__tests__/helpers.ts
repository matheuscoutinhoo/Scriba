import initSqlJs, { type Database } from 'sql.js';
import { initializeSchema, execute } from '../database/connection';

export async function createTestDb(): Promise<Database> {
   const SQL = await initSqlJs();
   const db = new SQL.Database();
   db.run('PRAGMA foreign_keys = ON');
   initializeSchema(db);
   execute(db,
      `INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)`,
      ['test-user', 'testuser', 'test@test.com', 'hash', 'Test User']
   );
   return db;
}
