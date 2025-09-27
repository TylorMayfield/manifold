# Color Palette Guide

This project now uses a custom color palette with 5 main colors, each with 9 shades (100-900).

## Color Palette

### 🎨 Main Colors

| Color         | Hex       | Usage                               |
| ------------- | --------- | ----------------------------------- |
| **Dark Cyan** | `#588b8b` | Primary background, main UI color   |
| **White**     | `#ffffff` | Text, highlights, contrast          |
| **Apricot**   | `#ffd5c2` | Accent elements, secondary actions  |
| **Tangerine** | `#f28f3b` | Primary actions, important elements |
| **Jasper**    | `#c8553d` | Destructive actions, warnings       |

### 🎯 Semantic Mapping

The colors are mapped to semantic roles in the CSS custom properties:

- **Background**: Dark Cyan (500)
- **Primary**: Tangerine (500)
- **Secondary**: Dark Cyan (300)
- **Accent**: Apricot (500)
- **Destructive**: Jasper (500)
- **Foreground**: White

## Usage Examples

### Tailwind Classes

```tsx
// Background colors
<div className="bg-dark_cyan-500">Main background</div>
<div className="bg-dark_cyan-300">Secondary background</div>
<div className="bg-white-100">Light background</div>

// Text colors
<p className="text-white">Primary text</p>
<p className="text-dark_cyan-300">Secondary text</p>
<p className="text-tangerine-500">Accent text</p>

// Button examples
<button className="bg-tangerine-500 hover:bg-tangerine-600 text-white">
  Primary Button
</button>

<button className="bg-apricot-500 hover:bg-apricot-600 text-dark_cyan-300">
  Secondary Button
</button>

<button className="bg-jasper-500 hover:bg-jasper-600 text-white">
  Destructive Button
</button>
```

### CSS Custom Properties

```css
/* Using the semantic color variables */
.my-component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}

.primary-button {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.destructive-button {
  background-color: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
}
```

## Color Shades

Each color has 9 shades (100-900):

- **100**: Darkest shade
- **200-400**: Dark shades
- **500**: Default/main shade
- **600-800**: Light shades
- **900**: Lightest shade

### Example Usage of Shades

```tsx
// Dark cyan shades
<div className="bg-dark_cyan-100">Very dark cyan</div>
<div className="bg-dark_cyan-500">Default dark cyan</div>
<div className="bg-dark_cyan-900">Very light cyan</div>

// Tangerine shades
<button className="bg-tangerine-300">Dark tangerine</button>
<button className="bg-tangerine-500">Default tangerine</button>
<button className="bg-tangerine-700">Light tangerine</button>
```

## Design Guidelines

### 🎨 Color Combinations

**Recommended combinations:**

- Dark Cyan + White (high contrast)
- Tangerine + White (vibrant, attention-grabbing)
- Apricot + Dark Cyan (warm, friendly)
- Jasper + White (urgent, important)

### 🚫 Avoid These Combinations

- White + Apricot (low contrast)
- Dark Cyan + Jasper (both muted, hard to distinguish)
- Tangerine + Apricot (too similar, confusing)

### 📱 Accessibility

- Always ensure sufficient contrast ratios
- Use Dark Cyan 300+ for text on light backgrounds
- Use White for text on dark backgrounds
- Test with color blindness simulators

## Implementation Notes

- Colors are defined in `tailwind.config.js`
- CSS custom properties are in `app/globals.css`
- All colors use HSL values for better manipulation
- The palette is designed for both light and dark themes

## Demo Component

Check out `components/ColorPaletteDemo.tsx` for a visual demonstration of all colors and usage examples.

