---
name: UI Component Development
description: Create reusable UI components
---

# UI Component Development

Guidelines for creating consistent components.

## Component Structure

```
components/
├── ui/           # Atomic (Button, Input)
├── layout/       # Layout (Navbar, Footer)
├── features/     # Feature-specific
└── shared/       # Shared utilities
```

## Component Template

### React/Vue Basic
```jsx
interface ComponentProps {
  /** Primary content */
  title: string;
  /** Visual variant */
  variant?: 'primary' | 'secondary';
  /** Children elements */
  children?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional classes */
  className?: string;
}

export function Component({
  title,
  variant = 'primary',
  children,
  onClick,
  className = '',
}: ComponentProps) {
  return (
    <div 
      className={`base-styles ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      <h3>{title}</h3>
      {children}
    </div>
  );
}
```

### With State
```jsx
'use client'; // Next.js

import { useState } from 'react';

export function Toggle() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <button onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? 'Close' : 'Open'}
    </button>
  );
}
```

## Styling Patterns

### Variant System
```javascript
const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-white text-gray-900 border hover:bg-gray-50',
  ghost: 'text-gray-600 hover:bg-gray-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};
```

### Combining Classes
```javascript
function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Usage
className={cx(
  'base-class',
  isActive && 'active-class',
  className
)}
```

## Common Components

### Button
```jsx
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  ...props
}) {
  return (
    <button
      className={cx(variants[variant], sizes[size])}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
```

### Input
```jsx
export function Input({
  label,
  error,
  ...props
}) {
  return (
    <div>
      {label && <label>{label}</label>}
      <input className={error ? 'border-red-500' : ''} {...props} />
      {error && <span className="text-red-500">{error}</span>}
    </div>
  );
}
```

### Card
```jsx
export function Card({ children, className }) {
  return (
    <div className={cx('bg-white rounded-lg shadow p-4', className)}>
      {children}
    </div>
  );
}
```

## Accessibility

- [ ] Semantic HTML
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus indicators
- [ ] Color contrast

```jsx
<button
  aria-label="Close menu"
  aria-expanded={isOpen}
  onClick={toggle}
>
  <Icon aria-hidden="true" />
</button>
```

## Component Checklist

- [ ] Props typed/documented
- [ ] Variants supported
- [ ] className extensible
- [ ] Responsive
- [ ] Accessible
- [ ] Tested
