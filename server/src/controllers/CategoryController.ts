import type { Request, Response } from 'express';
import type { ICategoryRepository } from '../repositories/interfaces.js';

export class CategoryController {
   constructor(private repository: ICategoryRepository) { }

   getAll = (req: Request, res: Response): void => {
      const categories = this.repository.findAllByUser(req.userId);
      res.json({ data: categories });
   };

   getById = (req: Request<{ id: string }>, res: Response): void => {
      const category = this.repository.findById(req.params.id, req.userId);

      if (!category) {
         res.status(404).json({ error: 'Category not found' });
         return;
      }

      res.json({ data: category });
   };

   create = (req: Request, res: Response): void => {
      const category = this.repository.create(req.body, req.userId);
      res.status(201).json({ data: category });
   };

   update = (req: Request<{ id: string }>, res: Response): void => {
      const category = this.repository.update(req.params.id, req.body, req.userId);

      if (!category) {
         res.status(404).json({ error: 'Category not found' });
         return;
      }

      res.json({ data: category });
   };

   delete = (req: Request<{ id: string }>, res: Response): void => {
      const deleted = this.repository.delete(req.params.id, req.userId);

      if (!deleted) {
         res.status(404).json({ error: 'Category not found' });
         return;
      }

      res.status(204).send();
   };
}
