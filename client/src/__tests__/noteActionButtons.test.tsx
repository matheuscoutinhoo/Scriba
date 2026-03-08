import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteActionButtons } from '@/components/sidebar/NoteActionButtons';
import type { Note } from '@/lib/types';

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

describe('NoteActionButtons', () => {
   it('renders nothing when no action handlers provided', () => {
      const { container } = render(<NoteActionButtons note={makeNote()} />);
      expect(container.firstChild).toBeNull();
   });

   it('renders pin button when onTogglePin provided', () => {
      render(<NoteActionButtons note={makeNote()} onTogglePin={vi.fn()} />);
      expect(screen.getByTitle('Pin')).toBeInTheDocument();
   });

   it('renders Unpin title when note is pinned', () => {
      render(<NoteActionButtons note={makeNote({ is_pinned: 1 })} onTogglePin={vi.fn()} />);
      expect(screen.getByTitle('Unpin')).toBeInTheDocument();
   });

   it('renders archive button when onToggleArchive provided', () => {
      render(<NoteActionButtons note={makeNote()} onToggleArchive={vi.fn()} />);
      expect(screen.getByTitle('Archive')).toBeInTheDocument();
   });

   it('renders delete button when onDeleteNote provided', () => {
      render(<NoteActionButtons note={makeNote()} onDeleteNote={vi.fn()} />);
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
   });

   it('calls onTogglePin with note on click', async () => {
      const user = userEvent.setup();
      const onTogglePin = vi.fn();
      const note = makeNote();
      render(<NoteActionButtons note={note} onTogglePin={onTogglePin} />);
      await user.click(screen.getByTitle('Pin'));
      expect(onTogglePin).toHaveBeenCalledWith(note);
   });

   it('calls onToggleArchive with note on click', async () => {
      const user = userEvent.setup();
      const onToggleArchive = vi.fn();
      const note = makeNote();
      render(<NoteActionButtons note={note} onToggleArchive={onToggleArchive} />);
      await user.click(screen.getByTitle('Archive'));
      expect(onToggleArchive).toHaveBeenCalledWith(note);
   });

   it('calls onDeleteNote with note id on click', async () => {
      const user = userEvent.setup();
      const onDeleteNote = vi.fn();
      render(<NoteActionButtons note={makeNote({ id: 'n99' })} onDeleteNote={onDeleteNote} />);
      await user.click(screen.getByTitle('Delete'));
      expect(onDeleteNote).toHaveBeenCalledWith('n99');
   });
});
