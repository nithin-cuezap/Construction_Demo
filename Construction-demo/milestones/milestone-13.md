# Milestone 13: AI Vendor Recommendation Assistant

## Objective

Enable AI-generated subcontractor recommendations for each work item.

## Directive

Recommendations must include concise rationale and remain user-approvable.

## Implementation Plan

1. Add AI tool endpoint: `recommend-subcontractors(workItemId)`.
2. Use available performance and assignment context to rank vendors.
3. Render recommendations in Selection stage with one-click "Add to Review".
4. Capture accept/reject feedback for quality tuning.

## Verification Steps (Human)

1. Open a work item and request recommendations.
2. Verify rationale is shown for each suggestion.
3. Accept suggestion and verify vendor appears in Review list.

## No-Data Scenario Handling

- If insufficient history/context exists, return "Insufficient data for recommendations" and keep manual assignment flow available.
- If no eligible vendors, show empty recommendation state.
