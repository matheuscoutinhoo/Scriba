import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export function Badge({ children, color, className, onClick }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        backgroundColor: color ? `${color}20` : 'var(--color-accent-soft)',
        color: color || 'var(--color-accent)',
        border: `1px solid ${color ? `${color}40` : 'rgba(225, 29, 72, 0.3)'}`,
      }}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
