import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { initializeSchema, execute } from '../database/connection';
import { NoteRepository } from '../repositories/NoteRepository';

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

describe('NoteRepository', () => {
  let db: Database;
  let repo: NoteRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new NoteRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a note with title and content', () => {
      const note = repo.create({ title: 'Test Note', content: '# Hello World' }, 'test-user');

      expect(note).toBeDefined();
      expect(note.id).toBeDefined();
      expect(note.title).toBe('Test Note');
      expect(note.content).toBe('# Hello World');
      expect(note.user_id).toBe('test-user');
      expect(note.tags).toEqual([]);
    });

    it('should create a note with tags', () => {
      const note = repo.create(
        { title: 'Tagged Note', content: 'content', tags: ['javascript', 'react'] },
        'test-user'
      );

      expect(note.tags).toHaveLength(2);
      expect(note.tags.map(t => t.name)).toContain('javascript');
      expect(note.tags.map(t => t.name)).toContain('react');
    });

    it('should create a note with a category', () => {
      const catId = createCategory(db, 'Dev', 'test-user');
      const note = repo.create(
        { title: 'Cat Note', content: 'content', category_id: catId },
        'test-user'
      );

      expect(note.category_id).toBe(catId);
    });

    it('should generate an excerpt from content', () => {
      const note = repo.create(
        { title: 'Excerpt Test', content: 'This is a simple note content' },
        'test-user'
      );

      expect(note.excerpt).toBe('This is a simple note content');
    });
  });

  describe('findAllByUser', () => {
    it('should return all non-archived notes for user', () => {
      repo.create({ title: 'Note 1' }, 'test-user');
      repo.create({ title: 'Note 2' }, 'test-user');

      const notes = repo.findAllByUser('test-user');
      expect(notes).toHaveLength(2);
    });

    it('should not return notes from other users', () => {
      execute(db,
        `INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)`,
        ['other-user', 'other', 'other@test.com', 'hash']
      );

      repo.create({ title: 'My Note' }, 'test-user');
      repo.create({ title: 'Other Note' }, 'other-user');

      const notes = repo.findAllByUser('test-user');
      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('My Note');
    });

    it('should filter by archived status', () => {
      const note = repo.create({ title: 'Archived' }, 'test-user');
      repo.update(note.id, { is_archived: true }, 'test-user');

      repo.create({ title: 'Active' }, 'test-user');

      const active = repo.findAllByUser('test-user', { archived: false });
      expect(active).toHaveLength(1);
      expect(active[0].title).toBe('Active');

      const archived = repo.findAllByUser('test-user', { archived: true });
      expect(archived).toHaveLength(1);
      expect(archived[0].title).toBe('Archived');
    });

    it('should filter by category', () => {
      const catId = createCategory(db, 'Work', 'test-user');
      repo.create({ title: 'Work Note', category_id: catId }, 'test-user');
      repo.create({ title: 'No Category' }, 'test-user');

      const notes = repo.findAllByUser('test-user', { categoryId: catId });
      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('Work Note');
    });

    it('should return pinned notes first', () => {
      repo.create({ title: 'Normal' }, 'test-user');
      const pinned = repo.create({ title: 'Pinned' }, 'test-user');
      repo.update(pinned.id, { is_pinned: true }, 'test-user');

      const notes = repo.findAllByUser('test-user');
      expect(notes[0].title).toBe('Pinned');
    });
  });

  describe('findById', () => {
    it('should return a note by id', () => {
      const created = repo.create({ title: 'Find Me' }, 'test-user');
      const found = repo.findById(created.id, 'test-user');

      expect(found).toBeDefined();
      expect(found!.title).toBe('Find Me');
    });

    it('should return null for non-existent note', () => {
      const found = repo.findById('non-existent', 'test-user');
      expect(found).toBeNull();
    });

    it('should not return notes from other users', () => {
      const created = repo.create({ title: 'Private' }, 'test-user');
      const found = repo.findById(created.id, 'other-user');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update note title', () => {
      const note = repo.create({ title: 'Old Title' }, 'test-user');
      const updated = repo.update(note.id, { title: 'New Title' }, 'test-user');

      expect(updated).toBeDefined();
      expect(updated!.title).toBe('New Title');
    });

    it('should update note content', () => {
      const note = repo.create({ title: 'Note', content: 'old' }, 'test-user');
      const updated = repo.update(note.id, { content: '# New Content' }, 'test-user');

      expect(updated!.content).toBe('# New Content');
    });

    it('should update tags', () => {
      const note = repo.create({ title: 'Note', tags: ['old'] }, 'test-user');
      const updated = repo.update(note.id, { tags: ['new', 'tags'] }, 'test-user');

      expect(updated!.tags).toHaveLength(2);
      expect(updated!.tags.map(t => t.name)).toContain('new');
      expect(updated!.tags.map(t => t.name)).toContain('tags');
    });

    it('should return null for non-existent note', () => {
      const updated = repo.update('non-existent', { title: 'x' }, 'test-user');
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a note', () => {
      const note = repo.create({ title: 'Delete Me' }, 'test-user');
      const deleted = repo.delete(note.id, 'test-user');

      expect(deleted).toBe(true);
      expect(repo.findById(note.id, 'test-user')).toBeNull();
    });

    it('should return false for non-existent note', () => {
      const deleted = repo.delete('non-existent', 'test-user');
      expect(deleted).toBe(false);
    });
  });

  describe('search', () => {
    it('should find notes by title', () => {
      repo.create({ title: 'JavaScript Guide', content: 'Learn JS' }, 'test-user');
      repo.create({ title: 'Python Guide', content: 'Learn Python' }, 'test-user');

      const result = repo.search('test-user', 'JavaScript');
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].title).toBe('JavaScript Guide');
      expect(result.total).toBe(1);
    });

    it('should find notes by content', () => {
      repo.create({ title: 'Note', content: 'React hooks are awesome' }, 'test-user');

      const result = repo.search('test-user', 'hooks');
      expect(result.notes).toHaveLength(1);
    });
  });
});

function createCategory(db: Database, name: string, userId: string): string {
  const id = crypto.randomUUID();
  execute(db,
    `INSERT INTO categories (id, name, slug, user_id) VALUES (?, ?, ?, ?)`,
    [id, name, name.toLowerCase(), userId]
  );
  return id;
}
