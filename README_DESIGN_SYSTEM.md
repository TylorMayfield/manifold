# 🎨 Manifold Design System

A comprehensive, consistent, and modular design system for the Manifold ETL platform. Built with TypeScript, React, and Tailwind CSS, following a cell-shaded aesthetic with sharp, clean lines and high contrast.

## ✨ Features

- **🎯 Consistent Styling**: Unified design language across all components
- **♿ Accessible**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **📱 Responsive**: Mobile-first design with responsive breakpoints
- **🔧 TypeScript**: Full type safety with comprehensive prop interfaces
- **🎨 Cell-Shaded Aesthetic**: Bold, sharp design with black borders and shadows
- **🧩 Modular**: Composable components that work together seamlessly
- **⚡ Performance**: Optimized for fast rendering and minimal bundle size

## 🚀 Quick Start

### Installation

The design system is already integrated into the Manifold project. Import components from the UI library:

```tsx
import { 
  CellButton, 
  CellInput, 
  CellCard, 
  FormField,
  CellStack 
} from '@/components/ui'
```

### Basic Usage

```tsx
import React from 'react'
import { CellButton, CellInput, CellCard, FormField } from '@/components/ui'

function MyComponent() {
  return (
    <CellCard padding="lg">
      <FormField label="Email" helper="Enter your email address">
        <CellInput 
          type="email" 
          placeholder="john@example.com"
        />
      </FormField>
      
      <CellButton variant="primary" size="md">
        Submit
      </CellButton>
    </CellCard>
  )
}
```

## 🧩 Component Library

### Core Components

| Component | Description | Variants | Sizes |
|-----------|-------------|----------|-------|
| `CellButton` | Primary interactive element | `primary`, `secondary`, `accent`, `danger`, `ghost` | `sm`, `md`, `lg` |
| `CellInput` | Form input with validation states | `default`, `error`, `success` | `sm`, `md`, `lg` |
| `CellCard` | Container for grouping content | `default`, `elevated`, `flat` | `none`, `sm`, `md`, `lg` |
| `CellSelect` | Dropdown selection | `default`, `error`, `success` | `sm`, `md`, `lg` |
| `CellTextarea` | Multi-line text input | `default`, `error`, `success` | `sm`, `md`, `lg` |

### Form Components

| Component | Description | Features |
|-----------|-------------|----------|
| `CellCheckbox` | Checkbox input | Label, description, validation states |
| `CellRadio` | Radio button input | Group selection, validation states |
| `CellSwitch` | Toggle switch | Boolean values, labels |
| `FormField` | Form field wrapper | Labels, errors, helpers, required indicators |

### Feedback Components

| Component | Description | Variants |
|-----------|-------------|----------|
| `CellAlert` | Alert messages | `success`, `warning`, `error`, `info` |
| `CellBadge` | Status indicators | `default`, `success`, `warning`, `error`, `info`, `accent` |
| `CellProgress` | Progress indicators | `default`, `success`, `warning`, `error` |
| `CellTooltip` | Contextual help | `top`, `bottom`, `left`, `right` |

### Layout Components

| Component | Description | Props |
|-----------|-------------|-------|
| `CellStack` | Flexible container | `direction`, `spacing`, `align`, `justify` |
| `CellGrid` | Responsive grid | `cols`, `gap` |

## 🎨 Design Tokens

### Colors

```typescript
// Primary colors
primary: {
  black: '#000000',
  white: '#ffffff'
}

// Semantic colors
semantic: {
  success: '#22c55e',
  warning: '#f59e0b', 
  error: '#ef4444',
  info: '#3b82f6'
}

// Accent colors
accent: {
  blue: '#0066ff',
  purple: '#8b5cf6',
  green: '#10b981'
}
```

### Typography

```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace']
}

fontSize: {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem'     // 20px
}
```

### Spacing

```typescript
spacing: {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem'       // 32px
}
```

### Shadows

```typescript
shadows: {
  cell: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
  'cell-sm': '1px 1px 0px 0px rgba(0, 0, 0, 1)',
  'cell-lg': '4px 4px 0px 0px rgba(0, 0, 0, 1)'
}
```

## 📋 Usage Patterns

### Form Patterns

```tsx
// ✅ Good: Consistent form structure
<CellStack spacing="lg">
  <FormField label="Email" error={emailError} required>
    <CellInput 
      type="email" 
      value={email}
      onChange={setEmail}
      variant={emailError ? 'error' : 'default'}
    />
  </FormField>
  
  <FormField label="Password" helper="Must be at least 8 characters">
    <CellInput 
      type="password" 
      value={password}
      onChange={setPassword}
    />
  </FormField>
  
  <CellButton 
    variant="primary" 
    disabled={!isValid}
    onClick={handleSubmit}
  >
    Sign In
  </CellButton>
</CellStack>
```

### Layout Patterns

```tsx
// ✅ Good: Composed with layout components
<CellCard padding="lg">
  <CellStack spacing="md">
    <h3>Title</h3>
    <CellInput label="Name" />
    <CellButton variant="primary">Submit</CellButton>
  </CellStack>
</CellCard>

// ✅ Good: Responsive grid
<CellGrid cols={3} gap="lg">
  <CellCard>Item 1</CellCard>
  <CellCard>Item 2</CellCard>
  <CellCard>Item 3</CellCard>
</CellGrid>
```

### Error Handling

```tsx
// ✅ Good: Consistent error display
{error && (
  <CellAlert variant="error" title="Error">
    {error}
  </CellAlert>
)}

// ✅ Good: Inline validation
<FormField label="Email" error={validationError}>
  <CellInput variant={validationError ? 'error' : 'default'} />
</FormField>
```

## 🔄 Migration Guide

### From Legacy Components

```tsx
// Old
<Button className="custom-button">Click me</Button>

// New
<CellButton variant="primary">Click me</CellButton>
```

### Custom Styling

```tsx
// Old
<div className="custom-card border-2 border-gray-300 bg-white p-4">

// New
<CellCard padding="md">Content</CellCard>
```

### Form Fields

```tsx
// Old
<div>
  <label className="block text-sm font-medium mb-2">Name</label>
  <input className="w-full border rounded px-3 py-2" />
</div>

// New
<FormField label="Name">
  <CellInput />
</FormField>
```

## ♿ Accessibility

### Keyboard Navigation
- All interactive elements support keyboard navigation
- Tab order follows logical flow
- Focus indicators are clearly visible with cell-shaded styling

### Screen Readers
- Semantic HTML elements used throughout
- ARIA labels and descriptions where needed
- Proper heading hierarchy

### Color Contrast
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Color is never the only indicator of state

## 📱 Responsive Design

All components are built with mobile-first responsive design:

- **Mobile (320px+)**: Single column layouts, larger touch targets
- **Tablet (768px+)**: Two column layouts, optimized spacing
- **Desktop (1024px+)**: Multi-column layouts, compact spacing

## 🚀 Best Practices

1. **Use the design system**: Always prefer design system components over custom styling
2. **Compose, don't override**: Build complex UIs by composing simple components
3. **Consistent spacing**: Use the spacing scale for all margins and padding
4. **Semantic HTML**: Use proper HTML elements for better accessibility
5. **Type safety**: Leverage TypeScript for component props and design tokens
6. **Performance**: Components are optimized for re-rendering and bundle size

## 🔧 Development

### Adding New Components

1. Create component file in `components/ui/`
2. Follow naming convention: `Cell[ComponentName].tsx`
3. Use consistent prop interfaces and styling patterns
4. Add to `components/ui/index.ts` for export
5. Update this documentation

### Component Structure

```tsx
"use client"

import React from 'react'
import { cn } from '../../lib/utils/cn'

export interface CellComponentProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const CellComponent = React.forwardRef<HTMLElement, CellComponentProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = "border-2 border-black bg-white"
    
    const variants = {
      default: "text-black",
      secondary: "text-gray-600"
    }

    const sizes = {
      sm: "text-sm",
      md: "text-base", 
      lg: "text-lg"
    }

    return (
      <element
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </element>
    )
  }
)

CellComponent.displayName = "CellComponent"

export default CellComponent
```

## 📚 Examples

See `components/examples/DesignSystemDemo.tsx` for comprehensive examples of all components and usage patterns.

## 🤝 Contributing

1. Follow the established patterns and naming conventions
2. Ensure all components are accessible and responsive
3. Add proper TypeScript types
4. Include examples in the demo component
5. Update documentation

This design system ensures consistency, accessibility, and maintainability across the entire Manifold ETL platform.
