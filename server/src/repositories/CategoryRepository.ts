import { v4 as uuidv4 } from 'uuid';
import type { Database } from '../database/connection.js';
import { queryAll, queryOne, execute } from '../database/connection.js';
import type { Category, CategoryWithCount, CreateCategoryDTO, UpdateCategoryDTO } from '../models/types.js';
import type { ICategoryRepository } from './ICategoryRepository.js';
import { slugify } from '../lib/utils.js';
import { DEFAULT_CATEGORY_COLOR } from '../lib/constants.js';

export class CategoryRepository implements ICategoryRepository {
   constructor(private db: Database) { }

   findAllByUser(userId: string): CategoryWithCount[] {
      const categories = queryAll<Category & { note_count: number }>(this.db, `
      SELECT c.*, COUNT(n.id) as note_count
      FROM categories c
      LEFT JOIN notes n ON n.category_id = c.id AND n.is_archived = 0
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.position ASC, c.name ASC
    `, [userId]);

      return this.buildTree(categories);
   }

   findById(id: string, userId: string): Category | null {
      return queryOne<Category>(this.db,
         `SELECT * FROM categories WHERE id = ? AND user_id = ?`,
         [id, userId]
      );
   }

   create(dto: CreateCategoryDTO, userId: string): Category {
      const id = uuidv4();
      const slug = slugify(dto.name);

      execute(this.db,
         `INSERT INTO categories (id, name, slug, color, icon, user_id, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
         [id, dto.name, slug, dto.color || DEFAULT_CATEGORY_COLOR, dto.icon || null, userId, dto.parent_id || null]
      );

      const result = this.findById(id, userId);
      if (!result) throw new Error(`Failed to create category with id ${id}`);
      return result;
   }

   update(id: string, dto: UpdateCategoryDTO, userId: string): Category | null {
      const existing = this.findById(id, userId);
      if (!existing) return null;

      const fields: string[] = [];
      const values: unknown[] = [];

      if (dto.name !== undefined) {
         fields.push('name = ?', 'slug = ?');
         values.push(dto.name, slugify(dto.name));
      }
      if (dto.color !== undefined) {
         fields.push('color = ?');
         values.push(dto.color);
      }
      if (dto.icon !== undefined) {
         fields.push('icon = ?');
         values.push(dto.icon);
      }
      if (dto.parent_id !== undefined) {
         fields.push('parent_id = ?');
         values.push(dto.parent_id);
      }
      if (dto.position !== undefined) {
         fields.push('position = ?');
         values.push(dto.position);
      }

      if (fields.length > 0) {
         fields.push("updated_at = datetime('now')");
         values.push(id, userId);
         execute(this.db,
            `UPDATE categories SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
            values
         );
      }

      return this.findById(id, userId);
   }

   delete(id: string, userId: string): boolean {
      const changes = execute(this.db,
         `DELETE FROM categories WHERE id = ? AND user_id = ?`,
         [id, userId]
      );
      return changes > 0;
   }

   private buildTree(categories: (Category & { note_count: number })[]): CategoryWithCount[] {
      const map = new Map<string, CategoryWithCount>();
      const roots: CategoryWithCount[] = [];

      for (const cat of categories) {
         map.set(cat.id, { ...cat, children: [] });
      }

      for (const cat of categories) {
         const node = map.get(cat.id)!;
         if (cat.parent_id && map.has(cat.parent_id)) {
            map.get(cat.parent_id)!.children!.push(node);
         } else {
            roots.push(node);
         }
      }

      return roots;
   }
}
