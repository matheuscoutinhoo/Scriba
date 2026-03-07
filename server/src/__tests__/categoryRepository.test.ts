import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { initializeSchema, execute } from '../database/connection';
import { CategoryRepository } from '../repositories/CategoryRepository';

async function createTestDb(): Promise<Database> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  initializeSchema(db);
  execute(db,
    `INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)`,
    ['test-user', 'testuser', 'test@test.com', 'hash', 'Test User']
  );
  return db;
}

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
      const category = repo.create({ name: 'Development' }, 'test-user');

      expect(category).toBeDefined();
      expect(category.id).toBeDefined();
      expect(category.name).toBe('Development');
      expect(category.slug).toBe('development');
      expect(category.color).toBe('#e11d48');
      expect(category.user_id).toBe('test-user');
    });

    it('should create a category with custom color', () => {
      const category = repo.create({ name: 'Design', color: '#3b82f6' }, 'test-user');
      expect(category.color).toBe('#3b82f6');
    });

    it('should create a subcategory', () => {
      const parent = repo.create({ name: 'Tech' }, 'test-user');
      const child = repo.create({ name: 'Frontend', parent_id: parent.id }, 'test-user');

      expect(child.parent_id).toBe(parent.id);
    });
  });

  describe('findAllByUser', () => {
    it('should return categories as a tree', () => {
      const parent = repo.create({ name: 'Tech' }, 'test-user');
      repo.create({ name: 'Frontend', parent_id: parent.id }, 'test-user');
      repo.create({ name: 'Backend', parent_id: parent.id }, 'test-user');

      const tree = repo.findAllByUser('test-user');
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('Tech');
      expect(tree[0].children).toHaveLength(2);
    });

    it('should include note counts', () => {
      const cat = repo.create({ name: 'Work' }, 'test-user');

      // Add a note to the category
      execute(db,
        `INSERT INTO notes (id, title, content, user_id, category_id) VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), 'Note 1', 'content', 'test-user', cat.id]
      );

      const categories = repo.findAllByUser('test-user');
      expect(categories[0].note_count).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a category by id', () => {
      const created = repo.create({ name: 'Find Me' }, 'test-user');
      const found = repo.findById(created.id, 'test-user');

      expect(found).toBeDefined();
      expect(found!.name).toBe('Find Me');
    });

    it('should return null for non-existent category', () => {
      const found = repo.findById('non-existent', 'test-user');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update category name and slug', () => {
      const cat = repo.create({ name: 'Old Name' }, 'test-user');
      const updated = repo.update(cat.id, { name: 'New Name' }, 'test-user');

      expect(updated!.name).toBe('New Name');
      expect(updated!.slug).toBe('new-name');
    });

    it('should update category color', () => {
      const cat = repo.create({ name: 'Colored' }, 'test-user');
      const updated = repo.update(cat.id, { color: '#22c55e' }, 'test-user');

      expect(updated!.color).toBe('#22c55e');
    });

    it('should return null for non-existent category', () => {
      const updated = repo.update('non-existent', { name: 'x' }, 'test-user');
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a category', () => {
      const cat = repo.create({ name: 'Delete Me' }, 'test-user');
      const deleted = repo.delete(cat.id, 'test-user');

      expect(deleted).toBe(true);
      expect(repo.findById(cat.id, 'test-user')).toBeNull();
    });

    it('should return false for non-existent category', () => {
      const deleted = repo.delete('non-existent', 'test-user');
      expect(deleted).toBe(false);
    });
  });
});
