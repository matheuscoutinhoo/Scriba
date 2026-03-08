import { useState, useCallback } from 'react';
import { PanelLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { NoteEditor } from '@/components/editor/NoteEditor';
import { CreateCategoryDialog } from '@/components/dialogs/CreateCategoryDialog';
import { useNotes, useNote, useCreateNote, useUpdateNote, useDeleteNote, useSearchNotes } from '@/hooks/useNotes';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import type { UpdateNotePayload } from '@/lib/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function ScribaApp() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categoryDialogParent, setCategoryDialogParent] = useState<{ id: string; name: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const { data: notes = [] } = useNotes();
  const { data: searchResults = [] } = useSearchNotes(searchQuery);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const displayedNotes = searchQuery ? searchResults : notes;
  const { data: individualNote } = useNote(selectedNoteId || undefined);
  const foundNote = displayedNotes.find(n => n.id === selectedNoteId) ?? individualNote ?? null;
  const selectedNote = foundNote && foundNote.content !== undefined ? foundNote : null;

  const handleNewNote = useCallback(() => {
    createNote.mutate(
      { title: 'Untitled Note', content: '', category_id: selectedCategoryId || undefined },
      {
        onSuccess: (data) => {
          setSelectedNoteId(data.data.id);
        },
      }
    );
  }, [createNote, selectedCategoryId]);

  const handleSaveNote = useCallback((id: string, payload: UpdateNotePayload) => {
    updateNote.mutate({ id, ...payload });
  }, [updateNote]);

  const handleDeleteNote = useCallback((id: string) => {
    setSelectedNoteId((current) => current === id ? null : current);
    deleteNote.mutate(id);
  }, [deleteNote]);

  const handleCreateCategory = useCallback((name: string, color: string, parentId?: string) => {
    createCategory.mutate({ name, color, parent_id: parentId });
  }, [createCategory]);

  const handleCreateSubcategory = useCallback((parentId: string, parentName: string) => {
    setCategoryDialogParent({ id: parentId, name: parentName });
    setShowCategoryDialog(true);
  }, []);

  const handleDropCategory = useCallback((categoryId: string, newParentId: string | null) => {
    updateCategory.mutate({ id: categoryId, parent_id: newParentId });
  }, [updateCategory]);

  const handleMoveNoteToCategory = useCallback((noteId: string, categoryId: string | null) => {
    updateNote.mutate({ id: noteId, category_id: categoryId });
  }, [updateNote]);

  const handleTogglePin = useCallback((note: { id: string; is_pinned: number }) => {
    updateNote.mutate({ id: note.id, is_pinned: !note.is_pinned });
  }, [updateNote]);

  const handleToggleArchive = useCallback((note: { id: string; is_archived: number }) => {
    updateNote.mutate({ id: note.id, is_archived: !note.is_archived });
  }, [updateNote]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className="h-screen flex-shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
        style={{ width: sidebarCollapsed ? '40px' : '320px' }}
      >
        {sidebarCollapsed ? (
          <div className="h-full flex flex-col items-center py-3 px-1 gap-1 animate-[fadeIn_200ms_ease-out]">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title="Show sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <div className="w-80 h-full animate-[fadeIn_150ms_ease-out_100ms_both]">
            <Sidebar
              selectedCategoryId={selectedCategoryId}
              searchQuery={searchQuery}
              notes={displayedNotes}
              selectedNoteId={selectedNoteId}
              onSelectCategory={(id) => {
                setSelectedCategoryId(id);
                setSearchQuery('');
              }}
              onSearch={setSearchQuery}
              onNewNote={handleNewNote}
              onNewCategory={() => {
                setCategoryDialogParent(null);
                setShowCategoryDialog(true);
              }}
              onCreateSubcategory={handleCreateSubcategory}
              onSelectNote={setSelectedNoteId}
              onMoveNoteToCategory={handleMoveNoteToCategory}
              onDropCategory={handleDropCategory}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
              onDeleteNote={handleDeleteNote}
              onCollapse={() => setSidebarCollapsed(true)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 bg-[var(--color-bg-primary)] overflow-hidden">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4 opacity-10">✍️</div>
            <h2 className="text-lg font-semibold text-[var(--color-text-muted)]">
              Select a note or create a new one
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Your notes are written in Markdown
            </p>
          </div>
        )}
      </div>

      <CreateCategoryDialog
        isOpen={showCategoryDialog}
        onClose={() => { setShowCategoryDialog(false); setCategoryDialogParent(null); }}
        onCreate={handleCreateCategory}
        parentId={categoryDialogParent?.id}
        parentName={categoryDialogParent?.name}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ScribaApp />
    </QueryClientProvider>
  );
}
