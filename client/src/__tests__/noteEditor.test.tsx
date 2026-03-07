import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from '@/components/editor/NoteEditor';
import type { Note } from '@/lib/types';

// Mock react-markdown to avoid heavy async rendering in jsdom
vi.mock('react-markdown', () => ({
   default: ({ children }: { children: string }) => <div data-testid="markdown-preview">{children}</div>,
}));
vi.mock('remark-gfm', () => ({ default: () => { } }));
vi.mock('rehype-sanitize', () => ({ default: () => { } }));

function makeNote(overrides: Partial<Note> = {}): Note {
   return {
      id: 'note-1',
      title: 'Test Note',
      content: '# Hello World',
      excerpt: 'Hello World',
      is_pinned: 0,
      is_archived: 0,
      user_id: 'user-1',
      category_id: null,
      position: 0,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      tags: [{ id: 't1', name: 'react', slug: 'react', user_id: 'user-1', created_at: '' }],
      ...overrides,
   };
}

describe('NoteEditor', () => {
   let onSave: ReturnType<typeof vi.fn>;
   let onDelete: ReturnType<typeof vi.fn>;

   beforeEach(() => {
      onSave = vi.fn();
      onDelete = vi.fn();
   });

   afterEach(() => {
      vi.useRealTimers();
   });

   it('renders title and content as rendered markdown lines', () => {
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);
      expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument();
      // Content renders as markdown preview (no input visible initially)
      expect(screen.getByText('# Hello World')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('# Hello World')).not.toBeInTheDocument();
   });

   it('renders tags', () => {
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);
      expect(screen.getByText('react ×')).toBeInTheDocument();
   });

   it('calls onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);

      await user.click(screen.getByTitle('Save (Ctrl+S)'));
      expect(onSave).toHaveBeenCalledWith('note-1', {
         title: 'Test Note',
         content: '# Hello World',
         tags: ['react'],
      });
   });

   it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);

      await user.click(screen.getByTitle('Delete'));
      expect(onDelete).toHaveBeenCalledWith('note-1');
   });

   it('calls onSave with is_pinned toggled when pin is clicked', async () => {
      const user = userEvent.setup();
      render(<NoteEditor note={makeNote({ is_pinned: 0 })} onSave={onSave} onDelete={onDelete} />);

      await user.click(screen.getByTitle('Pin'));
      expect(onSave).toHaveBeenCalledWith('note-1', { is_pinned: true });
   });

   it('calls onSave with is_pinned false when unpinning', async () => {
      const user = userEvent.setup();
      render(<NoteEditor note={makeNote({ is_pinned: 1 })} onSave={onSave} onDelete={onDelete} />);

      await user.click(screen.getByTitle('Unpin'));
      expect(onSave).toHaveBeenCalledWith('note-1', { is_pinned: false });
   });

   it('calls onSave with is_archived toggled', async () => {
      const user = userEvent.setup();
      render(<NoteEditor note={makeNote({ is_archived: 0 })} onSave={onSave} onDelete={onDelete} />);

      await user.click(screen.getByTitle('Archive'));
      expect(onSave).toHaveBeenCalledWith('note-1', { is_archived: true });
   });

   it('shows Unsaved indicator after editing', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);

      const titleInput = screen.getByDisplayValue('Test Note');
      fireEvent.change(titleInput, { target: { value: 'Changed' } });

      expect(screen.getByText('Unsaved')).toBeInTheDocument();
   });

   it('triggers auto-save after delay', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);

      const titleInput = screen.getByDisplayValue('Test Note');
      fireEvent.change(titleInput, { target: { value: 'New Title' } });

      expect(onSave).not.toHaveBeenCalled();

      act(() => {
         vi.advanceTimersByTime(1600);
      });

      expect(onSave).toHaveBeenCalledWith('note-1', {
         title: 'New Title',
         content: '# Hello World',
         tags: ['react'],
      });
   });

   it('removes a tag when clicked', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);

      fireEvent.click(screen.getByText('react ×'));

      act(() => {
         vi.advanceTimersByTime(1600);
      });

      const lastCall = onSave.mock.calls[onSave.mock.calls.length - 1];
      expect(lastCall[1].tags).toEqual([]);
   });

   it('activates line editing on click and shows input', () => {
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);

      // Line is rendered as markdown preview
      const renderedLine = screen.getByText('# Hello World');
      expect(renderedLine).toBeInTheDocument();

      // Click on the line to activate editing (uses mouseDown)
      fireEvent.mouseDown(renderedLine);

      // Now an input should be visible with the raw markdown
      const lineInput = screen.getByDisplayValue('# Hello World');
      expect(lineInput).toBeInTheDocument();
      expect(lineInput.tagName).toBe('INPUT');

      // Blur to deactivate editing
      fireEvent.blur(lineInput);
      expect(screen.queryByDisplayValue('# Hello World')).not.toBeInTheDocument();
      expect(screen.getByText('# Hello World')).toBeInTheDocument();
   });

   it('allows editing a line and triggers auto-save', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);

      // Click line to start editing
      fireEvent.mouseDown(screen.getByText('# Hello World'));

      // Change the line content
      const lineInput = screen.getByDisplayValue('# Hello World');
      fireEvent.change(lineInput, { target: { value: '## Updated Line' } });

      act(() => {
         vi.advanceTimersByTime(1600);
      });

      expect(onSave).toHaveBeenCalledWith('note-1', {
         title: 'Test Note',
         content: '## Updated Line',
         tags: ['react'],
      });
   });

   it('handles Enter key to split line', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote({ content: 'first line' })} onSave={onSave} onDelete={onDelete} />);

      // Click to edit the line
      fireEvent.mouseDown(screen.getByText('first line'));
      const lineInput = screen.getByDisplayValue('first line');

      // Simulate Enter key press (cursor at position 5)
      Object.defineProperty(lineInput, 'selectionStart', { value: 5, writable: true });
      Object.defineProperty(lineInput, 'selectionEnd', { value: 5, writable: true });
      fireEvent.keyDown(lineInput, { key: 'Enter' });

      act(() => {
         vi.advanceTimersByTime(1600);
      });

      // Content should be split into two lines
      expect(onSave).toHaveBeenCalledWith('note-1', {
         title: 'Test Note',
         content: 'first\n line',
         tags: ['react'],
      });
   });

   it('handles multi-line content with per-line rendering', () => {
      render(<NoteEditor note={makeNote({ content: '# Title\nSome text\n**bold**' })} onSave={onSave} onDelete={onDelete} />);

      // All three lines should be rendered
      expect(screen.getByText('# Title')).toBeInTheDocument();
      expect(screen.getByText('Some text')).toBeInTheDocument();
      expect(screen.getByText('**bold**')).toBeInTheDocument();
   });

   it('resets state when note changes', () => {
      const note1 = makeNote({ id: 'n1', title: 'First' });
      const note2 = makeNote({ id: 'n2', title: 'Second', content: '## Different', tags: [] });

      const { rerender } = render(<NoteEditor note={note1} onSave={onSave} onDelete={onDelete} />);
      expect(screen.getByDisplayValue('First')).toBeInTheDocument();

      rerender(<NoteEditor note={note2} onSave={onSave} onDelete={onDelete} />);
      expect(screen.getByDisplayValue('Second')).toBeInTheDocument();
      expect(screen.getByText('## Different')).toBeInTheDocument();
   });
});
