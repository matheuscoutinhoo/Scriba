import { Pin, PinOff, Trash2, Archive, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EditorToolbarProps {
   isDirty: boolean;
   isPinned: boolean;
   isArchived: boolean;
   onTogglePin: () => void;
   onToggleArchive: () => void;
   onSave: () => void;
   onDelete: () => void;
}

export function EditorToolbar({ isDirty, isPinned, isArchived, onTogglePin, onToggleArchive, onSave, onDelete }: EditorToolbarProps) {
   return (
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
         <div className="flex items-center gap-1">
            {isDirty && (
               <span className="text-[10px] text-[var(--color-warning)]">Unsaved</span>
            )}
         </div>

         <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onTogglePin} title={isPinned ? 'Unpin' : 'Pin'}>
               {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onToggleArchive} title={isArchived ? 'Unarchive' : 'Archive'}>
               <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onSave} title="Save (Ctrl+S)">
               <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} title="Delete" className="text-[var(--color-danger)] hover:text-[var(--color-danger)]">
               <Trash2 className="h-4 w-4" />
            </Button>
         </div>
      </div>
   );
}
