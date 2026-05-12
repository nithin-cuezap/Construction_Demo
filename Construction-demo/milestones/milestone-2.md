# Milestone 2: Work Items API Integration

## Objective

Replace local timeout-based loading with query-driven `GET /work-items` API integration.

## Directive

Make state null-safe and rely on server responses as the source of truth.

## Implementation Plan

1. Add MSW handler for `GET /work-items`.
2. Replace `setTimeout` logic in `App` with `useQuery` for work items.
3. Initialize `activeItem` only after successful data fetch.
4. Add loading, error, and empty states for left pane and center pane shell.

## Verification Steps (Human)

1. Open app and verify loading placeholder appears before work items render.
2. Confirm first work item becomes active after fetch.
3. Trigger mock error path and verify user-friendly error UI appears.

## No-Data Scenario Handling

- If API returns `[]`, show:
  - Left pane: "No work items found."
  - Center pane: "Select or create a work item to continue."
- Disable workflow navigation until a work item exists.
