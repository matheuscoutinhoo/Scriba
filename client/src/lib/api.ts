import type {
   Note,
   Category,
   CreateNotePayload,
   UpdateNotePayload,
   CreateCategoryPayload,
   UpdateCategoryPayload,
   ApiResponse,
} from './types';

const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
   const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
   });

   if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${res.status}`);
   }

   if (res.status === 204) return undefined as T;
   return res.json();
}

export const notesApi = {
   getAll(params?: { archived?: boolean; category_id?: string }): Promise<ApiResponse<Note[]>> {
      const search = new URLSearchParams();
      if (params?.archived !== undefined) search.set('archived', String(params.archived));
      if (params?.category_id) search.set('category_id', params.category_id);
      const qs = search.toString();
      return request(`/notes${qs ? `?${qs}` : ''}`);
   },

   getById(id: string): Promise<ApiResponse<Note>> {
      return request(`/notes/${encodeURIComponent(id)}`);
   },

   create(payload: CreateNotePayload): Promise<ApiResponse<Note>> {
      return request('/notes', { method: 'POST', body: JSON.stringify(payload) });
   },

   update(id: string, payload: UpdateNotePayload): Promise<ApiResponse<Note>> {
      return request(`/notes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
   },

   delete(id: string): Promise<void> {
      return request(`/notes/${encodeURIComponent(id)}`, { method: 'DELETE' });
   },

   search(q: string, limit?: number, offset?: number): Promise<ApiResponse<Note[]>> {
      const search = new URLSearchParams({ q });
      if (limit) search.set('limit', String(limit));
      if (offset) search.set('offset', String(offset));
      return request(`/notes/search?${search.toString()}`);
   },
};

export const categoriesApi = {
   getAll(): Promise<ApiResponse<Category[]>> {
      return request('/categories');
   },

   getById(id: string): Promise<ApiResponse<Category>> {
      return request(`/categories/${encodeURIComponent(id)}`);
   },

   create(payload: CreateCategoryPayload): Promise<ApiResponse<Category>> {
      return request('/categories', { method: 'POST', body: JSON.stringify(payload) });
   },

   update(id: string, payload: UpdateCategoryPayload): Promise<ApiResponse<Category>> {
      return request(`/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
   },

   delete(id: string): Promise<void> {
      return request(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
   },
};
