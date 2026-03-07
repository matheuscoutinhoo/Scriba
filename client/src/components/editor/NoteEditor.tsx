import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Pin, PinOff, Trash2, Archive, Save, Eye, Edit3, Columns } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Note, UpdateNotePayload } from '@/lib/types';

type ViewMode = 'edit' | 'preview' | 'split';

interface NoteEditorProps {
   note: Note;
   onSave: (id: string, payload: UpdateNotePayload) => void;
   onDelete: (id: string) => void;
}

export function NoteEditor({ note, onSave, onDelete }: NoteEditorProps) {
   const [title, setTitle] = useState(note.title);
   const [content, setContent] = useState(note.content);
   const [tagInput, setTagInput] = useState('');
   const [tags, setTags] = useState<string[]>(note.tags.map(t => t.name));
   const [viewMode, setViewMode] = useState<ViewMode>('split');
   const [isDirty, setIsDirty] = useState(false);
   const editorRef = useRef<HTMLTextAreaElement>(null);
   const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

   // Cleanup auto-save timer on unmount
   useEffect(() => {
      return () => {
         if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
   }, []);

   // Reset state when note changes
   useEffect(() => {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags.map(t => t.name));
      setIsDirty(false);
   }, [note.id, note.title, note.content, note.tags]);

   const handleSave = useCallback(() => {
      onSave(note.id, { title, content, tags });
      setIsDirty(false);
   }, [note.id, title, content, tags, onSave]);

   const handleAutoSave = useCallback((newTitle: string, newContent: string, newTags: string[]) => {
      setIsDirty(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
         onSave(note.id, { title: newTitle, content: newContent, tags: newTags });
         setIsDirty(false);
      }, 1500);
   }, [note.id, onSave]);

   const handleContentChange = (value: string) => {
      setContent(value);
      handleAutoSave(title, value, tags);
   };

   const handleTitleChange = (value: string) => {
      setTitle(value);
      handleAutoSave(value, content, tags);
   };

   const handleTagKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && tagInput.trim()) {
         e.preventDefault();
         const newTag = tagInput.trim();
         if (!tags.includes(newTag)) {
            const newTags = [...tags, newTag];
            setTags(newTags);
            handleAutoSave(title, content, newTags);
         }
         setTagInput('');
      }
   };

   const removeTag = (tag: string) => {
      const newTags = tags.filter(t => t !== tag);
      setTags(newTags);
      handleAutoSave(title, content, newTags);
   };

   const togglePin = () => {
      onSave(note.id, { is_pinned: !note.is_pinned });
   };

   const toggleArchive = () => {
      onSave(note.id, { is_archived: !note.is_archived });
   };

   // Handle keyboard shortcuts
   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
         e.preventDefault();
         handleSave();
      }
      // Handle tab for indentation
      if (e.key === 'Tab' && editorRef.current) {
         e.preventDefault();
         const start = editorRef.current.selectionStart;
         const end = editorRef.current.selectionEnd;
         const newContent = content.substring(0, start) + '  ' + content.substring(end);
         setContent(newContent);
         // Restore cursor position
         requestAnimationFrame(() => {
            editorRef.current!.selectionStart = start + 2;
            editorRef.current!.selectionEnd = start + 2;
         });
      }
   };

   return (
      <div className="flex flex-col h-full">
         {/* Toolbar */}
         <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <div className="flex items-center gap-1">
               <Button
                  variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('edit')}
                  title="Edit mode"
               >
                  <Edit3 className="h-3.5 w-3.5" />
               </Button>
               <Button
                  variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('split')}
                  title="Split view"
               >
                  <Columns className="h-3.5 w-3.5" />
               </Button>
               <Button
                  variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('preview')}
                  title="Preview mode"
               >
                  <Eye className="h-3.5 w-3.5" />
               </Button>
            </div>

            <div className="flex items-center gap-1">
               {isDirty && (
                  <span className="text-[10px] text-[var(--color-warning)] mr-2">Unsaved</span>
               )}
               <Button variant="ghost" size="icon" onClick={togglePin} title={note.is_pinned ? 'Unpin' : 'Pin'}>
                  {note.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
               </Button>
               <Button variant="ghost" size="icon" onClick={toggleArchive} title={note.is_archived ? 'Unarchive' : 'Archive'}>
                  <Archive className="h-4 w-4" />
               </Button>
               <Button variant="ghost" size="icon" onClick={handleSave} title="Save (Ctrl+S)">
                  <Save className="h-4 w-4" />
               </Button>
               <Button variant="ghost" size="icon" onClick={() => onDelete(note.id)} title="Delete" className="text-[var(--color-danger)] hover:text-[var(--color-danger)]">
                  <Trash2 className="h-4 w-4" />
               </Button>
            </div>
         </div>

         {/* Title */}
         <div className="px-4 pt-4 pb-2">
            <Input
               value={title}
               onChange={(e) => handleTitleChange(e.target.value)}
               placeholder="Note title..."
               className="border-none bg-transparent text-xl font-bold px-0 h-auto focus-visible:ring-0"
            />
         </div>

         {/* Tags */}
         <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
            {tags.map((tag) => (
               <Badge key={tag} onClick={() => removeTag(tag)} className="cursor-pointer">
                  {tag} ×
               </Badge>
            ))}
            <input
               value={tagInput}
               onChange={(e) => setTagInput(e.target.value)}
               onKeyDown={handleTagKeyDown}
               placeholder="Add tag..."
               className="text-xs bg-transparent border-none outline-none text-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)] w-20"
            />
         </div>

         {/* Editor / Preview */}
         <div className="flex-1 flex overflow-hidden" onKeyDown={handleKeyDown}>
            {/* Editor pane */}
            {(viewMode === 'edit' || viewMode === 'split') && (
               <div className={cn('flex-1 overflow-hidden', viewMode === 'split' && 'border-r border-[var(--color-border)]')}>
                  <textarea
                     ref={editorRef}
                     value={content}
                     onChange={(e) => handleContentChange(e.target.value)}
                     placeholder="Start writing in Markdown..."
                     className="w-full h-full resize-none bg-transparent px-4 py-2 text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none leading-relaxed"
                     spellCheck={false}
                  />
               </div>
            )}

            {/* Preview pane */}
            {(viewMode === 'preview' || viewMode === 'split') && (
               <div className="flex-1 overflow-y-auto px-6 py-2">
                  <div className="markdown-body">
                     <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeSanitize]}
                     >
                        {content || '*Start writing to see preview...*'}
                     </ReactMarkdown>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
