import { createApp } from './app.js';
import { getDatabase, initializeSchema, saveDatabase, closeDatabase } from './database/connection.js';
import { seedDefaultUser } from './lib/seed.js';

const PORT = process.env.PORT || 3001;

async function main() {
   const db = await getDatabase();
   initializeSchema(db);
   seedDefaultUser(db);

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
