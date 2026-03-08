import { Pin, PinOff, Archive, Trash2 } from 'lucide-react';
import type { Note } from '@/lib/types';

interface NoteActionButtonsProps {
   note: Note;
   onTogglePin?: (note: Note) => void;
   onToggleArchive?: (note: Note) => void;
   onDeleteNote?: (id: string) => void;
   right?: string;
   top?: string;
}

export function NoteActionButtons({ note, onTogglePin, onToggleArchive, onDeleteNote, right, top }: NoteActionButtonsProps) {
   if (!onTogglePin && !onToggleArchive && !onDeleteNote) return null;
   return (
      <div
         className="absolute hidden group-hover:flex items-center gap-0.5 bg-[var(--color-bg-secondary)] rounded shadow-sm border border-[var(--color-border)] px-0.5 py-0.5"
         style={{ right: right ?? '4px', top: top ?? '50%', transform: top ? 'none' : 'translateY(-50%)' }}
      >
         {onTogglePin && (
            <button
               onClick={(e) => { e.stopPropagation(); onTogglePin(note); }}
               className="p-0.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
               title={note.is_pinned === 1 ? 'Unpin' : 'Pin'}
            >
               {note.is_pinned === 1 ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            </button>
         )}
         {onToggleArchive && (
            <button
               onClick={(e) => { e.stopPropagation(); onToggleArchive(note); }}
               className="p-0.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-warning)] transition-colors cursor-pointer"
               title={note.is_archived === 1 ? 'Unarchive' : 'Archive'}
            >
               <Archive className="h-3 w-3" />
            </button>
         )}
         {onDeleteNote && (
            <button
               onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
               className="p-0.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
               title="Delete"
            >
               <Trash2 className="h-3 w-3" />
            </button>
         )}
      </div>
   );
}
