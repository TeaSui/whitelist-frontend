import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  asChild?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    disabled,
    asChild = false,
    fullWidth = false,
    children, 
    ...props 
  }, ref) => {
    const Comp = 'button';
    
    return (
      <Comp
        className={clsx(
          // Base styles
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          
          // Size variants
          {
            'px-3 py-2 text-sm': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
            'px-8 py-4 text-lg': size === 'xl',
          },
          
          // Color variants
          {
            // Primary
            'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm': 
              variant === 'primary',
            
            // Secondary
            'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500 border border-secondary-200': 
              variant === 'secondary',
            
            // Outline
            'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500 border border-primary-600 hover:border-primary-700': 
              variant === 'outline',
            
            // Ghost
            'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500': 
              variant === 'ghost',
            
            // Danger
            'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 shadow-sm': 
              variant === 'danger',
          },
          
          // Loading state
          {
            'cursor-wait': isLoading,
          },
          
          // Full width
          {
            'w-full': fullWidth,
          },
          
          className
        )}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <div className="mr-2 flex items-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button };