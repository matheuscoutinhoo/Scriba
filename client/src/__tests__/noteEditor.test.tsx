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

   it('handles Backspace to merge lines', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote({ content: 'line1\nline2' })} onSave={onSave} onDelete={onDelete} />);

      // Click the second line to edit it
      fireEvent.mouseDown(screen.getByText('line2'));
      const lineInput = screen.getByDisplayValue('line2');

      // Set cursor at beginning of line
      Object.defineProperty(lineInput, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(lineInput, 'selectionEnd', { value: 0, writable: true });
      fireEvent.keyDown(lineInput, { key: 'Backspace' });

      act(() => { vi.advanceTimersByTime(1600); });

      expect(onSave).toHaveBeenCalledWith('note-1', {
         title: 'Test Note',
         content: 'line1line2',
         tags: ['react'],
      });
   });

   it('handles ArrowUp to navigate to previous line', () => {
      render(<NoteEditor note={makeNote({ content: 'line1\nline2' })} onSave={onSave} onDelete={onDelete} />);

      // Click the second line
      fireEvent.mouseDown(screen.getByText('line2'));
      const lineInput = screen.getByDisplayValue('line2');

      Object.defineProperty(lineInput, 'selectionStart', { value: 0, writable: true });
      fireEvent.keyDown(lineInput, { key: 'ArrowUp' });

      // Now editing line1
      expect(screen.getByDisplayValue('line1')).toBeInTheDocument();
   });

   it('handles ArrowDown to navigate to next line', () => {
      render(<NoteEditor note={makeNote({ content: 'line1\nline2' })} onSave={onSave} onDelete={onDelete} />);

      // Click the first line
      fireEvent.mouseDown(screen.getByText('line1'));
      const lineInput = screen.getByDisplayValue('line1');

      Object.defineProperty(lineInput, 'selectionStart', { value: 0, writable: true });
      fireEvent.keyDown(lineInput, { key: 'ArrowDown' });

      // Now editing line2
      expect(screen.getByDisplayValue('line2')).toBeInTheDocument();
   });

   it('handles Tab to insert spaces', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote({ content: 'hello' })} onSave={onSave} onDelete={onDelete} />);

      fireEvent.mouseDown(screen.getByText('hello'));
      const lineInput = screen.getByDisplayValue('hello');

      Object.defineProperty(lineInput, 'selectionStart', { value: 0, writable: true });
      fireEvent.keyDown(lineInput, { key: 'Tab' });

      act(() => { vi.advanceTimersByTime(1600); });

      expect(onSave).toHaveBeenCalledWith('note-1', {
         title: 'Test Note',
         content: '  hello',
         tags: ['react'],
      });
   });

   it('handles Ctrl+A to enter selectAll mode', () => {
      render(<NoteEditor note={makeNote({ content: 'line1\nline2' })} onSave={onSave} onDelete={onDelete} />);

      // Click a line to edit
      fireEvent.mouseDown(screen.getByText('line1'));
      const lineInput = screen.getByDisplayValue('line1');

      fireEvent.keyDown(lineInput, { key: 'a', ctrlKey: true });

      // Should now show a textarea (select-all mode)
      const textareas = document.querySelectorAll('textarea');
      expect(textareas.length).toBe(1);
      expect(textareas[0].value).toBe('line1\nline2');
   });

   it('shows placeholder when content is empty', () => {
      render(<NoteEditor note={makeNote({ content: '' })} onSave={onSave} onDelete={onDelete} />);
      expect(screen.getByText('Click to start writing...')).toBeInTheDocument();
   });

   it('activates editing when clicking empty content placeholder', () => {
      render(<NoteEditor note={makeNote({ content: '' })} onSave={onSave} onDelete={onDelete} />);
      fireEvent.mouseDown(screen.getByText('Click to start writing...'));

      // Should now have an editing input visible (in addition to title and tag inputs)
      const inputs = screen.getAllByRole('textbox');
      // Title input + tag input + line editing input = 3
      expect(inputs.length).toBeGreaterThanOrEqual(3);
   });

   it('renders zoom controls', () => {
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByTitle('Decrease font size')).toBeInTheDocument();
      expect(screen.getByTitle('Increase font size')).toBeInTheDocument();
   });

   it('increases zoom when + button clicked', async () => {
      const user = userEvent.setup();
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);
      await user.click(screen.getByTitle('Increase font size'));
      expect(screen.getByText('110%')).toBeInTheDocument();
   });

   it('decreases zoom when - button clicked', async () => {
      const user = userEvent.setup();
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);
      await user.click(screen.getByTitle('Decrease font size'));
      expect(screen.getByText('90%')).toBeInTheDocument();
   });

   it('saves on Ctrl+S keyboard shortcut', () => {
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);
      const editor = screen.getByDisplayValue('Test Note').closest('.group\\/editor')!;
      fireEvent.keyDown(editor, { key: 's', ctrlKey: true });
      expect(onSave).toHaveBeenCalledWith('note-1', {
         title: 'Test Note',
         content: '# Hello World',
         tags: ['react'],
      });
   });

   it('adds a tag on Enter', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);
      const tagInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.change(tagInput, { target: { value: 'newtag' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      act(() => { vi.advanceTimersByTime(1600); });

      const lastCall = onSave.mock.calls[onSave.mock.calls.length - 1];
      expect(lastCall[1].tags).toContain('newtag');
   });

   it('does not add duplicate tag', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote()} onSave={onSave} onDelete={onDelete} />);
      const tagInput = screen.getByPlaceholderText('Add tag...');
      fireEvent.change(tagInput, { target: { value: 'react' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      act(() => { vi.advanceTimersByTime(1600); });

      // Should not have triggered auto-save for duplicate tag
      expect(onSave).not.toHaveBeenCalled();
   });

   it('renders table of contents for headings', () => {
      render(<NoteEditor note={makeNote({ content: '# Title\n## Subtitle' })} onSave={onSave} onDelete={onDelete} />);
      expect(screen.getByText('On this page')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Subtitle')).toBeInTheDocument();
   });

   it('handles multi-line paste', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote({ content: 'hello' })} onSave={onSave} onDelete={onDelete} />);

      // Click line to edit
      fireEvent.mouseDown(screen.getByText('hello'));
      const lineInput = screen.getByDisplayValue('hello');

      // Set selection start/end
      Object.defineProperty(lineInput, 'selectionStart', { value: 5, writable: true });
      Object.defineProperty(lineInput, 'selectionEnd', { value: 5, writable: true });

      fireEvent.paste(lineInput, {
         clipboardData: { getData: () => 'line1\nline2\nline3' },
      });

      act(() => { vi.advanceTimersByTime(1600); });

      expect(onSave).toHaveBeenCalledWith('note-1', {
         title: 'Test Note',
         content: 'helloline1\nline2\nline3',
         tags: ['react'],
      });
   });

   it('opens context menu on right-click with selection', () => {
      render(<NoteEditor note={makeNote({ content: 'some text here' })} onSave={onSave} onDelete={onDelete} />);
      fireEvent.mouseDown(screen.getByText('some text here'));
      const lineInput = screen.getByDisplayValue('some text here');

      // Set selection to simulate text selection
      Object.defineProperty(lineInput, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(lineInput, 'selectionEnd', { value: 4, writable: true });

      fireEvent.contextMenu(lineInput, { clientX: 100, clientY: 200 });

      // Context menu should appear with formatting options
      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('Italic')).toBeInTheDocument();
   });

   it('does not open context menu when no selection', () => {
      render(<NoteEditor note={makeNote({ content: 'some text' })} onSave={onSave} onDelete={onDelete} />);
      fireEvent.mouseDown(screen.getByText('some text'));
      const lineInput = screen.getByDisplayValue('some text');

      // No selection (start === end)
      Object.defineProperty(lineInput, 'selectionStart', { value: 3, writable: true });
      Object.defineProperty(lineInput, 'selectionEnd', { value: 3, writable: true });

      fireEvent.contextMenu(lineInput, { clientX: 100, clientY: 200 });

      expect(screen.queryByText('Bold')).not.toBeInTheDocument();
   });

   it('applies inline format (bold) from context menu', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote({ content: 'hello world' })} onSave={onSave} onDelete={onDelete} />);
      fireEvent.mouseDown(screen.getByText('hello world'));
      const lineInput = screen.getByDisplayValue('hello world');

      Object.defineProperty(lineInput, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(lineInput, 'selectionEnd', { value: 5, writable: true });

      fireEvent.contextMenu(lineInput, { clientX: 100, clientY: 200 });
      fireEvent.click(screen.getByText('Bold'));

      act(() => { vi.advanceTimersByTime(1600); });

      expect(onSave).toHaveBeenCalledWith('note-1', {
         title: 'Test Note',
         content: '**hello** world',
         tags: ['react'],
      });
   });

   it('applies line prefix (heading) from context menu', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote({ content: 'some text' })} onSave={onSave} onDelete={onDelete} />);
      fireEvent.mouseDown(screen.getByText('some text'));
      const lineInput = screen.getByDisplayValue('some text');

      Object.defineProperty(lineInput, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(lineInput, 'selectionEnd', { value: 4, writable: true });

      fireEvent.contextMenu(lineInput, { clientX: 100, clientY: 200 });
      fireEvent.click(screen.getByText('Heading 1'));

      act(() => { vi.advanceTimersByTime(1600); });

      expect(onSave).toHaveBeenCalledWith('note-1', {
         title: 'Test Note',
         content: '# some text',
         tags: ['react'],
      });
   });

   it('closes context menu on window click', () => {
      render(<NoteEditor note={makeNote({ content: 'text' })} onSave={onSave} onDelete={onDelete} />);
      fireEvent.mouseDown(screen.getByText('text'));
      const lineInput = screen.getByDisplayValue('text');

      Object.defineProperty(lineInput, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(lineInput, 'selectionEnd', { value: 4, writable: true });

      fireEvent.contextMenu(lineInput, { clientX: 100, clientY: 200 });
      expect(screen.getByText('Bold')).toBeInTheDocument();

      fireEvent.click(window);
      expect(screen.queryByText('Bold')).not.toBeInTheDocument();
   });

   it('clicks on content area background to activate last line', () => {
      render(<NoteEditor note={makeNote({ content: 'line1\nline2' })} onSave={onSave} onDelete={onDelete} />);

      // Get the scrollable content area (the div with tabIndex=0)
      const contentArea = document.querySelector('[tabindex="0"]')!;

      // MouseDown on the container itself (not a child)
      fireEvent.mouseDown(contentArea, { target: contentArea, currentTarget: contentArea });

      // Should activate line editing for last line
      expect(screen.getByDisplayValue('line2')).toBeInTheDocument();
   });

   it('navigates to first line with ArrowDown when no line is editing', () => {
      render(<NoteEditor note={makeNote({ content: 'line1\nline2' })} onSave={onSave} onDelete={onDelete} />);

      const contentArea = document.querySelector('[tabindex="0"]')!;
      fireEvent.keyDown(contentArea, { key: 'ArrowDown' });

      // Should activate first line
      expect(screen.getByDisplayValue('line1')).toBeInTheDocument();
   });

   it('navigates to last line with ArrowUp when no line is editing', () => {
      render(<NoteEditor note={makeNote({ content: 'line1\nline2' })} onSave={onSave} onDelete={onDelete} />);

      const contentArea = document.querySelector('[tabindex="0"]')!;
      fireEvent.keyDown(contentArea, { key: 'ArrowUp' });

      // Should activate last line
      expect(screen.getByDisplayValue('line2')).toBeInTheDocument();
   });

   it('editing selectAll textarea and pressing Escape exits select-all mode', () => {
      render(<NoteEditor note={makeNote({ content: 'line1\nline2' })} onSave={onSave} onDelete={onDelete} />);

      // Enter editing then ctrl+a
      fireEvent.mouseDown(screen.getByText('line1'));
      const lineInput = screen.getByDisplayValue('line1');
      fireEvent.keyDown(lineInput, { key: 'a', ctrlKey: true });

      // Should have textarea
      const textarea = document.querySelector('textarea')!;
      expect(textarea).toBeInTheDocument();

      // Press Escape to exit select-all mode
      fireEvent.keyDown(textarea, { key: 'Escape' });

      // Should no longer have textarea
      expect(document.querySelector('textarea')).not.toBeInTheDocument();
   });

   it('editing selectAll textarea and changing content triggers auto-save', () => {
      vi.useFakeTimers();
      render(<NoteEditor note={makeNote({ content: 'line1' })} onSave={onSave} onDelete={onDelete} />);

      // Enter editing then ctrl+a
      fireEvent.mouseDown(screen.getByText('line1'));
      const lineInput = screen.getByDisplayValue('line1');
      fireEvent.keyDown(lineInput, { key: 'a', ctrlKey: true });

      const textarea = document.querySelector('textarea')!;
      fireEvent.change(textarea, { target: { value: 'changed content' } });

      act(() => { vi.advanceTimersByTime(1600); });

      expect(onSave).toHaveBeenCalledWith('note-1', {
         title: 'Test Note',
         content: 'changed content',
         tags: ['react'],
      });
   });

   it('clicks canvas to dismiss select-all', () => {
      render(<NoteEditor note={makeNote({ content: 'line1' })} onSave={onSave} onDelete={onDelete} />);

      // Enter select-all mode
      fireEvent.mouseDown(screen.getByText('line1'));
      const lineInput = screen.getByDisplayValue('line1');
      fireEvent.keyDown(lineInput, { key: 'a', ctrlKey: true });

      expect(document.querySelector('textarea')).toBeInTheDocument();

      // Click on the content area background
      const contentArea = document.querySelector('[tabindex="0"]')!;
      fireEvent.mouseDown(contentArea, { target: contentArea, currentTarget: contentArea });

      // Should dismiss select-all
      expect(document.querySelector('textarea')).not.toBeInTheDocument();
   });

   it('clicks TOC heading to scroll and activate line', () => {
      // Mock scrollIntoView which is not available in jsdom
      Element.prototype.scrollIntoView = vi.fn();
      render(<NoteEditor note={makeNote({ content: '# Title\nSome text\n## Section' })} onSave={onSave} onDelete={onDelete} />);

      const tocEntry = screen.getByText('Section');
      fireEvent.click(tocEntry);

      // Should activate line editing for the heading line (index 2)
      expect(screen.getByDisplayValue('## Section')).toBeInTheDocument();
   });

   it('exits selectAll mode on textarea blur', () => {
      render(<NoteEditor note={makeNote({ content: 'line1' })} onSave={onSave} onDelete={onDelete} />);

      // Enter editing then ctrl+a
      fireEvent.mouseDown(screen.getByText('line1'));
      const lineInput = screen.getByDisplayValue('line1');
      fireEvent.keyDown(lineInput, { key: 'a', ctrlKey: true });

      const textarea = document.querySelector('textarea')!;
      expect(textarea).toBeInTheDocument();

      // Blur the textarea
      fireEvent.blur(textarea);

      // Should exit selectAll mode
      expect(document.querySelector('textarea')).not.toBeInTheDocument();
   });

   it('renders blank lines as empty divs', () => {
      const { container } = render(<NoteEditor note={makeNote({ content: 'line1\n\nline3' })} onSave={onSave} onDelete={onDelete} />);
      // The blank line should render as an empty div with specific height
      const emptyDivs = container.querySelectorAll('.h-\\[1\\.5em\\]');
      expect(emptyDivs.length).toBeGreaterThanOrEqual(1);
   });
});
