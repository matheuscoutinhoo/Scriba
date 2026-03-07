import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/lib/api';
import type { CreateNotePayload, UpdateNotePayload } from '@/lib/types';

export function useNotes(params?: { archived?: boolean; category_id?: string }) {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: () => notesApi.getAll(params),
    select: (data) => data.data,
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
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateNotePayload & { id: string }) =>
      notesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
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
