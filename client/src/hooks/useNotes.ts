import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/lib/api';
import type { CreateNotePayload, UpdateNotePayload, Note } from '@/lib/types';

export function useNotes(params?: { archived?: boolean; category_id?: string }, options?: { enabled?: boolean }) {
   return useQuery({
      queryKey: ['notes', params],
      queryFn: () => notesApi.getAll(params),
      select: (data) => data.data,
      enabled: options?.enabled ?? true,
   });
}

export function useNote(id: string | undefined) {
   return useQuery({
      queryKey: ['notes', id],
      queryFn: () => notesApi.getById(id!),
      select: (data) => data.data,
      enabled: !!id,
   });
}

export function useCreateNote() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (payload: CreateNotePayload) => notesApi.create(payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['notes'] });
         queryClient.invalidateQueries({ queryKey: ['categories'] });
      },
   });
}

export function useUpdateNote() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({ id, ...payload }: UpdateNotePayload & { id: string }) =>
         notesApi.update(id, payload),
      onMutate: async ({ id, ...payload }) => {
         await queryClient.cancelQueries({ queryKey: ['notes'] });
         const queries = queryClient.getQueriesData<{ data: Note[] }>({ queryKey: ['notes'] });
         for (const [key, cached] of queries) {
            if (cached && Array.isArray(cached.data)) {
               queryClient.setQueryData(key, {
                  ...cached,
                  data: cached.data.map((n: Note) =>
                     n.id === id ? { ...n, ...payload } : n
                  ),
               });
            }
         }
         return { queries };
      },
      onError: (_err, _vars, context) => {
         if (context?.queries) {
            for (const [key, data] of context.queries) {
               queryClient.setQueryData(key, data);
            }
         }
      },
      onSettled: (_data, _error, variables) => {
         if (variables.category_id !== undefined) {
            // Note moved between categories — invalidate all category-specific queries
            queryClient.invalidateQueries({ queryKey: ['notes'] });
         } else {
            queryClient.invalidateQueries({ queryKey: ['notes', undefined] });
         }
         queryClient.invalidateQueries({ queryKey: ['categories'] });
      },
   });
}

export function useDeleteNote() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => notesApi.delete(id),
      onMutate: async (id) => {
         await queryClient.cancelQueries({ queryKey: ['notes'] });
         const queries = queryClient.getQueriesData<{ data: Note[] }>({ queryKey: ['notes'] });
         for (const [key, cached] of queries) {
            if (cached && Array.isArray(cached.data)) {
               queryClient.setQueryData(key, {
                  ...cached,
                  data: cached.data.filter((n: Note) => n.id !== id),
               });
            }
         }
         return { queries };
      },
      onError: (_err, _vars, context) => {
         if (context?.queries) {
            for (const [key, data] of context.queries) {
               queryClient.setQueryData(key, data);
            }
         }
      },
      onSettled: () => {
         queryClient.invalidateQueries({ queryKey: ['notes'] });
         queryClient.invalidateQueries({ queryKey: ['categories'] });
      },
   });
}

export function useSearchNotes(query: string) {
   return useQuery({
      queryKey: ['notes', 'search', query],
      queryFn: () => notesApi.search(query),
      select: (data) => data.data,
      enabled: query.length > 0,
   });
}
