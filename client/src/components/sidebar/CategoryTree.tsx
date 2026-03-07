import { Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

interface CategoryTreeProps {
   selectedId: string | null;
   onSelect: (id: string | null) => void;
}

export function CategoryTree({ selectedId, onSelect }: CategoryTreeProps) {
   const { data: categories, isLoading } = useCategories();

   if (isLoading) {
      return (
         <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
            Loading...
         </div>
      );
   }

   if (!categories?.length) {
      return (
         <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
            No categories yet
         </div>
      );
   }

   return (
      <div className="space-y-0.5">
         {categories.map((category) => (
            <CategoryNode
               key={category.id}
               category={category}
               selectedId={selectedId}
               onSelect={onSelect}
               depth={0}
            />
         ))}
      </div>
   );
}

interface CategoryNodeProps {
   category: Category;
   selectedId: string | null;
   onSelect: (id: string) => void;
   depth: number;
}

function CategoryNode({ category, selectedId, onSelect, depth }: CategoryNodeProps) {
   const [expanded, setExpanded] = useState(false);
   const hasChildren = category.children && category.children.length > 0;
   const isSelected = selectedId === category.id;

   return (
      <div>
         <button
            onClick={() => onSelect(category.id)}
            className={cn(
               'w-full text-left py-1.5 text-sm flex items-center gap-1.5 transition-colors cursor-pointer',
               isSelected
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
         >
            {hasChildren && (
               <span
                  onClick={(e) => {
                     e.stopPropagation();
                     setExpanded(!expanded);
                  }}
                  className="cursor-pointer"
               >
                  {expanded ? (
                     <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                     <ChevronRight className="h-3.5 w-3.5" />
                  )}
               </span>
            )}
            <Folder
               className="h-3.5 w-3.5 flex-shrink-0"
               style={{ color: category.color }}
            />
            <span className="truncate flex-1">{category.name}</span>
            {category.note_count > 0 && (
               <span className="text-[10px] text-[var(--color-text-muted)] mr-3">
                  {category.note_count}
               </span>
            )}
         </button>

         {hasChildren && expanded && (
            <div>
               {category.children!.map((child) => (
                  <CategoryNode
                     key={child.id}
                     category={child}
                     selectedId={selectedId}
                     onSelect={onSelect}
                     depth={depth + 1}
                  />
               ))}
            </div>
         )}
      </div>
   );
}
