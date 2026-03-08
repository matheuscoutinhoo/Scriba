import { useState, useCallback, useRef, useEffect } from 'react';
import type { UpdateNotePayload } from '@/lib/types';

export function useAutoSave(noteId: string, onSave: (id: string, payload: UpdateNotePayload) => void) {
   const [isDirty, setIsDirty] = useState(false);
   const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

   useEffect(() => {
      return () => {
         if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
   }, []);

   const save = useCallback((title: string, content: string, tags: string[]) => {
      onSave(noteId, { title, content, tags });
      setIsDirty(false);
   }, [noteId, onSave]);

   const scheduleAutoSave = useCallback((title: string, content: string, tags: string[]) => {
      setIsDirty(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
         onSave(noteId, { title, content, tags });
         setIsDirty(false);
      }, 1500);
   }, [noteId, onSave]);

   const resetDirty = useCallback(() => setIsDirty(false), []);

   return { isDirty, save, scheduleAutoSave, resetDirty };
}
