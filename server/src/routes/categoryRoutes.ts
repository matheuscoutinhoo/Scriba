import { Router } from 'express';
import type { CategoryController } from '../controllers/CategoryController.js';
import { validate } from '../middleware/validation.js';
import { createCategorySchema, updateCategorySchema } from '../models/validation.js';

export function createCategoryRoutes(controller: CategoryController): Router {
   const router = Router();

   router.get('/', controller.getAll);
   router.get('/:id', controller.getById);
   router.post('/', validate(createCategorySchema, 'body'), controller.create);
   router.put('/:id', validate(updateCategorySchema, 'body'), controller.update);
   router.delete('/:id', controller.delete);

   return router;
}
