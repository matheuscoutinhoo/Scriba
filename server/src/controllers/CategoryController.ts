import type { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService.js';
import { createCategorySchema, updateCategorySchema } from '../models/validation.js';
import { ZodError } from 'zod';

export class CategoryController {
  constructor(private service: CategoryService) {}

  getAll = (req: Request, res: Response): void => {
    const userId = req.params.userId || 'default-user';
    const categories = this.service.getAll(userId);
    res.json({ data: categories });
  };

  getById = (req: Request, res: Response): void => {
    const userId = req.params.userId || 'default-user';
    const category = this.service.getById(req.params.id, userId);

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ data: category });
  };

  create = (req: Request, res: Response): void => {
    const userId = req.params.userId || 'default-user';

    try {
      const dto = createCategorySchema.parse(req.body);
      const category = this.service.create(dto, userId);
      res.status(201).json({ data: category });
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
      const dto = updateCategorySchema.parse(req.body);
      const category = this.service.update(req.params.id, dto, userId);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      res.json({ data: category });
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
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.status(204).send();
  };
}
