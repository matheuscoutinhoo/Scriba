import { Router } from 'express';
import type { Database } from '../database/connection.js';
import { CategoryController } from '../controllers/CategoryController.js';
import { CategoryService } from '../services/CategoryService.js';
import { CategoryRepository } from '../repositories/CategoryRepository.js';
import { validateBody } from '../middleware/validation.js';
import { createCategorySchema, updateCategorySchema } from '../models/validation.js';

export function createCategoryRoutes(db: Database): Router {
   const router = Router();
   const repository = new CategoryRepository(db);
   const service = new CategoryService(repository);
   const controller = new CategoryController(service);

   router.get('/', controller.getAll);
   router.get('/:id', controller.getById);
   router.post('/', validateBody(createCategorySchema), controller.create);
   router.put('/:id', validateBody(updateCategorySchema), controller.update);
   router.delete('/:id', controller.delete);

   return router;
}
