import express from 'express';
import cors from 'cors';
import type { Database } from './database/connection.js';
import { createNoteRoutes } from './routes/noteRoutes.js';
import { createCategoryRoutes } from './routes/categoryRoutes.js';

export function createApp(db: Database): express.Application {
   const app = express();

   app.use(cors());
   app.use(express.json());

   // Health check
   app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });

   // API routes
   app.use('/api/notes', createNoteRoutes(db));
   app.use('/api/categories', createCategoryRoutes(db));

   // Global error handler
   app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Unhandled error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
   });

   return app;
}
