---
name: BuildLinka Design System
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#40493d'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#707a6c'
  outline-variant: '#bfcaba'
  surface-tint: '#1b6d24'
  primary: '#0d631b'
  on-primary: '#ffffff'
  primary-container: '#2e7d32'
  on-primary-container: '#cbffc2'
  inverse-primary: '#88d982'
  secondary: '#a83900'
  on-secondary: '#ffffff'
  secondary-container: '#fc6018'
  on-secondary-container: '#531800'
  tertiary: '#6d5100'
  on-tertiary: '#ffffff'
  tertiary-container: '#8c6800'
  on-tertiary-container: '#ffefd6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a3f69c'
  primary-fixed-dim: '#88d982'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005312'
  secondary-fixed: '#ffdbcf'
  secondary-fixed-dim: '#ffb59a'
  on-secondary-fixed: '#380d00'
  on-secondary-fixed-variant: '#802a00'
  tertiary-fixed: '#ffdf9e'
  tertiary-fixed-dim: '#fabd00'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5b4300'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  currency-display:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system is engineered for the construction and project management industry, prioritizing **professionalism, reliability, and structural integrity**. It bridges the gap between rugged job sites and digital precision. 

The visual style is **Corporate / Modern** with a focus on high legibility and clear hierarchies. It utilizes a structured grid, subtle depth, and intentional color placement to ensure that critical data—such as material costs and workforce availability—is easily digestible. The aesthetic is clean and dependable, avoiding unnecessary decorative elements in favor of functional clarity.

## Colors
The color palette is grounded in the "Building Green" philosophy, using deep forest greens to represent growth and stability. 

- **Primary Green:** Used for main branding, successful states, and navigation headers. 
- **Secondary Orange:** Reserved exclusively for Call-to-Action (CTA) elements and critical alerts to ensure high visibility against the green.
- **Accent Amber:** Used for highlighting statuses (e.g., "Pending" or "In Progress") and trade-specific icons.
- **Neutral System:** An off-white background reduces screen glare in outdoor environments, while charcoal text ensures maximum contrast for readability.

## Typography
This design system utilizes **Inter** for its exceptional legibility and neutral, systematic tone. 

- **Numerical Data:** Currency values (₦) should always use `fontWeight: 700` to ensure costs are prominent.
- **Hierarchy:** Use `headline-lg` for screen titles and `label-lg` for form field headers.
- **Mobile Adjustments:** On mobile devices, the `display-lg` style scales down to 28px to prevent awkward text wrapping in narrow containers.

## Layout & Spacing
The layout follows a **fluid grid** model optimized for high-density information. 

- **Mobile:** A 4-column grid with 16px margins. 
- **Desktop:** A 12-column grid with 24px gutters and a maximum content width of 1280px.
- **Rhythm:** All spacing (padding, margins) must be multiples of the 8px base unit to maintain vertical rhythm. Use `md` (16px) for standard internal card padding and `lg` (24px) for section vertical spacing.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and soft ambient shadows. 

- **Surface Levels:** The background sits at the lowest level (`#F5F5F5`). Cards and primary containers sit at Level 1 (`#FFFFFF`) with a subtle 4px blur shadow (5% opacity charcoal).
- **Interactive Depth:** On hover or tap, cards should lift slightly by increasing the shadow blur to 8px and reducing the Y-offset.
- **Headers:** Page headers utilize a subtle linear gradient from `primary-base` to `primary-dark` to create a sense of solid containment at the top of the viewport.

## Shapes
The design system employs a **Rounded** shape language to balance the "hard" nature of construction with a user-friendly digital experience. 

- **Standard Containers:** Cards and input fields use a 0.5rem (8px) radius.
- **Pills:** All chips, status tags, and primary action buttons use a fully rounded "pill" radius (up to 3rem) to distinguish interactive elements from layout containers.

## Components

### Buttons & Chips
- **Primary Button:** Pill-shaped, `secondary-base` background, white text. High-contrast for maximum conversion.
- **Chips:** Used for worker trade categories (e.g., Mason, Electrician). Pill-shaped with a light gray background and `text-secondary`. Active states toggle to `primary-base` with white text.

### Cards
- **Construction Card:** White background, 8px radius, soft ambient shadow. Includes a 4px left-border accent using the trade's specific color or the system `primary-base`.

### Input Fields
- **Standard Input:** 8px radius, 1px border (`#E0E0E0`). On focus, the border transitions to `primary-base` with a 2px width.
- **Currency Input:** Prefixed with the Naira (₦) symbol in a weighted label.

### Navigation
- **Bottom Navigation Bar:** Fixed to the bottom on mobile. 4 tabs (Home, Materials, Workers, Profile). Icons use Material Design "Rounded" style. Active tab uses `primary-base` for the icon and label.

### Feedback & Animations
- **Transitions:** All page entries use a staggered 200ms fade-in for card lists. 
- **States:** Interactive elements must have a distinct "Pressed" state (10% darker overlay) to provide tactile feedback for users in high-activity environments.