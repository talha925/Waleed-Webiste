'use client';

import React, { Suspense, lazy, memo, useState, useCallback, useId } from 'react';
import { LoadingSpinner } from '@/components/common/UnifiedComponents';

// Dynamically import the optimized TinyMCE wrapper with better chunk splitting
const OptimizedTinyMCEWrapper = lazy(() => 
  import('./OptimizedTinyMCEWrapper').then(module => ({
    default: module.default
  }))
);

interface OptimizedRichTextEditorProps {
  id?: string;
  value: string;
  onChange: (content: string, editor?: any) => void;
  label?: string;
  error?: string;
  height?: number;
  placeholder?: string;
  mode?: 'basic' | 'advanced';
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
}

// Error boundary component for TinyMCE
const TinyMCEErrorBoundary: React.FC<{ 
  children: React.ReactNode;
  onError?: () => void;
}> = ({ children, onError }) => {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (error.message?.includes('tinymce') || error.filename?.includes('tinymce')) {
        setHasError(true);
        onError?.();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  if (hasError) {
    return (
      <div className="border border-red-300 rounded-md p-4 bg-red-50">
        <div className="text-red-600 text-sm">
          <p className="font-medium">Editor failed to load</p>
          <p className="mt-1">Please refresh the page or try again later.</p>
          <button 
            onClick={() => setHasError(false)}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Enhanced loading component with better UX
const EditorLoadingFallback: React.FC<{ height: number }> = memo(({ height }) => (
  <div 
    className="border border-gray-300 rounded-md p-4 flex flex-col items-center justify-center bg-gray-50 transition-all duration-200"
    style={{ height: Math.max(height, 200) }}
  >
    <LoadingSpinner size="md" text="Loading editor..." />
    <div className="mt-2 text-xs text-gray-500">
      This may take a moment on first load
    </div>
  </div>
));

EditorLoadingFallback.displayName = 'EditorLoadingFallback';

/**
 * OptimizedRichTextEditor - A performance-optimized rich text editor
 * Features:
 * - Dynamic imports with proper code splitting
 * - Error boundaries for graceful failure handling
 * - Enhanced loading states with better UX
 * - Memoization to prevent unnecessary re-renders
 * - Accessibility improvements
 */
const OptimizedRichTextEditor: React.FC<OptimizedRichTextEditorProps> = memo(({
  id,
  value,
  onChange,
  label,
  error,
  height = 400,
  placeholder = 'Start typing...',
  mode = 'advanced',
  disabled = false,
  required = false,
  helperText
}) => {
  const [editorError, setEditorError] = useState(false);

  // Memoized change handler
  const handleChange = useCallback((content: string, editor?: any) => {
    onChange(content, editor);
    
    // Auto-save to localStorage for draft functionality
    if (id) {
      try {
        localStorage.setItem(`editor-draft-${id}`, content);
      } catch (error) {
        // Silently fail if localStorage is not available
        console.warn('Failed to save draft:', error);
      }
    }
  }, [onChange, id]);

  // Handle editor errors
  const handleEditorError = useCallback(() => {
    setEditorError(true);
  }, []);

  // Generate unique ID using useId to ensure hydration stability
  const reactId = useId();
  const editorId = id || `rich-text-editor-${reactId}`;

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label
          htmlFor={editorId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-sm text-gray-600">{helperText}</p>
      )}

      {/* Editor */}
      <TinyMCEErrorBoundary onError={handleEditorError}>
        <Suspense fallback={<EditorLoadingFallback height={height} />}>
          <div className={`transition-opacity duration-200 ${disabled ? 'opacity-50' : ''}`}>
            <OptimizedTinyMCEWrapper
              id={editorId}
              value={value}
              onChange={handleChange}
              height={height}
              placeholder={placeholder}
              mode={mode}
              disabled={disabled}
            />
          </div>
        </Suspense>
      </TinyMCEErrorBoundary>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Editor-specific error */}
      {editorError && (
        <p className="text-sm text-amber-600" role="alert">
          Editor encountered an issue. Some features may not work properly.
        </p>
      )}
    </div>
  );
});

OptimizedRichTextEditor.displayName = 'OptimizedRichTextEditor';

export default OptimizedRichTextEditor;