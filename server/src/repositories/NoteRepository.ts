import { v4 as uuidv4 } from 'uuid';
import type { Database } from '../database/connection.js';
import { queryAll, queryOne, execute } from '../database/connection.js';
import type { Note, NoteWithTags, Tag, CreateNoteDTO, UpdateNoteDTO } from '../models/types.js';
import { slugify, escapeLikePattern } from '../lib/utils.js';
import { MAX_EXCERPT_LENGTH, DEFAULT_SEARCH_LIMIT } from '../lib/constants.js';

export class NoteRepository {
   constructor(private db: Database) { }

   findAllByUser(userId: string, options?: { archived?: boolean; categoryId?: string }): NoteWithTags[] {
      let query = `SELECT * FROM notes WHERE user_id = ?`;
      const params: unknown[] = [userId];

      if (options?.archived !== undefined) {
         query += ` AND is_archived = ?`;
         params.push(options.archived ? 1 : 0);
      }

      if (options?.categoryId) {
         query += ` AND category_id = ?`;
         params.push(options.categoryId);
      }

      query += ` ORDER BY is_pinned DESC, updated_at DESC`;

      const notes = queryAll<Note>(this.db, query, params);
      return notes.map(note => this.attachTags(note));
   }

   findById(id: string, userId: string): NoteWithTags | null {
      const note = queryOne<Note>(this.db, `SELECT * FROM notes WHERE id = ? AND user_id = ?`, [id, userId]);
      if (!note) return null;
      return this.attachTags(note);
   }

   create(dto: CreateNoteDTO, userId: string): NoteWithTags {
      const id = uuidv4();
      const excerpt = this.generateExcerpt(dto.content || '');

      execute(this.db,
         `INSERT INTO notes (id, title, content, excerpt, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?)`,
         [id, dto.title, dto.content || '', excerpt, userId, dto.category_id || null]
      );

      if (dto.tags && dto.tags.length > 0) {
         this.syncTags(id, dto.tags, userId);
      }

      const result = this.findById(id, userId);
      if (!result) throw new Error(`Failed to create note with id ${id}`);
      return result;
   }

   update(id: string, dto: UpdateNoteDTO, userId: string): NoteWithTags | null {
      const existing = this.findById(id, userId);
      if (!existing) return null;

      const fields: string[] = [];
      const values: unknown[] = [];

      if (dto.title !== undefined) {
         fields.push('title = ?');
         values.push(dto.title);
      }
      if (dto.content !== undefined) {
         fields.push('content = ?');
         values.push(dto.content);
         fields.push('excerpt = ?');
         values.push(this.generateExcerpt(dto.content));
      }
      if (dto.category_id !== undefined) {
         fields.push('category_id = ?');
         values.push(dto.category_id);
      }
      if (dto.is_pinned !== undefined) {
         fields.push('is_pinned = ?');
         values.push(dto.is_pinned ? 1 : 0);
      }
      if (dto.is_archived !== undefined) {
         fields.push('is_archived = ?');
         values.push(dto.is_archived ? 1 : 0);
      }

      if (fields.length > 0) {
         fields.push("updated_at = datetime('now')");
         values.push(id, userId);
         execute(this.db,
            `UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
            values
         );
      }

      if (dto.tags !== undefined) {
         this.syncTags(id, dto.tags, userId);
      }

      return this.findById(id, userId);
   }

   delete(id: string, userId: string): boolean {
      execute(this.db, `DELETE FROM note_tags WHERE note_id = ?`, [id]);
      const changes = execute(this.db, `DELETE FROM notes WHERE id = ? AND user_id = ?`, [id, userId]);
      return changes > 0;
   }

   search(userId: string, query: string, limit: number = DEFAULT_SEARCH_LIMIT, offset: number = 0): { notes: NoteWithTags[]; total: number } {
      const escaped = escapeLikePattern(query);
      const pattern = `%${escaped}%`;

      const countResult = queryOne<{ total: number }>(this.db,
         `SELECT COUNT(*) as total FROM notes WHERE user_id = ? AND (title LIKE ? ESCAPE '$' OR content LIKE ? ESCAPE '$')`,
         [userId, pattern, pattern]
      );

      const notes = queryAll<Note>(this.db,
         `SELECT * FROM notes WHERE user_id = ? AND (title LIKE ? ESCAPE '$' OR content LIKE ? ESCAPE '$') ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
         [userId, pattern, pattern, limit, offset]
      );

      return {
         notes: notes.map(note => this.attachTags(note)),
         total: countResult?.total ?? 0,
      };
   }

   private attachTags(note: Note): NoteWithTags {
      const tags = queryAll<Tag>(this.db,
         `SELECT t.* FROM tags t INNER JOIN note_tags nt ON t.id = nt.tag_id WHERE nt.note_id = ?`,
         [note.id]
      );
      return { ...note, tags };
   }

   private syncTags(noteId: string, tagNames: string[], userId: string): void {
      execute(this.db, `DELETE FROM note_tags WHERE note_id = ?`, [noteId]);

      for (const name of tagNames) {
         const slug = slugify(name);
         let tag = queryOne<Tag>(this.db,
            `SELECT * FROM tags WHERE slug = ? AND user_id = ?`,
            [slug, userId]
         );

         if (!tag) {
            const tagId = uuidv4();
            execute(this.db,
               `INSERT INTO tags (id, name, slug, user_id) VALUES (?, ?, ?, ?)`,
               [tagId, name, slug, userId]
            );
            tag = { id: tagId, name, slug, user_id: userId, created_at: '' };
         }

         execute(this.db,
            `INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)`,
            [noteId, tag.id]
         );
      }
   }

   private generateExcerpt(content: string): string {
      const plain = content.replace(/[#*_`~\[\]()>!|-]/g, '').trim();
      return plain.length > MAX_EXCERPT_LENGTH ? plain.substring(0, MAX_EXCERPT_LENGTH) + '...' : plain;
   }
}
