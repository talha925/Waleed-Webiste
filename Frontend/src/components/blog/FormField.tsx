'use client';

import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'url' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  maxLength,
  rows = 3,
  className = ''
}) => {
  const baseInputClasses = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-text text-gray-900 bg-white placeholder-gray-500 ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${className}`;

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          rows={rows}
          className={baseInputClasses}
        />
      );
    }

    return (
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className={baseInputClasses}
      />
    );
  };

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {maxLength && (
        <div className="flex justify-between items-center mt-1">
          <span></span>
          <p className="text-gray-500 text-sm">{value.length}/{maxLength}</p>
        </div>
      )}
    </div>
  );
};

export default FormField;