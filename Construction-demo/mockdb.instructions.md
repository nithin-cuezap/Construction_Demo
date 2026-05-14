---
applyTo: src/mockDb.ts,src/types.ts,src/App.tsx,src/views/**/*.tsx,src/components/**/*.tsx
---

# mockDB Persistence Rules

Use these rules whenever a change touches app state, workflow state, or data persistence behavior.

## Core Contract

- Treat src/mockDb.ts as the single persistence layer for in-memory app data.
- Read state only through mockDb.get\* methods.
- Persist state only through mockDb.set\* methods.
- Never access or mutate the internal db object directly.

## Update Pattern

- Always perform immutable updates.
- Create new arrays/objects with map/filter/spread before calling setters.
- Keep UI state and mockDb state synchronized in the same flow.

## Required Flow In Components

1. Initialize React state from mockDb.get\*.
2. Update local React state for UI responsiveness.
3. Immediately persist the same next state via mockDb.set\*.

## Workflow Rules

- Workflow stage must come from mockDb.getWorkflowStage and be persisted with setWorkflowStage.
- If changing stage behavior, keep hash routing and workflow stage persistence aligned.
- Preserve the ordered workflow stage progression unless explicitly asked to change it.

## Domain Constraints

- Preserve existing business constraints enforced by UI logic.
- Do not weaken constraints such as max carried/backups in awarding unless explicitly requested.
- Keep tender package control number generation format compatible with current behavior.

## Extending mockDb

When adding a new domain state:

1. Add a strongly typed interface.
2. Add field in MockDbState.
3. Add initial value in db initialization.
4. Add get*/set* pair returning/storing cloned state.
5. Export the new state type if consumed elsewhere.

## Safety Checks Before Finishing

- Confirm no direct mutation of objects returned from getters.
- Confirm setters receive complete, valid next state shapes.
- Confirm UI still re-renders from React state and persists to mockDb.
