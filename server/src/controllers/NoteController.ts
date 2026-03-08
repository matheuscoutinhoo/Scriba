import type { Request, Response } from 'express';
import type { INoteRepository } from '../repositories/interfaces.js';

export class NoteController {
   constructor(private repository: INoteRepository) { }

   getAll = (req: Request, res: Response): void => {
      const archived = req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : undefined;
      const categoryId = req.query.category_id as string | undefined;

      const notes = this.repository.findAllByUser(req.userId, { archived, categoryId });
      res.json({ data: notes });
   };

   getById = (req: Request<{ id: string }>, res: Response): void => {
      const note = this.repository.findById(req.params.id, req.userId);

      if (!note) {
         res.status(404).json({ error: 'Note not found' });
         return;
      }

      res.json({ data: note });
   };

   create = (req: Request, res: Response): void => {
      const note = this.repository.create(req.body, req.userId);
      res.status(201).json({ data: note });
   };

   update = (req: Request<{ id: string }>, res: Response): void => {
      const note = this.repository.update(req.params.id, req.body, req.userId);

      if (!note) {
         res.status(404).json({ error: 'Note not found' });
         return;
      }

      res.json({ data: note });
   };

   delete = (req: Request<{ id: string }>, res: Response): void => {
      const deleted = this.repository.delete(req.params.id, req.userId);

      if (!deleted) {
         res.status(404).json({ error: 'Note not found' });
         return;
      }

      res.status(204).send();
   };

   search = (req: Request, res: Response): void => {
      const { q, limit, offset } = req.query as unknown as { q: string; limit: number; offset: number };
      const result = this.repository.search(req.userId, q, limit, offset);
      res.json({ data: result.notes, total: result.total });
   };
}
