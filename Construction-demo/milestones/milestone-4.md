# Milestone 4: Assignments API and DnD Mutations

## Objective

Move assignment operations (add/remove/update) to API-backed mutations.

## Directive

Enforce assignment constraints server-side (mock API) and keep UI responsive.

## Implementation Plan

1. Add MSW handlers:
   - `GET /work-items/:id/assignments`
   - `POST /work-items/:id/assignments`
   - `DELETE /work-items/:id/assignments`
   - `PATCH /work-items/:id/status`
2. Use React Query mutations in drag-end and remove handlers.
3. Enforce constraints in API:
   - Max 1 carried vendor
   - Max 2 backup vendors
   - No duplicates across zones
4. Sync UI via query invalidation or optimistic updates with rollback.

## Verification Steps (Human)

1. Drag vendors into carried/backup/review and verify UI updates correctly.
2. Attempt over-capacity assignment and verify friendly rejection.
3. Remove vendors and verify state and status update correctly.

## No-Data Scenario Handling

- If assignments endpoint returns empty or missing object, normalize to `{ carried: [], backups: [], review: [] }`.
- If mutation references non-existent vendor, show safe inline error and preserve prior UI state.
