import type { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService.js';
import { DEFAULT_USER_ID } from '../lib/constants.js';

export class CategoryController {
   constructor(private service: CategoryService) { }

   getAll = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const categories = this.service.getAll(userId);
      res.json({ data: categories });
   };

   getById = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const category = this.service.getById(req.params.id, userId);

      if (!category) {
         res.status(404).json({ error: 'Category not found' });
         return;
      }

      res.json({ data: category });
   };

   create = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const category = this.service.create(req.body, userId);
      res.status(201).json({ data: category });
   };

   update = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const category = this.service.update(req.params.id, req.body, userId);

      if (!category) {
         res.status(404).json({ error: 'Category not found' });
         return;
      }

      res.json({ data: category });
   };

   delete = (req: Request, res: Response): void => {
      const userId = req.params.userId || DEFAULT_USER_ID;
      const deleted = this.service.delete(req.params.id, userId);

      if (!deleted) {
         res.status(404).json({ error: 'Category not found' });
         return;
      }

      res.status(204).send();
   };
}
