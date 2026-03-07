import type { Request, Response } from 'express';
import { NoteService } from '../services/NoteService.js';
import { DEFAULT_USER_ID } from '../lib/constants.js';

export class NoteController {
   constructor(private service: NoteService) { }

   getAll = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const archived = req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : undefined;
      const categoryId = req.query.category_id as string | undefined;

      const notes = this.service.getAll(userId, { archived, categoryId });
      res.json({ data: notes });
   };

   getById = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const note = this.service.getById(req.params.id, userId);

      if (!note) {
         res.status(404).json({ error: 'Note not found' });
         return;
      }

      res.json({ data: note });
   };

   create = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const note = this.service.create(req.body, userId);
      res.status(201).json({ data: note });
   };

   update = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const note = this.service.update(req.params.id, req.body, userId);

      if (!note) {
         res.status(404).json({ error: 'Note not found' });
         return;
      }

      res.json({ data: note });
   };

   delete = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const deleted = this.service.delete(req.params.id, userId);

      if (!deleted) {
         res.status(404).json({ error: 'Note not found' });
         return;
      }

      res.status(204).send();
   };

   search = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const { q, limit, offset } = req.query as unknown as { q: string; limit: number; offset: number };
      const result = this.service.search(userId, q, limit, offset);
      res.json({ data: result.notes, total: result.total });
   };
}
