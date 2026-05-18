/**
 * @fileoverview Reusable button component with multiple variants and sizes.
 * 
 * A flexible button component that supports different visual styles (variants)
 * and sizes. Extends native HTML button attributes for full compatibility.
 * 
 * @module components/Button
 */

import React from 'react';

/**
 * Available button visual styles.
 * @typedef {'primary' | 'secondary' | 'outline' | 'ghost'} ButtonVariant
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

/**
 * Available button sizes.
 * @typedef {'xs' | 'sm' | 'md' | 'lg'} ButtonSize
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Props for the Button component.
 * Extends all standard HTML button attributes.
 * 
 * @interface ButtonProps
 * @extends {React.ButtonHTMLAttributes<HTMLButtonElement>}
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant (default: 'primary') */
  variant?: ButtonVariant;
  /** Size preset (default: 'md') */
  size?: ButtonSize;
  /** Button content */
  children: React.ReactNode;
}


/**
 * Tailwind CSS classes for each button size.
 * Maps size presets to padding and font styling.
 */
const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-[10px] font-medium',
  sm: 'px-3 py-1.5 text-sm font-medium',
  md: 'px-5 py-2.5 text-md font-medium',
  lg: 'px-7 py-3 text-base font-bold',
};

/**
 * Base Tailwind CSS classes applied to all buttons.
 * Includes rounded corners, transitions, focus styles, and disabled states.
 */
const base =
  'rounded-lg transition-colors focus:ring-2 outline-none focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Tailwind CSS classes for each button variant.
 * Maps variants to color schemes including hover, active, focus, and disabled states.
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 disabled:bg-blue-300',
  secondary:
    'text-white bg-purple-600 border border-purple-700 hover:bg-purple-700 active:bg-purple-800 focus:ring-purple-500 disabled:bg-purple-300',
  outline:
    'text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-100 focus:ring-slate-300 disabled:bg-slate-100',
  ghost:
    'text-slate-600 bg-transparent hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-300 disabled:text-slate-400',
};

/**
 * A styled button component with configurable variants and sizes.
 * Combines base styles, size styles, and variant styles with any additional className.
 * 
 * @param {ButtonProps} props - Component props
 * @returns {JSX.Element} Rendered button element
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Submit
 * </Button>
 * ```
 */
export default function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
