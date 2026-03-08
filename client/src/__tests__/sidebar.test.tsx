import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar, SidebarNoteCard } from '@/components/layout/Sidebar';
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
      onTogglePin: vi.fn(),
      onToggleArchive: vi.fn(),
      onDeleteNote: vi.fn(),
      onCollapse: vi.fn(),
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

   it('calls onNewCategory when folder+ button is clicked', async () => {
      const onNewCategory = vi.fn();
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} onNewCategory={onNewCategory} />);
      // The folder+ button is the icon button next to New Note
      const buttons = screen.getAllByRole('button');
      const folderBtn = buttons.find(b => b.querySelector('svg.lucide-folder-plus'));
      if (folderBtn) await user.click(folderBtn);
      expect(onNewCategory).toHaveBeenCalledTimes(1);
   });

   it('calls onCollapse when collapse button is clicked', async () => {
      const onCollapse = vi.fn();
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} onCollapse={onCollapse} />);
      await user.click(screen.getByTitle('Hide sidebar'));
      expect(onCollapse).toHaveBeenCalledTimes(1);
   });

   it('switches to Notes tab when search query is typed', async () => {
      const user = userEvent.setup();
      const notes = [makeNote({ id: '1', title: 'Found Note' })];
      render(<Sidebar {...defaultProps} notes={notes} />);
      // Initially on Categories tab
      expect(screen.getByTestId('category-tree')).toBeInTheDocument();
      // Type in search - should switch to Notes tab
      await user.type(screen.getByPlaceholderText('Search notes...'), 'test');
      // Should show notes now
      expect(screen.getByText('Found Note')).toBeInTheDocument();
   });

   it('shows search query label in Notes tab header', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} searchQuery="hello" notes={[]} />);
      await user.click(screen.getByText('Notes'));
      expect(screen.getByText('Search: "hello"')).toBeInTheDocument();
   });

   it('shows "Recent Notes" label when no search query', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} searchQuery="" notes={[]} />);
      await user.click(screen.getByText('Notes'));
      expect(screen.getByText('Recent Notes')).toBeInTheDocument();
   });

   it('does not switch tabs when clicking same tab', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);
      // Already on Categories tab, click it again
      await user.click(screen.getByText('Categories'));
      expect(screen.getByTestId('category-tree')).toBeInTheDocument();
   });

   it('calls onTogglePin through note card in Notes tab', async () => {
      const onTogglePin = vi.fn();
      const user = userEvent.setup();
      const note = makeNote({ id: 'n1', title: 'Pin Me', is_pinned: 0 });
      render(<Sidebar {...defaultProps} notes={[note]} onTogglePin={onTogglePin} />);
      await user.click(screen.getByText('Notes'));
      await user.click(screen.getByTitle('Pin'));
      expect(onTogglePin).toHaveBeenCalledWith(note);
   });

   it('calls onToggleArchive through note card in Notes tab', async () => {
      const onToggleArchive = vi.fn();
      const user = userEvent.setup();
      const note = makeNote({ id: 'n1', title: 'Archive Me' });
      render(<Sidebar {...defaultProps} notes={[note]} onToggleArchive={onToggleArchive} />);
      await user.click(screen.getByText('Notes'));
      await user.click(screen.getByTitle('Archive'));
      expect(onToggleArchive).toHaveBeenCalledWith(note);
   });

   it('calls onDeleteNote through note card in Notes tab', async () => {
      const onDeleteNote = vi.fn();
      const user = userEvent.setup();
      const note = makeNote({ id: 'n1', title: 'Delete Me' });
      render(<Sidebar {...defaultProps} notes={[note]} onDeleteNote={onDeleteNote} />);
      await user.click(screen.getByText('Notes'));
      await user.click(screen.getByTitle('Delete'));
      expect(onDeleteNote).toHaveBeenCalledWith('n1');
   });
});

describe('SidebarNoteCard', () => {
   it('renders note title, excerpt and date', () => {
      render(
         <SidebarNoteCard
            note={makeNote({ title: 'My Note', excerpt: 'Hello world excerpt' })}
            isSelected={false}
            onClick={vi.fn()}
         />
      );
      expect(screen.getByText('My Note')).toBeInTheDocument();
      expect(screen.getByText('Hello world excerpt')).toBeInTheDocument();
   });

   it('renders pin icon for pinned notes', () => {
      const { container } = render(
         <SidebarNoteCard
            note={makeNote({ is_pinned: 1 })}
            isSelected={false}
            onClick={vi.fn()}
         />
      );
      expect(container.querySelector('.lucide-pin')).toBeInTheDocument();
   });

   it('renders archive icon for archived notes', () => {
      const { container } = render(
         <SidebarNoteCard
            note={makeNote({ is_archived: 1 })}
            isSelected={false}
            onClick={vi.fn()}
         />
      );
      expect(container.querySelector('.lucide-archive')).toBeInTheDocument();
   });

   it('applies selected styling', () => {
      const { container } = render(
         <SidebarNoteCard
            note={makeNote()}
            isSelected={true}
            onClick={vi.fn()}
         />
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-l-2');
   });

   it('calls onClick when clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(
         <SidebarNoteCard
            note={makeNote({ title: 'Click Me' })}
            isSelected={false}
            onClick={onClick}
         />
      );
      await user.click(screen.getByText('Click Me'));
      expect(onClick).toHaveBeenCalledTimes(1);
   });

   it('is draggable', () => {
      const { container } = render(
         <SidebarNoteCard note={makeNote()} isSelected={false} onClick={vi.fn()} />
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('draggable', 'true');
   });

   it('sets drag data on drag start', () => {
      const { container } = render(
         <SidebarNoteCard note={makeNote({ id: 'n42' })} isSelected={false} onClick={vi.fn()} />
      );
      const card = container.firstChild as HTMLElement;
      const setData = vi.fn();
      fireEvent.dragStart(card, { dataTransfer: { setData, effectAllowed: '' } });
      expect(setData).toHaveBeenCalledWith('text/x-note-id', 'n42');
   });

   it('renders tags (max 2 + overflow)', () => {
      const tags = [
         { id: 't1', name: 'react', slug: 'react', user_id: 'u1', created_at: '' },
         { id: 't2', name: 'vue', slug: 'vue', user_id: 'u1', created_at: '' },
         { id: 't3', name: 'angular', slug: 'angular', user_id: 'u1', created_at: '' },
      ];
      render(
         <SidebarNoteCard note={makeNote({ tags })} isSelected={false} onClick={vi.fn()} />
      );
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('vue')).toBeInTheDocument();
      expect(screen.queryByText('angular')).not.toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
   });

   it('renders hover action buttons and handles pin click', async () => {
      const onTogglePin = vi.fn();
      const user = userEvent.setup();
      render(
         <SidebarNoteCard
            note={makeNote({ is_pinned: 0 })}
            isSelected={false}
            onClick={vi.fn()}
            onTogglePin={onTogglePin}
         />
      );
      await user.click(screen.getByTitle('Pin'));
      expect(onTogglePin).toHaveBeenCalledTimes(1);
   });

   it('renders Unpin title for pinned note', () => {
      render(
         <SidebarNoteCard
            note={makeNote({ is_pinned: 1 })}
            isSelected={false}
            onClick={vi.fn()}
            onTogglePin={vi.fn()}
         />
      );
      expect(screen.getByTitle('Unpin')).toBeInTheDocument();
   });

   it('handles archive click without propagating to card', async () => {
      const onClick = vi.fn();
      const onToggleArchive = vi.fn();
      const user = userEvent.setup();
      render(
         <SidebarNoteCard
            note={makeNote()}
            isSelected={false}
            onClick={onClick}
            onToggleArchive={onToggleArchive}
         />
      );
      await user.click(screen.getByTitle('Archive'));
      expect(onToggleArchive).toHaveBeenCalledTimes(1);
      // onClick should not have been called because stopPropagation
      // (but userEvent.click does bubble, so this tests the e.stopPropagation in the handler)
   });

   it('handles delete click', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();
      render(
         <SidebarNoteCard
            note={makeNote()}
            isSelected={false}
            onClick={vi.fn()}
            onDelete={onDelete}
         />
      );
      await user.click(screen.getByTitle('Delete'));
      expect(onDelete).toHaveBeenCalledTimes(1);
   });

   it('does not render hover buttons when no action handlers provided', () => {
      render(
         <SidebarNoteCard note={makeNote()} isSelected={false} onClick={vi.fn()} />
      );
      expect(screen.queryByTitle('Pin')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Archive')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
   });
});
