# Milestone 6: Awarding Candidate Aggregation API

## Objective

Replace local awarding candidate derivation with centralized API computation.

## Directive

Keep candidate computation in a single API layer to prevent divergence.

## Implementation Plan

1. Add MSW handler: `GET /awarding/candidates`.
2. API computes:
   - All vendors present in any review zone.
   - Excludes vendors already assigned as carried/backups anywhere.
3. Populate `AwardingLeftPane` from query data.
4. Add selected-vendor state in awarding stage.

## Verification Steps (Human)

1. Ensure left pane vendors match review pool minus carried/backups.
2. Click vendor and verify selection highlight.
3. Change assignments and verify candidate list refreshes correctly.

## No-Data Scenario Handling

- If response is empty, show "No shortlisted vendors available for awarding."
- Keep center pane rendered but disable bid-specific actions.
