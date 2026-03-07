import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { }

export const Input = forwardRef<HTMLInputElement, InputProps>(
   ({ className, ...props }, ref) => {
      return (
         <input
            className={cn(
               'flex h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:border-transparent transition-colors',
               className
            )}
            ref={ref}
            {...props}
         />
      );
   }
);
Input.displayName = 'Input';
