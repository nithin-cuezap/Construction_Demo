# Milestone 12: SharePoint as Primary Document Source

## Objective

Integrate SharePoint (via Microsoft Graph MCP) as the primary source for bids, specs, templates, and generated outputs.

## Directive

All document retrieval should route through SharePoint-first connectors.

## Implementation Plan

1. Configure Microsoft Graph app registration and required scopes.
2. Connect MCP server for SharePoint/Graph operations.
3. Implement APIs/tools for:
   - Site and library listing
   - Folder navigation
   - Search
   - File metadata retrieval
4. Add document picker UI components backed by SharePoint APIs.

## Verification Steps (Human)

1. Authenticate and browse SharePoint sites/libraries.
2. Search and select files for a work item context.
3. Validate selected file metadata is available to downstream AI tools.

## No-Data Scenario Handling

- If no SharePoint sites/libraries are visible, show permissions/setup checklist.
- If folder/library is empty, show "No documents found" with refresh action.
