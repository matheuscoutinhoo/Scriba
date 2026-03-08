import { Bold, Italic, Strikethrough, Code, Highlighter, Heading1, Heading2, Heading3, List, ListOrdered, Quote } from 'lucide-react';

interface EditorContextMenuProps {
   x: number;
   y: number;
   onApplyInlineFormat: (wrapper: string) => void;
   onApplyLinePrefix: (prefix: string) => void;
}

const INLINE_FORMATS = [
   { icon: Bold, label: 'Bold', wrapper: '**' },
   { icon: Italic, label: 'Italic', wrapper: '*' },
   { icon: Strikethrough, label: 'Strikethrough', wrapper: '~~' },
   { icon: Code, label: 'Code', wrapper: '`' },
   { icon: Highlighter, label: 'Highlight', wrapper: '==' },
];

const BLOCK_FORMATS = [
   { icon: Heading1, label: 'Heading 1', prefix: '# ' },
   { icon: Heading2, label: 'Heading 2', prefix: '## ' },
   { icon: Heading3, label: 'Heading 3', prefix: '### ' },
   { icon: List, label: 'Bullet List', prefix: '- ' },
   { icon: ListOrdered, label: 'Numbered List', prefix: '1. ' },
   { icon: Quote, label: 'Blockquote', prefix: '> ' },
];

const MENU_BUTTON_CLASS = "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer";

export function EditorContextMenu({ x, y, onApplyInlineFormat, onApplyLinePrefix }: EditorContextMenuProps) {
   return (
      <div
         className="fixed z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-xl py-1 min-w-[180px]"
         style={{ left: x, top: y }}
         onMouseDown={(e) => e.preventDefault()}
      >
         <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
            Formatting
         </div>
         {INLINE_FORMATS.map(({ icon: Icon, label, wrapper }) => (
            <button key={label} onClick={() => onApplyInlineFormat(wrapper)} className={MENU_BUTTON_CLASS}>
               <Icon className="h-3.5 w-3.5" /> {label}
            </button>
         ))}
         <div className="border-t border-[var(--color-border)] my-1" />
         <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
            Block
         </div>
         {BLOCK_FORMATS.map(({ icon: Icon, label, prefix }) => (
            <button key={label} onClick={() => onApplyLinePrefix(prefix)} className={MENU_BUTTON_CLASS}>
               <Icon className="h-3.5 w-3.5" /> {label}
            </button>
         ))}
      </div>
   );
}
