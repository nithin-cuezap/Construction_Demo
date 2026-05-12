# Milestone 8: Bid Details View in Awarding Center

## Objective

Add a bid-inspection screen integrated into awarding center with a clear toggle.

## Directive

Make inspection and assignment views co-exist without disrupting current flow.

## Implementation Plan

1. Add center-pane mode toggle/tabs:
   - `Assignments`
   - `Bid Details`
2. Add `BidDetailsView` component showing:
   - Amount and currency
   - Lead time and validity
   - Inclusions/exclusions
   - Notes
   - Attachments (stub section)
3. Add actions:
   - Award
   - Mark as Backup
   - Optional stubs: Reject, Request Revision
4. Use selected vendor from awarding left pane as context.

## Verification Steps (Human)

1. Toggle between Assignments and Bid Details and verify state remains stable.
2. Select different vendors and verify details update.
3. Run Award and Mark as Backup actions and verify assignment updates.

## No-Data Scenario Handling

- No selected vendor: show "Select a vendor to inspect bid details."
- Selected vendor with no bid: show "No bid available" and provide "Generate Demo Bid" action.
- Disable action buttons when bid data is absent.
