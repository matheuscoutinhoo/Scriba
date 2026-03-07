import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
   ({ className, ...props }, ref) => {
      return (
         <textarea
            className={cn(
               'flex min-h-[200px] w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] font-[family-name:var(--font-mono)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:border-transparent resize-none transition-colors leading-relaxed',
               className
            )}
            ref={ref}
            {...props}
         />
      );
   }
);
Textarea.displayName = 'Textarea';
