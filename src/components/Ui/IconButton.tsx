'use client';

import { Icon } from '@iconify/react';
import type { ButtonHTMLAttributes } from 'react';

type IconButtonVariant = 'ghost' | 'solid' | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: string;
  label: string;
  loading?: boolean;
  active?: boolean;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  tooltip?: string;
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
};

const iconSizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-4.5 w-4.5',
  lg: 'h-5 w-5',
};

const variantClasses: Record<IconButtonVariant, string> = {
  ghost: 'text-[#d4d4d4] hover:bg-[#2a2a2a] hover:text-white',
  solid: 'bg-green-700 text-white hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400',
  danger:
    'border border-red-500/60 text-red-400 hover:border-red-400 hover:bg-red-500/10 hover:text-red-300',
};

export function IconButton({
  icon,
  label,
  loading = false,
  active = false,
  variant = 'ghost',
  size = 'md',
  tooltip,
  className = '',
  disabled,
  type = 'button',
  ...props
}: IconButtonProps) {
  const tooltipText = tooltip ?? label;

  return (
    <span className="group relative inline-flex">
      <button
        type={type}
        aria-label={label}
        disabled={disabled || loading}
        className={`flex shrink-0 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses[size]} ${
          active ? 'bg-[#2a2a2a] text-white' : variantClasses[variant]
        } ${className}`}
        {...props}
      >
        <Icon
          icon={loading ? 'lucide:loader-2' : icon}
          className={`${iconSizeClasses[size]} ${loading ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
      </button>
      {tooltipText ? (
        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 rounded-[6px] bg-white px-2.5 py-1 text-[12px] font-medium whitespace-nowrap text-[#4a4a4a] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          {tooltipText}
        </span>
      ) : null}
    </span>
  );
}
