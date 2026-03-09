import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EditorToolbar } from './EditorToolbar';
import { EditorContextMenu } from './EditorContextMenu';
import { useAutoSave } from '@/hooks/useAutoSave';
import { EDITOR_FONT_SIZE, EDITOR_LINE_HEIGHT, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '@/lib/constants';
import type { Note, UpdateNotePayload } from '@/lib/types';

const sanitizeSchema = {
   ...defaultSchema,
   tagNames: [...(defaultSchema.tagNames ?? []), 'input'],
   attributes: {
      ...defaultSchema.attributes,
      input: ['type', 'checked', 'disabled'],
   },
};

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
   const [fontScale, setFontScale] = useState(100);
   const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lineIndex: number } | null>(null);
   const lineInputRef = useRef<HTMLInputElement>(null);
   const selectAllRef = useRef<HTMLTextAreaElement>(null);
   const pendingCursorRef = useRef<number | null>(null);

   const { isDirty, save, scheduleAutoSave, resetDirty } = useAutoSave(note.id, onSave);
   const lines = useMemo(() => content.split('\n'), [content]);

   useEffect(() => {
      if (selectAll && selectAllRef.current) {
         selectAllRef.current.focus();
         selectAllRef.current.select();
      }
   }, [selectAll]);

   useEffect(() => {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags.map(t => t.name));
      resetDirty();
      setEditingLineIndex(null);
      setSelectAll(false);
   }, [note.id, resetDirty]);

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
      save(title, content, tags);
   }, [title, content, tags, save]);

   const handleTitleChange = (value: string) => {
      setTitle(value);
      scheduleAutoSave(value, content, tags);
   };

   const handleTagKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && tagInput.trim()) {
         e.preventDefault();
         const newTag = tagInput.trim();
         if (!tags.includes(newTag)) {
            const newTags = [...tags, newTag];
            setTags(newTags);
            scheduleAutoSave(title, content, newTags);
         }
         setTagInput('');
      }
   };

   const removeTag = (tag: string) => {
      const newTags = tags.filter(t => t !== tag);
      setTags(newTags);
      scheduleAutoSave(title, content, newTags);
   };

   const togglePin = () => onSave(note.id, { is_pinned: !note.is_pinned });
   const toggleArchive = () => onSave(note.id, { is_archived: !note.is_archived });

   const handleLineChange = (index: number, value: string) => {
      const newLines = [...lines];
      newLines[index] = value;
      const newContent = newLines.join('\n');
      setContent(newContent);
      scheduleAutoSave(title, newContent, tags);
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
      scheduleAutoSave(title, newContent, tags);
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
            scheduleAutoSave(title, newContent, tags);
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
            scheduleAutoSave(title, newContent, tags);
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

   const applyInlineFormat = (wrapper: string) => {
      const input = lineInputRef.current;
      if (!input || editingLineIndex === null) return;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const line = lines[editingLineIndex];
      const selected = line.substring(start, end);
      const newLine = line.substring(0, start) + wrapper + (selected || 'text') + wrapper + line.substring(end);
      handleLineChange(editingLineIndex, newLine);
      requestAnimationFrame(() => {
         if (lineInputRef.current) {
            lineInputRef.current.focus();
            const selStart = start + wrapper.length;
            lineInputRef.current.setSelectionRange(selStart, selStart + (selected || 'text').length);
         }
      });
      setContextMenu(null);
   };

   const applyLinePrefix = (prefix: string) => {
      if (editingLineIndex === null) return;
      const line = lines[editingLineIndex];
      const stripped = line.replace(/^(#{1,6}\s|>\s|- |\d+\.\s)/, '');
      const newLine = prefix + stripped;
      handleLineChange(editingLineIndex, newLine);
      requestAnimationFrame(() => {
         if (lineInputRef.current) {
            lineInputRef.current.focus();
            lineInputRef.current.setSelectionRange(newLine.length, newLine.length);
         }
      });
      setContextMenu(null);
   };

   useEffect(() => {
      if (!contextMenu) return;
      const handleClick = () => setContextMenu(null);
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
   }, [contextMenu]);

   const headings = useMemo(() => {
      return lines
         .map((line, index) => {
            const match = line.match(/^(#{1,6})\s+(.+)/);
            if (!match) return null;
            return { level: match[1].length, text: match[2].replace(/[*_~\[\]]/g, ''), lineIndex: index };
         })
         .filter((h): h is { level: number; text: string; lineIndex: number } => h !== null);
   }, [lines]);

   const lineRefs = useRef<Map<number, HTMLElement>>(new Map());

   const scrollToHeading = (lineIndex: number) => {
      const el = lineRefs.current.get(lineIndex);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setEditingLineIndex(lineIndex);
   };

   return (
      <>
         <div className="group/editor flex flex-col h-full" onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 's') {
               e.preventDefault();
               handleSave();
            }
         }}>
            <EditorToolbar
               isDirty={isDirty}
               isPinned={!!note.is_pinned}
               isArchived={!!note.is_archived}
               onTogglePin={togglePin}
               onToggleArchive={toggleArchive}
               onSave={handleSave}
               onDelete={() => onDelete(note.id)}
            />

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
               <div
                  className="flex-1 overflow-y-auto px-8 py-4 outline-none"
                  tabIndex={0}
                  onKeyDown={(e) => {
                     if (editingLineIndex === null && !selectAll && lines.length > 0) {
                        if (e.key === 'ArrowDown') {
                           e.preventDefault();
                           setEditingLineIndex(0);
                        } else if (e.key === 'ArrowUp') {
                           e.preventDefault();
                           setEditingLineIndex(lines.length - 1);
                        }
                     }
                  }}
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
                              scheduleAutoSave(title, newContent, tags);
                              setSelectAll(false);
                              setEditingLineIndex(null);
                           }}
                           onMouseUp={() => {
                              const ta = selectAllRef.current;
                              if (ta && ta.selectionStart === ta.selectionEnd) {
                                 const pos = ta.selectionStart;
                                 const before = content.substring(0, pos);
                                 const lineIndex = before.split('\n').length - 1;
                                 const lineStart = before.lastIndexOf('\n') + 1;
                                 pendingCursorRef.current = pos - lineStart;
                                 setSelectAll(false);
                                 setEditingLineIndex(lineIndex);
                              }
                           }}
                           onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                 e.preventDefault();
                                 setSelectAll(false);
                                 setEditingLineIndex(null);
                              }
                           }}
                           className="w-full bg-transparent border-none outline-none text-[var(--color-text-primary)] leading-relaxed resize-none"
                           style={{ fontFamily: 'var(--font-sans)', fontSize: EDITOR_FONT_SIZE, minHeight: `${lines.length * parseFloat(EDITOR_LINE_HEIGHT)}em` }}
                           spellCheck={false}
                           autoComplete="off"
                        />
                     ) : content === '' && editingLineIndex === null ? (
                        <div
                           onMouseDown={(e) => {
                              e.preventDefault();
                              setEditingLineIndex(0);
                           }}
                           className="text-[var(--color-text-muted)] italic py-0.5"
                           style={{ fontSize: EDITOR_FONT_SIZE }}
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
                                 onContextMenu={(e) => {
                                    const input = e.currentTarget;
                                    if (input.selectionStart !== input.selectionEnd) {
                                       e.preventDefault();
                                       setContextMenu({ x: e.clientX, y: e.clientY, lineIndex: index });
                                    }
                                 }}
                                 className="w-full bg-transparent border-none outline-none text-[var(--color-text-primary)] py-0.5 block"
                                 style={{ fontFamily: 'var(--font-sans)', fontSize: EDITOR_FONT_SIZE, lineHeight: EDITOR_LINE_HEIGHT }}
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
                                 className="min-h-[1.5em]"
                              >
                                 {line.trim() === '' ? (
                                    <div className="h-[1.5em]" />
                                 ) : (
                                    <div className="markdown-line">
                                       <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                          rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
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

               {/* Zoom controls */}
               <div className="absolute right-0 top-0 w-64 py-4 pr-3 pl-2">
                  <div className="flex items-center gap-1">
                     <button
                        onClick={() => setFontScale(s => Math.max(ZOOM_MIN, s - ZOOM_STEP))}
                        className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                        title="Decrease font size"
                     >
                        <Minus className="h-3.5 w-3.5" />
                     </button>
                     <span className="text-[12px] text-[var(--color-text-muted)] w-8 text-center tabular-nums">{fontScale}%</span>
                     <button
                        onClick={() => setFontScale(s => Math.min(ZOOM_MAX, s + ZOOM_STEP))}
                        className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                        title="Increase font size"
                     >
                        <Plus className="h-3.5 w-3.5" />
                     </button>
                  </div>
               </div>

               {/* Table of Contents */}
               {headings.length > 0 && (
                  <div className="absolute right-0 top-10 bottom-0 w-64 overflow-y-auto py-4 pr-3 opacity-0 group-hover/editor:opacity-100 transition-opacity duration-300 pointer-events-none group-hover/editor:pointer-events-auto">
                     <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] block mb-2 px-0">
                        On this page
                     </span>
                     <nav className="flex flex-col gap-0.5">
                        {headings.map((h, i) => (
                           <button
                              key={`${h.lineIndex}-${i}`}
                              onClick={() => scrollToHeading(h.lineIndex)}
                              className="text-left text-[13px] px-0 py-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors truncate cursor-pointer"

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

         {contextMenu && (
            <EditorContextMenu
               x={contextMenu.x}
               y={contextMenu.y}
               onApplyInlineFormat={applyInlineFormat}
               onApplyLinePrefix={applyLinePrefix}
            />
         )}
      </>
   );
}
