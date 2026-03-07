import type { INoteRepository } from '../repositories/INoteRepository.js';
import type { CreateNoteDTO, UpdateNoteDTO, NoteWithTags, SearchResult } from '../models/types.js';

export class NoteService {
   constructor(private repository: INoteRepository) { }

   getAll(userId: string, options?: { archived?: boolean; categoryId?: string }): NoteWithTags[] {
      return this.repository.findAllByUser(userId, options);
   }

   getById(id: string, userId: string): NoteWithTags | null {
      return this.repository.findById(id, userId);
   }

   create(dto: CreateNoteDTO, userId: string): NoteWithTags {
      return this.repository.create(dto, userId);
   }

   update(id: string, dto: UpdateNoteDTO, userId: string): NoteWithTags | null {
      return this.repository.update(id, dto, userId);
   }

   delete(id: string, userId: string): boolean {
      return this.repository.delete(id, userId);
   }

   search(userId: string, query: string, limit?: number, offset?: number): SearchResult {
      return this.repository.search(userId, query, limit, offset);
   }
}
