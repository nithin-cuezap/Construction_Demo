# Milestone 18: Conversational AI Agent Panel with MCP Tools

## Objective

Provide a conversational UI for users to perform workflow activities through AI-assisted actions.

## Directive

Require explicit confirmation before any state-changing tool call.

## Implementation Plan

1. Add AI chat panel in app shell.
2. Wire tool orchestration to MCP-backed backend.
3. Add confirmation modal for mutating actions:
   - Assign vendor
   - Advance stage
   - Send invitations
   - Update bid status
4. Display audit trail of tool actions and outcomes.

## Verification Steps (Human)

1. Ask AI for recommendations and verify tool output appears.
2. Trigger a mutating action and verify confirmation gate.
3. Confirm action log captures prompt, tool, and result.

## No-Data Scenario Handling

- If conversation lacks required context, AI should ask clarifying questions.
- If tool response is empty, AI should report "No actionable results" with suggested next steps.
