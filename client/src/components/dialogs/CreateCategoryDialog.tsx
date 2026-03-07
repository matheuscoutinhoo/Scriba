import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CreateCategoryDialogProps {
   isOpen: boolean;
   onClose: () => void;
   onCreate: (name: string, color: string) => void;
}

const COLORS = [
   '#e11d48', '#f97316', '#eab308', '#22c55e',
   '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

export function CreateCategoryDialog({ isOpen, onClose, onCreate }: CreateCategoryDialogProps) {
   const [name, setName] = useState('');
   const [color, setColor] = useState(COLORS[0]);

   // Reset form state when dialog opens
   useEffect(() => {
      if (isOpen) {
         setName('');
         setColor(COLORS[0]);
      }
   }, [isOpen]);

   if (!isOpen) return null;

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
         onCreate(name.trim(), color);
         setName('');
         setColor(COLORS[0]);
         onClose();
      }
   };

   return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
         <div
            className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
         >
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold">New Category</h2>
               <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
               </Button>
            </div>

            <form onSubmit={handleSubmit}>
               <div className="space-y-4">
                  <div>
                     <label className="text-sm text-[var(--color-text-secondary)] block mb-1.5">
                        Name
                     </label>
                     <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Category name..."
                        autoFocus
                     />
                  </div>

                  <div>
                     <label className="text-sm text-[var(--color-text-secondary)] block mb-1.5">
                        Color
                     </label>
                     <div className="flex gap-2">
                        {COLORS.map((c) => (
                           <button
                              key={c}
                              type="button"
                              onClick={() => setColor(c)}
                              className="w-7 h-7 rounded-full transition-transform cursor-pointer"
                              style={{
                                 backgroundColor: c,
                                 transform: color === c ? 'scale(1.2)' : 'scale(1)',
                                 boxShadow: color === c ? `0 0 0 2px var(--color-bg-secondary), 0 0 0 4px ${c}` : 'none',
                              }}
                           />
                        ))}
                     </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                     <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                     </Button>
                     <Button type="submit" disabled={!name.trim()}>
                        Create
                     </Button>
                  </div>
               </div>
            </form>
         </div>
      </div>
   );
}
