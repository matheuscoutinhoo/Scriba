import type { NoteWithTags, CreateNoteDTO, UpdateNoteDTO, SearchResult } from '../models/types.js';

export interface INoteRepository {
   findAllByUser(userId: string, options?: { archived?: boolean; categoryId?: string }): NoteWithTags[];
   findById(id: string, userId: string): NoteWithTags | null;
   create(dto: CreateNoteDTO, userId: string): NoteWithTags;
   update(id: string, dto: UpdateNoteDTO, userId: string): NoteWithTags | null;
   delete(id: string, userId: string): boolean;
   search(userId: string, query: string, limit?: number, offset?: number): SearchResult;
}
