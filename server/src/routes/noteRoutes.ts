import { Router } from 'express';
import type { Database } from '../database/connection.js';
import { NoteController } from '../controllers/NoteController.js';
import { NoteService } from '../services/NoteService.js';
import { NoteRepository } from '../repositories/NoteRepository.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { createNoteSchema, updateNoteSchema, searchSchema, notesQuerySchema } from '../models/validation.js';

export function createNoteRoutes(db: Database): Router {
   const router = Router();
   const repository = new NoteRepository(db);
   const service = new NoteService(repository);
   const controller = new NoteController(service);

   router.get('/search', validateQuery(searchSchema), controller.search);
   router.get('/', validateQuery(notesQuerySchema), controller.getAll);
   router.get('/:id', controller.getById);
   router.post('/', validateBody(createNoteSchema), controller.create);
   router.put('/:id', validateBody(updateNoteSchema), controller.update);
   router.delete('/:id', controller.delete);

   return router;
}
