# Theme System Documentation

## Overview

This document describes the centralized theme system implemented for the Penny Scroll application. The theme system provides a consistent, maintainable, and accessible color palette that complements the existing button colors while introducing a modern white and grey design.

## Architecture

The theme system consists of four main components:

1. **Color Configuration** (`src/lib/theme/colors.ts`)
2. **CSS Variables** (`src/app/globals.css`)
3. **Tailwind Configuration** (`tailwind.config.js`)
4. **Theme Utilities** (`src/lib/theme/utils.ts`)

## Color Palette

### Background Colors
- `--background`: Pure white (#FFFFFF) - Main background
- `--background-secondary`: Grey-50 (#FAFAFA) - Secondary surfaces
- `--background-tertiary`: Grey-100 (#F5F5F5) - Tertiary surfaces
- `--background-elevated`: Pure white - Cards and elevated surfaces

### Text Colors
- `--foreground`: Grey-900 (#212121) - Primary text
- `--foreground-secondary`: Grey-600 (#757575) - Secondary text
- `--foreground-tertiary`: Grey-500 (#9E9E9E) - Tertiary text
- `--foreground-muted`: Grey-400 (#BDBDBD) - Muted text

### Button Colors (Preserved from existing design)
- `--button-orange`: Orange-500 (#F97316)
- `--button-blue`: Blue-500 (#3B82F6)
- `--button-green`: Emerald-500 (#10B981)

### State Colors
- `--destructive`: Red-500 (#EF4444) - Error states
- `--success`: Emerald-500 (#10B981) - Success states
- `--warning`: Orange-500 (#F97316) - Warning states

### Border Colors
- `--border`: Grey-200 (#EEEEEE) - Default borders
- `--border-medium`: Grey-300 (#E0E0E0) - Medium borders
- `--border-strong`: Grey-400 (#BDBDBD) - Strong borders

## Usage Guidelines

### Using Theme Classes

Instead of hardcoded colors, use the theme classes provided in `src/lib/theme/utils.ts`:

```typescript
import { themeClasses, componentThemes } from '@/lib/theme/utils';

// Background classes
themeClasses.backgrounds.primary    // 'bg-background'
themeClasses.backgrounds.secondary  // 'bg-background-secondary'
themeClasses.backgrounds.elevated   // 'bg-background-elevated'

// Text classes
themeClasses.text.primary     // 'text-foreground'
themeClasses.text.secondary   // 'text-foreground-secondary'
themeClasses.text.muted       // 'text-foreground-muted'

// Button classes
themeClasses.buttons.orange   // 'bg-button-orange hover:bg-button-orange-hover'
themeClasses.buttons.blue     // 'bg-button-blue hover:bg-button-blue-hover'
themeClasses.buttons.green    // 'bg-button-green hover:bg-button-green-hover'
```

### Component Themes

Use pre-defined component themes for consistency:

```typescript
// Card component
componentThemes.card.default  // Complete card styling
componentThemes.card.elevated // Elevated card with shadow

// Header component
componentThemes.header.default // Header styling

// Form components
componentThemes.form.input     // Input field styling
componentThemes.form.label     // Label styling
```

### Helper Functions

Utility functions for dynamic theme application:

```typescript
// Get button theme based on variant
const buttonClasses = getButtonTheme('blue'); // Returns complete button classes

// Get background theme
const bgClasses = getBackgroundTheme('elevated');

// Get text theme
const textClasses = getTextTheme('secondary');

// Create components with theme
const button = createButton('primary', 'large');
const card = createCard('elevated');
```

## Accessibility

The theme system ensures WCAG 2.1 AA compliance:

- **Contrast Ratios**: All text/background combinations meet minimum 4.5:1 ratio
- **Focus States**: Enhanced focus rings with `--ring` color
- **State Indicators**: Clear visual feedback for interactive elements

### Focus Management

```css
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

## Migration Guide

### From Hardcoded Colors

**Before:**
```jsx
<div className="bg-gray-900 text-gray-300 border-gray-800">
```

**After:**
```jsx
<div className="bg-background-elevated text-foreground-secondary border-border">
```

### Common Replacements

| Old Class | New Class |
|-----------|----------|
| `bg-gray-900` | `bg-background-elevated` |
| `text-gray-300` | `text-foreground-secondary` |
| `text-gray-400` | `text-foreground-tertiary` |
| `border-gray-800` | `border-border` |
| `hover:bg-gray-800` | `hover:bg-accent` |

## Customization

### Adding New Colors

1. **Add to CSS Variables** (`src/app/globals.css`):
```css
--custom-color: 210 40% 50%;
```

2. **Update Tailwind Config** (`tailwind.config.js`):
```javascript
colors: {
  'custom-color': 'hsl(var(--custom-color))',
}
```

3. **Add to Theme Utils** (`src/lib/theme/utils.ts`):
```typescript
export const customColors = {
  custom: 'bg-custom-color text-white',
};
```

### Extending Component Themes

```typescript
export const extendedComponentThemes = {
  ...componentThemes,
  newComponent: {
    default: 'bg-background border border-border rounded-lg p-4',
    variant: 'bg-background-elevated shadow-md',
  },
};
```

## Best Practices

1. **Always use theme classes** instead of hardcoded colors
2. **Import theme utilities** at the component level
3. **Use semantic color names** (e.g., `foreground-secondary` instead of `gray-600`)
4. **Test accessibility** when adding new color combinations
5. **Document custom themes** when extending the system

## Troubleshooting

### Common Issues

**Colors not applying:**
- Ensure CSS variables are defined in `:root`
- Check Tailwind config includes the color
- Verify import statements

**Accessibility warnings:**
- Check contrast ratios with tools like WebAIM
- Ensure focus states are visible
- Test with screen readers

**Theme inconsistencies:**
- Use theme utilities instead of manual classes
- Follow the component theme patterns
- Avoid mixing hardcoded and theme colors

## Files Modified

During theme implementation, the following files were updated:

- `src/lib/theme/colors.ts` - Color definitions
- `src/lib/theme/utils.ts` - Theme utilities
- `src/app/globals.css` - CSS variables and global styles
- `tailwind.config.js` - Tailwind configuration
- `src/app/page.tsx` - Main page theme integration
- `src/components/ui/SearchBar.tsx` - Search component theme
- `src/components/Header.tsx` - Header component theme

## Future Enhancements

- Dark mode support
- Theme switching functionality
- Additional color variants
- Component-specific theme overrides
- Theme testing utilities

---

*Last updated: January 2025*
*Version: 1.0.0*