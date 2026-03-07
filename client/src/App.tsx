import { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { NoteEditor } from '@/components/editor/NoteEditor';
import { CreateCategoryDialog } from '@/components/dialogs/CreateCategoryDialog';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useSearchNotes } from '@/hooks/useNotes';
import { useCreateCategory } from '@/hooks/useCategories';
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

  const { data: notes = [] } = useNotes(
    searchQuery ? undefined : { category_id: selectedCategoryId || undefined }
  );
  const { data: searchResults = [] } = useSearchNotes(searchQuery);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const createCategory = useCreateCategory();

  const displayedNotes = searchQuery ? searchResults : notes;
  const selectedNote = displayedNotes.find(n => n.id === selectedNoteId) ?? null;

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
    deleteNote.mutate(id, {
      onSuccess: () => {
        setSelectedNoteId(null);
      },
    });
  }, [deleteNote]);

  const handleCreateCategory = useCallback((name: string, color: string) => {
    createCategory.mutate({ name, color });
  }, [createCategory]);

  const handleMoveNoteToCategory = useCallback((noteId: string, categoryId: string | null) => {
    updateNote.mutate({ id: noteId, category_id: categoryId });
  }, [updateNote]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        selectedCategoryId={selectedCategoryId}
        searchQuery={searchQuery}
        notes={displayedNotes}
        selectedNoteId={selectedNoteId}
        onSelectCategory={(id) => {
          setSelectedCategoryId(id);
          setSelectedNoteId(null);
          setSearchQuery('');
        }}
        onSearch={setSearchQuery}
        onNewNote={handleNewNote}
        onNewCategory={() => setShowCategoryDialog(true)}
        onSelectNote={setSelectedNoteId}
        onMoveNoteToCategory={handleMoveNoteToCategory}
      />

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
        onClose={() => setShowCategoryDialog(false)}
        onCreate={handleCreateCategory}
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
