---
applyTo: "**/*.ts,**/*.tsx"
---

# Project Coding Standards for TypeScript and React

Apply [documents](C:\Users\pisla\Documents\trading-journal-desktop\documents) for the implementation.

## TypeScript Guidelines

### Core Principles

- Use TypeScript for all new code
- Follow functional programming principles where possible
- Prefer immutable data structures and operations
- Prioritize type safety and explicit typing over `any`

### Type Definitions

- Use `interface` for object shapes and data structures
- Use `type` for unions, intersections, and computed types
- Prefer `interface` over `type` for extensible object definitions
- Use generic types for reusable components and utilities
- Define strict types for API responses and external data

### Code Patterns

- Use optional chaining (`?.`) and nullish coalescing (`??`) operators
- Prefer `const` assertions for immutable values
- Use `readonly` for arrays and objects that shouldn't be mutated
- Implement proper error handling with typed error objects
- Use discriminated unions for state management

### Naming Conventions

- Use PascalCase for types, interfaces, and enums
- Use camelCase for variables, functions, and methods
- Prefix interfaces with descriptive names (avoid `I` prefix)
- Use meaningful names that describe the data structure

### Import/Export Standards

- Use named exports over default exports for utilities
- Group imports: external libraries, internal modules, relative imports
- Use type-only imports when importing only for type annotations

```typescript
import type { ComponentProps } from "react";
import { useState, useEffect } from "react";
```

## React Guidelines

### Component Architecture

- Use functional components with hooks exclusively
- Keep components small, focused, and single-responsibility
- Separate business logic into custom hooks
- Use composition over inheritance
- Implement proper component hierarchy and data flow

### Hooks and State Management

- Follow React hooks rules (no conditional hooks, proper dependency arrays)
- Use `useState` for local component state
- Use `useEffect` sparingly and with proper cleanup
- Create custom hooks for reusable stateful logic
- Use `useCallback` and `useMemo` judiciously for performance optimization

### Component Props and Types

- Define explicit prop interfaces for all components
- Use `React.FC<Props>` or function declaration with typed props
- Make props readonly to prevent mutation
- Use discriminated unions for variant props
- Implement proper prop validation and default values

```typescript
interface ButtonProps {
  readonly variant: "primary" | "secondary" | "danger";
  readonly size?: "small" | "medium" | "large";
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant,
  size = "medium",
  disabled = false,
  onClick,
  children,
}) => {
  // Component implementation
};
```

### Event Handling

- Use specific event types instead of generic `Event`
- Implement proper event handler typing
- Use callback functions for event handling
- Prevent default behavior when necessary

```typescript
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  // Handle form submission
};
```

### Performance Optimization

- Use `React.memo` for components that receive stable props
- Implement proper key props for list items
- Avoid inline object/function creation in render
- Use lazy loading for code splitting where appropriate

### Styling Guidelines

- Use CSS Modules for component-scoped styling
- Follow BEM methodology for CSS class naming
- Use CSS custom properties for theming
- Implement responsive design with mobile-first approach
- Keep styling logic separate from component logic

### Error Handling

- Implement Error Boundaries for component error handling
- Use proper error states in components
- Handle async operations with proper loading and error states
- Provide meaningful error messages to users

### Testing Considerations

- Write components that are easy to test
- Use data-testid attributes for testing selectors
- Separate presentational and container components
- Mock external dependencies properly

### Accessibility (a11y)

- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation support
- Provide alternative text for images
- Use proper heading hierarchy
- Test with screen readers

## Code Organization

### File Structure

- Use consistent file naming (kebab-case for files, PascalCase for components)
- Group related components in directories
- Separate types into dedicated files when complex
- Use barrel exports (index.ts) for clean imports

### Component File Structure

```
ComponentName/
├── index.ts (barrel export)
├── ComponentName.tsx (main component)
├── ComponentName.module.css (styles)
├── ComponentName.test.tsx (tests)
├── ComponentName.types.ts (complex types)
└── hooks/ (component-specific hooks)
```

## Best Practices Summary

### Do's

- ✅ Use strict TypeScript configuration
- ✅ Implement comprehensive error handling
- ✅ Write self-documenting code with clear types
- ✅ Use modern React patterns and hooks
- ✅ Implement proper accessibility features
- ✅ Write testable, modular components
- ✅ Use consistent code formatting (Prettier)
- ✅ Implement proper linting rules (ESLint)

### Don'ts

- ❌ Use `any` type without justification
- ❌ Mutate props or state directly
- ❌ Use inline styles for complex styling
- ❌ Ignore accessibility requirements
- ❌ Create overly complex components
- ❌ Skip error boundary implementation
- ❌ Use class components for new development
- ❌ Ignore TypeScript compiler warnings

## Tools and Configuration

### Recommended Tools

- **TypeScript**: Latest stable version with strict configuration
- **ESLint**: With TypeScript and React plugins
- **Prettier**: For consistent code formatting
- **Husky**: For pre-commit hooks
- **Jest + Testing Library**: For testing
- **Storybook**: For component development and documentation
