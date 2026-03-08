import { Folder, FolderOpen, ChevronRight, ChevronDown, FileText, Clock, Pencil, Palette, Trash, FolderPlus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import type { Category, Note } from '@/lib/types';
import { NoteActionButtons } from './NoteActionButtons';

const CATEGORY_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#ffffff'];

export interface CategoryNodeProps {
   category: Category;
   selectedId: string | null;
   onSelect: (id: string) => void;
   onDropNote: (noteId: string, categoryId: string) => void;
   onDropCategory?: (categoryId: string, newParentId: string) => void;
   onCreateSubcategory?: (parentId: string, parentName: string) => void;
   selectedNoteId?: string | null;
   onSelectNote?: (id: string) => void;
   onTogglePin?: (note: Note) => void;
   onToggleArchive?: (note: Note) => void;
   onDeleteNote?: (id: string) => void;
   depth: number;
   onDragCategorizedNote?: () => void;
}

export function CategoryNode({ category, selectedId, onSelect, onDropNote, onDropCategory, onCreateSubcategory, selectedNoteId, onSelectNote, onTogglePin, onToggleArchive, onDeleteNote, depth, onDragCategorizedNote }: CategoryNodeProps) {
   const [expanded, setExpanded] = useState(false);
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

   const { data: categoryNotes } = useNotes(
      { category_id: category.id },
      { enabled: expanded }
   );

   useEffect(() => {
      if (contentRef.current) {
         setContentHeight(contentRef.current.scrollHeight);
      }
   }, [expanded, categoryNotes, hasChildren]);

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
            <div
               className="fixed z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-xl py-1 min-w-[160px]"
               style={{ left: ctxMenu.x, top: ctxMenu.y }}
               onMouseDown={(e) => e.preventDefault()}
               onClick={(e) => e.stopPropagation()}
            >
               <button
                  onClick={() => { setCtxMenu(null); setRenameValue(category.name); setIsRenaming(true); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
               >
                  <Pencil className="h-3.5 w-3.5" /> Rename
               </button>
               <button
                  onClick={() => {
                     setCtxMenu(null);
                     onCreateSubcategory?.(category.id, category.name);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
               >
                  <FolderPlus className="h-3.5 w-3.5" /> New Subcategory
               </button>
               <button
                  onClick={() => { setShowColorPicker((v) => !v); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
               >
                  <Palette className="h-3.5 w-3.5" /> Change Color
               </button>
               {showColorPicker && (
                  <div className="flex flex-wrap gap-1 px-3 py-1.5">
                     {CATEGORY_COLORS.map((color) => (
                        <button
                           key={color}
                           onClick={() => {
                              updateCategory.mutate({ id: category.id, color });
                              setShowColorPicker(false);
                              setCtxMenu(null);
                           }}
                           className="w-5 h-5 rounded-full border border-[var(--color-border)] hover:scale-125 transition-transform cursor-pointer"
                           style={{ backgroundColor: color, outline: category.color === color ? '2px solid var(--color-accent)' : 'none', outlineOffset: '2px' }}
                        />
                     ))}
                  </div>
               )}
               <div className="border-t border-[var(--color-border)] my-1" />
               <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
               >
                  <Trash className="h-3.5 w-3.5" /> Delete
               </button>
            </div>
         )}

         <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
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

               {categoryNotes?.map((note) => {
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
                              onDragCategorizedNote?.();
                           }}
                           className={cn(
                              'w-full text-left py-1.5 transition-colors cursor-pointer',
                              selectedNoteId === note.id
                                 ? 'border-l-2 border-l-[var(--color-accent)] text-white'
                                 : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]'
                           )}
                           style={{ paddingLeft: `${28 + depth * 16}px`, paddingRight: '8px', ...(selectedNoteId === note.id ? { background: 'linear-gradient(to right, var(--color-accent-soft) 0%, transparent 30%)' } : {}) }}
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
