import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotes, useNote, useCreateNote, useDeleteNote, useSearchNotes, useUpdateNote } from '@/hooks/useNotes';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import type { ReactNode } from 'react';

vi.mock('@/lib/api', () => ({
   notesApi: {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      search: vi.fn(),
   },
   categoriesApi: {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
   },
}));

import { notesApi, categoriesApi } from '@/lib/api';

const mockNotesApi = notesApi as { [K in keyof typeof notesApi]: ReturnType<typeof vi.fn> };
const mockCategoriesApi = categoriesApi as { [K in keyof typeof categoriesApi]: ReturnType<typeof vi.fn> };

function createWrapper() {
   const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
   });
   return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
   );
}

beforeEach(() => {
   vi.clearAllMocks();
});

describe('useNotes', () => {
   it('fetches notes', async () => {
      mockNotesApi.getAll.mockResolvedValue({ data: [{ id: '1', title: 'Note 1' }] });
      const { result } = renderHook(() => useNotes(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.data).toEqual([{ id: '1', title: 'Note 1' }]));
   });

   it('passes params to API', async () => {
      mockNotesApi.getAll.mockResolvedValue({ data: [] });
      renderHook(() => useNotes({ archived: true, category_id: 'c1' }), { wrapper: createWrapper() });
      await waitFor(() => expect(mockNotesApi.getAll).toHaveBeenCalledWith({ archived: true, category_id: 'c1' }));
   });

   it('respects enabled option', () => {
      mockNotesApi.getAll.mockResolvedValue({ data: [] });
      renderHook(() => useNotes(undefined, { enabled: false }), { wrapper: createWrapper() });
      expect(mockNotesApi.getAll).not.toHaveBeenCalled();
   });
});

describe('useNote', () => {
   it('fetches a single note by id', async () => {
      mockNotesApi.getById.mockResolvedValue({ data: { id: 'n1', title: 'Test' } });
      const { result } = renderHook(() => useNote('n1'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.data).toEqual({ id: 'n1', title: 'Test' }));
   });

   it('does not fetch when id is undefined', () => {
      renderHook(() => useNote(undefined), { wrapper: createWrapper() });
      expect(mockNotesApi.getById).not.toHaveBeenCalled();
   });
});

describe('useCreateNote', () => {
   it('calls create API', async () => {
      mockNotesApi.create.mockResolvedValue({ data: { id: 'new' } });
      const { result } = renderHook(() => useCreateNote(), { wrapper: createWrapper() });
      result.current.mutate({ title: 'New Note' });
      await waitFor(() => expect(mockNotesApi.create).toHaveBeenCalledWith({ title: 'New Note' }));
   });
});

describe('useDeleteNote', () => {
   it('calls delete API', async () => {
      mockNotesApi.delete.mockResolvedValue(undefined);
      const { result } = renderHook(() => useDeleteNote(), { wrapper: createWrapper() });
      result.current.mutate('n1');
      await waitFor(() => expect(mockNotesApi.delete).toHaveBeenCalledWith('n1'));
   });
});

describe('useSearchNotes', () => {
   it('searches when query is non-empty', async () => {
      mockNotesApi.search.mockResolvedValue({ data: [{ id: '1' }] });
      const { result } = renderHook(() => useSearchNotes('hello'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.data).toEqual([{ id: '1' }]));
   });

   it('does not search when query is empty', () => {
      renderHook(() => useSearchNotes(''), { wrapper: createWrapper() });
      expect(mockNotesApi.search).not.toHaveBeenCalled();
   });
});

describe('useCategories', () => {
   it('fetches categories', async () => {
      mockCategoriesApi.getAll.mockResolvedValue({ data: [{ id: 'c1', name: 'Work' }] });
      const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.data).toEqual([{ id: 'c1', name: 'Work' }]));
   });
});

describe('useCreateCategory', () => {
   it('calls create API', async () => {
      mockCategoriesApi.create.mockResolvedValue({ data: { id: 'c1' } });
      const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });
      result.current.mutate({ name: 'Work' });
      await waitFor(() => expect(mockCategoriesApi.create).toHaveBeenCalledWith({ name: 'Work' }));
   });
});

describe('useUpdateCategory', () => {
   it('calls update API', async () => {
      mockCategoriesApi.update.mockResolvedValue({ data: { id: 'c1' } });
      const { result } = renderHook(() => useUpdateCategory(), { wrapper: createWrapper() });
      result.current.mutate({ id: 'c1', name: 'Updated' });
      await waitFor(() => expect(mockCategoriesApi.update).toHaveBeenCalledWith('c1', { name: 'Updated' }));
   });
});

describe('useDeleteCategory', () => {
   it('calls delete API', async () => {
      mockCategoriesApi.delete.mockResolvedValue(undefined);
      const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() });
      result.current.mutate('c1');
      await waitFor(() => expect(mockCategoriesApi.delete).toHaveBeenCalledWith('c1'));
   });
});

describe('useUpdateNote', () => {
   it('calls update API with id and payload', async () => {
      mockNotesApi.update.mockResolvedValue({ data: { id: 'n1', title: 'Updated' } });
      const { result } = renderHook(() => useUpdateNote(), { wrapper: createWrapper() });
      result.current.mutate({ id: 'n1', title: 'Updated' });
      await waitFor(() => expect(mockNotesApi.update).toHaveBeenCalledWith('n1', { title: 'Updated' }));
   });

   it('optimistically updates cached notes list', async () => {
      const queryClient = new QueryClient({
         defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });

      // Pre-populate the cache with notes
      queryClient.setQueryData(['notes', undefined], {
         data: [
            { id: 'n1', title: 'Old Title', content: 'content' },
            { id: 'n2', title: 'Other Note', content: 'other' },
         ],
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
         <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      mockNotesApi.update.mockResolvedValue({ data: { id: 'n1', title: 'New Title' } });

      const { result } = renderHook(() => useUpdateNote(), { wrapper });
      result.current.mutate({ id: 'n1', title: 'New Title' });

      // Optimistic update should happen before API resolves
      await waitFor(() => {
         const cached = queryClient.getQueryData<{ data: Array<{ id: string; title: string }> }>(['notes', undefined]);
         expect(cached?.data.find(n => n.id === 'n1')?.title).toBe('New Title');
      });
   });

   it('rolls back on error', async () => {
      const queryClient = new QueryClient({
         defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });

      queryClient.setQueryData(['notes', undefined], {
         data: [{ id: 'n1', title: 'Original', content: 'content' }],
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
         <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      mockNotesApi.update.mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useUpdateNote(), { wrapper });
      result.current.mutate({ id: 'n1', title: 'Fail Title' });

      await waitFor(() => {
         expect(result.current.isError).toBe(true);
      });

      // Cache should be rolled back to original
      const cached = queryClient.getQueryData<{ data: Array<{ id: string; title: string }> }>(['notes', undefined]);
      expect(cached?.data.find(n => n.id === 'n1')?.title).toBe('Original');
   });
});
