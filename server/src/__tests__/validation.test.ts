import { describe, it, expect } from 'vitest';
import {
   createNoteSchema,
   updateNoteSchema,
   createCategorySchema,
   updateCategorySchema,
   searchSchema,
} from '../models/validation';

describe('createNoteSchema', () => {
   it('accepts valid input', () => {
      const result = createNoteSchema.parse({ title: 'My Note' });
      expect(result.title).toBe('My Note');
      expect(result.content).toBe('');
      expect(result.tags).toEqual([]);
   });

   it('accepts full input', () => {
      const result = createNoteSchema.parse({
         title: 'Note',
         content: '# Hello',
         category_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
         tags: ['dev', 'react'],
      });
      expect(result.tags).toEqual(['dev', 'react']);
      expect(result.category_id).toBeDefined();
   });

   it('rejects empty title', () => {
      expect(() => createNoteSchema.parse({ title: '' })).toThrow();
   });

   it('rejects missing title', () => {
      expect(() => createNoteSchema.parse({})).toThrow();
   });

   it('rejects title exceeding 255 chars', () => {
      expect(() => createNoteSchema.parse({ title: 'a'.repeat(256) })).toThrow();
   });

   it('rejects invalid category_id format', () => {
      expect(() => createNoteSchema.parse({ title: 'Note', category_id: 'not-a-uuid' })).toThrow();
   });

   it('rejects tags with empty strings', () => {
      expect(() => createNoteSchema.parse({ title: 'Note', tags: [''] })).toThrow();
   });

   it('rejects tag exceeding 50 chars', () => {
      expect(() => createNoteSchema.parse({ title: 'Note', tags: ['a'.repeat(51)] })).toThrow();
   });
});

describe('updateNoteSchema', () => {
   it('accepts partial update', () => {
      const result = updateNoteSchema.parse({ title: 'New Title' });
      expect(result.title).toBe('New Title');
   });

   it('accepts boolean fields', () => {
      const result = updateNoteSchema.parse({ is_pinned: true, is_archived: false });
      expect(result.is_pinned).toBe(true);
      expect(result.is_archived).toBe(false);
   });

   it('accepts empty object', () => {
      const result = updateNoteSchema.parse({});
      expect(result).toEqual({});
   });

   it('accepts null category_id', () => {
      const result = updateNoteSchema.parse({ category_id: null });
      expect(result.category_id).toBeNull();
   });

   it('rejects invalid is_pinned type', () => {
      expect(() => updateNoteSchema.parse({ is_pinned: 'yes' })).toThrow();
   });
});

describe('createCategorySchema', () => {
   it('accepts valid input with defaults', () => {
      const result = createCategorySchema.parse({ name: 'Development' });
      expect(result.name).toBe('Development');
      expect(result.color).toBe('#e11d48');
   });

   it('accepts custom color', () => {
      const result = createCategorySchema.parse({ name: 'Design', color: '#3b82f6' });
      expect(result.color).toBe('#3b82f6');
   });

   it('rejects empty name', () => {
      expect(() => createCategorySchema.parse({ name: '' })).toThrow();
   });

   it('rejects name exceeding 100 chars', () => {
      expect(() => createCategorySchema.parse({ name: 'a'.repeat(101) })).toThrow();
   });

   it('rejects invalid color format', () => {
      expect(() => createCategorySchema.parse({ name: 'Test', color: 'red' })).toThrow();
      expect(() => createCategorySchema.parse({ name: 'Test', color: '#gg0000' })).toThrow();
      expect(() => createCategorySchema.parse({ name: 'Test', color: '#fff' })).toThrow();
   });

   it('rejects invalid parent_id format', () => {
      expect(() => createCategorySchema.parse({ name: 'Test', parent_id: 'not-uuid' })).toThrow();
   });
});

describe('updateCategorySchema', () => {
   it('accepts partial update', () => {
      const result = updateCategorySchema.parse({ color: '#22c55e' });
      expect(result.color).toBe('#22c55e');
   });

   it('accepts null parent_id', () => {
      const result = updateCategorySchema.parse({ parent_id: null });
      expect(result.parent_id).toBeNull();
   });

   it('accepts position', () => {
      const result = updateCategorySchema.parse({ position: 3 });
      expect(result.position).toBe(3);
   });

   it('rejects negative position', () => {
      expect(() => updateCategorySchema.parse({ position: -1 })).toThrow();
   });
});

describe('searchSchema', () => {
   it('accepts valid search query', () => {
      const result = searchSchema.parse({ q: 'react' });
      expect(result.q).toBe('react');
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
   });

   it('accepts custom limit and offset', () => {
      const result = searchSchema.parse({ q: 'test', limit: '10', offset: '5' });
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(5);
   });

   it('rejects empty query', () => {
      expect(() => searchSchema.parse({ q: '' })).toThrow();
   });

   it('rejects missing query', () => {
      expect(() => searchSchema.parse({})).toThrow();
   });

   it('rejects limit exceeding 100', () => {
      expect(() => searchSchema.parse({ q: 'test', limit: '200' })).toThrow();
   });

   it('rejects negative offset', () => {
      expect(() => searchSchema.parse({ q: 'test', offset: '-1' })).toThrow();
   });
});
