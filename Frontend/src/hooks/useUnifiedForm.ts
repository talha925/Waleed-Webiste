/**
 * Unified Form Management Hook
 * Consolidates form handling logic and eliminates repetitive code
 * Follows SOLID principles and provides type-safe form management
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';

// Form field configuration
interface FieldConfig<T = any> {
  defaultValue?: T;
  validation?: z.ZodSchema<T>;
  transform?: (value: any) => T;
  dependencies?: string[];
  debounceMs?: number;
}

// Form configuration
interface FormConfig<T extends Record<string, any>> {
  fields: {
    [K in keyof T]: FieldConfig<T[K]>;
  };
  validation?: z.ZodSchema<T>;
  onSubmit?: (data: T) => Promise<void> | void;
  onFieldChange?: (field: keyof T, value: T[keyof T], allValues: T) => void;
  onValidationChange?: (errors: FormErrors<T>, isValid: boolean) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  resetOnSubmit?: boolean;
}

// Form state types
type FormErrors<T> = {
  [K in keyof T]?: string[];
} & {
  _form?: string[];
};

type FormTouched<T> = {
  [K in keyof T]?: boolean;
};

interface FormState<T> {
  values: T;
  errors: FormErrors<T>;
  touched: FormTouched<T>;
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;
}

interface FormActions<T> {
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T | '_form', errors: string | string[]) => void;
  setErrors: (errors: FormErrors<T>) => void;
  clearError: (field: keyof T | '_form') => void;
  clearErrors: () => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  setAllTouched: () => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (values?: Partial<T>) => void;
  getFieldProps: (field: keyof T) => FieldProps<T[keyof T]>;
  getFieldState: (field: keyof T) => FieldState;
}

interface FieldProps<T> {
  value: T;
  onChange: (value: T) => void;
  onBlur: () => void;
  name: string;
  error: string | undefined;
  touched: boolean;
}

interface FieldState {
  error: string | undefined;
  touched: boolean;
  hasError: boolean;
}

type UseFormReturn<T> = FormState<T> & FormActions<T>;

// Debounce utility
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

// Main form hook
export function useUnifiedForm<T extends Record<string, any>>(
  config: FormConfig<T>
): UseFormReturn<T> {
  const {
    fields,
    validation,
    onSubmit,
    onFieldChange,
    onValidationChange,
    validateOnChange = true,
    validateOnBlur = true,
    resetOnSubmit = false
  } = config;

  // Initialize default values
  const getDefaultValues = useCallback((): T => {
    const defaultValues = {} as T;
    Object.keys(fields).forEach(key => {
      const field = fields[key as keyof T];
      defaultValues[key as keyof T] = field.defaultValue as T[keyof T];
    });
    return defaultValues;
  }, [fields]);

  // State
  const [state, setState] = useState<FormState<T>>(() => ({
    values: getDefaultValues(),
    errors: {},
    touched: {},
    isSubmitting: false,
    isValidating: false,
    isValid: true,
    isDirty: false,
    submitCount: 0
  }));

  // Refs for tracking
  const initialValuesRef = useRef<T>(getDefaultValues());
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update state helper
  const updateState = useCallback((updates: Partial<FormState<T>>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Validation helpers
  const validateFieldValue = useCallback(async (
    field: keyof T,
    value: T[keyof T],
    allValues: T
  ): Promise<string[]> => {
    const fieldConfig = fields[field];
    const errors: string[] = [];

    // Field-level validation
    if (fieldConfig.validation) {
      try {
        fieldConfig.validation.parse(value);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(...error.issues.map((e: any) => e.message));
        }
      }
    }

    // Form-level validation for this field
    if (validation) {
      try {
        validation.parse(allValues);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors = error.issues
            .filter((e: any) => e.path.includes(field as string))
            .map((e: any) => e.message);
          errors.push(...fieldErrors);
        }
      }
    }

    return errors;
  }, [fields, validation]);

  const validateAllFields = useCallback(async (values: T): Promise<FormErrors<T>> => {
    const errors: FormErrors<T> = {};

    // Validate each field
    await Promise.all(
      Object.keys(fields).map(async (key) => {
        const field = key as keyof T;
        const fieldErrors = await validateFieldValue(field, values[field], values);
        if (fieldErrors.length > 0) {
          (errors as any)[field] = fieldErrors;
        }
      })
    );

    // Form-level validation
    if (validation) {
      try {
        validation.parse(values);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formErrors = error.issues
            .filter((e: any) => e.path.length === 0)
            .map((e: any) => e.message);
          if (formErrors.length > 0) {
            errors._form = formErrors;
          }
        }
      }
    }

    return errors;
  }, [fields, validation, validateFieldValue]);

  // Check if form is dirty
  const checkIsDirty = useCallback((values: T): boolean => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, []);

  // Check if form is valid
  const checkIsValid = useCallback((errors: FormErrors<T>): boolean => {
    return Object.keys(errors).length === 0;
  }, []);

  // Debounced validation
  const debouncedValidation = useDebounce(async (values: T) => {
    updateState({ isValidating: true });
    
    const errors = await validateAllFields(values);
    const isValid = checkIsValid(errors);
    
    updateState({
      errors,
      isValid,
      isValidating: false
    });
    
    onValidationChange?.(errors, isValid);
  }, 300);

  // Actions
  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    const fieldConfig = fields[field];
    
    // Transform value if transformer is provided
    const transformedValue = fieldConfig.transform ? fieldConfig.transform(value) : value;
    
    const newValues = { ...state.values, [field]: transformedValue };
    const isDirty = checkIsDirty(newValues);
    
    updateState({
      values: newValues,
      isDirty
    });
    
    onFieldChange?.(field, transformedValue, newValues);
    
    // Validate on change if enabled
    if (validateOnChange) {
      debouncedValidation(newValues);
    }
    
    // Validate dependent fields
    if (fieldConfig.dependencies) {
      fieldConfig.dependencies.forEach(depField => {
        if (validateOnChange) {
          validateField(depField as keyof T);
        }
      });
    }
  }, [state.values, fields, checkIsDirty, onFieldChange, validateOnChange, debouncedValidation]);

  const setValues = useCallback((values: Partial<T>) => {
    const newValues = { ...state.values, ...values };
    const isDirty = checkIsDirty(newValues);
    
    updateState({
      values: newValues,
      isDirty
    });
    
    if (validateOnChange) {
      debouncedValidation(newValues);
    }
  }, [state.values, checkIsDirty, validateOnChange, debouncedValidation]);

  const setError = useCallback((field: keyof T | '_form', errors: string | string[]) => {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    const newErrors = {
      ...state.errors,
      [field]: errorArray
    };
    const isValid = checkIsValid(newErrors);
    
    updateState({
      errors: newErrors,
      isValid
    });
  }, [state.errors, checkIsValid]);

  const setErrors = useCallback((errors: FormErrors<T>) => {
    const isValid = checkIsValid(errors);
    updateState({ errors, isValid });
  }, [checkIsValid]);

  const clearError = useCallback((field: keyof T | '_form') => {
    const newErrors = { ...state.errors };
    delete newErrors[field];
    const isValid = checkIsValid(newErrors);
    
    updateState({
      errors: newErrors,
      isValid
    });
  }, [state.errors, checkIsValid]);

  const clearErrors = useCallback(() => {
    updateState({
      errors: {},
      isValid: true
    });
  }, []);

  const setTouched = useCallback((field: keyof T, touched: boolean = true) => {
    updateState({
      touched: {
        ...state.touched,
        [field]: touched
      }
    });
  }, [state.touched]);

  const setAllTouched = useCallback(() => {
    const allTouched = {} as FormTouched<T>;
    Object.keys(fields).forEach(key => {
      allTouched[key as keyof T] = true;
    });
    updateState({ touched: allTouched });
  }, [fields]);

  const validateField = useCallback(async (field: keyof T): Promise<boolean> => {
    const errors = await validateFieldValue(field, state.values[field], state.values);
    
    const newErrors = { ...state.errors };
    if (errors.length > 0) {
      (newErrors as any)[field] = errors;
    } else {
      delete newErrors[field];
    }
    
    const isValid = checkIsValid(newErrors);
    
    updateState({
      errors: newErrors,
      isValid
    });
    
    return errors.length === 0;
  }, [state.values, state.errors, validateFieldValue, checkIsValid]);

  const validateForm = useCallback(async (): Promise<boolean> => {
    updateState({ isValidating: true });
    
    const errors = await validateAllFields(state.values);
    const isValid = checkIsValid(errors);
    
    updateState({
      errors,
      isValid,
      isValidating: false
    });
    
    return isValid;
  }, [state.values, validateAllFields, checkIsValid]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    updateState({ isSubmitting: true, submitCount: state.submitCount + 1 });
    setAllTouched();
    
    try {
      const isValid = await validateForm();
      
      if (isValid && onSubmit) {
        await onSubmit(state.values);
        
        if (resetOnSubmit) {
          reset();
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setError('_form', error instanceof Error ? error.message : 'Submission failed');
    } finally {
      updateState({ isSubmitting: false });
    }
  }, [state.values, state.submitCount, validateForm, onSubmit, resetOnSubmit, setAllTouched, setError]);

  const reset = useCallback((values?: Partial<T>) => {
    const resetValues = values ? { ...getDefaultValues(), ...values } : getDefaultValues();
    initialValuesRef.current = resetValues;
    
    setState({
      values: resetValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValidating: false,
      isValid: true,
      isDirty: false,
      submitCount: 0
    });
  }, [getDefaultValues]);

  const getFieldProps = useCallback((field: keyof T): FieldProps<T[keyof T]> => {
    const errors = state.errors[field];
    const error = errors && errors.length > 0 ? errors[0] : undefined;
    
    return {
      value: state.values[field],
      onChange: (value: T[keyof T]) => setValue(field, value),
      onBlur: () => {
        setTouched(field, true);
        if (validateOnBlur) {
          validateField(field);
        }
      },
      name: String(field),
      error,
      touched: !!state.touched[field]
    };
  }, [state.values, state.errors, state.touched, setValue, setTouched, validateOnBlur, validateField]);

  const getFieldState = useCallback((field: keyof T): FieldState => {
    const errors = state.errors[field];
    const error = errors && errors.length > 0 ? errors[0] : undefined;
    
    return {
      error,
      touched: !!state.touched[field],
      hasError: !!error
    };
  }, [state.errors, state.touched]);

  return {
    ...state,
    setValue,
    setValues,
    setError,
    setErrors,
    clearError,
    clearErrors,
    setTouched,
    setAllTouched,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    getFieldProps,
    getFieldState
  };
}

// Convenience hooks for common patterns
export function useSimpleForm<T extends Record<string, any>>(
  defaultValues: T,
  onSubmit?: (data: T) => Promise<void> | void
) {
  const fields = {} as FormConfig<T>['fields'];
  
  Object.keys(defaultValues).forEach(key => {
    fields[key as keyof T] = {
      defaultValue: defaultValues[key as keyof T]
    };
  });
  
  return useUnifiedForm({
    fields,
    onSubmit,
    validateOnChange: false,
    validateOnBlur: false
  });
}

export function useValidatedForm<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  defaultValues: T,
  onSubmit?: (data: T) => Promise<void> | void
) {
  const fields = {} as FormConfig<T>['fields'];
  
  Object.keys(defaultValues).forEach(key => {
    fields[key as keyof T] = {
      defaultValue: defaultValues[key as keyof T]
    };
  });
  
  return useUnifiedForm({
    fields,
    validation: schema,
    onSubmit,
    validateOnChange: true,
    validateOnBlur: true
  });
}