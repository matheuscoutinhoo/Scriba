import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Pin, PinOff, Trash2, Archive, Save, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { Note, UpdateNotePayload } from '@/lib/types';

interface NoteEditorProps {
   note: Note;
   onSave: (id: string, payload: UpdateNotePayload) => void;
   onDelete: (id: string) => void;
}

export function NoteEditor({ note, onSave, onDelete }: NoteEditorProps) {
   const [title, setTitle] = useState(note.title ?? '');
   const [content, setContent] = useState(note.content ?? '');
   const [tagInput, setTagInput] = useState('');
   const [tags, setTags] = useState<string[]>((note.tags ?? []).map(t => t.name));
   const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
   const [selectAll, setSelectAll] = useState(false);
   const [isDirty, setIsDirty] = useState(false);
   const [fontScale, setFontScale] = useState(100);
   const lineInputRef = useRef<HTMLInputElement>(null);
   const selectAllRef = useRef<HTMLTextAreaElement>(null);
   const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
   const pendingCursorRef = useRef<number | null>(null);

   const lines = content.split('\n');

   // Cleanup auto-save timer on unmount
   useEffect(() => {
      return () => {
         if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
   }, []);

   // Focus and select all text when selectAll mode is activated
   useEffect(() => {
      if (selectAll && selectAllRef.current) {
         selectAllRef.current.focus();
         selectAllRef.current.select();
      }
   }, [selectAll]);

   // Reset state when note changes
   useEffect(() => {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags.map(t => t.name));
      setIsDirty(false);
      setEditingLineIndex(null);
      setSelectAll(false);
   }, [note.id, note.title, note.content, note.tags]);

   // Focus line input when editing line changes
   useEffect(() => {
      if (editingLineIndex !== null && lineInputRef.current) {
         lineInputRef.current.focus();
         const pos = pendingCursorRef.current ?? lineInputRef.current.value.length;
         const clamped = Math.min(pos, lineInputRef.current.value.length);
         lineInputRef.current.setSelectionRange(clamped, clamped);
         pendingCursorRef.current = null;
      }
   }, [editingLineIndex]);

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

   const handleLineChange = (index: number, value: string) => {
      const newLines = [...lines];
      newLines[index] = value;
      const newContent = newLines.join('\n');
      setContent(newContent);
      handleAutoSave(title, newContent, tags);
   };

   const handleLinePaste = (e: React.ClipboardEvent, index: number) => {
      const text = e.clipboardData.getData('text/plain');
      if (!text.includes('\n')) return;
      e.preventDefault();
      const input = lineInputRef.current;
      if (!input) return;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const currentLine = lines[index];
      const pastedLines = (currentLine.substring(0, start) + text + currentLine.substring(end)).split('\n');
      const newLines = [...lines];
      newLines.splice(index, 1, ...pastedLines);
      const newContent = newLines.join('\n');
      setContent(newContent);
      handleAutoSave(title, newContent, tags);
      const lastPastedLine = pastedLines[pastedLines.length - 1];
      pendingCursorRef.current = lastPastedLine.length - currentLine.substring(end).length;
      setEditingLineIndex(index + pastedLines.length - 1);
   };

   const handleLineKeyDown = (e: React.KeyboardEvent, index: number) => {
      const input = lineInputRef.current;

      if (e.key === 'Enter') {
         e.preventDefault();
         if (input) {
            const cursorPos = input.selectionStart ?? 0;
            const currentLine = lines[index];
            const before = currentLine.substring(0, cursorPos);
            const after = currentLine.substring(cursorPos);
            const newLines = [...lines];
            newLines.splice(index, 1, before, after);
            const newContent = newLines.join('\n');
            setContent(newContent);
            handleAutoSave(title, newContent, tags);
            pendingCursorRef.current = 0;
            setEditingLineIndex(index + 1);
         }
      } else if (e.key === 'Backspace') {
         if (input && input.selectionStart === 0 && input.selectionEnd === 0 && index > 0) {
            e.preventDefault();
            const newLines = [...lines];
            const prevLineLen = newLines[index - 1].length;
            newLines[index - 1] += newLines[index];
            newLines.splice(index, 1);
            const newContent = newLines.join('\n');
            setContent(newContent);
            handleAutoSave(title, newContent, tags);
            pendingCursorRef.current = prevLineLen;
            setEditingLineIndex(index - 1);
         }
      } else if (e.key === 'ArrowUp' && index > 0) {
         e.preventDefault();
         if (input) pendingCursorRef.current = input.selectionStart ?? 0;
         setEditingLineIndex(index - 1);
      } else if (e.key === 'ArrowDown' && index < lines.length - 1) {
         e.preventDefault();
         if (input) pendingCursorRef.current = input.selectionStart ?? 0;
         setEditingLineIndex(index + 1);
      } else if (e.ctrlKey && e.key === 'a') {
         e.preventDefault();
         setEditingLineIndex(null);
         setSelectAll(true);
      } else if (e.key === 'Tab') {
         e.preventDefault();
         if (input) {
            const start = input.selectionStart ?? 0;
            const currentLine = lines[index];
            const newLine = currentLine.substring(0, start) + '  ' + currentLine.substring(start);
            handleLineChange(index, newLine);
            requestAnimationFrame(() => {
               if (lineInputRef.current) {
                  lineInputRef.current.setSelectionRange(start + 2, start + 2);
               }
            });
         }
      }
   };

   const headings = useMemo(() => {
      return lines
         .map((line, index) => {
            const match = line.match(/^(#{1,6})\s+(.+)/);
            if (!match) return null;
            return { level: match[1].length, text: match[2].replace(/[*_`~\[\]]/g, ''), lineIndex: index };
         })
         .filter((h): h is { level: number; text: string; lineIndex: number } => h !== null);
   }, [lines]);

   const lineRefs = useRef<Map<number, HTMLElement>>(new Map());

   const scrollToHeading = (lineIndex: number) => {
      const el = lineRefs.current.get(lineIndex);
      if (el) {
         el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setEditingLineIndex(lineIndex);
   };

   return (
      <div className="group/editor flex flex-col h-full" onKeyDown={(e) => {
         if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            handleSave();
         }
      }}>
         {/* Toolbar */}
         <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <div className="flex items-center gap-1">
               {isDirty && (
                  <span className="text-[10px] text-[var(--color-warning)]">Unsaved</span>
               )}
            </div>

            <div className="flex items-center gap-1">
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
         <div className="max-w-3xl mx-auto w-full px-8 pt-6 pb-2">
            <Input
               value={title}
               onChange={(e) => handleTitleChange(e.target.value)}
               placeholder="Note title..."
               className="border-none bg-transparent text-2xl font-bold px-0 h-auto focus-visible:ring-0 text-center"
            />
         </div>

         {/* Tags */}
         <div className="max-w-3xl mx-auto w-full px-8 pb-3 flex items-center justify-center gap-2 flex-wrap">
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

         {/* Content area with TOC */}
         <div className="flex-1 flex overflow-hidden relative">
            {/* Content - Line-by-line live preview editor */}
            <div
               className="flex-1 overflow-y-auto px-8 py-4"
               onMouseDown={(e) => {
                  if (e.target === e.currentTarget) {
                     e.preventDefault();
                     if (selectAll) {
                        setSelectAll(false);
                        setEditingLineIndex(null);
                     } else {
                        setEditingLineIndex(lines.length - 1);
                     }
                  }
               }}
            >
               <div className="max-w-3xl mx-auto w-full" style={{ zoom: fontScale / 100 }}>
                  {selectAll ? (
                     <textarea
                        ref={selectAllRef}
                        value={content}
                        onChange={(e) => {
                           const newContent = e.target.value;
                           setContent(newContent);
                           handleAutoSave(title, newContent, tags);
                        }}
                        onBlur={() => setSelectAll(false)}
                        onKeyDown={(e) => {
                           if (e.key === 'Escape') {
                              e.preventDefault();
                              setSelectAll(false);
                           }
                        }}
                        className="w-full h-full bg-transparent border-none outline-none font-[family-name:var(--font-mono)] text-[var(--color-text-primary)] leading-relaxed resize-none"
                        style={{ fontSize: '1.006rem' }}
                        spellCheck={false}
                        autoComplete="off"
                     />
                  ) : content === '' && editingLineIndex === null ? (
                     <div
                        onMouseDown={(e) => {
                           e.preventDefault();
                           setEditingLineIndex(0);
                        }}
                        className="text-[var(--color-text-muted)] cursor-text italic py-0.5"
                        style={{ fontSize: '1.006rem' }}
                     >
                        Click to start writing...
                     </div>
                  ) : (
                     lines.map((line, index) =>
                        editingLineIndex === index ? (
                           <input
                              key={index}
                              ref={lineInputRef}
                              type="text"
                              value={line}
                              onChange={(e) => handleLineChange(index, e.target.value)}
                              onKeyDown={(e) => handleLineKeyDown(e, index)}
                              onPaste={(e) => handleLinePaste(e, index)}
                              onBlur={() => setEditingLineIndex(null)}
                              className="w-full bg-transparent border-none outline-none font-[family-name:var(--font-mono)] text-[var(--color-text-primary)] py-0.5 block"
                              style={{ fontSize: '1.006rem', lineHeight: '1.925' }}
                              spellCheck={false}
                              autoComplete="off"
                           />
                        ) : (
                           <div
                              key={index}
                              ref={(el) => {
                                 if (el) lineRefs.current.set(index, el);
                                 else lineRefs.current.delete(index);
                              }}
                              onMouseDown={(e) => {
                                 e.preventDefault();
                                 setEditingLineIndex(index);
                              }}
                              className="cursor-text min-h-[1.5em]"
                           >
                              {line.trim() === '' ? (
                                 <div className="h-[1.5em]" />
                              ) : (
                                 <div className="markdown-line">
                                    <ReactMarkdown
                                       remarkPlugins={[remarkGfm]}
                                       rehypePlugins={[rehypeSanitize]}
                                    >
                                       {line}
                                    </ReactMarkdown>
                                 </div>
                              )}
                           </div>
                        )
                     )
                  )}
               </div>
            </div>

            {/* Zoom controls - right side (always visible) */}
            <div className="absolute right-0 top-0 w-64 py-4 pr-3 pl-2">
               <div className="flex items-center gap-1">
                  <button
                     onClick={() => setFontScale(s => Math.max(50, s - 10))}
                     className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                     title="Decrease font size"
                  >
                     <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[12px] text-[var(--color-text-muted)] w-8 text-center tabular-nums">{fontScale}%</span>
                  <button
                     onClick={() => setFontScale(s => Math.min(200, s + 10))}
                     className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                     title="Increase font size"
                  >
                     <Plus className="h-3.5 w-3.5" />
                  </button>
               </div>
            </div>

            {/* Table of Contents - right side (overlay) */}
            {headings.length > 0 && (
               <div className="absolute right-0 top-10 bottom-0 w-64 overflow-y-auto py-4 pr-3 pl-2 opacity-0 group-hover/editor:opacity-100 transition-opacity duration-300 pointer-events-none group-hover/editor:pointer-events-auto">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] block mb-2">
                     On this page
                  </span>
                  <nav className="flex flex-col gap-0.5">
                     {headings.map((h, i) => (
                        <button
                           key={`${h.lineIndex}-${i}`}
                           onClick={() => scrollToHeading(h.lineIndex)}
                           className="text-left text-[13px] py-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors truncate cursor-pointer"
                           style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                           title={h.text}
                        >
                           {h.text}
                        </button>
                     ))}
                  </nav>
               </div>
            )}
         </div>
      </div>
   );
}
