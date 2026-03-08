import initSqlJs, { type Database } from 'sql.js';
import { initializeSchema, execute } from '../database/connection';

const DEFAULT_TEST_USER_ID = 'default-user';

export async function createTestDb(userId: string = DEFAULT_TEST_USER_ID): Promise<Database> {
   const SQL = await initSqlJs();
   const db = new SQL.Database();
   db.run('PRAGMA foreign_keys = ON');
   initializeSchema(db);
   execute(db,
      `INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)`,
      [userId, 'scriba', 'scriba@local', 'hash', 'Scriba User']
   );
   return db;
}
