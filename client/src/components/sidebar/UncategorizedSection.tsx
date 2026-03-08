import { ChevronRight, ChevronDown, FileText, Clock, Inbox } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';
import type { Note } from '@/lib/types';
import { NoteActionButtons } from './NoteActionButtons';

interface UncategorizedSectionProps {
   selectedNoteId?: string | null;
   onSelectNote?: (id: string) => void;
   onTogglePin?: (note: Note) => void;
   onToggleArchive?: (note: Note) => void;
   onDeleteNote?: (id: string) => void;
   onDropNote: (noteId: string, categoryId: string | null) => void;
}

export function UncategorizedSection({ selectedNoteId, onSelectNote, onTogglePin, onToggleArchive, onDeleteNote, onDropNote }: UncategorizedSectionProps) {
   const [expanded, setExpanded] = useState(false);
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
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: expanded ? `${contentHeight}px` : '0px', opacity: expanded ? 1 : 0 }}
         >
            <div ref={contentRef}>
               {uncategorizedNotes.map((note) => {
                  const formattedDate = new Date(note.created_at).toLocaleDateString('pt-BR', {
                     day: '2-digit',
                     month: 'short',
                  });
                  return (
                     <div
                        key={note.id}
                        className="group relative"
                     >
                        <div
                           onClick={() => onSelectNote?.(note.id)}
                           draggable
                           onDragStart={(e) => {
                              e.dataTransfer.setData('text/x-note-id', note.id);
                              e.dataTransfer.effectAllowed = 'move';
                           }}
                           className={cn(
                              'w-full text-left py-1.5 transition-colors cursor-pointer',
                              selectedNoteId === note.id
                                 ? 'border-l-2 border-l-[var(--color-accent)] text-white'
                                 : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]'
                           )}
                           style={{ paddingLeft: '28px', paddingRight: '8px', ...(selectedNoteId === note.id ? { background: 'linear-gradient(to right, var(--color-accent-soft) 0%, transparent 30%)' } : {}) }}
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
               })}
            </div>
         </div>
      </div>
   );
}
