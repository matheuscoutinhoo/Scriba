import { describe, it, expect, vi } from 'vitest';
import { NoteService } from '../services/NoteService';
import type { INoteRepository } from '../repositories/INoteRepository';
import type { NoteWithTags } from '../models/types';

function makeNote(overrides: Partial<NoteWithTags> = {}): NoteWithTags {
   return {
      id: 'note-1',
      title: 'Test',
      content: '',
      excerpt: null,
      is_pinned: 0,
      is_archived: 0,
      user_id: 'user-1',
      category_id: null,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      tags: [],
      ...overrides,
   };
}

function createMockRepository(): INoteRepository {
   return {
      findAllByUser: vi.fn().mockReturnValue([]),
      findById: vi.fn().mockReturnValue(null),
      create: vi.fn().mockReturnValue(makeNote()),
      update: vi.fn().mockReturnValue(null),
      delete: vi.fn().mockReturnValue(false),
      search: vi.fn().mockReturnValue({ notes: [], total: 0 }),
   };
}

describe('NoteService', () => {
   it('getAll delegates to repository', () => {
      const repo = createMockRepository();
      const notes = [makeNote({ id: '1' }), makeNote({ id: '2' })];
      vi.mocked(repo.findAllByUser).mockReturnValue(notes);

      const service = new NoteService(repo);
      const result = service.getAll('user-1', { archived: false });

      expect(repo.findAllByUser).toHaveBeenCalledWith('user-1', { archived: false });
      expect(result).toEqual(notes);
   });

   it('getById delegates to repository', () => {
      const repo = createMockRepository();
      const note = makeNote();
      vi.mocked(repo.findById).mockReturnValue(note);

      const service = new NoteService(repo);
      const result = service.getById('note-1', 'user-1');

      expect(repo.findById).toHaveBeenCalledWith('note-1', 'user-1');
      expect(result).toEqual(note);
   });

   it('getById returns null for non-existent note', () => {
      const repo = createMockRepository();
      const service = new NoteService(repo);

      expect(service.getById('missing', 'user-1')).toBeNull();
   });

   it('create delegates to repository', () => {
      const repo = createMockRepository();
      const created = makeNote({ title: 'New' });
      vi.mocked(repo.create).mockReturnValue(created);

      const service = new NoteService(repo);
      const result = service.create({ title: 'New' }, 'user-1');

      expect(repo.create).toHaveBeenCalledWith({ title: 'New' }, 'user-1');
      expect(result).toEqual(created);
   });

   it('update delegates to repository', () => {
      const repo = createMockRepository();
      const updated = makeNote({ title: 'Updated' });
      vi.mocked(repo.update).mockReturnValue(updated);

      const service = new NoteService(repo);
      const result = service.update('note-1', { title: 'Updated' }, 'user-1');

      expect(repo.update).toHaveBeenCalledWith('note-1', { title: 'Updated' }, 'user-1');
      expect(result).toEqual(updated);
   });

   it('delete delegates to repository', () => {
      const repo = createMockRepository();
      vi.mocked(repo.delete).mockReturnValue(true);

      const service = new NoteService(repo);
      const result = service.delete('note-1', 'user-1');

      expect(repo.delete).toHaveBeenCalledWith('note-1', 'user-1');
      expect(result).toBe(true);
   });

   it('search delegates to repository with params', () => {
      const repo = createMockRepository();
      const searchResult = { notes: [makeNote()], total: 1 };
      vi.mocked(repo.search).mockReturnValue(searchResult);

      const service = new NoteService(repo);
      const result = service.search('user-1', 'test', 10, 5);

      expect(repo.search).toHaveBeenCalledWith('user-1', 'test', 10, 5);
      expect(result).toEqual(searchResult);
   });
});
