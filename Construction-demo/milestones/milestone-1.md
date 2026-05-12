# Milestone 1: Dependencies and Scaffolding

## Objective

Set up foundational libraries and project scaffolding for API mocking, query state management, and testability.

## Directive

Use proven libraries instead of custom infrastructure. Keep this milestone focused on setup only.

## Implementation Plan

1. Install runtime dependencies:
   - `@tanstack/react-query`
   - `@tanstack/react-query-devtools`
   - `msw`
   - `zod`
   - `@faker-js/faker`
   - `nanoid`
2. Install dev dependencies:
   - `vitest`
   - `@testing-library/react`
   - `@testing-library/user-event`
   - `@testing-library/jest-dom`
   - `jsdom`
3. Add `QueryClientProvider` in app bootstrap.
4. Initialize MSW browser worker and add a `GET /health` handler.
5. Configure Vitest with jsdom and an MSW node test server for integration-like UI tests.

## Verification Steps (Human)

1. Run `pnpm dev` and confirm app starts.
2. Confirm MSW worker is active in browser console.
3. Trigger `GET /health` manually (dev console fetch) and confirm `{ ok: true }` response.
4. Run `pnpm test` and verify baseline test passes.

## No-Data Scenario Handling

- If MSW fails to start, show a non-blocking banner: "Mock services offline."
- Continue rendering app shell with disabled data-dependent actions.
- In tests, keep deterministic behavior using MSW node server even when browser worker is unavailable.
