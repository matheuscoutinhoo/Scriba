import { Router } from 'express';
import type { NoteController } from '../controllers/NoteController.js';
import { validate } from '../middleware/validation.js';
import { createNoteSchema, updateNoteSchema, searchSchema, notesQuerySchema } from '../models/validation.js';

export function createNoteRoutes(controller: NoteController): Router {
   const router = Router();

   router.get('/search', validate(searchSchema, 'query'), controller.search);
   router.get('/', validate(notesQuerySchema, 'query'), controller.getAll);
   router.get('/:id', controller.getById);
   router.post('/', validate(createNoteSchema, 'body'), controller.create);
   router.put('/:id', validate(updateNoteSchema, 'body'), controller.update);
   router.delete('/:id', controller.delete);

   return router;
}
