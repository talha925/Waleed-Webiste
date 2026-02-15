import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  as?: 'input' | 'textarea' | 'select';
  children?: React.ReactNode;
}

const FormField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  className = '',
  maxLength,
  as = 'input',
  children,
}: FormFieldProps) => {
  const baseInputClasses = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500 ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${className}`;

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {as === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          className={baseInputClasses}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={5}
        />
      ) : as === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={baseInputClasses}
          disabled={disabled}
        >
          {children}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          className={baseInputClasses}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
        />
      )}
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      
      {maxLength && as !== 'select' && (
        <div className="flex justify-end">
          <p className="text-gray-500 text-sm mt-1">
            {typeof value === 'string' ? value.length : 0}/{maxLength}
          </p>
        </div>
      )}
    </div>
  );
};

export default FormField;