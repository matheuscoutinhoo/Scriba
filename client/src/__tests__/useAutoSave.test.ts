import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '@/hooks/useAutoSave';

describe('useAutoSave', () => {
   beforeEach(() => {
      vi.useFakeTimers();
   });

   afterEach(() => {
      vi.useRealTimers();
   });

   it('starts with isDirty false', () => {
      const onSave = vi.fn();
      const { result } = renderHook(() => useAutoSave('note-1', onSave));
      expect(result.current.isDirty).toBe(false);
   });

   it('save calls onSave immediately and clears isDirty', () => {
      const onSave = vi.fn();
      const { result } = renderHook(() => useAutoSave('note-1', onSave));

      act(() => {
         result.current.scheduleAutoSave('Title', 'Content', ['tag']);
      });
      expect(result.current.isDirty).toBe(true);

      act(() => {
         result.current.save('Title', 'Content', ['tag']);
      });
      expect(onSave).toHaveBeenCalledWith('note-1', { title: 'Title', content: 'Content', tags: ['tag'] });
      expect(result.current.isDirty).toBe(false);
   });

   it('scheduleAutoSave sets isDirty and auto-saves after 1500ms', () => {
      const onSave = vi.fn();
      const { result } = renderHook(() => useAutoSave('note-1', onSave));

      act(() => {
         result.current.scheduleAutoSave('Title', 'Content', ['tag']);
      });
      expect(result.current.isDirty).toBe(true);
      expect(onSave).not.toHaveBeenCalled();

      act(() => {
         vi.advanceTimersByTime(1500);
      });
      expect(onSave).toHaveBeenCalledWith('note-1', { title: 'Title', content: 'Content', tags: ['tag'] });
      expect(result.current.isDirty).toBe(false);
   });

   it('debounces multiple scheduleAutoSave calls', () => {
      const onSave = vi.fn();
      const { result } = renderHook(() => useAutoSave('note-1', onSave));

      act(() => {
         result.current.scheduleAutoSave('T1', 'C1', []);
      });
      act(() => {
         vi.advanceTimersByTime(1000);
      });
      act(() => {
         result.current.scheduleAutoSave('T2', 'C2', []);
      });
      act(() => {
         vi.advanceTimersByTime(1500);
      });

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith('note-1', { title: 'T2', content: 'C2', tags: [] });
   });

   it('resetDirty clears isDirty without saving', () => {
      const onSave = vi.fn();
      const { result } = renderHook(() => useAutoSave('note-1', onSave));

      act(() => {
         result.current.scheduleAutoSave('T', 'C', []);
      });
      expect(result.current.isDirty).toBe(true);

      act(() => {
         result.current.resetDirty();
      });
      expect(result.current.isDirty).toBe(false);
      expect(onSave).not.toHaveBeenCalled();
   });

   it('cleans up timer on unmount', () => {
      const onSave = vi.fn();
      const { result, unmount } = renderHook(() => useAutoSave('note-1', onSave));

      act(() => {
         result.current.scheduleAutoSave('T', 'C', []);
      });
      unmount();

      act(() => {
         vi.advanceTimersByTime(2000);
      });
      expect(onSave).not.toHaveBeenCalled();
   });
});
