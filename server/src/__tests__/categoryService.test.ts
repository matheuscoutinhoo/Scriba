import { describe, it, expect, vi } from 'vitest';
import { CategoryService } from '../services/CategoryService';
import type { ICategoryRepository } from '../repositories/ICategoryRepository';
import type { Category, CategoryWithCount } from '../models/types';

function makeCategory(overrides: Partial<Category> = {}): Category {
   return {
      id: 'cat-1',
      name: 'Test',
      slug: 'test',
      color: '#e11d48',
      icon: null,
      user_id: 'user-1',
      parent_id: null,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      ...overrides,
   };
}

function makeCategoryWithCount(overrides: Partial<CategoryWithCount> = {}): CategoryWithCount {
   return { ...makeCategory(), note_count: 0, ...overrides };
}

function createMockRepository(): ICategoryRepository {
   return {
      findAllByUser: vi.fn().mockReturnValue([]),
      findById: vi.fn().mockReturnValue(null),
      create: vi.fn().mockReturnValue(makeCategory()),
      update: vi.fn().mockReturnValue(null),
      delete: vi.fn().mockReturnValue(false),
   };
}

describe('CategoryService', () => {
   it('getAll delegates to repository', () => {
      const repo = createMockRepository();
      const categories = [makeCategoryWithCount({ id: '1' })];
      vi.mocked(repo.findAllByUser).mockReturnValue(categories);

      const service = new CategoryService(repo);
      const result = service.getAll('user-1');

      expect(repo.findAllByUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(categories);
   });

   it('getById delegates to repository', () => {
      const repo = createMockRepository();
      const category = makeCategory();
      vi.mocked(repo.findById).mockReturnValue(category);

      const service = new CategoryService(repo);
      const result = service.getById('cat-1', 'user-1');

      expect(repo.findById).toHaveBeenCalledWith('cat-1', 'user-1');
      expect(result).toEqual(category);
   });

   it('getById returns null for non-existent category', () => {
      const repo = createMockRepository();
      const service = new CategoryService(repo);

      expect(service.getById('missing', 'user-1')).toBeNull();
   });

   it('create delegates to repository', () => {
      const repo = createMockRepository();
      const created = makeCategory({ name: 'New' });
      vi.mocked(repo.create).mockReturnValue(created);

      const service = new CategoryService(repo);
      const result = service.create({ name: 'New' }, 'user-1');

      expect(repo.create).toHaveBeenCalledWith({ name: 'New' }, 'user-1');
      expect(result).toEqual(created);
   });

   it('update delegates to repository', () => {
      const repo = createMockRepository();
      const updated = makeCategory({ name: 'Updated' });
      vi.mocked(repo.update).mockReturnValue(updated);

      const service = new CategoryService(repo);
      const result = service.update('cat-1', { name: 'Updated' }, 'user-1');

      expect(repo.update).toHaveBeenCalledWith('cat-1', { name: 'Updated' }, 'user-1');
      expect(result).toEqual(updated);
   });

   it('delete delegates to repository', () => {
      const repo = createMockRepository();
      vi.mocked(repo.delete).mockReturnValue(true);

      const service = new CategoryService(repo);
      const result = service.delete('cat-1', 'user-1');

      expect(repo.delete).toHaveBeenCalledWith('cat-1', 'user-1');
      expect(result).toBe(true);
   });
});
