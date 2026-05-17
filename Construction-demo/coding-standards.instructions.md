---
description: "Use when writing or refactoring TypeScript code. Covers SOLID principles, dependency management, simplicity, error handling, and documentation standards."
applyTo: "src/**/*.{ts,tsx}"
---

# Coding Standards

## SOLID Principles

Apply SOLID principles pragmatically:

- **Single Responsibility**: Each function/class/component has one clear purpose
  - React: One component per file, separate logic (hooks) from UI (components)
  - Components over ~200-300 lines should be split
  - Views orchestrate, components present, hooks contain logic
- **Open/Closed**: Extend behavior through composition, not modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Keep interfaces small and focused
- **Dependency Inversion**: Depend on abstractions, not concretions

## Dependency Management

- Use DI/IoC **ONLY** for app-wide objects (Database, API clients)
- Don't inject simple utilities (formatters, validators, helpers)
- For component-level logic, prefer direct imports and composition

## React Component Architecture

**One Component Per File Rule:**

- Export ONE main component per file
- Small helper components OK if only used in that file
- Separate unrelated components into different files

**Composition Pattern (for 200+ line components):**

```typescript
// Split into:
// 1. hooks/useFeature.ts - State and business logic
// 2. components/FeatureForm.tsx - Form UI
// 3. components/FeatureSuccess.tsx - Success UI
// 4. views/FeatureView.tsx - Orchestration (50-100 lines)

// View example:
export default function FeatureView() {
  const { data, handleSubmit, loading } = useFeature(id);
  if (loading) return <Loading />;
  if (data.submitted) return <FeatureSuccess data={data} />;
  return <FeatureForm data={data} onSubmit={handleSubmit} />;
}
```

**When to Split:**

- Component exceeds ~200-300 lines
- Handles multiple distinct UI sections
- Mixes business logic with presentation
- Complex state obscures the UI

## Error Handling

**Use Result Types for Expected Failures:**

```typescript
type Result<T, E> = { success: true; data: T } | { success: false; error: E };

// Define domain-specific errors
type FeatureError =
  | { type: "validation"; message: string }
  | { type: "not_found"; resource: string }
  | { type: "unknown"; message: string };

// Return Results, don't throw
export async function submitFeature(
  data: Input,
): Promise<Result<Output, FeatureError>> {
  try {
    const result = await save(data);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in submitFeature:", error);
    return { success: false, error: { type: "unknown", message: "Failed" } };
  }
}

// Handle in UI
const result = await submitFeature(data);
if (!result.success) {
  showError(result.error.message); // User-friendly message
}
```

**Key Rules:**

- Result types for expected failures (validation, not found, etc.)
- try-catch for unexpected errors and I/O
- Never silently swallow errors
- User-facing messages vs internal error details
- Log unexpected errors, return generic messages to users

## Documentation

**TSDoc Required for All Exports:**

````typescript
/**
 * Brief description of what the function does.
 *
 * @param paramName - Description
 * @returns Description of return value
 *
 * @example
 * ```ts
 * const result = myFunction(arg);
 * ```
 */
export function myFunction(paramName: Type): ReturnType {
  // implementation
}
````

**Internal Functions: Explain "Why" Not "What":**

```typescript
// Prevent race condition when rapid clicking
const debouncedSubmit = debounce(handleSubmit, 300);
```

## Quick Checklist

- [ ] Each function/class/component has one responsibility
- [ ] React: One component/file, <300 lines, logic in hooks
- [ ] DI only for app-wide objects
- [ ] Result types for expected failures
- [ ] User-facing errors are clear and actionable
- [ ] All exports have TSDoc
- [ ] Internal code has "why" comments for non-obvious logic
