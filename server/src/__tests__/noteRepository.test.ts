import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Database } from 'sql.js';
import { execute } from '../database/connection';
import { NoteRepository } from '../repositories/NoteRepository';
import { createTestDb } from './helpers';

const TEST_USER = 'default-user';

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
         const note = repo.create({ title: 'Test Note', content: '# Hello World' }, TEST_USER);

         expect(note).toBeDefined();
         expect(note.id).toBeDefined();
         expect(note.title).toBe('Test Note');
         expect(note.content).toBe('# Hello World');
         expect(note.user_id).toBe(TEST_USER);
         expect(note.tags).toEqual([]);
      });

      it('should create a note with tags', () => {
         const note = repo.create(
            { title: 'Tagged Note', content: 'content', tags: ['javascript', 'react'] },
            TEST_USER
         );

         expect(note.tags).toHaveLength(2);
         expect(note.tags.map(t => t.name)).toContain('javascript');
         expect(note.tags.map(t => t.name)).toContain('react');
      });

      it('should create a note with a category', () => {
         const catId = createCategory(db, 'Dev', TEST_USER);
         const note = repo.create(
            { title: 'Cat Note', content: 'content', category_id: catId },
            TEST_USER
         );

         expect(note.category_id).toBe(catId);
      });

      it('should generate an excerpt from content', () => {
         const note = repo.create(
            { title: 'Excerpt Test', content: 'This is a simple note content' },
            TEST_USER
         );

         expect(note.excerpt).toBe('This is a simple note content');
      });
   });

   describe('findAllByUser', () => {
      it('should return all non-archived notes for user', () => {
         repo.create({ title: 'Note 1' }, TEST_USER);
         repo.create({ title: 'Note 2' }, TEST_USER);

         const notes = repo.findAllByUser(TEST_USER);
         expect(notes).toHaveLength(2);
      });

      it('should not return notes from other users', () => {
         execute(db,
            `INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)`,
            ['other-user', 'other', 'other@test.com', 'hash']
         );

         repo.create({ title: 'My Note' }, TEST_USER);
         repo.create({ title: 'Other Note' }, 'other-user');

         const notes = repo.findAllByUser(TEST_USER);
         expect(notes).toHaveLength(1);
         expect(notes[0].title).toBe('My Note');
      });

      it('should filter by archived status', () => {
         const note = repo.create({ title: 'Archived' }, TEST_USER);
         repo.update(note.id, { is_archived: true }, TEST_USER);

         repo.create({ title: 'Active' }, TEST_USER);

         const active = repo.findAllByUser(TEST_USER, { archived: false });
         expect(active).toHaveLength(1);
         expect(active[0].title).toBe('Active');

         const archived = repo.findAllByUser(TEST_USER, { archived: true });
         expect(archived).toHaveLength(1);
         expect(archived[0].title).toBe('Archived');
      });

      it('should filter by category', () => {
         const catId = createCategory(db, 'Work', TEST_USER);
         repo.create({ title: 'Work Note', category_id: catId }, TEST_USER);
         repo.create({ title: 'No Category' }, TEST_USER);

         const notes = repo.findAllByUser(TEST_USER, { categoryId: catId });
         expect(notes).toHaveLength(1);
         expect(notes[0].title).toBe('Work Note');
      });

      it('should return pinned notes first', () => {
         repo.create({ title: 'Normal' }, TEST_USER);
         const pinned = repo.create({ title: 'Pinned' }, TEST_USER);
         repo.update(pinned.id, { is_pinned: true }, TEST_USER);

         const notes = repo.findAllByUser(TEST_USER);
         expect(notes[0].title).toBe('Pinned');
      });
   });

   describe('findById', () => {
      it('should return a note by id', () => {
         const created = repo.create({ title: 'Find Me' }, TEST_USER);
         const found = repo.findById(created.id, TEST_USER);

         expect(found).toBeDefined();
         expect(found!.title).toBe('Find Me');
      });

      it('should return null for non-existent note', () => {
         const found = repo.findById('non-existent', TEST_USER);
         expect(found).toBeNull();
      });

      it('should not return notes from other users', () => {
         const created = repo.create({ title: 'Private' }, TEST_USER);
         const found = repo.findById(created.id, 'other-user');
         expect(found).toBeNull();
      });
   });

   describe('update', () => {
      it('should update note title', () => {
         const note = repo.create({ title: 'Old Title' }, TEST_USER);
         const updated = repo.update(note.id, { title: 'New Title' }, TEST_USER);

         expect(updated).toBeDefined();
         expect(updated!.title).toBe('New Title');
      });

      it('should update note content', () => {
         const note = repo.create({ title: 'Note', content: 'old' }, TEST_USER);
         const updated = repo.update(note.id, { content: '# New Content' }, TEST_USER);

         expect(updated!.content).toBe('# New Content');
      });

      it('should update tags', () => {
         const note = repo.create({ title: 'Note', tags: ['old'] }, TEST_USER);
         const updated = repo.update(note.id, { tags: ['new', 'tags'] }, TEST_USER);

         expect(updated!.tags).toHaveLength(2);
         expect(updated!.tags.map(t => t.name)).toContain('new');
         expect(updated!.tags.map(t => t.name)).toContain('tags');
      });

      it('should return null for non-existent note', () => {
         const updated = repo.update('non-existent', { title: 'x' }, TEST_USER);
         expect(updated).toBeNull();
      });
   });

   describe('delete', () => {
      it('should delete a note', () => {
         const note = repo.create({ title: 'Delete Me' }, TEST_USER);
         const deleted = repo.delete(note.id, TEST_USER);

         expect(deleted).toBe(true);
         expect(repo.findById(note.id, TEST_USER)).toBeNull();
      });

      it('should return false for non-existent note', () => {
         const deleted = repo.delete('non-existent', TEST_USER);
         expect(deleted).toBe(false);
      });
   });

   describe('search', () => {
      it('should find notes by title', () => {
         repo.create({ title: 'JavaScript Guide', content: 'Learn JS' }, TEST_USER);
         repo.create({ title: 'Python Guide', content: 'Learn Python' }, TEST_USER);

         const result = repo.search(TEST_USER, 'JavaScript');
         expect(result.notes).toHaveLength(1);
         expect(result.notes[0].title).toBe('JavaScript Guide');
         expect(result.total).toBe(1);
      });

      it('should find notes by content', () => {
         repo.create({ title: 'Note', content: 'React hooks are awesome' }, TEST_USER);

         const result = repo.search(TEST_USER, 'hooks');
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
