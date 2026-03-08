import { ChevronRight, ChevronDown, Inbox } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';
import type { Note } from '@/lib/types';
import { NoteListItem } from './NoteListItem';

interface UncategorizedSectionProps {
   selectedNoteId?: string | null;
   onSelectNote?: (id: string) => void;
   onTogglePin?: (note: Note) => void;
   onToggleArchive?: (note: Note) => void;
   onDeleteNote?: (id: string) => void;
   onDropNote: (noteId: string, categoryId: string | null) => void;
   defaultExpanded?: boolean;
}

export function UncategorizedSection({ selectedNoteId, onSelectNote, onTogglePin, onToggleArchive, onDeleteNote, onDropNote, defaultExpanded = false }: UncategorizedSectionProps) {
   const [expanded, setExpanded] = useState(defaultExpanded);
   const [isDragOver, setIsDragOver] = useState(false);
   const contentRef = useRef<HTMLDivElement>(null);
   const [contentHeight, setContentHeight] = useState(0);

   const { data: allNotes } = useNotes();
   const uncategorizedNotes = useMemo(() => {
      if (!allNotes) return [];
      return allNotes
         .filter((n) => !n.category_id)
         .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
   }, [allNotes]);

   useEffect(() => {
      if (defaultExpanded) setExpanded(true);
   }, [defaultExpanded]);

   useEffect(() => {
      if (contentRef.current) {
         setContentHeight(contentRef.current.scrollHeight);
      }
   }, [expanded, uncategorizedNotes]);

   if (uncategorizedNotes.length === 0) return null;

   return (
      <div>
         <button
            onClick={() => setExpanded((prev) => !prev)}
            onDragOver={(e) => {
               e.preventDefault();
               e.dataTransfer.dropEffect = 'move';
               setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
               e.preventDefault();
               e.stopPropagation();
               setIsDragOver(false);
               const noteId = e.dataTransfer.getData('text/x-note-id');
               if (noteId) onDropNote(noteId, null);
            }}
            className={cn(
               'w-full text-left py-1.5 text-sm flex items-center gap-1.5 transition-colors cursor-pointer',
               isDragOver && 'ring-2 ring-[var(--color-accent)] ring-inset bg-[var(--color-accent-soft)]',
               'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            )}
            style={{ paddingLeft: '12px' }}
         >
            {expanded ? (
               <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
               <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <Inbox className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-text-muted)]" />
            <span className="truncate flex-1">Uncategorized</span>
            <span className="text-[10px] text-[var(--color-text-muted)] mr-3">
               {uncategorizedNotes.length}
            </span>
         </button>

         <div
            className="overflow-hidden transition-all duration-150 ease-in-out"
            style={{ maxHeight: expanded ? `${contentHeight}px` : '0px', opacity: expanded ? 1 : 0 }}
         >
            <div ref={contentRef}>
               {uncategorizedNotes.map((note) => (
                  <NoteListItem
                     key={note.id}
                     note={note}
                     isSelected={selectedNoteId === note.id}
                     paddingLeft={28}
                     onSelect={onSelectNote}
                     onTogglePin={onTogglePin}
                     onToggleArchive={onToggleArchive}
                     onDeleteNote={onDeleteNote}
                  />
               ))}
            </div>
         </div>
      </div>
   );
}
