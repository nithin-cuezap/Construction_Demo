import React from 'react';


export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}


const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-[10px] font-medium', // new size, much smaller than before
  sm: 'px-3 py-1.5 text-sm font-medium', // much smaller than before
  md: 'px-5 py-2.5 text-md font-medium',
  lg: 'px-7 py-3 text-base font-bold',
};

const base =
  'rounded-lg transition-colors focus:ring-2 outline-none focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 disabled:bg-blue-300',
  secondary:
    'text-white bg-purple-600 border border-purple-700 hover:bg-purple-700 active:bg-purple-800 focus:ring-purple-500 disabled:bg-purple-300',
  outline:
    'text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-100 focus:ring-slate-300 disabled:bg-slate-100',
};

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
