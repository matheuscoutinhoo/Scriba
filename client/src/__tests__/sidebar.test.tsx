import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/components/layout/Sidebar';
import type { Note } from '@/lib/types';

// Mock CategoryTree since it uses hooks (useCategories, useNotes)
vi.mock('@/components/sidebar/CategoryTree', () => ({
   CategoryTree: ({ onDropNote, selectedNoteId, onSelectNote }: {
      onDropNote: (noteId: string, categoryId: string) => void;
      selectedNoteId?: string | null;
      onSelectNote?: (id: string) => void;
   }) => (
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

   it('shows Categories and Notes tabs', () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
   });

   it('renders CategoryTree in Categories tab by default', () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getByTestId('category-tree')).toBeInTheDocument();
   });

   it('switches to Notes tab and shows notes', async () => {
      const user = userEvent.setup();
      const notes = [
         makeNote({ id: '1', title: 'First Note' }),
         makeNote({ id: '2', title: 'Second Note' }),
      ];
      render(<Sidebar {...defaultProps} notes={notes} />);

      await user.click(screen.getByText('Notes'));
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
   });

   it('shows empty state in Notes tab when no notes', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} notes={[]} />);
      await user.click(screen.getByText('Notes'));
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
   });

   it('calls onSelectNote when a note in Notes tab is clicked', async () => {
      const onSelectNote = vi.fn();
      const user = userEvent.setup();
      const notes = [makeNote({ id: 'note-1', title: 'Click Me' })];
      render(<Sidebar {...defaultProps} notes={notes} onSelectNote={onSelectNote} />);

      await user.click(screen.getByText('Notes'));
      await user.click(screen.getByText('Click Me'));
      expect(onSelectNote).toHaveBeenCalledWith('note-1');
   });

   it('note cards in Notes tab are draggable', async () => {
      const user = userEvent.setup();
      const notes = [makeNote({ id: 'note-1', title: 'Draggable' })];
      render(<Sidebar {...defaultProps} notes={notes} />);

      await user.click(screen.getByText('Notes'));
      const noteCard = screen.getByText('Draggable').closest('[draggable]');
      expect(noteCard).toHaveAttribute('draggable', 'true');
   });

   it('shows note count in Notes tab', async () => {
      const user = userEvent.setup();
      const notes = [makeNote(), makeNote({ id: '2' })];
      render(<Sidebar {...defaultProps} notes={notes} />);
      await user.click(screen.getByText('Notes'));
      expect(screen.getByText('2')).toBeInTheDocument();
   });

   it('does not show notes in Categories tab', () => {
      const notes = [makeNote({ id: '1', title: 'Hidden Note' })];
      render(<Sidebar {...defaultProps} notes={notes} />);
      // Categories tab is active by default, notes should not show here
      expect(screen.queryByText('Hidden Note')).not.toBeInTheDocument();
   });
});
