/**
 * Theme Utility Functions and Constants
 * Provides easy access to centralized theme system for components
 */

import { theme, semanticColors, buttonColors, baseColors } from './colors';
import { cn } from '@/lib/utils';

// Theme utility class names for common patterns
export const themeClasses = {
  // Background variations
  backgrounds: {
    primary: 'bg-background',
    secondary: 'bg-background-secondary',
    tertiary: 'bg-background-tertiary',
    elevated: 'bg-background-elevated shadow-lg backdrop-blur-sm',
    card: 'bg-card/80 backdrop-blur-md border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300',
    cardHover: 'bg-card/90 hover:bg-card border-0 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300',
  },
  
  // Text variations
  text: {
    primary: 'text-foreground',
    secondary: 'text-foreground-secondary',
    tertiary: 'text-foreground-tertiary',
    muted: 'text-foreground-muted',
    inverse: 'text-white',
    link: 'text-button-blue hover:text-button-blue-hover transition-colors',
  },
  
  // Button styles (preserving existing design)
  buttons: {
    // Orange button (primary CTA)
    orange: 'bg-button-orange hover:bg-button-orange-hover text-white font-semibold py-2 px-6 rounded-full shadow-md transition-all duration-200 transform hover:scale-105',
    
    // Blue button
    blue: 'bg-button-blue hover:bg-button-blue-hover text-white font-semibold py-2 px-6 rounded-lg transition-colors',
    
    // Green button (success states)
    green: 'bg-button-green hover:bg-button-green-hover text-white font-semibold py-2 px-6 rounded-lg transition-colors',
    
    // Black to blue gradient (existing design)
    gradientBlackBlue: 'bg-gradient-black-to-blue text-white font-bold uppercase tracking-wide rounded-md transition-all duration-200 active:scale-95 hover:opacity-90',
    
    // Blue to purple gradient (existing design)
    gradientBluePurple: 'bg-gradient-blue-to-purple text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl',
    
    // Secondary button
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-lg transition-colors',
    
    // Ghost button
    ghost: 'hover:bg-accent hover:text-accent-foreground transition-colors',
    
    // Outline button
    outline: 'border border-border hover:bg-accent hover:text-accent-foreground transition-colors',
  },
  
  // Input styles
  inputs: {
    default: 'w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-input-focus transition-colors',
    error: 'w-full px-3 py-2 bg-background border border-destructive rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-destructive transition-colors',
    success: 'w-full px-3 py-2 bg-background border border-success rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-success transition-colors',
  },
  
  // Border styles
  borders: {
    light: 'border-border',
    medium: 'border-border-medium',
    strong: 'border-border-strong',
    focus: 'border-ring',
  },
  
  // Shadow styles
  shadows: {
    sm: 'shadow-theme-sm',
    md: 'shadow-theme-md',
    lg: 'shadow-theme-lg',
    xl: 'shadow-theme-xl',
  },
  
  // State styles
  states: {
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    error: 'text-destructive bg-destructive/10 border-destructive/20',
    info: 'text-button-blue bg-button-blue/10 border-button-blue/20',
  },
} as const;

// Component-specific theme utilities
export const componentThemes = {
  // Card component themes
  card: {
    default: cn(themeClasses.backgrounds.card, 'p-8'),
    hover: cn(themeClasses.backgrounds.cardHover, 'p-8'),
    elevated: cn(themeClasses.backgrounds.elevated, 'p-8 rounded-3xl'),
    compact: cn(themeClasses.backgrounds.card, 'p-6'),
    modern: 'bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-lg border-0 rounded-3xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 p-8',
  },
  
  // Header/Navigation themes
  header: {
    default: 'bg-background-elevated border-b border-border shadow-theme-sm',
    transparent: 'bg-background/80 backdrop-blur-md border-b border-border/50',
    dark: 'bg-slate-900 border-b border-slate-800 text-white',
  },
  
  // Modal/Dialog themes
  modal: {
    overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
    content: 'bg-background-elevated rounded-xl shadow-theme-xl border border-border p-6',
    header: 'border-b border-border pb-4 mb-4',
    footer: 'border-t border-border pt-4 mt-4',
  },
  
  // Form themes
  form: {
    group: 'space-y-2',
    label: 'text-sm font-medium text-foreground',
    helperText: 'text-xs text-foreground-tertiary',
    errorText: 'text-xs text-destructive',
  },
  
  // List/Grid themes
  list: {
    container: 'space-y-2',
    item: 'p-3 rounded-lg hover:bg-background-secondary transition-colors',
    itemActive: 'p-3 rounded-lg bg-accent text-accent-foreground',
  },
  
  // Search/Filter themes
  search: {
    container: 'relative',
    input: cn(themeClasses.inputs.default, 'pl-10 pr-4'),
    icon: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted',
    results: 'absolute top-full left-0 right-0 mt-2 bg-background-elevated border border-border rounded-lg shadow-theme-lg z-50',
  },
} as const;

// Responsive design utilities
export const responsive = {
  // Container sizes
  containers: {
    sm: 'max-w-sm mx-auto px-4',
    md: 'max-w-4xl mx-auto px-4 md:px-6',
    lg: 'max-w-6xl mx-auto px-4 md:px-8',
    xl: 'max-w-7xl mx-auto px-4 md:px-12',
    full: 'w-full px-4 md:px-6',
  },
  
  // Grid layouts
  grids: {
    auto: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    blog: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
    stores: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4',
  },
  
  // Flex layouts
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center justify-center',
  },
} as const;

// Animation utilities
export const animations = {
  // Entrance animations
  entrance: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    scaleIn: 'animate-scale-in',
  },
  
  // Hover animations
  hover: {
    scale: 'transform transition-transform duration-200 hover:scale-105',
    lift: 'transform transition-all duration-200 hover:-translate-y-1 hover:shadow-theme-lg',
    glow: 'transition-shadow duration-300 hover:shadow-theme-xl',
  },
  
  // Loading states
  loading: {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
  },
} as const;

// Accessibility utilities
export const accessibility = {
  // Focus styles
  focus: {
    ring: 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  },
  
  // Screen reader utilities
  screenReader: {
    only: 'sr-only',
    focusable: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0',
  },
  
  // High contrast mode support
  highContrast: {
    border: 'border border-current',
    background: 'bg-current text-background',
  },
} as const;

// Utility functions
export const themeUtils = {
  // Combine theme classes with custom classes
  combine: (...classes: (string | undefined | null | false)[]): string => {
    return cn(...classes);
  },
  
  // Get button theme by variant
  getButtonTheme: (variant: keyof typeof themeClasses.buttons): string => {
    return themeClasses.buttons[variant];
  },
  
  // Get background theme by variant
  getBackgroundTheme: (variant: keyof typeof themeClasses.backgrounds): string => {
    return themeClasses.backgrounds[variant];
  },
  
  // Get text theme by variant
  getTextTheme: (variant: keyof typeof themeClasses.text): string => {
    return themeClasses.text[variant];
  },
  
  // Get state theme by variant
  getStateTheme: (variant: keyof typeof themeClasses.states): string => {
    return themeClasses.states[variant];
  },
  
  // Create custom button with theme
  createButton: ({
    variant = 'blue',
    size = 'md',
    className,
  }: {
    variant?: keyof typeof themeClasses.buttons;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  } = {}): string => {
    const baseTheme = themeClasses.buttons[variant];
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
    
    return cn(baseTheme, sizeClasses[size], className);
  },
  
  // Create custom card with theme
  createCard: ({
    variant = 'default',
    padding = 'md',
    className,
  }: {
    variant?: keyof typeof componentThemes.card;
    padding?: 'sm' | 'md' | 'lg' | 'none';
    className?: string;
  } = {}): string => {
    const baseTheme = componentThemes.card[variant];
    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    };
    
    // Remove default padding if custom padding is specified
    const themeWithoutPadding = baseTheme.replace(/p-\d+/, '');
    
    return cn(themeWithoutPadding, paddingClasses[padding], className);
  },
} as const;

// Export everything for easy access
export {
  theme,
  semanticColors,
  buttonColors,
  baseColors,
};

// Default export
export default {
  classes: themeClasses,
  components: componentThemes,
  responsive,
  animations,
  accessibility,
  utils: themeUtils,
};

// Type definitions
export type ThemeClasses = typeof themeClasses;
export type ComponentThemes = typeof componentThemes;
export type ResponsiveUtils = typeof responsive;
export type AnimationUtils = typeof animations;
export type AccessibilityUtils = typeof accessibility;
export type ThemeUtils = typeof themeUtils;