import { createApp } from './app.js';
import { getDatabase, initializeSchema, execute, queryOne } from './database/index.js';

const PORT = process.env.PORT || 3001;

async function main() {
   const db = await getDatabase();
   initializeSchema(db);

   // Seed default user if not exists
   const existingUser = queryOne(db, 'SELECT id FROM users WHERE id = ?', ['default-user']);
   if (!existingUser) {
      execute(db,
         `INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)`,
         ['default-user', 'scriba', 'scriba@local', 'not-implemented', 'Scriba User']
      );
   }

   const app = createApp(db);

   app.listen(PORT, () => {
      console.log(`🖊️  Scriba server running on http://localhost:${PORT}`);
   });
}

main().catch(console.error);
