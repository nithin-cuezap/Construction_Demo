# Milestone 15: AI Bid Parsing and Normalization (SharePoint Files)

## Objective

Extract and normalize bid data from SharePoint documents into the app's bid schema.

## Directive

Preserve traceability from parsed values back to original documents.

## Implementation Plan

1. Add AI tool endpoint: `parse-bid(fileRef)`.
2. File input should be SharePoint document reference.
3. Parse PDF/DOCX/text and map to normalized bid schema.
4. Attach parsed bids to selected subcontractor/work item.
5. Provide confidence indicators and manual correction hooks.

## Verification Steps (Human)

1. Select a SharePoint bid file and run parse action.
2. Confirm normalized fields appear in Bid Details.
3. Edit a parsed field and verify persisted override.

## No-Data Scenario Handling

- If selected file has no extractable content, show "Unable to parse document" and provide manual entry path.
- If document reference is missing/invalid, prompt user to reselect file.
