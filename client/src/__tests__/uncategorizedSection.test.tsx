import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UncategorizedSection } from '@/components/sidebar/UncategorizedSection';
import type { ReactNode } from 'react';
import type { Note } from '@/lib/types';

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

import { notesApi } from '@/lib/api';
const mockNotesApi = notesApi as { [K in keyof typeof notesApi]: ReturnType<typeof vi.fn> };

function makeNote(overrides: Partial<Note> = {}): Note {
   return {
      id: 'note-1',
      title: 'Uncategorized Note',
      content: 'content',
      excerpt: 'some excerpt',
      is_pinned: 0,
      is_archived: 0,
      user_id: 'user-1',
      category_id: null,
      position: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
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
   selectedNoteId: null as string | null,
   onSelectNote: vi.fn(),
   onTogglePin: vi.fn(),
   onToggleArchive: vi.fn(),
   onDeleteNote: vi.fn(),
   onDropNote: vi.fn(),
};

beforeEach(() => {
   vi.clearAllMocks();
});

describe('UncategorizedSection', () => {
   it('renders nothing when all notes have categories', async () => {
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', category_id: 'cat-1' })],
      });
      const { container } = render(
         <UncategorizedSection {...defaultProps} />,
         { wrapper: createWrapper() }
      );
      await waitFor(() => {
         expect(mockNotesApi.getAll).toHaveBeenCalled();
      });
      // Should render null since no uncategorized notes
      expect(container.children.length).toBe(0);
   });

   it('renders nothing when no notes exist', async () => {
      mockNotesApi.getAll.mockResolvedValue({ data: [] });
      const { container } = render(
         <UncategorizedSection {...defaultProps} />,
         { wrapper: createWrapper() }
      );
      await waitFor(() => expect(mockNotesApi.getAll).toHaveBeenCalled());
      expect(container.children.length).toBe(0);
   });

   it('renders Uncategorized header with note count', async () => {
      mockNotesApi.getAll.mockResolvedValue({
         data: [
            makeNote({ id: 'n1', category_id: null }),
            makeNote({ id: 'n2', category_id: null }),
         ],
      });
      render(<UncategorizedSection {...defaultProps} />, { wrapper: createWrapper() });
      await waitFor(() => {
         expect(screen.getByText('Uncategorized')).toBeInTheDocument();
      });
      expect(screen.getByText('2')).toBeInTheDocument();
   });

   it('expands to show notes on click', async () => {
      const user = userEvent.setup();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Loose Note', category_id: null })],
      });
      render(<UncategorizedSection {...defaultProps} />, { wrapper: createWrapper() });
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());
      await user.click(screen.getByText('Uncategorized'));

      expect(screen.getByText('Loose Note')).toBeInTheDocument();
   });

   it('collapses on second click', async () => {
      const user = userEvent.setup();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Toggle Note', category_id: null })],
      });
      render(<UncategorizedSection {...defaultProps} />, { wrapper: createWrapper() });
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());

      // Expand
      await user.click(screen.getByText('Uncategorized'));
      expect(screen.getByText('Toggle Note')).toBeInTheDocument();

      // Collapse - note text is still in DOM but wrapper has maxHeight: 0
      await user.click(screen.getByText('Uncategorized'));
      const wrapper = screen.getByText('Toggle Note').closest('.overflow-hidden');
      expect(wrapper).toBeTruthy();
      expect(wrapper!.getAttribute('style')).toContain('max-height: 0');
   });

   it('calls onSelectNote when clicking a note', async () => {
      const user = userEvent.setup();
      const onSelectNote = vi.fn();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Click Me', category_id: null })],
      });
      render(
         <UncategorizedSection {...defaultProps} onSelectNote={onSelectNote} />,
         { wrapper: createWrapper() }
      );
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());
      await user.click(screen.getByText('Uncategorized'));
      await user.click(screen.getByText('Click Me'));
      expect(onSelectNote).toHaveBeenCalledWith('n1');
   });

   it('shows notes with excerpt and date', async () => {
      const user = userEvent.setup();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Note', excerpt: 'my excerpt', category_id: null, created_at: '2024-06-15T00:00:00Z' })],
      });
      render(<UncategorizedSection {...defaultProps} />, { wrapper: createWrapper() });
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());
      await user.click(screen.getByText('Uncategorized'));
      expect(screen.getByText('my excerpt')).toBeInTheDocument();
   });

   it('shows Untitled for notes without title', async () => {
      const user = userEvent.setup();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: '', category_id: null })],
      });
      render(<UncategorizedSection {...defaultProps} />, { wrapper: createWrapper() });
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());
      await user.click(screen.getByText('Uncategorized'));
      expect(screen.getByText('Untitled')).toBeInTheDocument();
   });

   it('highlights selected note', async () => {
      const user = userEvent.setup();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Selected', category_id: null })],
      });
      render(
         <UncategorizedSection {...defaultProps} selectedNoteId="n1" />,
         { wrapper: createWrapper() }
      );
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());
      await user.click(screen.getByText('Uncategorized'));

      const noteEl = screen.getByText('Selected').closest('[draggable]')!;
      expect(noteEl.className).toContain('border-l-2');
   });

   it('notes are draggable', async () => {
      const user = userEvent.setup();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Drag Me', category_id: null })],
      });
      render(<UncategorizedSection {...defaultProps} />, { wrapper: createWrapper() });
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());
      await user.click(screen.getByText('Uncategorized'));

      const noteEl = screen.getByText('Drag Me').closest('[draggable]')!;
      expect(noteEl).toHaveAttribute('draggable', 'true');
   });

   it('handles drag start on note', async () => {
      const user = userEvent.setup();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Drag Me', category_id: null })],
      });
      render(<UncategorizedSection {...defaultProps} />, { wrapper: createWrapper() });
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());
      await user.click(screen.getByText('Uncategorized'));

      const noteEl = screen.getByText('Drag Me').closest('[draggable]')!;
      const setData = vi.fn();
      fireEvent.dragStart(noteEl, { dataTransfer: { setData, effectAllowed: '' } });
      expect(setData).toHaveBeenCalledWith('text/x-note-id', 'n1');
   });

   // Drag-drop on section header
   it('handles drag over the header', async () => {
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', category_id: null })],
      });
      render(<UncategorizedSection {...defaultProps} />, { wrapper: createWrapper() });
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());

      const btn = screen.getByText('Uncategorized').closest('button')!;
      fireEvent.dragOver(btn, { dataTransfer: { dropEffect: '' } });
      expect(btn.className).toContain('ring');
   });

   it('handles drag leave on header', async () => {
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', category_id: null })],
      });
      render(<UncategorizedSection {...defaultProps} />, { wrapper: createWrapper() });
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());

      const btn = screen.getByText('Uncategorized').closest('button')!;
      fireEvent.dragOver(btn, { dataTransfer: { dropEffect: '' } });
      fireEvent.dragLeave(btn);
      expect(btn.className).not.toContain('ring');
   });

   it('handles drop on header calling onDropNote with null categoryId', async () => {
      const onDropNote = vi.fn();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', category_id: null })],
      });
      render(
         <UncategorizedSection {...defaultProps} onDropNote={onDropNote} />,
         { wrapper: createWrapper() }
      );
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());

      const btn = screen.getByText('Uncategorized').closest('button')!;
      fireEvent.drop(btn, {
         dataTransfer: { getData: () => 'note-42' },
      });
      expect(onDropNote).toHaveBeenCalledWith('note-42', null);
   });

   it('filters out categorized notes', async () => {
      mockNotesApi.getAll.mockResolvedValue({
         data: [
            makeNote({ id: 'n1', title: 'Has Category', category_id: 'cat-1' }),
            makeNote({ id: 'n2', title: 'No Category', category_id: null }),
         ],
      });
      render(<UncategorizedSection {...defaultProps} />, { wrapper: createWrapper() });
      await waitFor(() => expect(screen.getByText('Uncategorized')).toBeInTheDocument());
      expect(screen.getByText('1')).toBeInTheDocument(); // count = 1
   });
});
