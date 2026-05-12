# Milestone 16: AI Bid Comparison and Award Justification

## Objective

Provide AI-generated comparative analysis across bids and produce award rationale.

## Directive

Outputs must be explainable and traceable to underlying bid values.

## Implementation Plan

1. Add AI tool endpoint: `compare-bids(workItemId)`.
2. Compute differences in cost, lead time, scope coverage, exclusions, and risk signals.
3. Generate human-readable summary and award recommendation rationale.
4. Add export option to save analysis to SharePoint.

## Verification Steps (Human)

1. Run comparison for a work item with multiple bids.
2. Verify summary references actual bid values.
3. Export report and confirm file saved in configured SharePoint library.

## No-Data Scenario Handling

- If fewer than two bids are available, show limited-comparison message and suggest next actions.
- If report export destination is unavailable, allow local download fallback.
