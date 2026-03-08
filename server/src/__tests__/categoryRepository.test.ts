import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Database } from 'sql.js';
import { execute } from '../database/connection';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { createTestDb } from './helpers';

const TEST_USER = 'default-user';

describe('CategoryRepository', () => {
   let db: Database;
   let repo: CategoryRepository;

   beforeEach(async () => {
      db = await createTestDb();
      repo = new CategoryRepository(db);
   });

   afterEach(() => {
      db.close();
   });

   describe('create', () => {
      it('should create a category with name', () => {
         const category = repo.create({ name: 'Development' }, TEST_USER);

         expect(category).toBeDefined();
         expect(category.id).toBeDefined();
         expect(category.name).toBe('Development');
         expect(category.slug).toBe('development');
         expect(category.color).toBe('#e11d48');
         expect(category.user_id).toBe(TEST_USER);
      });

      it('should create a category with custom color', () => {
         const category = repo.create({ name: 'Design', color: '#3b82f6' }, TEST_USER);
         expect(category.color).toBe('#3b82f6');
      });

      it('should create a subcategory', () => {
         const parent = repo.create({ name: 'Tech' }, TEST_USER);
         const child = repo.create({ name: 'Frontend', parent_id: parent.id }, TEST_USER);

         expect(child.parent_id).toBe(parent.id);
      });
   });

   describe('findAllByUser', () => {
      it('should return categories as a tree', () => {
         const parent = repo.create({ name: 'Tech' }, TEST_USER);
         repo.create({ name: 'Frontend', parent_id: parent.id }, TEST_USER);
         repo.create({ name: 'Backend', parent_id: parent.id }, TEST_USER);

         const tree = repo.findAllByUser(TEST_USER);
         expect(tree).toHaveLength(1);
         expect(tree[0].name).toBe('Tech');
         expect(tree[0].children).toHaveLength(2);
      });

      it('should include note counts', () => {
         const cat = repo.create({ name: 'Work' }, TEST_USER);

         // Add a note to the category
         execute(db,
            `INSERT INTO notes (id, title, content, user_id, category_id) VALUES (?, ?, ?, ?, ?)`,
            [crypto.randomUUID(), 'Note 1', 'content', TEST_USER, cat.id]
         );

         const categories = repo.findAllByUser(TEST_USER);
         expect(categories[0].note_count).toBe(1);
      });
   });

   describe('findById', () => {
      it('should return a category by id', () => {
         const created = repo.create({ name: 'Find Me' }, TEST_USER);
         const found = repo.findById(created.id, TEST_USER);

         expect(found).toBeDefined();
         expect(found!.name).toBe('Find Me');
      });

      it('should return null for non-existent category', () => {
         const found = repo.findById('non-existent', TEST_USER);
         expect(found).toBeNull();
      });
   });

   describe('update', () => {
      it('should update category name and slug', () => {
         const cat = repo.create({ name: 'Old Name' }, TEST_USER);
         const updated = repo.update(cat.id, { name: 'New Name' }, TEST_USER);

         expect(updated!.name).toBe('New Name');
         expect(updated!.slug).toBe('new-name');
      });

      it('should update category color', () => {
         const cat = repo.create({ name: 'Colored' }, TEST_USER);
         const updated = repo.update(cat.id, { color: '#22c55e' }, TEST_USER);

         expect(updated!.color).toBe('#22c55e');
      });

      it('should return null for non-existent category', () => {
         const updated = repo.update('non-existent', { name: 'x' }, TEST_USER);
         expect(updated).toBeNull();
      });
   });

   describe('delete', () => {
      it('should delete a category', () => {
         const cat = repo.create({ name: 'Delete Me' }, TEST_USER);
         const deleted = repo.delete(cat.id, TEST_USER);

         expect(deleted).toBe(true);
         expect(repo.findById(cat.id, TEST_USER)).toBeNull();
      });

      it('should return false for non-existent category', () => {
         const deleted = repo.delete('non-existent', TEST_USER);
         expect(deleted).toBe(false);
      });
   });
});
