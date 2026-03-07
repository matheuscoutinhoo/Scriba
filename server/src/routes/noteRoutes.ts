import { Router } from 'express';
import type { Database } from '../database/connection.js';
import { NoteController } from '../controllers/NoteController.js';
import { NoteService } from '../services/NoteService.js';

export function createNoteRoutes(db: Database): Router {
   const router = Router();
   const service = new NoteService(db);
   const controller = new NoteController(service);

   router.get('/search', controller.search);
   router.get('/', controller.getAll);
   router.get('/:id', controller.getById);
   router.post('/', controller.create);
   router.put('/:id', controller.update);
   router.delete('/:id', controller.delete);

   return router;
}
