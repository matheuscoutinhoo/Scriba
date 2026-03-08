import type { Database } from '../database/connection.js';
import { execute, queryOne } from '../database/connection.js';
import { DEFAULT_USER_ID } from './constants.js';

export function seedDefaultUser(db: Database): void {
   const existingUser = queryOne(db, 'SELECT id FROM users WHERE id = ?', [DEFAULT_USER_ID]);
   if (!existingUser) {
      execute(db,
         `INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)`,
         [DEFAULT_USER_ID, 'scriba', 'scriba@local', 'not-implemented', 'Scriba User']
      );
   }
}
