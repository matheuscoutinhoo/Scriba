import { Router } from 'express';
import type { Database } from '../database/connection.js';
import { CategoryController } from '../controllers/CategoryController.js';
import { CategoryService } from '../services/CategoryService.js';

export function createCategoryRoutes(db: Database): Router {
   const router = Router();
   const service = new CategoryService(db);
   const controller = new CategoryController(service);

   router.get('/', controller.getAll);
   router.get('/:id', controller.getById);
   router.post('/', controller.create);
   router.put('/:id', controller.update);
   router.delete('/:id', controller.delete);

   return router;
}
