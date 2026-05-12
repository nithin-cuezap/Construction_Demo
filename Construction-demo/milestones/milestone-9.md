# Milestone 9: Test Coverage for Core Workflow

## Objective

Add automated tests for critical data, transition, and awarding behaviors.

## Directive

Focus on user-observable behavior and no-data resilience.

## Implementation Plan

1. Add UI tests for:
   - Work item loading and empty state
   - Division subcontractor loading and empty state
   - Assignment constraints (carried/backups capacity)
   - Workflow transition gating
   - Awarding candidate list computation
   - Bid details toggle and actions
2. Use MSW node handlers for deterministic test scenarios.
3. Add no-data and error-path test cases for each major endpoint group.

## Verification Steps (Human)

1. Run `pnpm test` and verify all tests pass.
2. Confirm failing snapshots/assertions are actionable.
3. Confirm no-data scenarios are explicitly covered.

## No-Data Scenario Handling

- Ensure each tested view has expected fallback UI for empty API responses.
- Verify transitions and action buttons disable appropriately when required data is missing.
