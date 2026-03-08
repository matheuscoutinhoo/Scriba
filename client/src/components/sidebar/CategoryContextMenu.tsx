import { Pencil, Palette, Trash, FolderPlus } from 'lucide-react';
import { CATEGORY_COLORS } from '@/lib/constants';
import type { Category } from '@/lib/types';

interface CategoryContextMenuProps {
   category: Category;
   position: { x: number; y: number };
   showColorPicker: boolean;
   onToggleColorPicker: () => void;
   onRename: () => void;
   onCreateSubcategory: () => void;
   onChangeColor: (color: string) => void;
   onDelete: () => void;
   onClose: () => void;
}

export function CategoryContextMenu({
   category,
   position,
   showColorPicker,
   onToggleColorPicker,
   onRename,
   onCreateSubcategory,
   onChangeColor,
   onDelete,
   onClose,
}: CategoryContextMenuProps) {
   return (
      <div
         className="fixed z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-xl py-1 min-w-[160px]"
         style={{ left: position.x, top: position.y }}
         onMouseDown={(e) => e.preventDefault()}
         onClick={(e) => e.stopPropagation()}
      >
         <button
            onClick={() => { onClose(); onRename(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
         >
            <Pencil className="h-3.5 w-3.5" /> Rename
         </button>
         <button
            onClick={() => { onClose(); onCreateSubcategory(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
         >
            <FolderPlus className="h-3.5 w-3.5" /> New Subcategory
         </button>
         <button
            onClick={onToggleColorPicker}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
         >
            <Palette className="h-3.5 w-3.5" /> Change Color
         </button>
         {showColorPicker && (
            <div className="flex flex-wrap gap-1 px-3 py-1.5">
               {CATEGORY_COLORS.map((color) => (
                  <button
                     key={color}
                     onClick={() => onChangeColor(color)}
                     className="w-5 h-5 rounded-full border border-[var(--color-border)] hover:scale-125 transition-transform cursor-pointer"
                     style={{ backgroundColor: color, outline: category.color === color ? '2px solid var(--color-accent)' : 'none', outlineOffset: '2px' }}
                  />
               ))}
            </div>
         )}
         <div className="border-t border-[var(--color-border)] my-1" />
         <button
            onClick={onDelete}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
         >
            <Trash className="h-3.5 w-3.5" /> Delete
         </button>
      </div>
   );
}
