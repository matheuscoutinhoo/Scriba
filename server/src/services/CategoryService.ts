import type { ICategoryRepository } from '../repositories/ICategoryRepository.js';
import type { Category, CategoryWithCount, CreateCategoryDTO, UpdateCategoryDTO } from '../models/types.js';

export class CategoryService {
   constructor(private repository: ICategoryRepository) { }

   getAll(userId: string): CategoryWithCount[] {
      return this.repository.findAllByUser(userId);
   }

   getById(id: string, userId: string): Category | null {
      return this.repository.findById(id, userId);
   }

   create(dto: CreateCategoryDTO, userId: string): Category {
      return this.repository.create(dto, userId);
   }

   update(id: string, dto: UpdateCategoryDTO, userId: string): Category | null {
      return this.repository.update(id, dto, userId);
   }

   delete(id: string, userId: string): boolean {
      return this.repository.delete(id, userId);
   }
}
