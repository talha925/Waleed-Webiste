/**
 * Centralized Theme Color Configuration
 * Modern, clean color palette with white and grey tones
 * Preserves existing button colors while ensuring accessibility
 */

// Base color palette - Modern white and grey tones (Updated to specified colors)
export const baseColors = {
  // Pure whites
  white: '#FFFFFF',
  
  // Modern greys (updated to specified color palette)
  grey: {
    50: '#F9FAFB',   // Soft white-gray (specified primary background)
    100: '#F3F4F6',  // Secondary background (specified)
    200: '#E5E7EB',  // Light grey for borders and dividers
    300: '#D1D5DB',  // Medium-light grey for inactive elements
    400: '#9CA3AF',  // Medium grey for placeholders
    500: '#6B7280',  // Softer gray for secondary text (specified)
    600: '#4B5563',  // Medium-dark grey
    700: '#374151',  // Darker grey for emphasis
    800: '#1F2937',  // Very dark grey
    900: '#111827',  // Dark gray for primary text (specified)
  },
  
  // Cool greys (for modern, tech-focused sections)
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
} as const;

// Existing button colors (preserved from current design)
export const buttonColors = {
  // Primary orange button (from StoreCard)
  orange: {
    primary: '#F97316',    // orange-500
    hover: '#EA580C',      // orange-600
    light: '#FED7AA',      // orange-200
    dark: '#C2410C',       // orange-700
  },
  
  // Black to blue gradient (from StoreCard and StoreClient)
  gradient: {
    blackToBlue: {
      from: '#000000',
      to: '#1E40AF',       // blue-800
      hover: {
        from: '#1E40AF',
        to: '#000000',
      }
    },
    
    // Blue to purple gradient (from homepage)
    blueToPurple: {
      from: '#2563EB',     // blue-600
      to: '#9333EA',       // purple-600
      light: {
        from: '#60A5FA',   // blue-400
        to: '#A855F7',     // purple-500
      }
    },
    
    // Cyan to purple (from homepage categories)
    cyanToPurple: {
      from: '#06B6D4',     // cyan-500
      via: '#2563EB',      // blue-600
      to: '#9333EA',       // purple-600
    }
  },
  
  // Green for success states
  green: {
    primary: '#10B981',    // emerald-500
    hover: '#059669',      // emerald-600
    light: '#A7F3D0',      // emerald-200
  },
  
  // Blue accents
  blue: {
    primary: '#3B82F6',    // blue-500
    hover: '#2563EB',      // blue-600
    light: '#DBEAFE',      // blue-100
    dark: '#1E40AF',       // blue-800
  }
} as const;

// Semantic color mapping for different UI contexts (Updated to specified colors)
export const semanticColors = {
  // Background colors (Updated to specified colors)
  background: {
    primary: baseColors.grey[50],    // #F9FAFB - specified primary background
    secondary: baseColors.grey[100], // #F3F4F6 - specified secondary background
    tertiary: baseColors.grey[200],  // #E5E7EB - tertiary background
    elevated: baseColors.white,      // Pure white for cards
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Surface colors (cards, panels, etc.)
  surface: {
    primary: baseColors.white,
    secondary: baseColors.grey[50],  // #F9FAFB
    elevated: baseColors.white,
    hover: baseColors.grey[100],     // #F3F4F6
    pressed: baseColors.grey[200],   // #E5E7EB
  },
  
  // Border colors
  border: {
    light: baseColors.grey[200],     // #E5E7EB
    medium: baseColors.grey[300],    // #D1D5DB
    strong: baseColors.grey[400],    // #9CA3AF
    focus: buttonColors.blue.primary,
  },
  
  // Text colors (Updated to specified colors)
  text: {
    primary: baseColors.grey[900],   // #111827 - specified primary text
    secondary: baseColors.grey[500], // #6B7280 - specified secondary text
    tertiary: baseColors.grey[400],  // #9CA3AF - muted text
    disabled: baseColors.grey[300],  // #D1D5DB - disabled text
    inverse: baseColors.white,
    link: buttonColors.blue.primary,
    linkHover: buttonColors.blue.hover,
  },
  
  // State colors
  state: {
    success: buttonColors.green.primary,
    warning: buttonColors.orange.primary,
    error: '#EF4444',      // red-500
    info: buttonColors.blue.primary,
  },
  
  // Interactive elements
  interactive: {
    primary: buttonColors.blue.primary,
    primaryHover: buttonColors.blue.hover,
    secondary: baseColors.grey[100],
    secondaryHover: baseColors.grey[200],
  }
} as const;

// Shadow definitions for depth and elevation
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;

// Spacing scale for consistent layout
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const;

// Border radius for consistent rounded corners
export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// Typography scale
export const typography = {
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  }
} as const;

// Export the complete theme object
export const theme = {
  colors: {
    ...baseColors,
    ...semanticColors,
    buttons: buttonColors,
  },
  shadows,
  spacing,
  borderRadius,
  typography,
} as const;

// Type definitions for TypeScript support
export type BaseColors = typeof baseColors;
export type ButtonColors = typeof buttonColors;
export type SemanticColors = typeof semanticColors;
export type Theme = typeof theme;

// Helper function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper function to get HSL values for CSS variables
export const toHSL = (hex: string): string => {
  // Convert hex to RGB first
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export default theme;