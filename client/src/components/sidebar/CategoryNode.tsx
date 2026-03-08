import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect, memo } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import type { Category, Note } from '@/lib/types';
import { NoteListItem } from './NoteListItem';
import { CategoryContextMenu } from './CategoryContextMenu';

export interface CategoryNodeProps {
   category: Category;
   selectedId: string | null;
   onSelect: (id: string) => void;
   onDropNote: (noteId: string, categoryId: string) => void;
   onDropCategory?: (categoryId: string, newParentId: string | null) => void;
   onCreateSubcategory?: (parentId: string, parentName: string) => void;
   selectedNoteId?: string | null;
   onSelectNote?: (id: string) => void;
   onTogglePin?: (note: Note) => void;
   onToggleArchive?: (note: Note) => void;
   onDeleteNote?: (id: string) => void;
   depth: number;
   onDragCategorizedNote?: () => void;
}

export const CategoryNode = memo(function CategoryNode({ category, selectedId, onSelect, onDropNote, onDropCategory, onCreateSubcategory, selectedNoteId, onSelectNote, onTogglePin, onToggleArchive, onDeleteNote, depth, onDragCategorizedNote }: CategoryNodeProps) {
   const [expanded, setExpanded] = useState(false);
   const [wasExpanded, setWasExpanded] = useState(false);
   const [isDragOver, setIsDragOver] = useState(false);
   const contentRef = useRef<HTMLDivElement>(null);
   const [contentHeight, setContentHeight] = useState(0);
   const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
   const [isRenaming, setIsRenaming] = useState(false);
   const [renameValue, setRenameValue] = useState(category.name);
   const [showColorPicker, setShowColorPicker] = useState(false);
   const renameInputRef = useRef<HTMLInputElement>(null);
   const updateCategory = useUpdateCategory();
   const deleteCategory = useDeleteCategory();

   const hasChildren = category.children && category.children.length > 0;
   const isSelected = selectedId === category.id;
   const hasContent = hasChildren || category.note_count > 0;

   if (expanded && !wasExpanded) setWasExpanded(true);

   const { data: categoryNotes } = useNotes(
      { category_id: category.id },
      { enabled: wasExpanded || expanded }
   );

   useEffect(() => {
      const el = contentRef.current;
      if (!el) return;
      const observer = new ResizeObserver(() => {
         setContentHeight(el.scrollHeight);
      });
      observer.observe(el);
      return () => observer.disconnect();
   }, []);

   useEffect(() => {
      if (!ctxMenu) return;
      const close = () => setCtxMenu(null);
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
   }, [ctxMenu]);

   useEffect(() => {
      if (isRenaming && renameInputRef.current) {
         renameInputRef.current.focus();
         renameInputRef.current.select();
      }
   }, [isRenaming]);

   const handleClick = () => {
      if (isRenaming) return;
      onSelect(category.id);
      if (hasContent) {
         setExpanded((prev) => !prev);
      }
   };

   const handleRenameSubmit = () => {
      const trimmed = renameValue.trim();
      if (trimmed && trimmed !== category.name) {
         updateCategory.mutate({ id: category.id, name: trimmed });
      }
      setIsRenaming(false);
   };

   const handleDelete = () => {
      deleteCategory.mutate(category.id);
      setCtxMenu(null);
   };

   return (
      <div>
         <button
            onClick={handleClick}
            onContextMenu={(e) => {
               e.preventDefault();
               e.stopPropagation();
               setCtxMenu({ x: e.clientX, y: e.clientY });
            }}
            draggable
            onDragStart={(e) => {
               e.dataTransfer.setData('text/x-category-id', category.id);
               e.dataTransfer.effectAllowed = 'move';
               if (category.parent_id) onDragCategorizedNote?.();
            }}
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
               if (noteId) { onDropNote(noteId, category.id); setExpanded(true); return; }
               const catId = e.dataTransfer.getData('text/x-category-id');
               if (catId && catId !== category.id) { onDropCategory?.(catId, category.id); setExpanded(true); }
            }}
            className={cn(
               'w-full text-left py-1.5 text-sm flex items-center gap-1.5 transition-colors cursor-pointer',
               isDragOver && 'ring-2 ring-[var(--color-accent)] ring-inset bg-[var(--color-accent-soft)]',
               isSelected
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]'
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
            {isRenaming ? (
               <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter') handleRenameSubmit();
                     if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(category.name); }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-[var(--color-bg-primary)] border border-[var(--color-accent)] rounded px-1 py-0 text-sm text-[var(--color-text-primary)] outline-none"
               />
            ) : (
               <span className="truncate flex-1">{category.name}</span>
            )}
            {category.note_count > 0 && (
               <span className="text-[10px] text-[var(--color-text-muted)] mr-3">
                  {category.note_count}
               </span>
            )}
         </button>

         {ctxMenu && (
            <CategoryContextMenu
               category={category}
               position={ctxMenu}
               showColorPicker={showColorPicker}
               onToggleColorPicker={() => setShowColorPicker((v) => !v)}
               onRename={() => { setRenameValue(category.name); setIsRenaming(true); }}
               onCreateSubcategory={() => onCreateSubcategory?.(category.id, category.name)}
               onChangeColor={(color) => {
                  updateCategory.mutate({ id: category.id, color });
                  setShowColorPicker(false);
                  setCtxMenu(null);
               }}
               onDelete={handleDelete}
               onClose={() => setCtxMenu(null)}
            />
         )}

         <div
            className="overflow-hidden transition-all duration-150 ease-in-out"
            style={{ maxHeight: expanded ? `${contentHeight}px` : '0px', opacity: expanded ? 1 : 0 }}
         >
            <div ref={contentRef}>
               {hasChildren && category.children!.map((child) => (
                  <CategoryNode
                     key={child.id}
                     category={child}
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
                     depth={depth + 1}
                     onDragCategorizedNote={onDragCategorizedNote}
                  />
               ))}

               {categoryNotes?.map((note) => (
                  <NoteListItem
                     key={note.id}
                     note={note}
                     isSelected={selectedNoteId === note.id}
                     paddingLeft={28 + depth * 16}
                     onSelect={onSelectNote}
                     onTogglePin={onTogglePin}
                     onToggleArchive={onToggleArchive}
                     onDeleteNote={onDeleteNote}
                     onDragStart={onDragCategorizedNote}
                  />
               ))}
            </div>
         </div>
      </div>
   );
});
