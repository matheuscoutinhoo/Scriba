import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Database } from './database/connection.js';
import { NoteRepository } from './repositories/NoteRepository.js';
import { CategoryRepository } from './repositories/CategoryRepository.js';
import { NoteController } from './controllers/NoteController.js';
import { CategoryController } from './controllers/CategoryController.js';
import { createNoteRoutes } from './routes/noteRoutes.js';
import { createCategoryRoutes } from './routes/categoryRoutes.js';
import { extractUserId } from './middleware/extractUserId.js';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
   ? process.env.ALLOWED_ORIGINS.split(',')
   : ['http://localhost:5173'];

export function createApp(db: Database): express.Application {
   const app = express();

   // Composition root — wire up dependencies
   const noteRepository = new NoteRepository(db);
   const categoryRepository = new CategoryRepository(db);
   const noteController = new NoteController(noteRepository);
   const categoryController = new CategoryController(categoryRepository);

   // Security headers
   app.use(helmet());

   // CORS — restrict to known origins
   app.use(cors({
      origin: ALLOWED_ORIGINS,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type'],
   }));

   // Rate limiting — 100 requests per minute per IP
   app.use('/api', rateLimit({
      windowMs: 60_000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later' },
   }));

   // Body size limit (1MB)
   app.use(express.json({ limit: '1mb' }));

   // Extract userId for all API routes
   app.use('/api', extractUserId);

   // Health check
   app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });

   // API routes
   app.use('/api/notes', createNoteRoutes(noteController));
   app.use('/api/categories', createCategoryRoutes(categoryController));

   // Global error handler
   app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Unhandled error:', err.name);
      res.status(500).json({ error: 'Internal server error' });
   });

   return app;
}
