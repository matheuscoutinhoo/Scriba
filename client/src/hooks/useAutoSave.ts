import { useState, useCallback, useRef, useEffect } from 'react';
import type { UpdateNotePayload } from '@/lib/types';
import { AUTO_SAVE_DELAY_MS } from '@/lib/constants';

export function useAutoSave(noteId: string, onSave: (id: string, payload: UpdateNotePayload) => void) {
   const [isDirty, setIsDirty] = useState(false);
   const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

   useEffect(() => {
      return () => {
         if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
   }, [noteId]);

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
      }, AUTO_SAVE_DELAY_MS);
   }, [noteId, onSave]);

   const resetDirty = useCallback(() => setIsDirty(false), []);

   return { isDirty, save, scheduleAutoSave, resetDirty };
}
