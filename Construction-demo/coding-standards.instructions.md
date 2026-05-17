---
description: "Use when writing or refactoring TypeScript code. Covers SOLID principles, dependency management, simplicity, error handling, and documentation standards."
applyTo: ["src/**/*.ts", "src/**/*.tsx"]
---

# Coding Standards

## SOLID Principles

Apply SOLID principles pragmatically:

- **Single Responsibility**: Each function/class has one clear purpose
- **Open/Closed**: Extend behavior through composition, not modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Keep interfaces small and focused
- **Dependency Inversion**: Depend on abstractions, not concretions

## Dependency Management

**Use Dependency Injection/Inversion of Control ONLY for application-wide objects:**

```typescript
// ✅ Good: Application-wide services
interface Database { query(sql: string): Promise<any> }
function createApp(db: Database) { /* inject database */ }

// ❌ Avoid: Over-engineering simple utilities
// Don't inject formatters, validators, or simple helpers
function formatDate(date: Date): string { /* direct implementation */ }
```

**For component-level logic, prefer direct imports and composition.**

## Simplicity Over Complexity

- Choose the simplest solution that meets requirements
- Avoid premature abstraction and over-engineering
- Refactor when patterns emerge, not speculatively
- Prefer pure functions over stateful classes when possible
- Keep indirection minimal—favor clarity over clever patterns

## Error Handling Patterns

**Handle errors at the appropriate level:**

```typescript
// ✅ Good: Handle at operation level, return Result types
export async function submitBid(bidData: BidInput): Promise<Result<Bid, BidError>> {
  try {
    const validated = validateBid(bidData);
    const saved = await db.bids.add(validated);
    return { success: true, data: saved };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: { type: 'validation', message: error.message } };
    }
    // Log unexpected errors, return generic message to user
    console.error('Unexpected error in submitBid:', error);
    return { success: false, error: { type: 'unknown', message: 'Failed to submit bid' } };
  }
}

// ❌ Avoid: Silent failures or swallowing errors
try {
  await riskyOperation();
} catch {
  // Don't ignore errors
}
```

**Define domain-specific error types:**

```typescript
type BidError = 
  | { type: 'validation'; message: string; field?: string }
  | { type: 'duplicate'; existingBidId: string }
  | { type: 'deadline_passed'; deadline: Date }
  | { type: 'unknown'; message: string };

type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

**UI error handling:**

```typescript
// Show user-friendly messages, log technical details
const result = await submitBid(bidData);
if (!result.success) {
  switch (result.error.type) {
    case 'validation':
      showError(`Invalid input: ${result.error.message}`);
      break;
    case 'deadline_passed':
      showError('The submission deadline has passed');
      break;
    default:
      showError('An unexpected error occurred. Please try again.');
  }
}
```

**Key principles:**

- Return Result types instead of throwing exceptions for expected failures
- Use try-catch for unexpected errors and I/O operations
- Never silently swallow errors—log or handle them
- Distinguish between user-facing messages and internal error details
- Validate input early, fail fast with clear error messages

## TSDoc Comments (Mandatory)

**All exported functions, classes, interfaces, and types require TSDoc:**

```typescript
/**
 * Calculates the total cost of materials for a tender package.
 * 
 * @param materials - Array of materials with quantities and unit prices
 * @param taxRate - Tax rate as decimal (e.g., 0.15 for 15%)
 * @returns Total cost including tax
 * 
 * @example
 * ```ts
 * const total = calculateMaterialCost(materials, 0.15);
 * ```
 */
export function calculateMaterialCost(
  materials: Material[],
  taxRate: number
): number {
  // implementation
}
```

**Internal/private functions should have concise comments explaining "why", not "what":**

```typescript
// Filter out expired bids before processing awards
function removeExpiredBids(bids: Bid[]): Bid[] { /* ... */ }
```

## Quick Checklist

Before committing code, verify:

- [ ] Each function/class has one clear responsibility
- [ ] DI/IoC used only for app-wide objects (DB, API clients, etc.)
- [ ] Solution is simple and meets current requirements
- [ ] Errors are handled appropriately (Result types for expected failures)
- [ ] User-facing error messages are clear and actionable
- [ ] All exports have complete TSDoc comments
- [ ] Internal logic has "why" comments for non-obvious decisions
