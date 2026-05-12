# Milestone 5: Workflow Stage Transition API Rules

## Objective

Drive workflow transitions via API rules rather than local-only state changes.

## Directive

Transition validation belongs in API logic; UI should reflect allowed transitions.

## Implementation Plan

1. Add MSW handlers:
   - `POST /workflow/advance`
   - `POST /workflow/regress`
2. Implement validation rule for advance to Invitation:
   - Require at least one vendor in review.
3. Wire `advanceWorkflow` and `regressWorkflow` to mutations.
4. Disable transition buttons while requests are in-flight.

## Verification Steps (Human)

1. Try advancing with no review vendors and verify blocked transition.
2. Add review vendor, then advance and verify success.
3. Regress workflow and verify previous stage renders correctly.

## No-Data Scenario Handling

- If no active work item exists, transition actions are disabled with explanatory text.
- If transition API returns missing stage, fallback to current stage and show warning message.
