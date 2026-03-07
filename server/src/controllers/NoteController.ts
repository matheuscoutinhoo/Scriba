import type { Request, Response } from 'express';
import { NoteService } from '../services/NoteService.js';
import { createNoteSchema, updateNoteSchema, searchSchema } from '../models/validation.js';
import { ZodError } from 'zod';

export class NoteController {
   constructor(private service: NoteService) { }

   getAll = (req: Request, res: Response): void => {
      const userId = req.params.userId || 'default-user';
      const archived = req.query.archived === 'true';
      const categoryId = req.query.category_id as string | undefined;

      const notes = this.service.getAll(userId, { archived, categoryId });
      res.json({ data: notes });
   };

   getById = (req: Request, res: Response): void => {
      const userId = req.params.userId || 'default-user';
      const note = this.service.getById(req.params.id, userId);

      if (!note) {
         res.status(404).json({ error: 'Note not found' });
         return;
      }

      res.json({ data: note });
   };

   create = (req: Request, res: Response): void => {
      const userId = req.params.userId || 'default-user';

      try {
         const dto = createNoteSchema.parse(req.body);
         const note = this.service.create(dto, userId);
         res.status(201).json({ data: note });
      } catch (error) {
         if (error instanceof ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
         }
         throw error;
      }
   };

   update = (req: Request, res: Response): void => {
      const userId = req.params.userId || 'default-user';

      try {
         const dto = updateNoteSchema.parse(req.body);
         const note = this.service.update(req.params.id, dto, userId);

         if (!note) {
            res.status(404).json({ error: 'Note not found' });
            return;
         }

         res.json({ data: note });
      } catch (error) {
         if (error instanceof ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
         }
         throw error;
      }
   };

   delete = (req: Request, res: Response): void => {
      const userId = req.params.userId || 'default-user';
      const deleted = this.service.delete(req.params.id, userId);

      if (!deleted) {
         res.status(404).json({ error: 'Note not found' });
         return;
      }

      res.status(204).send();
   };

   search = (req: Request, res: Response): void => {
      const userId = req.params.userId || 'default-user';

      try {
         const { q, limit, offset } = searchSchema.parse(req.query);
         const result = this.service.search(userId, q, limit, offset);
         res.json({ data: result.notes, total: result.total });
      } catch (error) {
         if (error instanceof ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
         }
         throw error;
      }
   };
}
