# Milestone 3: Subcontractors by Division API

## Objective

Load subcontractors dynamically per active work item division via API.

## Directive

Remove direct dependency on hardcoded subcontractor arrays in UI flow.

## Implementation Plan

1. Add MSW handler: `GET /divisions/:division/subcontractors`.
2. Add React Query request keyed by division.
3. Feed `ShortlistRightPane` from fetched data.
4. Keep assignment-based client filtering for already-assigned vendors.
5. Add loading, empty, and error UI states for right pane.

## Verification Steps (Human)

1. Switch active work items and confirm subcontractor list refetches by division.
2. Confirm assigned vendors do not appear in right pane.
3. Simulate error and verify right pane shows recoverable message.

## No-Data Scenario Handling

- If division returns no vendors, show "No vendors available for this division."
- Keep DnD source list empty; do not break drop zones.
- Provide a retry action in error state.
