'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface OptimizedTinyMCEWrapperProps {
  id?: string;
  value: string;
  onChange: (content: string, editor: any) => void;
  height?: number;
  placeholder?: string;
  mode?: 'basic' | 'advanced';
  disabled?: boolean;
  onInit?: (evt: any, editor: any) => void;
}

// Memoized configuration to prevent recreation on every render
const createEditorConfig = (
  height: number,
  placeholder: string,
  mode: 'basic' | 'advanced'
) => {
  const baseConfig = {
    height,
    placeholder,
    menubar: mode === 'advanced',
    branding: false,
    promotion: false,
    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; }',
    skin: 'oxide',
    content_css: 'default',
    
    // Performance & Raw HTML optimizations
    convert_urls: false,
    relative_urls: false,
    remove_script_host: false,
    valid_elements: '*[*]',
    extended_valid_elements: 'style[type|id|class],article[*],section[*],details[*],summary[*],div[*],span[*],img[*],a[*],h1[*],h2[*],h3[*],h4[*],h5[*],h6[*],p[*],ul[*],ol[*],li[*],button[*]',
    custom_elements: 'style,article,section,details,summary',
    valid_children: '+body[style],+article[style],+div[style],+body[details],+article[details],+section[details]',
    allow_html_in_named_anchor: true,
    verify_html: false,
    entity_encoding: 'raw' as const,
    cleanup: false,
    cleanup_on_startup: false,
    
    // Accessibility improvements
    a11y_advanced_options: true,
    
    // Image upload handler with retry mechanism and better error handling
    images_upload_handler: function (blobInfo: any, progress: (percent: number) => void): Promise<string> {
      return new Promise<string>(async (resolve, reject) => {
        const maxRetries = 3;
        
        const attemptUpload = async (attempt: number): Promise<void> => {
          try {
            const reader = new FileReader();
            
            reader.onload = function () {
              try {
                const result = reader.result as string;
                // Validate the result before resolving
                if (result && result.startsWith('data:')) {
                  resolve(encodeURI(result));
                } else {
                  throw new Error('Invalid image data');
                }
              } catch (error) {
                throw new Error('Failed to process image');
              }
            };
            
            reader.onerror = function () {
              throw new Error('Image upload failed');
            };
            
            // Add progress tracking
            reader.onprogress = function (e) {
              if (e.lengthComputable) {
                progress((e.loaded / e.total) * 100);
              }
            };
            
            reader.readAsDataURL(blobInfo.blob());
          } catch (error) {
            if (attempt < maxRetries) {
              // Exponential backoff: wait longer between retries
              const delay = 1000 * Math.pow(2, attempt - 1);
              setTimeout(() => attemptUpload(attempt + 1), delay);
            } else {
              reject(`Image upload failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        };
        
        await attemptUpload(1);
      });
    }
  };

  // Mode-specific configurations
  if (mode === 'basic') {
    return {
      ...baseConfig,
      plugins: [
        'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | blocks | bold italic underline | ' +
        'alignleft aligncenter alignright alignjustify | ' +
        'bullist numlist outdent indent | link image | code preview'
    };
  }

  // Advanced mode with standard free plugins
  return {
    ...baseConfig,
    plugins: [
      'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 
      'media', 'searchreplace', 'table', 'visualblocks', 'wordcount', 'code', 'fullscreen',
      'insertdatetime', 'preview', 'help'
    ],
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
      'link image media table | align lineheight | numlist bullist indent outdent | ' +
      'emoticons charmap | removeformat | code fullscreen help'
  };
};

/**
 * OptimizedTinyMCEWrapper - A performance-optimized TinyMCE wrapper
 * Features:
 * - Memoized configuration to prevent unnecessary re-renders
 * - Optimized image upload handling with progress tracking
 * - Basic and advanced modes for different use cases
 * - Better error handling and accessibility
 */
const OptimizedTinyMCEWrapper: React.FC<OptimizedTinyMCEWrapperProps> = memo(({
  id,
  value,
  onChange,
  height = 400,
  placeholder = 'Start typing...',
  mode = 'advanced',
  disabled = false,
  onInit
}) => {
  // Memoize the editor configuration to prevent recreation
  const editorConfig = useMemo(
    () => createEditorConfig(height, placeholder, mode),
    [height, placeholder, mode]
  );

  // Memoized change handler to prevent unnecessary re-renders
  const handleEditorChange = useCallback((content: string, editor: any) => {
    onChange(content, editor);
  }, [onChange]);

  // Memoized init handler
  const handleInit = useCallback((evt: any, editor: any) => {
    // Set up editor optimizations
    editor.on('init', () => {
      // Optimize editor performance
      editor.getBody().style.fontSize = '16px';
      editor.getBody().style.lineHeight = '1.6';
    });

    // Call custom onInit if provided
    if (onInit) {
      onInit(evt, editor);
    }
  }, [onInit]);

  return (
    // @ts-ignore
    <Editor
      apiKey="6be041uk7orm1ngovq1ze4udc28my9puzhlaeosuhcm6g3lg"
      id={id}
      value={value}
      disabled={disabled}
      onEditorChange={handleEditorChange}
      onInit={handleInit}
      init={editorConfig}
    />
  );
});

OptimizedTinyMCEWrapper.displayName = 'OptimizedTinyMCEWrapper';

export default OptimizedTinyMCEWrapper;