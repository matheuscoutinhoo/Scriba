import { useState } from 'react';
import { Search, Plus, FolderPlus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CategoryTree } from '@/components/sidebar/CategoryTree';
import { cn } from '@/lib/utils';

interface SidebarProps {
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onSearch: (query: string) => void;
  onNewNote: () => void;
  onNewCategory: () => void;
}

export function Sidebar({
  selectedCategoryId,
  onSelectCategory,
  onSearch,
  onNewNote,
  onNewCategory,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <aside className="w-64 h-screen flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      {/* Logo */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-[var(--color-accent)]">S</span>criba
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Smart Notes</p>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 flex gap-2">
        <Button size="sm" onClick={onNewNote} className="flex-1">
          <Plus className="h-3.5 w-3.5" />
          New Note
        </Button>
        <Button size="icon" variant="secondary" onClick={onNewCategory} className="h-7 w-7">
          <FolderPlus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto mt-3">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Categories
          </span>
        </div>

        {/* All Notes */}
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            'w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors cursor-pointer',
            selectedCategoryId === null
              ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          All Notes
        </button>

        <CategoryTree
          selectedId={selectedCategoryId}
          onSelect={onSelectCategory}
        />
      </div>
    </aside>
  );
}
