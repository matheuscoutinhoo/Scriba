import { Folder, FolderOpen, ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useNotes } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

interface CategoryTreeProps {
   selectedId: string | null;
   onSelect: (id: string | null) => void;
   onDropNote: (noteId: string, categoryId: string | null) => void;
   selectedNoteId?: string | null;
   onSelectNote?: (id: string) => void;
   onAllNotesClick?: () => void;
}

export function CategoryTree({ selectedId, onSelect, onDropNote, selectedNoteId, onSelectNote, onAllNotesClick }: CategoryTreeProps) {
   const { data: categories, isLoading } = useCategories();
   const [dragOverAllNotes, setDragOverAllNotes] = useState(false);

   if (isLoading) {
      return (
         <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
            Loading...
         </div>
      );
   }

   return (
      <div className="space-y-0.5">
         {/* All Notes */}
         <button
            onClick={() => onAllNotesClick ? onAllNotesClick() : onSelect(null)}
            onDragOver={(e) => {
               e.preventDefault();
               e.dataTransfer.dropEffect = 'move';
               setDragOverAllNotes(true);
            }}
            onDragLeave={() => setDragOverAllNotes(false)}
            onDrop={(e) => {
               e.preventDefault();
               setDragOverAllNotes(false);
               const noteId = e.dataTransfer.getData('text/x-note-id');
               if (noteId) onDropNote(noteId, null);
            }}
            className={cn(
               'w-full text-left px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors cursor-pointer',
               dragOverAllNotes && 'ring-2 ring-[var(--color-accent)] ring-inset bg-[var(--color-accent-soft)]',
               selectedId === null
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            )}
         >
            <Folder className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate flex-1">All Notes</span>
         </button>

         {categories?.map((category) => (
            <CategoryNode
               key={category.id}
               category={category}
               selectedId={selectedId}
               onSelect={onSelect}
               onDropNote={onDropNote}
               selectedNoteId={selectedNoteId}
               onSelectNote={onSelectNote}
               depth={0}
            />
         ))}

         {!categories?.length && (
            <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
               No categories yet
            </div>
         )}
      </div>
   );
}

interface CategoryNodeProps {
   category: Category;
   selectedId: string | null;
   onSelect: (id: string) => void;
   onDropNote: (noteId: string, categoryId: string) => void;
   selectedNoteId?: string | null;
   onSelectNote?: (id: string) => void;
   depth: number;
}

function CategoryNode({ category, selectedId, onSelect, onDropNote, selectedNoteId, onSelectNote, depth }: CategoryNodeProps) {
   const [expanded, setExpanded] = useState(false);
   const [isDragOver, setIsDragOver] = useState(false);
   const contentRef = useRef<HTMLDivElement>(null);
   const [contentHeight, setContentHeight] = useState(0);

   const hasChildren = category.children && category.children.length > 0;
   const isSelected = selectedId === category.id;
   const hasContent = hasChildren || category.note_count > 0;

   const { data: categoryNotes } = useNotes(
      expanded ? { category_id: category.id } : undefined
   );

   useEffect(() => {
      if (contentRef.current) {
         setContentHeight(contentRef.current.scrollHeight);
      }
   }, [expanded, categoryNotes, hasChildren]);

   const handleClick = () => {
      onSelect(category.id);
      if (hasContent) {
         setExpanded((prev) => !prev);
      }
   };

   return (
      <div>
         <button
            onClick={handleClick}
            onDragOver={(e) => {
               e.preventDefault();
               e.dataTransfer.dropEffect = 'move';
               setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
               e.preventDefault();
               setIsDragOver(false);
               const noteId = e.dataTransfer.getData('text/x-note-id');
               if (noteId) onDropNote(noteId, category.id);
            }}
            className={cn(
               'w-full text-left py-1.5 text-sm flex items-center gap-1.5 transition-colors cursor-pointer',
               isDragOver && 'ring-2 ring-[var(--color-accent)] ring-inset bg-[var(--color-accent-soft)]',
               isSelected
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
         >
            {hasContent ? (
               expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
               ) : (
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
               )
            ) : (
               <span className="w-3.5" />
            )}
            {expanded ? (
               <FolderOpen
                  className="h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: category.color }}
               />
            ) : (
               <Folder
                  className="h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: category.color }}
               />
            )}
            <span className="truncate flex-1">{category.name}</span>
            {category.note_count > 0 && (
               <span className="text-[10px] text-[var(--color-text-muted)] mr-3">
                  {category.note_count}
               </span>
            )}
         </button>

         {/* Animated expandable content */}
         <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: expanded ? `${contentHeight}px` : '0px', opacity: expanded ? 1 : 0 }}
         >
            <div ref={contentRef}>
               {/* Child categories */}
               {hasChildren && category.children!.map((child) => (
                  <CategoryNode
                     key={child.id}
                     category={child}
                     selectedId={selectedId}
                     onSelect={onSelect}
                     onDropNote={onDropNote}
                     selectedNoteId={selectedNoteId}
                     onSelectNote={onSelectNote}
                     depth={depth + 1}
                  />
               ))}

               {/* Notes inside this category */}
               {categoryNotes?.map((note) => (
                  <button
                     key={note.id}
                     onClick={() => onSelectNote?.(note.id)}
                     draggable
                     onDragStart={(e) => {
                        e.dataTransfer.setData('text/x-note-id', note.id);
                        e.dataTransfer.effectAllowed = 'move';
                     }}
                     className={cn(
                        'w-full text-left py-1 text-xs flex items-center gap-1.5 transition-colors cursor-pointer',
                        selectedNoteId === note.id
                           ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                           : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]'
                     )}
                     style={{ paddingLeft: `${28 + depth * 16}px` }}
                  >
                     <FileText className="h-3 w-3 flex-shrink-0" />
                     <span className="truncate">{note.title || 'Untitled'}</span>
                  </button>
               ))}
            </div>
         </div>
      </div>
   );
}
