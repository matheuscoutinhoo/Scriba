import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notesApi, categoriesApi } from '@/lib/api';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(data: unknown, status = 200) {
   return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
   });
}

beforeEach(() => {
   mockFetch.mockReset();
});

describe('notesApi', () => {
   it('getAll fetches notes without params', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: [] }));
      const result = await notesApi.getAll();
      expect(result.data).toEqual([]);
      expect(mockFetch).toHaveBeenCalledWith('/api/notes', expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }));
   });

   it('getAll passes archived and category_id as query params', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: [] }));
      await notesApi.getAll({ archived: true, category_id: 'cat-1' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('archived=true');
      expect(url).toContain('category_id=cat-1');
   });

   it('getById encodes id', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: { id: 'n1' } }));
      await notesApi.getById('n1');
      expect(mockFetch.mock.calls[0][0]).toBe('/api/notes/n1');
   });

   it('create sends POST with payload', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: { id: 'n1' } }, 201));
      await notesApi.create({ title: 'Test' });
      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ title: 'Test' });
   });

   it('update sends PUT', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: { id: 'n1' } }));
      await notesApi.update('n1', { title: 'Updated' });
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/notes/n1');
      expect(opts.method).toBe('PUT');
   });

   it('delete sends DELETE and returns undefined for 204', async () => {
      mockFetch.mockResolvedValue(new Response(null, { status: 204, headers: { 'Content-Type': 'application/json' } }));
      const result = await notesApi.delete('n1');
      expect(result).toBeUndefined();
   });

   it('search builds query string', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: [], total: 0 }));
      await notesApi.search('hello', 10, 5);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('q=hello');
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=5');
   });

   it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: 'Not found' }, 404));
      await expect(notesApi.getById('bad')).rejects.toThrow('Not found');
   });

   it('throws fallback message when error JSON parsing fails', async () => {
      mockFetch.mockResolvedValue(new Response('not json', { status: 500 }));
      await expect(notesApi.getAll()).rejects.toThrow('Request failed');
   });

   it('throws HTTP status fallback when error response has no error field', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: 'other format' }, 422));
      await expect(notesApi.getAll()).rejects.toThrow('HTTP 422');
   });

   it('search works without limit and offset', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: [] }));
      await notesApi.search('hello');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('q=hello');
      expect(url).not.toContain('limit');
      expect(url).not.toContain('offset');
   });
});

describe('categoriesApi', () => {
   it('getAll fetches categories', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: [] }));
      const result = await categoriesApi.getAll();
      expect(result.data).toEqual([]);
   });

   it('getById fetches single category', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: { id: 'c1' } }));
      const result = await categoriesApi.getById('c1');
      expect(result.data).toEqual({ id: 'c1' });
   });

   it('create sends POST', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: { id: 'c1' } }, 201));
      await categoriesApi.create({ name: 'Work' });
      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe('POST');
   });

   it('update sends PUT', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: { id: 'c1' } }));
      await categoriesApi.update('c1', { name: 'Updated' });
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/categories/c1');
      expect(opts.method).toBe('PUT');
   });

   it('delete sends DELETE', async () => {
      mockFetch.mockResolvedValue(new Response(null, { status: 204, headers: { 'Content-Type': 'application/json' } }));
      await categoriesApi.delete('c1');
      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe('DELETE');
   });
});
