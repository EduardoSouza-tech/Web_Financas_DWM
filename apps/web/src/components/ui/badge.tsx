import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'secondary';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-primary/10 text-primary border-primary/20',
      success: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      info: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      outline: 'bg-background border-border text-foreground',
      secondary: 'bg-secondary/50 text-secondary-foreground border-secondary',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
