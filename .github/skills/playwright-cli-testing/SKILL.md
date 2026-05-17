---
name: playwright-cli-testing
description: "Write and run end-to-end tests using Playwright CLI. Use when users ask for Playwright test cases, CLI-based browser automation, test execution, debugging flaky tests, or CI-ready Playwright commands. Do not use Playwright MCP servers."
argument-hint: "Feature or user flow to test, plus target URL or route"
user-invocable: true
disable-model-invocation: false
---

# Playwright CLI Testing

Create, execute, and debug Playwright tests using only Playwright CLI and code files in the repo.

## Hard Rules

- Never use Playwright MCP servers.
- Never rely on browser control tools as a substitute for Playwright tests when the ask is testing.
- Prefer repo package manager commands first (`pnpm` in this workspace); provide npm fallback only when needed.
- Keep tests deterministic: avoid arbitrary sleeps, prefer locator waits and assertions.

## When to Use

- User asks to add or update Playwright end-to-end tests.
- User asks for step-based browser test cases that can be executed from terminal.
- User asks to run or debug failing Playwright tests.
- User asks for CI-friendly Playwright commands and artifacts.

## Inputs to Collect

- Feature or journey under test.
- Base URL and environment (`local`, `staging`, `prod-like`).
- Credentials/test accounts if required.
- Browser/project targets (Chromium only vs all configured projects).
- Success criteria and required evidence (screenshots, trace, videos, junit/html reports).

## Procedure

1. Preflight and setup.
2. Convert requirements into CLI-oriented test cases.
3. Implement tests.
4. Execute tests with the right CLI mode.
5. Triage failures and stabilize.
6. Confirm completion checks.

## 1) Preflight and Setup

1. Detect package manager and scripts.
2. If Playwright is not installed, add dependencies and scaffold config:
   - `pnpm add -D @playwright/test`
   - `pnpm exec playwright install`
3. Ensure app run command is known (for this repo, `pnpm dev`).
4. Decide execution environment:
   - Local dev server available -> run tests against local URL.
   - CI/non-interactive -> use reporter, retries, and trace options.

Decision branch:

- If user forbids dependency changes, provide exact commands they should run and continue authoring tests without executing.
- If auth/session is needed, implement stable login fixtures or storage state strategy.

## 2) Convert Requirements to CLI-Oriented Test Cases

Represent each case as executable steps:

1. `Navigate`: open URL/route.
2. `Act`: perform user actions with resilient locators.
3. `Assert`: verify visible state, network outcome, or persisted result.
4. `Capture`: optional screenshot/trace at critical checkpoints.

Use this authoring format before coding:

- Case name
- Preconditions
- CLI steps (`navigate`, `click`, `fill`, `select`, `assert`)
- Expected result

Example case draft:

- Name: submit tender package with required fields
- Preconditions: user is authenticated and has invitation permissions
- Steps:
  - navigate `/tender-packages/new`
  - fill package title and due date
  - upload required document
  - click submit
  - assert success banner appears
- Expected: package is created and listed in overview

## 3) Implement Tests

1. Create or update test file under `tests/` or existing Playwright structure.
2. Use `test.describe` for feature grouping and `test.step` to mirror CLI steps.
3. Prefer robust locators (`getByRole`, `getByLabel`, `getByTestId`) over brittle CSS chains.
4. Keep assertions specific and user-visible.
5. Add shared fixtures/utilities only when at least two tests need them.

Quality checks while writing:

- No hard-coded timing waits unless unavoidable and justified.
- Each test independent and idempotent.
- Names describe user behavior and expected outcome.

## 4) Execute Tests via Playwright CLI

Use the smallest command that answers the user request first.

Core commands:

- Run all: `pnpm exec playwright test`
- Run one file: `pnpm exec playwright test tests/<file>.spec.ts`
- Run by title: `pnpm exec playwright test -g "<test name>"`
- Debug mode: `pnpm exec playwright test --debug`
- UI mode: `pnpm exec playwright test --ui`
- Headed browser: `pnpm exec playwright test --headed`
- Show report: `pnpm exec playwright show-report`

CI-oriented commands:

- `pnpm exec playwright test --reporter=line,junit --retries=2 --trace=on-first-retry`

Fallback if pnpm is unavailable:

- `npx playwright test`

## 5) Triage and Stabilize Failures

1. Read failing assertion and stack trace first.
2. Re-run only failing test with `-g` and `--debug`.
3. Inspect trace/report before changing selectors.
4. Fix root cause in this order:
   - Wrong expectation
   - Unstable locator
   - Missing wait on navigation/network/state
   - Test data coupling
5. Re-run targeted test, then full related suite.

## 6) Completion Checks

A task is complete only if all apply:

- Tests compile and execute with Playwright CLI commands.
- New/updated tests cover requested behavior and at least one negative or edge path when relevant.
- No Playwright MCP usage was introduced.
- Commands used to run tests are documented in the response.
- If execution was blocked, blockers and exact next commands are provided.

## Response Template

When reporting back to the user, include:

1. What test cases were added/updated.
2. Which CLI commands were run.
3. Pass/fail summary.
4. If failures remain, exact failing case and next diagnostic command.

## Quick Prompts

- `/playwright-cli-testing add tests for tender package creation flow on local dev`
- `/playwright-cli-testing run only invitation flow tests and debug flaky assertion`
- `/playwright-cli-testing convert this checklist into Playwright test.step cases and execute`
