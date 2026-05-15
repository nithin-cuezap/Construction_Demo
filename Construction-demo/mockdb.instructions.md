---
applyTo: src/mockDb.ts,src/indexedDb.ts,src/types.ts,src/App.tsx,src/views/**/*.tsx,src/components/**/*.tsx,src/**/*.ops.ts
---

# Data & State Management Rules

## Golden Rules

1. **`.ops.ts` files are the ONLY gateway to mockDb** — No `.tsx` file can import or access `mockDb.ts`
2. **Data persistence goes through `.ops.ts` files** — Any read/write to mockDb must be in an `.ops.ts` file
3. **Data logic lives in `.ops.ts` files** — Transformations, calculations, business logic, and data helpers belong in `.ops.ts`
4. **UI state lives in `.tsx` files** — Local React state, form inputs, animations, and UI toggles belong in components
5. **`.ops.ts` files can import other `.ops.ts` files** — Build utilities and share data operations across `.ops` files

## IndexedDB Persistence & PWA Support

**mockDb now uses IndexedDB for automatic data persistence**, providing:

- **Offline functionality**: All data is saved locally and available offline
- **Session persistence**: Data survives browser refreshes and restarts
- **PWA foundation**: Prepared for Progressive Web App deployment
- **Powered by Dexie.js**: Industry-standard IndexedDB wrapper with TypeScript support

### How It Works

1. **Automatic persistence**: All `mockDb.set*()` operations automatically save to IndexedDB
2. **Initialization**: Data is loaded from IndexedDB on app startup (`main.tsx` calls `mockDb.initialize()`)
3. **Synchronous API**: The mockDb API remains synchronous for backward compatibility
4. **Background sync**: IndexedDB operations happen asynchronously in the background

### Important Files

- **`src/mockDb.ts`**: Main database API with in-memory cache + IndexedDB persistence
- **`src/indexedDb.ts`**: Dexie.js wrapper providing IndexedDB operations
- **`src/main.tsx`**: Initializes database on application startup

### Developer Notes

- **First run**: If no persisted data exists, initial seed data is automatically saved to IndexedDB
- **Data reset**: Use `mockDb.clearPersistedData()` to reset to initial state (useful for testing)
- **No code changes needed**: Existing `.ops.ts` files work unchanged - persistence is automatic

## mockDB is a Data-Only Abstraction

**mockDb is an abstraction for a database and should ONLY store data objects.** Never store UI state, view state, or UI-related objects in mockDb.

- **Store in mockDb**: Business entities (WorkItems, Subcontractors, TenderPackages, Selections, Decisions, etc.)
- **Never store in mockDb**: UI toggles, form states, panel visibility, selected tabs, animations, hover states, etc.
- **UI state belongs in React component state** via `useState()`
- **mockDb is for persistent, shareable data** that represents the actual domain model

This keeps mockDb clean as a true data layer and makes it easy to replace with a real backend API later.

## Where Code Goes

### `.ops.ts` Files (Data Layer)

- Read data from mockDb via `mockDb.get*()` methods
- Write data to mockDb via `mockDb.set*()` methods
- Data transformations and calculations (e.g., `setWorkItemStatus()`, `removeAwardingSub()`)
- Data helper functions (e.g., `getDecisionAssignment()`)
- Data validation and filtering
- Importing other `.ops.ts` files to reuse data logic

### `.tsx` Files (UI Layer)

- Local React state via `useState()` (form inputs, UI toggles, animations, panels, etc.)
- UI logic and event handlers
- Rendering and component composition
- Calling `.ops.ts` functions to load or persist data
- Do NOT import or access `mockDb.ts` directly

## Required Pattern

When data needs to be persisted:

1. **In `.tsx` file**: Call `.ops.ts` function to persist

   ```tsx
   const handleSave = () => {
     persistSelectionData(updatedData); // calls .ops.ts
   };
   ```

2. **In `.ops.ts` file**: Perform transformation and call mockDb
   ```ts
   export function persistSelectionData(data: SelectionDataState) {
     mockDb.setSelectionData(data);
   }
   ```

## Safety Checklist

- Confirm no `.tsx` file imports `mockDb.ts`
- Confirm no `.tsx` file imports `mockDb` or accesses it directly
- Confirm all mockDb operations are in `.ops.ts` files
- Confirm `.ops.ts` files use mockDb get/set methods, not direct object mutation
