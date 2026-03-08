import type { Request, Response } from 'express';
import type { CategoryRepository } from '../repositories/CategoryRepository.js';
import { DEFAULT_USER_ID } from '../lib/constants.js';

export class CategoryController {
   constructor(private repository: CategoryRepository) { }

   getAll = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const categories = this.repository.findAllByUser(userId);
      res.json({ data: categories });
   };

   getById = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const category = this.repository.findById(req.params.id, userId);

      if (!category) {
         res.status(404).json({ error: 'Category not found' });
         return;
      }

      res.json({ data: category });
   };

   create = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const category = this.repository.create(req.body, userId);
      res.status(201).json({ data: category });
   };

   update = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const category = this.repository.update(req.params.id, req.body, userId);

      if (!category) {
         res.status(404).json({ error: 'Category not found' });
         return;
      }

      res.json({ data: category });
   };

   delete = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const deleted = this.repository.delete(req.params.id, userId);

      if (!deleted) {
         res.status(404).json({ error: 'Category not found' });
         return;
      }

      res.status(204).send();
   };
}
