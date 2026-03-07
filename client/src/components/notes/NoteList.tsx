import { Pin, Archive, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Note } from '@/lib/types';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
}

export function NoteList({ notes, selectedNoteId, onSelectNote }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <p className="text-[var(--color-text-muted)] text-sm">No notes yet</p>
        <p className="text-[var(--color-text-muted)] text-xs mt-1">
          Create your first note to get started
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isSelected={selectedNoteId === note.id}
          onClick={() => onSelectNote(note.id)}
        />
      ))}
    </div>
  );
}

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
}

function NoteCard({ note, isSelected, onClick }: NoteCardProps) {
  const formattedDate = new Date(note.updated_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 border-b border-[var(--color-border)] transition-colors cursor-pointer',
        isSelected
          ? 'bg-[var(--color-accent-soft)] border-l-2 border-l-[var(--color-accent)]'
          : 'hover:bg-[var(--color-bg-hover)]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium truncate flex-1">
          {note.title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          {note.is_pinned === 1 && (
            <Pin className="h-3 w-3 text-[var(--color-accent)]" />
          )}
          {note.is_archived === 1 && (
            <Archive className="h-3 w-3 text-[var(--color-text-muted)]" />
          )}
        </div>
      </div>

      {note.excerpt && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
          {note.excerpt}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1 flex-wrap">
          {note.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} className="text-[10px] py-0 px-1.5">
              {tag.name}
            </Badge>
          ))}
          {note.tags.length > 3 && (
            <span className="text-[10px] text-[var(--color-text-muted)]">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formattedDate}
        </span>
      </div>
    </button>
  );
}
