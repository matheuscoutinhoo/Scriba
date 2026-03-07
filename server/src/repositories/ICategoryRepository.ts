import type { Category, CategoryWithCount, CreateCategoryDTO, UpdateCategoryDTO } from '../models/types.js';

export interface ICategoryRepository {
   findAllByUser(userId: string): CategoryWithCount[];
   findById(id: string, userId: string): Category | null;
   create(dto: CreateCategoryDTO, userId: string): Category;
   update(id: string, dto: UpdateCategoryDTO, userId: string): Category | null;
   delete(id: string, userId: string): boolean;
}
