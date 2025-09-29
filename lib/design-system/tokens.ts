// Design System Tokens
// Centralized design tokens for consistent styling across the application

export const designTokens = {
  // Colors
  colors: {
    // Primary palette
    primary: {
      black: '#000000',
      white: '#ffffff',
    },
    
    // Grayscale
    gray: {
      50: '#f8f9fa',
      100: '#e9ecef',
      200: '#dee2e6',
      300: '#ced4da',
      400: '#adb5bd',
      500: '#6c757d',
      600: '#495057',
      700: '#343a40',
      800: '#212529',
      900: '#000000',
    },
    
    // Semantic colors
    semantic: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    
    // Accent colors
    accent: {
      blue: '#0066ff',
      purple: '#8b5cf6',
      green: '#10b981',
      orange: '#f59e0b',
      red: '#ef4444',
      yellow: '#eab308',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      display: ['Inter', 'system-ui', 'sans-serif'],
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    full: '9999px',
  },
  
  // Shadows (Cell-shaded design)
  shadows: {
    cell: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
    'cell-sm': '1px 1px 0px 0px rgba(0, 0, 0, 1)',
    'cell-lg': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
    'cell-inset': 'inset 2px 2px 0px 0px rgba(0, 0, 0, 0.1)',
  },
  
  // Border widths
  borderWidth: {
    thin: '1px',
    medium: '2px',
    thick: '3px',
    extra: '4px',
  },
  
  // Transitions
  transitions: {
    fast: '0.1s ease-out',
    normal: '0.15s ease-out',
    slow: '0.3s ease-out',
  },
  
  // Component sizes
  sizes: {
    button: {
      sm: {
        padding: '0.375rem 0.75rem',
        fontSize: '0.875rem',
        height: '2rem',
      },
      md: {
        padding: '0.5rem 1rem',
        fontSize: '1rem',
        height: '2.5rem',
      },
      lg: {
        padding: '0.75rem 1.5rem',
        fontSize: '1.125rem',
        height: '3rem',
      },
    },
    
    input: {
      sm: {
        padding: '0.25rem 0.5rem',
        fontSize: '0.875rem',
        height: '2rem',
      },
      md: {
        padding: '0.5rem 0.75rem',
        fontSize: '1rem',
        height: '2.5rem',
      },
      lg: {
        padding: '0.75rem 1rem',
        fontSize: '1.125rem',
        height: '3rem',
      },
    },
    
    card: {
      sm: { padding: '0.75rem' },
      md: { padding: '1rem' },
      lg: { padding: '1.5rem' },
    },
  },
  
  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
} as const

// Type definitions for better TypeScript support
export type ColorVariant = keyof typeof designTokens.colors.semantic
export type SizeVariant = 'sm' | 'md' | 'lg'
export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'success' | 'warning'
export type InputVariant = 'default' | 'error' | 'success' | 'warning'
export type CardVariant = 'default' | 'elevated' | 'flat' | 'outlined'

// Utility functions for design tokens
export const getColor = (path: string) => {
  const keys = path.split('.')
  let value: any = designTokens.colors
  
  for (const key of keys) {
    value = value[key]
    if (value === undefined) {
      console.warn(`Color path "${path}" not found in design tokens`)
      return '#000000'
    }
  }
  
  return value
}

export const getSpacing = (size: keyof typeof designTokens.spacing) => {
  return designTokens.spacing[size]
}

export const getShadow = (variant: keyof typeof designTokens.shadows) => {
  return designTokens.shadows[variant]
}
