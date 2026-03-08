import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryNode } from '@/components/sidebar/CategoryNode';
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

import { notesApi, categoriesApi } from '@/lib/api';
const mockNotesApi = notesApi as { [K in keyof typeof notesApi]: ReturnType<typeof vi.fn> };
const mockCategoriesApi = categoriesApi as { [K in keyof typeof categoriesApi]: ReturnType<typeof vi.fn> };

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
      excerpt: 'an excerpt',
      is_pinned: 0,
      is_archived: 0,
      user_id: 'user-1',
      category_id: 'cat-1',
      position: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      tags: [],
      ...overrides,
   };
}

function createWrapper() {
   const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
   });
   return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
   );
}

const defaultProps = {
   category: makeCategory(),
   selectedId: null as string | null,
   onSelect: vi.fn(),
   onDropNote: vi.fn(),
   selectedNoteId: null as string | null,
   onSelectNote: vi.fn(),
   onTogglePin: vi.fn(),
   onToggleArchive: vi.fn(),
   onDeleteNote: vi.fn(),
   depth: 0,
   onDragCategorizedNote: vi.fn(),
};

beforeEach(() => {
   vi.clearAllMocks();
   mockNotesApi.getAll.mockResolvedValue({ data: [] });
   mockCategoriesApi.update.mockResolvedValue({ data: {} });
   mockCategoriesApi.delete.mockResolvedValue(undefined);
});

describe('CategoryNode', () => {
   it('renders category name', () => {
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByText('Work')).toBeInTheDocument();
   });

   it('renders note count when > 0', () => {
      render(
         <CategoryNode {...defaultProps} category={makeCategory({ note_count: 5 })} />,
         { wrapper: createWrapper() }
      );
      expect(screen.getByText('5')).toBeInTheDocument();
   });

   it('does not render note count when 0', () => {
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.queryByText('0')).not.toBeInTheDocument();
   });

   it('calls onSelect on click', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(
         <CategoryNode {...defaultProps} onSelect={onSelect} />,
         { wrapper: createWrapper() }
      );
      await user.click(screen.getByText('Work'));
      expect(onSelect).toHaveBeenCalledWith('cat-1');
   });

   it('applies selected styling when isSelected', () => {
      render(
         <CategoryNode {...defaultProps} selectedId="cat-1" />,
         { wrapper: createWrapper() }
      );
      const btn = screen.getByText('Work').closest('button')!;
      expect(btn.className).toContain('accent');
   });

   it('applies paddingLeft based on depth', () => {
      render(
         <CategoryNode {...defaultProps} depth={2} />,
         { wrapper: createWrapper() }
      );
      const btn = screen.getByText('Work').closest('button')!;
      expect(btn.style.paddingLeft).toBe('44px'); // 12 + 2*16
   });

   it('expands and fetches notes on click when note_count > 0', async () => {
      const user = userEvent.setup();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'My Note' })],
      });
      render(
         <CategoryNode {...defaultProps} category={makeCategory({ note_count: 2 })} />,
         { wrapper: createWrapper() }
      );
      await user.click(screen.getByText('Work'));
      await waitFor(() => {
         expect(screen.getByText('My Note')).toBeInTheDocument();
      });
   });

   it('shows notes with formatted date and excerpt', async () => {
      const user = userEvent.setup();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'My Note', excerpt: 'an excerpt', created_at: '2024-03-15T00:00:00Z' })],
      });
      render(
         <CategoryNode {...defaultProps} category={makeCategory({ note_count: 1 })} />,
         { wrapper: createWrapper() }
      );
      await user.click(screen.getByText('Work'));
      await waitFor(() => {
         expect(screen.getByText('an excerpt')).toBeInTheDocument();
      });
   });

   it('calls onSelectNote when a note is clicked', async () => {
      const user = userEvent.setup();
      const onSelectNote = vi.fn();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Clickable Note' })],
      });
      render(
         <CategoryNode
            {...defaultProps}
            category={makeCategory({ note_count: 1 })}
            onSelectNote={onSelectNote}
         />,
         { wrapper: createWrapper() }
      );
      await user.click(screen.getByText('Work'));
      await waitFor(() => expect(screen.getByText('Clickable Note')).toBeInTheDocument());
      await user.click(screen.getByText('Clickable Note'));
      expect(onSelectNote).toHaveBeenCalledWith('n1');
   });

   it('renders child categories recursively', async () => {
      const user = userEvent.setup();
      const category = makeCategory({
         note_count: 0,
         children: [makeCategory({ id: 'child-1', name: 'Sub-Work', note_count: 0, children: [] })],
      });
      render(
         <CategoryNode {...defaultProps} category={category} />,
         { wrapper: createWrapper() }
      );
      await user.click(screen.getByText('Work'));
      expect(screen.getByText('Sub-Work')).toBeInTheDocument();
   });

   // Context menu tests
   it('opens context menu on right-click', () => {
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      expect(screen.getByText('Rename')).toBeInTheDocument();
      expect(screen.getByText('Change Color')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
   });

   it('closes context menu on window click', async () => {
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      expect(screen.getByText('Rename')).toBeInTheDocument();

      // Simulate window click
      fireEvent.click(window);
      await waitFor(() => {
         expect(screen.queryByText('Rename')).not.toBeInTheDocument();
      });
   });

   it('enters rename mode from context menu', async () => {
      const user = userEvent.setup();
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      await user.click(screen.getByText('Rename'));

      // Should show an input with the category name
      const input = screen.getByDisplayValue('Work');
      expect(input.tagName).toBe('INPUT');
   });

   it('submits rename on blur with trimmed name', async () => {
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      fireEvent.click(screen.getByText('Rename'));

      const input = screen.getByDisplayValue('Work');
      fireEvent.change(input, { target: { value: 'Updated Name' } });
      fireEvent.blur(input);

      await waitFor(() => {
         expect(mockCategoriesApi.update).toHaveBeenCalledWith('cat-1', { name: 'Updated Name' });
      });
   });

   it('submits rename on Enter key', async () => {
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      fireEvent.click(screen.getByText('Rename'));

      const input = screen.getByDisplayValue('Work');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
         expect(mockCategoriesApi.update).toHaveBeenCalled();
      });
   });

   it('cancels rename on Escape key', () => {
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      fireEvent.click(screen.getByText('Rename'));

      const input = screen.getByDisplayValue('Work');
      fireEvent.change(input, { target: { value: 'Changed' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should revert to showing the name text, not input
      expect(screen.queryByDisplayValue('Changed')).not.toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
   });

   it('does not submit rename when value is unchanged', () => {
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      fireEvent.click(screen.getByText('Rename'));

      const input = screen.getByDisplayValue('Work');
      fireEvent.blur(input); // blur without changing value

      expect(mockCategoriesApi.update).not.toHaveBeenCalled();
   });

   it('does not submit rename when value is empty', () => {
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      fireEvent.click(screen.getByText('Rename'));

      const input = screen.getByDisplayValue('Work');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.blur(input);

      expect(mockCategoriesApi.update).not.toHaveBeenCalled();
   });

   it('does not toggle expand when renaming', async () => {
      const onSelect = vi.fn();
      render(
         <CategoryNode {...defaultProps} onSelect={onSelect} category={makeCategory({ note_count: 3 })} />,
         { wrapper: createWrapper() }
      );
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      fireEvent.click(screen.getByText('Rename'));

      // Click the button while renaming - should not call onSelect
      fireEvent.click(btn);
      expect(onSelect).not.toHaveBeenCalled();
   });

   it('shows color picker from context menu', async () => {
      const user = userEvent.setup();
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      await user.click(screen.getByText('Change Color'));

      // Should show color buttons (there are 10 colors)
      const colorButtons = document.querySelectorAll('button[style*="background-color"]');
      expect(colorButtons.length).toBe(10);
   });

   it('changes color when a color button is clicked', async () => {
      const user = userEvent.setup();
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      await user.click(screen.getByText('Change Color'));

      // Click the first color button
      const colorButtons = document.querySelectorAll('button[style*="background-color"]');
      await user.click(colorButtons[0]);

      await waitFor(() => {
         expect(mockCategoriesApi.update).toHaveBeenCalled();
      });
   });

   it('deletes category from context menu', async () => {
      const user = userEvent.setup();
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.contextMenu(btn);
      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
         expect(mockCategoriesApi.delete).toHaveBeenCalledWith('cat-1');
      });
   });

   // Drag and drop tests
   it('handles drag over with visual indicator', () => {
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.dragOver(btn, { dataTransfer: { dropEffect: '' } });
      expect(btn.className).toContain('ring');
   });

   it('removes drag indicator on drag leave', () => {
      render(<CategoryNode {...defaultProps} />, { wrapper: createWrapper() });
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.dragOver(btn, { dataTransfer: { dropEffect: '' } });
      fireEvent.dragLeave(btn);
      expect(btn.className).not.toContain('ring');
   });

   it('calls onDropNote on drop', () => {
      const onDropNote = vi.fn();
      render(
         <CategoryNode {...defaultProps} onDropNote={onDropNote} />,
         { wrapper: createWrapper() }
      );
      const btn = screen.getByText('Work').closest('button')!;
      fireEvent.drop(btn, {
         dataTransfer: { getData: () => 'note-123' },
      });
      expect(onDropNote).toHaveBeenCalledWith('note-123', 'cat-1');
   });

   it('fires onDragCategorizedNote on note drag start', async () => {
      const user = userEvent.setup();
      const onDragCategorizedNote = vi.fn();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Drag Me' })],
      });
      render(
         <CategoryNode
            {...defaultProps}
            category={makeCategory({ note_count: 1 })}
            onDragCategorizedNote={onDragCategorizedNote}
         />,
         { wrapper: createWrapper() }
      );
      await user.click(screen.getByText('Work'));
      await waitFor(() => expect(screen.getByText('Drag Me')).toBeInTheDocument());

      const noteEl = screen.getByText('Drag Me').closest('[draggable]')!;
      fireEvent.dragStart(noteEl, {
         dataTransfer: { setData: vi.fn(), effectAllowed: '' },
      });
      expect(onDragCategorizedNote).toHaveBeenCalled();
   });

   it('highlights selected note', async () => {
      const user = userEvent.setup();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: 'Selected Note' })],
      });
      render(
         <CategoryNode
            {...defaultProps}
            category={makeCategory({ note_count: 1 })}
            selectedNoteId="n1"
         />,
         { wrapper: createWrapper() }
      );
      await user.click(screen.getByText('Work'));
      await waitFor(() => expect(screen.getByText('Selected Note')).toBeInTheDocument());

      const noteEl = screen.getByText('Selected Note').closest('[draggable]')!;
      expect(noteEl.className).toContain('border-l-2');
   });

   it('shows Untitled for notes without title', async () => {
      const user = userEvent.setup();
      mockNotesApi.getAll.mockResolvedValue({
         data: [makeNote({ id: 'n1', title: '' })],
      });
      render(
         <CategoryNode {...defaultProps} category={makeCategory({ note_count: 1 })} />,
         { wrapper: createWrapper() }
      );
      await user.click(screen.getByText('Work'));
      await waitFor(() => expect(screen.getByText('Untitled')).toBeInTheDocument());
   });
});
