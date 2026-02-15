/**
 * Unified Component Library
 * Consolidates repetitive UI patterns and provides reusable components
 * Follows SOLID principles and component composition patterns
 */

import React, { forwardRef, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Base component interfaces
interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Button variants and sizes
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>, BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

// Input variants and states
type InputVariant = 'default' | 'filled' | 'outline';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, BaseComponentProps {
  variant?: InputVariant;
  size?: InputSize;
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Card component props
interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

// Modal component props
interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

// Loading component props
interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
}

// Alert component props
type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps extends BaseComponentProps {
  variant?: AlertVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
}

// Badge component props
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps extends BaseComponentProps {
  variant?: BadgeVariant;
}

// Form field wrapper props
interface FormFieldProps extends BaseComponentProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  htmlFor?: string;
}

// Utility functions for styling
const getButtonStyles = (variant: ButtonVariant, size: ButtonSize): string => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  };
  
  const sizeStyles = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8 text-lg'
  };
  
  return cn(baseStyles, variantStyles[variant], sizeStyles[size]);
};

const getInputStyles = (variant: InputVariant, size: InputSize, hasError: boolean): string => {
  const baseStyles = 'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const variantStyles = {
    default: '',
    filled: 'bg-muted border-0',
    outline: 'border-2'
  };
  
  const sizeStyles = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base'
  };
  
  const errorStyles = hasError ? 'border-destructive focus-visible:ring-destructive' : '';
  
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], errorStyles);
};

const getCardStyles = (variant: CardProps['variant'], padding: CardProps['padding'], hover: boolean): string => {
  const baseStyles = 'rounded-lg border bg-card text-card-foreground';
  
  const variantStyles = {
    default: 'border-border',
    outlined: 'border-2 border-border',
    elevated: 'shadow-md border-0'
  };
  
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const hoverStyles = hover ? 'transition-shadow hover:shadow-lg' : '';
  
  return cn(baseStyles, variantStyles[variant || 'default'], paddingStyles[padding || 'md'], hoverStyles);
};

// Button Component
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, iconPosition = 'left', children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <button
        className={cn(getButtonStyles(variant, size), className)}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <LoadingSpinner size="sm" className="mr-2" />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Input Component
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', size = 'md', error, helperText, label, required, leftIcon, rightIcon, ...props }, ref) => {
    const hasError = !!error;
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <FormField
        label={label}
        error={error}
        helperText={helperText}
        required={required}
        htmlFor={inputId}
      >
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            className={cn(
              getInputStyles(variant, size, hasError),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            id={inputId}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
      </FormField>
    );
  }
);
Input.displayName = 'Input';

// Card Component
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    return (
      <div
        className={cn(getCardStyles(variant, padding, hover), className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// Modal Component
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  children
}) => {
  React.useEffect(() => {
    if (!closeOnEscape) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);
  
  if (!isOpen) return null;
  
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className={cn(
        'relative bg-background rounded-lg shadow-lg w-full',
        sizeStyles[size],
        className
      )}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b">
            {title && (
              <h2 className="text-lg font-semibold">{title}</h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <span className="sr-only">Close</span>
                ×
              </Button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  className
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  const spinnerComponent = {
    spinner: (
      <div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', sizeStyles[size])} />
    ),
    dots: (
      <div className="flex space-x-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={cn('rounded-full bg-current animate-pulse', {
              'w-1 h-1': size === 'sm',
              'w-2 h-2': size === 'md',
              'w-3 h-3': size === 'lg'
            })}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    ),
    pulse: (
      <div className={cn('rounded bg-current animate-pulse', sizeStyles[size])} />
    )
  };
  
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        {spinnerComponent[variant]}
        {text && (
          <span className="text-sm text-muted-foreground">{text}</span>
        )}
      </div>
    </div>
  );
};

// Alert Component
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  dismissible,
  onDismiss,
  icon,
  className,
  children
}) => {
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };
  
  const defaultIcons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  return (
    <div className={cn(
      'rounded-md border p-4',
      variantStyles[variant],
      className
    )}>
      <div className="flex">
        <div className="flex-shrink-0">
          {icon || defaultIcons[variant]}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <span className="sr-only">Dismiss</span>
              ×
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Badge Component
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className,
  children
}) => {
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground'
  };
  
  return (
    <div className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      variantStyles[variant],
      className
    )}>
      {children}
    </div>
  );
};

// Form Field Wrapper Component
export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required,
  htmlFor,
  className,
  children
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

// Layout Components
export const Container: React.FC<BaseComponentProps & {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centerContent?: boolean;
}> = ({ maxWidth = 'lg', centerContent = false, className, children }) => {
  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  };
  
  return (
    <div className={cn(
      'mx-auto px-4',
      maxWidthStyles[maxWidth],
      centerContent && 'flex items-center justify-center min-h-screen',
      className
    )}>
      {children}
    </div>
  );
};

export const Stack: React.FC<BaseComponentProps & {
  direction?: 'row' | 'column';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}> = ({
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  className,
  children
}) => {
  const spacingStyles = {
    none: '',
    sm: direction === 'row' ? 'space-x-2' : 'space-y-2',
    md: direction === 'row' ? 'space-x-4' : 'space-y-4',
    lg: direction === 'row' ? 'space-x-6' : 'space-y-6'
  };
  
  const alignStyles = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };
  
  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  };
  
  return (
    <div className={cn(
      'flex',
      direction === 'row' ? 'flex-row' : 'flex-col',
      spacingStyles[spacing],
      alignStyles[align],
      justifyStyles[justify],
      className
    )}>
      {children}
    </div>
  );
};

// Export all components
export {
  type ButtonProps,
  type InputProps,
  type CardProps,
  type ModalProps,
  type LoadingProps,
  type AlertProps,
  type BadgeProps,
  type FormFieldProps
};