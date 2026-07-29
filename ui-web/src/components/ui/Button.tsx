'use client';
import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-navy-700 text-white hover:bg-navy-900',
  // Ghost — bordered, neutral text. Default for non-destructive secondary actions.
  secondary: 'bg-white border border-border-button text-text-secondary hover:bg-surface-2',
  // Same shape as secondary but no border — for lower-emphasis inline actions.
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-2',
  // Danger is always ghost/outline — there is no solid danger button in this system.
  danger: 'bg-white border border-border-button text-danger-text hover:bg-danger-soft hover:border-danger',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-[26px] px-[10px] text-[11px] gap-1.5 rounded-[5px]',
  md: 'h-[34px] px-[14px] text-[12px] gap-1.5 rounded-[6px]',
  lg: 'h-[44px] px-6 text-[13.5px] gap-2 rounded-[6px]',
  icon: 'h-[26px] w-[26px] rounded-[5px]',
};

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, fullWidth, disabled, className, children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className={cn('animate-spin', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} /> : children}
    </motion.button>
  );
});

export default Button;
