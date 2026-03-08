import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import type { Note } from '@/lib/types';
import { CategoryNode } from './CategoryNode';
import { UncategorizedSection } from './UncategorizedSection';

interface CategoryTreeProps {
   selectedId: string | null;
   onSelect: (id: string | null) => void;
   onDropNote: (noteId: string, categoryId: string | null) => void;
   onDropCategory?: (categoryId: string, newParentId: string | null) => void;
   onCreateSubcategory?: (parentId: string, parentName: string) => void;
   selectedNoteId?: string | null;
   onSelectNote?: (id: string) => void;
   onTogglePin?: (note: Note) => void;
   onToggleArchive?: (note: Note) => void;
   onDeleteNote?: (id: string) => void;
}

export function CategoryTree({ selectedId, onSelect, onDropNote, onDropCategory, onCreateSubcategory, selectedNoteId, onSelectNote, onTogglePin, onToggleArchive, onDeleteNote }: CategoryTreeProps) {
   const { data: categories, isLoading } = useCategories();
   const [isDraggingCategorized, setIsDraggingCategorized] = useState(false);
   const [isDropHover, setIsDropHover] = useState(false);

   useEffect(() => {
      const onDragEnd = () => { setIsDraggingCategorized(false); setIsDropHover(false); };
      window.addEventListener('dragend', onDragEnd);
      return () => window.removeEventListener('dragend', onDragEnd);
   }, []);

   const onDragCategorizedNote = () => setIsDraggingCategorized(true);

   if (isLoading) {
      return (
         <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
            Loading...
         </div>
      );
   }

   return (
      <div className="space-y-0.5">
         {categories?.map((category) => (
            <CategoryNode
               key={category.id}
               category={category}
               selectedId={selectedId}
               onSelect={onSelect}
               onDropNote={onDropNote}
               onDropCategory={onDropCategory}
               onCreateSubcategory={onCreateSubcategory}
               selectedNoteId={selectedNoteId}
               onSelectNote={onSelectNote}
               onTogglePin={onTogglePin}
               onToggleArchive={onToggleArchive}
               onDeleteNote={onDeleteNote}
               depth={0}
               onDragCategorizedNote={onDragCategorizedNote}
            />
         ))}

         {!categories?.length && (
            <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
               No categories yet
            </div>
         )}

         <UncategorizedSection
            selectedNoteId={selectedNoteId}
            onSelectNote={onSelectNote}
            onTogglePin={onTogglePin}
            onToggleArchive={onToggleArchive}
            onDeleteNote={onDeleteNote}
            onDropNote={onDropNote}
         />

         {isDraggingCategorized && (
            <div
               className={cn(
                  'mx-3 mt-2 py-3 border-2 border-dashed rounded-lg text-center text-xs transition-colors',
                  isDropHover
                     ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                     : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
               )}
               onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                  setIsDropHover(true);
               }}
               onDragLeave={() => setIsDropHover(false)}
               onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropHover(false);
                  setIsDraggingCategorized(false);
                  const noteId = e.dataTransfer.getData('text/x-note-id');
                  if (noteId) onDropNote(noteId, null);
                  const catId = e.dataTransfer.getData('text/x-category-id');
                  if (catId) onDropCategory?.(catId, null);
               }}
            >
               Drop here to remove from category
            </div>
         )}
      </div>
   );
}
