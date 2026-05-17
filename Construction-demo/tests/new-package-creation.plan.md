# New Package Creation Plan

Date: 2026-05-17
Target URL: http://localhost:5173/#/tenderpackages/new/primary-information
Session Name: tender-package-create

## Scope

- Validate Save & Exit on a new tender package.
- Validate that Next navigates from Primary Information to Documents only.
- Use a single named `playwright-cli` session for the full test flow.

## Session Cleanup

Run this before starting the test to ensure no stale browser sessions remain:

```bash
playwright-cli close-all
```

## Test Setup

Run these once before step execution:

```bash
pnpm dev
New-Item -ItemType Directory -Force tests/artifacts
```

## Test Data Review Checkpoints

- Checkpoint A: review Dataset A before executing Save & Exit commands.
- Checkpoint B: review Dataset B before executing Next-to-Documents commands.

## Dataset A (Save & Exit)

- packageName: CLI-A-Tender-Package-20260517
- projectDescription: First package for Save and Exit redirect verification.
- tenderSubmissionDueDate: 2026-06-15
- rfqDueDate: 2026-06-10
- subContractorBidSubmissionDueDate: 2026-06-08
- subContractorRfqDueDate: 2026-06-05
- siteAddress.street: 1200 Test Avenue
- siteAddress.city: Austin
- siteAddress.state: TX
- siteAddress.zipCode: 73301
- customerName: Skyline Builders
- customerContactDetails.name: Maya Chen
- customerContactDetails.email: maya.chen@example.com
- customerContactDetails.phone: 5125550101
- customerContactDetails.mobile: 5125550102
- customerContactDetails.title: Project Manager

## Dataset B (Next to Documents)

- packageName: CLI-B-Tender-Package-20260517
- projectDescription: Second package for Primary Information to Upload Documents navigation verification.
- tenderSubmissionDueDate: 2026-07-01
- rfqDueDate: 2026-06-25
- subContractorBidSubmissionDueDate: 2026-06-22
- subContractorRfqDueDate: 2026-06-20
- siteAddress.street: 88 Integration Road
- siteAddress.city: Dallas
- siteAddress.state: TX
- siteAddress.zipCode: 75001
- customerName: North Ridge Construction
- customerContactDetails.name: Jordan Patel
- customerContactDetails.email: jordan.patel@example.com
- customerContactDetails.phone: 2145550110
- customerContactDetails.mobile: 2145550111
- customerContactDetails.title: Estimating Lead

## Command Conventions

- Use the single named session `tender-package-create` for every browser command.
- The date fields are duplicated by label, so target them by ordered date input position.
- The form contains address autocomplete, but the required validation only needs street, city, state, and zip code.

## Ordered Steps

Step 1: Start one browser session on the new package form.

- Command: `playwright-cli -s=tender-package-create open "http://localhost:5173/#/tenderpackages/new/primary-information"`
- Purpose: Open the Primary Information form in a single reusable browser session.

Step 2: Capture a baseline snapshot for element verification.

- Command: `playwright-cli -s=tender-package-create snapshot --filename=tests/artifacts/new-package-step1-primary.yaml`
- Purpose: Record the initial page state before data entry.

Step 3: Enter Dataset A and save the new package.

- Commands:
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Package Name']" "CLI-A-Tender-Package-20260517"`
  - `playwright-cli -s=tender-package-create fill "textarea[placeholder='Enter project description...']" "First package for Save and Exit redirect verification."`
  - `playwright-cli -s=tender-package-create fill "locator('input[type=\"date\"]').nth(0)" "2026-06-15"`
  - `playwright-cli -s=tender-package-create fill "locator('input[type=\"date\"]').nth(1)" "2026-06-10"`
  - `playwright-cli -s=tender-package-create fill "locator('input[type=\"date\"]').nth(2)" "2026-06-08"`
  - `playwright-cli -s=tender-package-create fill "locator('input[type=\"date\"]').nth(3)" "2026-06-05"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Address Line']" "1200 Test Avenue"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='City']" "Austin"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='State']" "TX"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Zip Code']" "73301"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Customer Name *']" "Skyline Builders"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Title (Optional)']" "Project Manager"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Contact Name *']" "Maya Chen"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Email *']" "maya.chen@example.com"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Phone']" "5125550101"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Mobile (Optional)']" "5125550102"`
  - `playwright-cli -s=tender-package-create click "getByRole('button', { name: 'Save & Exit' })"`
- Purpose: Create the first tender package and return to the list view.

Step 4: Verify Save & Exit outcome and capture evidence.

- Commands:
  - `playwright-cli -s=tender-package-create eval "window.location.hash"`
  - `playwright-cli -s=tender-package-create eval "() => window.location.hash.includes('#/tenderpackages')"`
  - `playwright-cli -s=tender-package-create snapshot --filename=tests/artifacts/new-package-step4-list.yaml`
  - `playwright-cli -s=tender-package-create screenshot --filename=tests/artifacts/new-package-step4-list.png`
  - `playwright-cli -s=tender-package-create eval "() => document.body.innerText.includes('CLI-A-Tender-Package-20260517')"`
- Purpose: Confirm redirect to the list view and verify the new package row is present.

Step 5: Restart the flow by returning to the new package form in the same session.

- Command: `playwright-cli -s=tender-package-create goto "http://localhost:5173/#/tenderpackages/new/primary-information"`
- Purpose: Reuse the same session for the Next-button-only test.

Step 6: Capture a second baseline snapshot before Dataset B.

- Command: `playwright-cli -s=tender-package-create snapshot --filename=tests/artifacts/new-package-step6-primary-restart.yaml`
- Purpose: Record the restarted form state.

Step 7: Enter Dataset B and click Next.

- Commands:
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Package Name']" "CLI-B-Tender-Package-20260517"`
  - `playwright-cli -s=tender-package-create fill "textarea[placeholder='Enter project description...']" "Second package for Primary Information to Upload Documents navigation verification."`
  - `playwright-cli -s=tender-package-create fill "locator('input[type=\"date\"]').nth(0)" "2026-07-01"`
  - `playwright-cli -s=tender-package-create fill "locator('input[type=\"date\"]').nth(1)" "2026-06-25"`
  - `playwright-cli -s=tender-package-create fill "locator('input[type=\"date\"]').nth(2)" "2026-06-22"`
  - `playwright-cli -s=tender-package-create fill "locator('input[type=\"date\"]').nth(3)" "2026-06-20"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Address Line']" "88 Integration Road"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='City']" "Dallas"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='State']" "TX"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Zip Code']" "75001"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Customer Name *']" "North Ridge Construction"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Title (Optional)']" "Estimating Lead"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Contact Name *']" "Jordan Patel"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Email *']" "jordan.patel@example.com"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Phone']" "2145550110"`
  - `playwright-cli -s=tender-package-create fill "input[placeholder='Mobile (Optional)']" "2145550111"`
  - `playwright-cli -s=tender-package-create click "getByRole('button', { name: 'Next: Document Upload' })"`
- Purpose: Create a second draft package only far enough to navigate to the Documents step.

Step 8: Verify the Documents view loads and capture evidence.

- Commands:
  - `playwright-cli -s=tender-package-create eval "window.location.hash"`
  - `playwright-cli -s=tender-package-create eval "() => window.location.hash.includes('/documents')"`
  - `playwright-cli -s=tender-package-create snapshot --filename=tests/artifacts/new-package-step8-documents.yaml`
  - `playwright-cli -s=tender-package-create screenshot --filename=tests/artifacts/new-package-step8-documents.png`
  - `playwright-cli -s=tender-package-create eval "() => document.body.innerText.includes('Confidential & Reference Documents')"`
- Purpose: Confirm the app reached the Upload Documents view and stop there.

Step 9: Close the browser session.

- Command: `playwright-cli -s=tender-package-create close`
- Purpose: End the test cleanly after both scenarios finish.
