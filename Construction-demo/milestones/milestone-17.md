# Milestone 17: AI RFI Generation from SharePoint Scope Documents

## Objective

Generate relevant RFIs from project scope/specification documents sourced from SharePoint.

## Directive

RFIs must be context-aware and actionable.

## Implementation Plan

1. Add AI tool endpoint: `generate-rfis(workItemId, docRefs[])`.
2. Pull context from selected SharePoint scope/spec docs.
3. Generate prioritized RFI suggestions with category tags.
4. Allow review/edit and optional send via email MCP.

## Verification Steps (Human)

1. Select scope docs and run RFI generation.
2. Verify generated RFIs are relevant to scope text.
3. Approve and send one RFI through configured channel.

## No-Data Scenario Handling

- If no scope docs are selected, show "Select at least one scope document to generate RFIs."
- If generated result is empty, return "No major ambiguities detected" instead of blank output.
