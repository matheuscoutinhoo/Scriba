import { createApp } from './app.js';
import { getDatabase, initializeSchema, execute, queryOne, saveDatabase, closeDatabase } from './database/connection.js';
import { DEFAULT_USER_ID } from './lib/constants.js';

const PORT = process.env.PORT || 3001;

async function main() {
   const db = await getDatabase();
   initializeSchema(db);

   // Seed default user if not exists
   const existingUser = queryOne(db, 'SELECT id FROM users WHERE id = ?', [DEFAULT_USER_ID]);
   if (!existingUser) {
      execute(db,
         `INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)`,
         [DEFAULT_USER_ID, 'scriba', 'scriba@local', 'not-implemented', 'Scriba User']
      );
   }

   const app = createApp(db);

   app.listen(PORT, () => {
      console.log(`🖊️  Scriba server running on http://localhost:${PORT}`);
   });

   const shutdown = () => {
      saveDatabase();
      closeDatabase();
      process.exit(0);
   };
   process.on('SIGINT', shutdown);
   process.on('SIGTERM', shutdown);
}

main().catch(console.error);
