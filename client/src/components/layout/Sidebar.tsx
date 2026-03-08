import { useState, useMemo, useEffect, memo } from 'react';
import { Search, Plus, FolderPlus, Pin, PinOff, Archive, Trash2, Clock, FolderOpen, FileText, PanelLeftClose, Tag, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
import { CategoryTree } from '@/components/sidebar/CategoryTree';
import { cn } from '@/lib/utils';
import { LOCALE } from '@/lib/constants';
import type { Note } from '@/lib/types';

type SidebarTab = 'categories' | 'notes';

interface SidebarProps {
   selectedCategoryId: string | null;
   searchQuery: string;
   notes: Note[];
   selectedNoteId: string | null;
   onSelectCategory: (id: string | null) => void;
   onSearch: (query: string) => void;
   onNewNote: () => void;
   onNewCategory: () => void;
   onCreateSubcategory: (parentId: string, parentName: string) => void;
   onSelectNote: (id: string) => void;
   onMoveNoteToCategory: (noteId: string, categoryId: string | null) => void;
   onDropCategory: (categoryId: string, newParentId: string | null) => void;
   onTogglePin: (note: Note) => void;
   onToggleArchive: (note: Note) => void;
   onDeleteNote: (id: string) => void;
   onCollapse: () => void;
   theme: 'dark' | 'light';
   onToggleTheme: () => void;
}

export function Sidebar({
   selectedCategoryId,
   searchQuery,
   notes,
   selectedNoteId,
   onSelectCategory,
   onSearch,
   onNewNote,
   onNewCategory,
   onCreateSubcategory,
   onSelectNote,
   onMoveNoteToCategory,
   onDropCategory,
   onTogglePin,
   onToggleArchive,
   onDeleteNote,
   onCollapse,
   theme,
   onToggleTheme,
}: SidebarProps) {
   const [activeTab, setActiveTab] = useState<SidebarTab>('categories');
   const [tabAnimKey, setTabAnimKey] = useState(0);
   const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

   const allTags = useMemo(() => {
      const tagMap = new Map<string, { id: string; name: string }>();
      for (const note of notes) {
         for (const tag of note.tags) {
            if (!tagMap.has(tag.id)) {
               tagMap.set(tag.id, { id: tag.id, name: tag.name });
            }
         }
      }
      return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
   }, [notes]);

   const filteredNotes = useMemo(() => {
      if (!selectedTagId) return notes;
      return notes.filter((note) => note.tags.some((tag) => tag.id === selectedTagId));
   }, [notes, selectedTagId]);

   useEffect(() => {
      if (selectedTagId && !allTags.some((t) => t.id === selectedTagId)) {
         setSelectedTagId(null);
      }
   }, [selectedTagId, allTags]);

   const switchTab = (tab: SidebarTab) => {
      if (tab === activeTab) return;
      setActiveTab(tab);
      setTabAnimKey((k) => k + 1);
   };

   return (
      <aside className="w-80 h-screen flex flex-col bg-[var(--color-bg-secondary)]">
         {/* Logo */}
         <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div>
               <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-[var(--color-accent)]">S</span>criba
               </h1>
               <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Smart Notes</p>
            </div>
            <div className="flex items-center gap-1">
               <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
               <button
                  onClick={onCollapse}
                  className="p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                  title="Hide sidebar"
               >
                  <PanelLeftClose className="h-4 w-4" />
               </button>
            </div>
         </div>

         {/* Search */}
         <div className="p-3">
            <div className="relative">
               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
               <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => {
                     const value = e.target.value;
                     onSearch(value);
                     if (value && activeTab !== 'notes') {
                        switchTab('notes');
                     }
                  }}
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

         {/* Tabs */}
         <div className="flex mt-3 border-b border-[var(--color-border)]">
            <button
               onClick={() => switchTab('categories')}
               className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors cursor-pointer',
                  activeTab === 'categories'
                     ? 'text-[var(--color-text-primary)] border-b-2 border-[var(--color-text-primary)]'
                     : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
               )}
            >
               <FolderOpen className="h-3.5 w-3.5" />
               Categories
            </button>
            <button
               onClick={() => switchTab('notes')}
               className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors cursor-pointer',
                  activeTab === 'notes'
                     ? 'text-[var(--color-text-primary)] border-b-2 border-[var(--color-text-primary)]'
                     : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
               )}
            >
               <FileText className="h-3.5 w-3.5" />
               Notes
            </button>
         </div>

         {/* Tab Content */}
         <div className="flex-1 overflow-y-auto">
            <div
               key={tabAnimKey}
               className="animate-[fadeSlideIn_200ms_ease-out]"
            >
               {activeTab === 'categories' ? (
                  <div className="py-2">
                     <CategoryTree
                        selectedId={selectedCategoryId}
                        onSelect={onSelectCategory}
                        onDropNote={onMoveNoteToCategory}
                        onDropCategory={onDropCategory}
                        onCreateSubcategory={onCreateSubcategory}
                        selectedNoteId={selectedNoteId}
                        onSelectNote={onSelectNote}
                        onTogglePin={onTogglePin}
                        onToggleArchive={onToggleArchive}
                        onDeleteNote={onDeleteNote}
                     />
                  </div>
               ) : (
                  <div className="py-2">
                     <div className="px-3 py-1 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                           {searchQuery ? `Search: "${searchQuery}"` : 'Recent Notes'}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                           {filteredNotes.length}
                        </span>
                     </div>

                     {allTags.length > 0 && (
                        <div className="px-3 py-1.5 flex items-center gap-1.5 flex-wrap">
                           <Tag className="h-3 w-3 text-[var(--color-text-muted)] flex-shrink-0" />
                           {allTags.map((tag) => (
                              <button
                                 key={tag.id}
                                 onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                                 className={cn(
                                    'text-[9px] px-1.5 py-0.5 rounded-full transition-colors cursor-pointer',
                                    selectedTagId === tag.id
                                       ? 'bg-[var(--color-accent)] text-white'
                                       : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                 )}
                              >
                                 {tag.name}
                              </button>
                           ))}
                           {selectedTagId && (
                              <button
                                 onClick={() => setSelectedTagId(null)}
                                 className="p-0.5 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                                 title="Clear filter"
                              >
                                 <X className="h-3 w-3" />
                              </button>
                           )}
                        </div>
                     )}

                     {filteredNotes.length === 0 ? (
                        <div className="px-3 py-4 text-center">
                           <p className="text-[var(--color-text-muted)] text-xs">
                              {selectedTagId ? 'No notes with this tag' : 'No notes yet'}
                           </p>
                        </div>
                     ) : (
                        <div className="flex flex-col">
                           {filteredNotes.map((note) => (
                              <SidebarNoteCard
                                 key={note.id}
                                 note={note}
                                 isSelected={selectedNoteId === note.id}
                                 onClick={() => onSelectNote(note.id)}
                                 onTogglePin={() => onTogglePin(note)}
                                 onToggleArchive={() => onToggleArchive(note)}
                                 onDelete={() => onDeleteNote(note.id)}
                              />
                           ))}
                        </div>
                     )}
                  </div>
               )}
            </div>
         </div>
      </aside>
   );
}

interface SidebarNoteCardProps {
   note: Note;
   isSelected: boolean;
   onClick: () => void;
   onTogglePin?: () => void;
   onToggleArchive?: () => void;
   onDelete?: () => void;
}

export const SidebarNoteCard = memo(function SidebarNoteCard({ note, isSelected, onClick, onTogglePin, onToggleArchive, onDelete }: SidebarNoteCardProps) {
   const formattedDate = new Date(note.updated_at).toLocaleDateString(LOCALE, {
      day: '2-digit',
      month: 'short',
   });

   return (
      <div
         className={cn(
            'group relative w-full text-left px-3 py-2 border-b border-[var(--color-border)] transition-colors cursor-pointer',
            isSelected
               ? 'border-l-2 border-l-[var(--color-accent)]'
               : 'hover:bg-[var(--color-bg-hover)]'
         )}
         style={isSelected ? { background: 'linear-gradient(to right, var(--color-accent-soft) 0%, transparent 30%)' } : undefined}
         draggable
         onDragStart={(e) => {
            e.dataTransfer.setData('text/x-note-id', note.id);
            e.dataTransfer.effectAllowed = 'move';
         }}
         onClick={onClick}
      >
         <div className="flex items-start justify-between gap-2">
            <h3 className="text-[0.9rem] font-medium truncate flex-1">
               {note.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
               {note.is_pinned === 1 && (
                  <Pin className="h-3 w-3 text-[var(--color-accent)] group-hover:hidden" />
               )}
               {note.is_archived === 1 && (
                  <Archive className="h-3 w-3 text-[var(--color-text-muted)] group-hover:hidden" />
               )}
            </div>
         </div>

         {/* Hover action buttons */}
         {(onTogglePin || onToggleArchive || onDelete) && (
            <div className="absolute right-2 top-1.5 hidden group-hover:flex items-center gap-0.5 bg-[var(--color-bg-secondary)] rounded shadow-sm border border-[var(--color-border)] px-0.5 py-0.5">
               {onTogglePin && (
                  <button
                     onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                     className="p-0.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
                     title={note.is_pinned === 1 ? 'Unpin' : 'Pin'}
                  >
                     {note.is_pinned === 1 ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                  </button>
               )}
               {onToggleArchive && (
                  <button
                     onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}
                     className="p-0.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-warning)] transition-colors cursor-pointer"
                     title={note.is_archived === 1 ? 'Unarchive' : 'Archive'}
                  >
                     <Archive className="h-3 w-3" />
                  </button>
               )}
               {onDelete && (
                  <button
                     onClick={(e) => { e.stopPropagation(); onDelete(); }}
                     className="p-0.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                     title="Delete"
                  >
                     <Trash2 className="h-3 w-3" />
                  </button>
               )}
            </div>
         )}

         {note.excerpt && (
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
               {note.excerpt}
            </p>
         )}

         <div className="flex items-center justify-between mt-1">
            <div className="flex gap-1 flex-wrap">
               {note.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag.id} className="text-[9px] py-0 px-1">
                     {tag.name}
                  </Badge>
               ))}
               {note.tags.length > 2 && (
                  <span className="text-[9px] text-[var(--color-text-muted)]">
                     +{note.tags.length - 2}
                  </span>
               )}
            </div>
            <span className="text-[9px] text-[var(--color-text-muted)] flex items-center gap-1">
               <Clock className="h-2.5 w-2.5" />
               {formattedDate}
            </span>
         </div>
      </div>
   );
});
