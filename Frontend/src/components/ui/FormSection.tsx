import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'muted';
  className?: string;
}

const FormSection = ({
  title,
  children,
  variant = 'default',
  className = '',
}: FormSectionProps) => {
  const variantClasses = {
    default: 'bg-white',
    primary: 'bg-blue-50',
    secondary: 'bg-gray-50',
    muted: 'bg-gray-50',
  };

  const titleClasses = {
    default: 'text-gray-800',
    primary: 'text-blue-800',
    secondary: 'text-gray-800',
    muted: 'text-gray-700',
  };

  return (
    <div className={`p-4 rounded-lg ${variantClasses[variant]} ${className}`}>
      <h2 className={`text-xl font-semibold ${titleClasses[variant]} mb-4`}>{title}</h2>
      {children}
    </div>
  );
};

export default FormSection; 