import { memo } from 'react';
import { FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOCALE } from '@/lib/constants';
import type { Note } from '@/lib/types';
import { NoteActionButtons } from './NoteActionButtons';

interface NoteListItemProps {
   note: Note;
   isSelected: boolean;
   paddingLeft: number;
   onSelect?: (id: string) => void;
   onTogglePin?: (note: Note) => void;
   onToggleArchive?: (note: Note) => void;
   onDeleteNote?: (id: string) => void;
   onDragStart?: () => void;
}

export const NoteListItem = memo(function NoteListItem({
   note,
   isSelected,
   paddingLeft,
   onSelect,
   onTogglePin,
   onToggleArchive,
   onDeleteNote,
   onDragStart,
}: NoteListItemProps) {
   const formattedDate = new Date(note.updated_at).toLocaleDateString(LOCALE, {
      day: '2-digit',
      month: 'short',
   });

   return (
      <div className="group relative">
         <div
            onClick={() => onSelect?.(note.id)}
            draggable
            onDragStart={(e) => {
               e.dataTransfer.setData('text/x-note-id', note.id);
               e.dataTransfer.effectAllowed = 'move';
               onDragStart?.();
            }}
            className={cn(
               'w-full text-left py-1.5 transition-colors cursor-pointer',
               isSelected
                  ? 'border-l-2 border-l-[var(--color-accent)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]'
            )}
            style={{
               paddingLeft: `${paddingLeft}px`,
               paddingRight: '8px',
               ...(isSelected ? { background: 'linear-gradient(to right, var(--color-accent-soft) 0%, transparent 30%)' } : {}),
            }}
         >
            <div className="flex items-center gap-1.5">
               <FileText className="h-3 w-3 flex-shrink-0" />
               <span className="truncate text-[0.9rem]">{note.title || 'Untitled'}</span>
            </div>
            {note.excerpt && (
               <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 line-clamp-1" style={{ paddingLeft: '18px' }}>
                  {note.excerpt}
               </p>
            )}
            <div className="flex items-center justify-end mt-0.5" style={{ paddingLeft: '18px' }}>
               <span className="text-[9px] text-[var(--color-text-muted)] flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {formattedDate}
               </span>
            </div>
         </div>
         <NoteActionButtons note={note} onTogglePin={onTogglePin} onToggleArchive={onToggleArchive} onDeleteNote={onDeleteNote} right="8px" top="6px" />
      </div>
   );
});
