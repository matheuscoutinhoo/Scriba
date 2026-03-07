import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteList } from '@/components/notes/NoteList';
import type { Note } from '@/lib/types';

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

describe('NoteList', () => {
  it('shows empty state when no notes', () => {
    render(<NoteList notes={[]} selectedNoteId={null} onSelectNote={() => {}} />);
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
  });

  it('renders note titles', () => {
    const notes = [makeNote({ id: '1', title: 'First' }), makeNote({ id: '2', title: 'Second' })];
    render(<NoteList notes={notes} selectedNoteId={null} onSelectNote={() => {}} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('shows excerpt when available', () => {
    const notes = [makeNote({ excerpt: 'Short preview text' })];
    render(<NoteList notes={notes} selectedNoteId={null} onSelectNote={() => {}} />);
    expect(screen.getByText('Short preview text')).toBeInTheDocument();
  });

  it('calls onSelectNote when a note is clicked', async () => {
    const user = userEvent.setup();
    let selectedId = '';
    const notes = [makeNote({ id: 'note-1', title: 'Click Me' })];
    render(<NoteList notes={notes} selectedNoteId={null} onSelectNote={(id) => { selectedId = id; }} />);
    await user.click(screen.getByText('Click Me'));
    expect(selectedId).toBe('note-1');
  });

  it('shows pin icon for pinned notes', () => {
    const notes = [makeNote({ is_pinned: 1 })];
    const { container } = render(<NoteList notes={notes} selectedNoteId={null} onSelectNote={() => {}} />);
    // Lucide Pin renders an SVG
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('shows tags as badges', () => {
    const notes = [makeNote({ tags: [{ id: 't1', name: 'react', slug: 'react', user_id: 'u1', created_at: '' }] })];
    render(<NoteList notes={notes} selectedNoteId={null} onSelectNote={() => {}} />);
    expect(screen.getByText('react')).toBeInTheDocument();
  });
});
