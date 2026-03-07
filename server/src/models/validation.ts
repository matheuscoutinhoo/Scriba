import { z } from 'zod';
import { DEFAULT_CATEGORY_COLOR } from '../lib/constants.js';

export const createNoteSchema = z.object({
   title: z.string().min(1, 'Title is required').max(255),
   content: z.string().optional().default(''),
   category_id: z.string().uuid().optional(),
   tags: z.array(z.string().min(1).max(50)).max(20).optional().default([]),
});

export const updateNoteSchema = z.object({
   title: z.string().min(1).max(255).optional(),
   content: z.string().max(500_000).optional(),
   category_id: z.string().uuid().nullable().optional(),
   is_pinned: z.boolean().optional(),
   is_archived: z.boolean().optional(),
   tags: z.array(z.string().min(1).max(50)).max(20).optional(),
});

export const notesQuerySchema = z.object({
   archived: z.enum(['true', 'false']).optional(),
   category_id: z.string().uuid().optional(),
});

export const createCategorySchema = z.object({
   name: z.string().min(1, 'Name is required').max(100),
   color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default(DEFAULT_CATEGORY_COLOR),
   icon: z.string().max(50).optional(),
   parent_id: z.string().uuid().optional(),
});

export const updateCategorySchema = z.object({
   name: z.string().min(1).max(100).optional(),
   color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
   icon: z.string().max(50).optional(),
   parent_id: z.string().uuid().nullable().optional(),
   position: z.number().int().min(0).optional(),
});

export const searchSchema = z.object({
   q: z.string().min(1, 'Search query is required').max(200),
   limit: z.coerce.number().int().min(1).max(100).optional().default(20),
   offset: z.coerce.number().int().min(0).optional().default(0),
});
