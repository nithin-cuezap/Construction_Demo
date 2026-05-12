# Milestone 14: AI Invitation Drafting with SharePoint Templates

## Objective

Generate vendor invitation drafts using AI and SharePoint-stored templates.

## Directive

Keep humans in control: draft, edit, approve, then send.

## Implementation Plan

1. Add AI tool endpoint: `draft-invitation(workItemId, vendorIds)`.
2. Fetch invitation templates from SharePoint template library.
3. Merge template + work item context + vendor list.
4. Provide compose UI for edits and final confirmation.
5. Optionally send through email MCP connector.

## Verification Steps (Human)

1. Load a SharePoint template and generate draft.
2. Edit generated content and confirm save/send flow.
3. Verify placeholders are correctly resolved.

## No-Data Scenario Handling

- If no templates exist in SharePoint, show "No templates available" and allow free-form draft generation.
- If no selected vendors, disable send with clear instruction.
