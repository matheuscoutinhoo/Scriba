import { Sun, Moon } from 'lucide-react';

interface ThemeToggleButtonProps {
   theme: 'dark' | 'light';
   onToggle: () => void;
   className?: string;
}

export function ThemeToggleButton({ theme, onToggle, className }: ThemeToggleButtonProps) {
   return (
      <button
         onClick={onToggle}
         className={className ?? "p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"}
         title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
         {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
   );
}
