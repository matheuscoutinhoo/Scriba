import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryTree } from '@/components/sidebar/CategoryTree';
import type { ReactNode } from 'react';
import type { Category, Note } from '@/lib/types';

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

import { categoriesApi, notesApi } from '@/lib/api';

const mockCategoriesApi = categoriesApi as { [K in keyof typeof categoriesApi]: ReturnType<typeof vi.fn> };
const mockNotesApi = notesApi as { [K in keyof typeof notesApi]: ReturnType<typeof vi.fn> };

function makeCategory(overrides: Partial<Category> = {}): Category {
   return {
      id: 'cat-1',
      name: 'Work',
      slug: 'work',
      color: '#ef4444',
      icon: null,
      user_id: 'user-1',
      parent_id: null,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      note_count: 0,
      children: [],
      ...overrides,
   };
}

function makeNote(overrides: Partial<Note> = {}): Note {
   return {
      id: 'note-1',
      title: 'Test Note',
      content: 'content',
      excerpt: 'content',
      is_pinned: 0,
      is_archived: 0,
      user_id: 'user-1',
      category_id: null,
      position: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      tags: [],
      ...overrides,
   };
}

function createWrapper() {
   const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
   });
   return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
   );
}

const defaultProps = {
   selectedId: null,
   onSelect: vi.fn(),
   onDropNote: vi.fn(),
   selectedNoteId: null,
   onSelectNote: vi.fn(),
   onTogglePin: vi.fn(),
   onToggleArchive: vi.fn(),
   onDeleteNote: vi.fn(),
};

beforeEach(() => {
   vi.clearAllMocks();
   mockNotesApi.getAll.mockResolvedValue({ data: [] });
});

describe('CategoryTree', () => {
   it('shows loading state', () => {
      mockCategoriesApi.getAll.mockReturnValue(new Promise(() => { }));
      render(<CategoryTree {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByText('Loading...')).toBeInTheDocument();
   });

   it('shows "No categories yet" when empty', async () => {
      mockCategoriesApi.getAll.mockResolvedValue({ data: [] });
      render(<CategoryTree {...defaultProps} />, { wrapper: createWrapper() });
      expect(await screen.findByText('No categories yet')).toBeInTheDocument();
   });

   it('renders categories', async () => {
      mockCategoriesApi.getAll.mockResolvedValue({
         data: [makeCategory({ id: 'c1', name: 'Work' }), makeCategory({ id: 'c2', name: 'Personal' })],
      });
      render(<CategoryTree {...defaultProps} />, { wrapper: createWrapper() });
      expect(await screen.findByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
   });

   it('renders note count badge on category', async () => {
      mockCategoriesApi.getAll.mockResolvedValue({
         data: [makeCategory({ id: 'c1', name: 'Work', note_count: 5 })],
      });
      render(<CategoryTree {...defaultProps} />, { wrapper: createWrapper() });
      expect(await screen.findByText('5')).toBeInTheDocument();
   });

   it('calls onSelect when category is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      mockCategoriesApi.getAll.mockResolvedValue({
         data: [makeCategory({ id: 'c1', name: 'Work', note_count: 0 })],
      });
      render(<CategoryTree {...defaultProps} onSelect={onSelect} />, { wrapper: createWrapper() });
      await user.click(await screen.findByText('Work'));
      expect(onSelect).toHaveBeenCalledWith('c1');
   });

   it('renders uncategorized section when there are uncategorized notes', async () => {
      mockCategoriesApi.getAll.mockResolvedValue({ data: [] });
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Loose Note', category_id: null })],
      });
      render(<CategoryTree {...defaultProps} />, { wrapper: createWrapper() });
      expect(await screen.findByText('Uncategorized')).toBeInTheDocument();
   });

   it('does not render uncategorized section when all notes have categories', async () => {
      mockCategoriesApi.getAll.mockResolvedValue({ data: [] });
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', category_id: 'c1' })],
      });
      render(<CategoryTree {...defaultProps} />, { wrapper: createWrapper() });
      await screen.findByText('No categories yet');
      expect(screen.queryByText('Uncategorized')).not.toBeInTheDocument();
   });

   it('shows drop-to-remove zone when onDragCategorizedNote fires', async () => {
      const user = userEvent.setup();
      mockCategoriesApi.getAll.mockResolvedValue({
         data: [makeCategory({ id: 'c1', name: 'Work', note_count: 1 })],
      });
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Drag Me', category_id: 'c1' })],
      });
      render(<CategoryTree {...defaultProps} />, { wrapper: createWrapper() });

      // Click category to expand and show notes
      await user.click(await screen.findByText('Work'));
      await screen.findByText('Drag Me');

      // Start dragging the note — this calls onDragCategorizedNote
      const noteEl = screen.getByText('Drag Me').closest('[draggable]')!;
      fireEvent.dragStart(noteEl, {
         dataTransfer: { setData: vi.fn(), effectAllowed: '' },
      });

      // The "Drop here to remove from category" zone should appear
      expect(screen.getByText('Drop here to remove from category')).toBeInTheDocument();
   });

   it('handles drop on the remove-from-category zone', async () => {
      const user = userEvent.setup();
      const onDropNote = vi.fn();
      mockCategoriesApi.getAll.mockResolvedValue({
         data: [makeCategory({ id: 'c1', name: 'Work', note_count: 1 })],
      });
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Drag Me', category_id: 'c1' })],
      });
      render(<CategoryTree {...defaultProps} onDropNote={onDropNote} />, { wrapper: createWrapper() });

      await user.click(await screen.findByText('Work'));
      await screen.findByText('Drag Me');

      const noteEl = screen.getByText('Drag Me').closest('[draggable]')!;
      fireEvent.dragStart(noteEl, {
         dataTransfer: { setData: vi.fn(), effectAllowed: '' },
      });

      const dropZone = screen.getByText('Drop here to remove from category');
      fireEvent.dragOver(dropZone, { dataTransfer: { dropEffect: '' } });
      fireEvent.drop(dropZone, {
         dataTransfer: { getData: () => 'n1' },
      });

      expect(onDropNote).toHaveBeenCalledWith('n1', null);
   });

   it('handles dragend to clean up drag state', async () => {
      const user = userEvent.setup();
      mockCategoriesApi.getAll.mockResolvedValue({
         data: [makeCategory({ id: 'c1', name: 'Work', note_count: 1 })],
      });
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Drag Me', category_id: 'c1' })],
      });
      render(<CategoryTree {...defaultProps} />, { wrapper: createWrapper() });

      await user.click(await screen.findByText('Work'));
      await screen.findByText('Drag Me');

      const noteEl = screen.getByText('Drag Me').closest('[draggable]')!;
      fireEvent.dragStart(noteEl, {
         dataTransfer: { setData: vi.fn(), effectAllowed: '' },
      });

      expect(screen.getByText('Drop here to remove from category')).toBeInTheDocument();

      // Fire dragend on window to clean up
      fireEvent.dragEnd(window);

      // Drop zone should disappear
      expect(screen.queryByText('Drop here to remove from category')).not.toBeInTheDocument();
   });
});
