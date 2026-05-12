# Milestone 7: Bids Domain and Seeded Mock Data

## Objective

Introduce structured bid data model and API endpoints for awarding stage.

## Directive

Use schema validation and generated mock values to avoid ad hoc structures.

## Implementation Plan

1. Add/extend `Bid` type in domain model.
2. Add MSW handlers:
   - `GET /work-items/:id/bids`
   - `GET /work-items/:id/bids/:vendorId`
   - `POST /bids/upsert`
   - `PATCH /bids/:id/status`
3. Seed bid data automatically when entering Awarding for shortlisted vendors.
4. Store and query bid data by work item + vendor.

## Verification Steps (Human)

1. Enter Awarding and verify bids are available for shortlisted vendors.
2. Open dev tools network tab and verify bid APIs are called.
3. Update bid status and verify state reflects updates.

## No-Data Scenario Handling

- If no shortlisted vendors exist, skip seeding and return empty bids payload.
- If specific vendor bid is missing, return 404 with graceful empty-state handling in UI.
