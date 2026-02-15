/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',   // Scan all app files
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', // Scan components folder
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}'   // Scan pages folder
  ],
  theme: {
    extend: {
      colors: {
        // Base theme colors
        background: {
          DEFAULT: 'hsl(var(--background))',
          secondary: 'hsl(var(--background-secondary))',
          tertiary: 'hsl(var(--background-tertiary))',
          elevated: 'hsl(var(--background-elevated))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          secondary: 'hsl(var(--foreground-secondary))',
          tertiary: 'hsl(var(--foreground-tertiary))',
          muted: 'hsl(var(--foreground-muted))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          hover: 'hsl(var(--card-hover))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          medium: 'hsl(var(--border-medium))',
          strong: 'hsl(var(--border-strong))',
        },
        input: {
          DEFAULT: 'hsl(var(--input))',
          focus: 'hsl(var(--input-focus))',
        },
        ring: 'hsl(var(--ring))',
        
        // Button colors (preserving existing design)
        'button-orange': {
          DEFAULT: 'hsl(var(--button-orange))',
          hover: 'hsl(var(--button-orange-hover))',
        },
        'button-blue': {
          DEFAULT: 'hsl(var(--button-blue))',
          hover: 'hsl(var(--button-blue-hover))',
        },
        'button-green': {
          DEFAULT: 'hsl(var(--button-green))',
          hover: 'hsl(var(--button-green-hover))',
        },
        
        // Modern grey scale (Updated to specified colors)
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
        
        // Semantic color aliases for better DX
        'bg-primary': 'hsl(var(--background))',
        'bg-secondary': 'hsl(var(--background-secondary))',
        'text-primary': 'hsl(var(--foreground))',
        'text-secondary': 'hsl(var(--foreground-secondary))',
        
        // Slate colors for modern sections
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
      },
      
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius)',
        sm: 'var(--radius-sm)',
        xl: 'var(--radius-xl)',
      },
      
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
        'theme-xl': 'var(--shadow-xl)',
      },
      
      backgroundImage: {
        // Preserving existing gradients with CSS variables
        'gradient-black-to-blue': 'linear-gradient(to right, hsl(var(--gradient-black-to-blue-from)), hsl(var(--gradient-black-to-blue-to)))',
        'gradient-blue-to-purple': 'linear-gradient(to right, hsl(var(--gradient-blue-to-purple-from)), hsl(var(--gradient-blue-to-purple-to)))',
        'gradient-cyan-to-purple': 'linear-gradient(to right, hsl(var(--gradient-cyan-to-purple-from)), hsl(var(--gradient-cyan-to-purple-via)), hsl(var(--gradient-cyan-to-purple-to)))',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate')
  ],
}

