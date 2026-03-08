import type { Note, NoteWithTags, Tag, Category, CategoryWithCount, CreateNoteDTO, UpdateNoteDTO, CreateCategoryDTO, UpdateCategoryDTO } from '../models/types.js';

export interface INoteRepository {
   findAllByUser(userId: string, options?: { archived?: boolean; categoryId?: string }): NoteWithTags[];
   findById(id: string, userId: string): NoteWithTags | null;
   create(dto: CreateNoteDTO, userId: string): NoteWithTags;
   update(id: string, dto: UpdateNoteDTO, userId: string): NoteWithTags | null;
   delete(id: string, userId: string): boolean;
   search(userId: string, query: string, limit?: number, offset?: number): { notes: NoteWithTags[]; total: number };
}

export interface ICategoryRepository {
   findAllByUser(userId: string): CategoryWithCount[];
   findById(id: string, userId: string): Category | null;
   create(dto: CreateCategoryDTO, userId: string): Category;
   update(id: string, dto: UpdateCategoryDTO, userId: string): Category | null;
   delete(id: string, userId: string): boolean;
}
