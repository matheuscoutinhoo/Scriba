import { describe, it, expect } from 'vitest';
import { slugify, escapeLikePattern } from '../lib/utils';

describe('slugify', () => {
   it('lowercases text', () => {
      expect(slugify('Hello World')).toBe('hello-world');
   });

   it('replaces spaces with hyphens', () => {
      expect(slugify('my note title')).toBe('my-note-title');
   });

   it('removes special characters', () => {
      expect(slugify('Hello! @World#')).toBe('hello-world');
   });

   it('collapses multiple hyphens', () => {
      expect(slugify('hello---world')).toBe('hello-world');
   });

   it('trims whitespace', () => {
      expect(slugify('  hello  ')).toBe('hello');
   });

   it('handles underscores', () => {
      expect(slugify('hello_world')).toBe('hello-world');
   });

   it('handles empty string', () => {
      expect(slugify('')).toBe('');
   });
});

describe('escapeLikePattern', () => {
   it('escapes percent signs', () => {
      expect(escapeLikePattern('100%')).toBe('100$%');
   });

   it('escapes underscores', () => {
      expect(escapeLikePattern('my_note')).toBe('my$_note');
   });

   it('escapes dollar signs', () => {
      expect(escapeLikePattern('$100')).toBe('$$100');
   });

   it('escapes multiple special characters', () => {
      expect(escapeLikePattern('$100_%')).toBe('$$100$_$%');
   });

   it('leaves normal text unchanged', () => {
      expect(escapeLikePattern('hello world')).toBe('hello world');
   });
});
