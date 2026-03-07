import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/components/layout/Sidebar';
import type { Note } from '@/lib/types';

// Mock CategoryTree since it uses hooks (useCategories)
vi.mock('@/components/sidebar/CategoryTree', () => ({
   CategoryTree: ({ onDropNote }: { onDropNote: (noteId: string, categoryId: string) => void }) => (
      <div
         data-testid="category-tree"
         onDrop={() => onDropNote('note-1', 'cat-1')}
      />
   ),
}));

function makeNote(overrides: Partial<Note> = {}): Note {
   return {
      id: '1',
      title: 'Test Note',
      content: '# Hello',
      excerpt: 'Hello world excerpt',
      is_pinned: 0,
      is_archived: 0,
      user_id: 'user-1',
      category_id: null,
      position: 0,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      tags: [],
      ...overrides,
   };
}

describe('Sidebar', () => {
   const defaultProps = {
      selectedCategoryId: null as string | null,
      searchQuery: '',
      notes: [] as Note[],
      selectedNoteId: null as string | null,
      onSelectCategory: vi.fn(),
      onSearch: vi.fn(),
      onNewNote: vi.fn(),
      onNewCategory: vi.fn(),
      onSelectNote: vi.fn(),
      onMoveNoteToCategory: vi.fn(),
   };

   it('renders logo and tagline', () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getByText('criba')).toBeInTheDocument();
      expect(screen.getByText('Smart Notes')).toBeInTheDocument();
   });

   it('renders search input with provided value', () => {
      render(<Sidebar {...defaultProps} searchQuery="hello" />);
      expect(screen.getByPlaceholderText('Search notes...')).toHaveValue('hello');
   });

   it('calls onSearch when typing in search', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} onSearch={onSearch} />);

      await user.type(screen.getByPlaceholderText('Search notes...'), 'test');
      expect(onSearch).toHaveBeenCalled();
   });

   it('calls onNewNote when New Note button is clicked', async () => {
      const onNewNote = vi.fn();
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} onNewNote={onNewNote} />);

      await user.click(screen.getByText('New Note'));
      expect(onNewNote).toHaveBeenCalledTimes(1);
   });

   it('calls onSelectCategory with null for All Notes', async () => {
      const onSelectCategory = vi.fn();
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} onSelectCategory={onSelectCategory} />);

      await user.click(screen.getByText('All Notes'));
      expect(onSelectCategory).toHaveBeenCalledWith(null);
   });

   it('highlights All Notes when no category selected', () => {
      render(<Sidebar {...defaultProps} selectedCategoryId={null} />);
      const allNotes = screen.getByText('All Notes');
      expect(allNotes.className).toContain('text-[var(--color-accent)]');
   });

   it('renders CategoryTree', () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getByTestId('category-tree')).toBeInTheDocument();
   });

   it('renders notes in the sidebar', () => {
      const notes = [
         makeNote({ id: '1', title: 'First Note' }),
         makeNote({ id: '2', title: 'Second Note' }),
      ];
      render(<Sidebar {...defaultProps} notes={notes} />);
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
   });

   it('shows empty state when no notes', () => {
      render(<Sidebar {...defaultProps} notes={[]} />);
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
   });

   it('calls onSelectNote when a note is clicked', async () => {
      const onSelectNote = vi.fn();
      const user = userEvent.setup();
      const notes = [makeNote({ id: 'note-1', title: 'Click Me' })];
      render(<Sidebar {...defaultProps} notes={notes} onSelectNote={onSelectNote} />);
      await user.click(screen.getByText('Click Me'));
      expect(onSelectNote).toHaveBeenCalledWith('note-1');
   });

   it('note cards are draggable', () => {
      const notes = [makeNote({ id: 'note-1', title: 'Draggable' })];
      render(<Sidebar {...defaultProps} notes={notes} />);
      const noteCard = screen.getByText('Draggable').closest('button');
      expect(noteCard).toHaveAttribute('draggable', 'true');
   });

   it('calls onMoveNoteToCategory when note is dropped on All Notes', () => {
      const onMoveNoteToCategory = vi.fn();
      const notes = [makeNote({ id: 'note-1', title: 'Drag Me' })];
      render(<Sidebar {...defaultProps} notes={notes} onMoveNoteToCategory={onMoveNoteToCategory} />);

      const allNotesBtn = screen.getByText('All Notes');
      fireEvent.drop(allNotesBtn, {
         dataTransfer: {
            getData: (type: string) => type === 'text/x-note-id' ? 'note-1' : '',
         },
      });
      expect(onMoveNoteToCategory).toHaveBeenCalledWith('note-1', null);
   });

   it('shows note count', () => {
      const notes = [makeNote(), makeNote({ id: '2' })];
      render(<Sidebar {...defaultProps} notes={notes} />);
      expect(screen.getByText('2')).toBeInTheDocument();
   });
});
