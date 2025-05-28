import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 transform';
    
    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };
    
    // Variant classes
    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-primary-dark hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow',
      secondary: 'bg-secondary text-white hover:bg-secondary-dark hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow',
      accent: 'bg-accent text-white hover:bg-accent-dark hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow',
      outline: 'border-2 border-primary text-primary hover:bg-primary/10 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow',
      ghost: 'text-primary hover:bg-primary/10 hover:-translate-y-1 active:translate-y-0',
    };
    
    // Disabled classes
    const disabledClasses = 'opacity-50 pointer-events-none';
    
    // Combine classes
    const buttonClasses = `
      ${baseClasses}
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${isLoading || disabled ? disabledClasses : ''}
      ${className}
    `;

    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={isLoading || disabled}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {isLoading && (
          <div className="mr-2">
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          </div>
        )}
        
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        
        {children}
        
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;