# Milestones Index

This folder contains incremental, verifiable milestones for staged implementation.

## Recommended Execution Order

### Phase 1: Core Data and Workflow Foundations

1. [Milestone 1](./milestone-1.md) - Dependencies and Scaffolding
2. [Milestone 2](./milestone-2.md) - Work Items API Integration
3. [Milestone 3](./milestone-3.md) - Subcontractors by Division API
4. [Milestone 4](./milestone-4.md) - Assignments API and DnD Mutations
5. [Milestone 5](./milestone-5.md) - Workflow Stage Transition API Rules

### Phase 2: Awarding and Bid Experience

6. [Milestone 6](./milestone-6.md) - Awarding Candidate Aggregation API
7. [Milestone 7](./milestone-7.md) - Bids Domain and Seeded Mock Data
8. [Milestone 8](./milestone-8.md) - Bid Details View in Awarding Center
9. [Milestone 9](./milestone-9.md) - Test Coverage for Core Workflow
10. [Milestone 10](./milestone-10.md) - Cleanup and Documentation

### Phase 3: AI and SharePoint-First Capabilities

11. [Milestone 11](./milestone-11.md) - AI Foundation and MCP Governance
12. [Milestone 12](./milestone-12.md) - SharePoint as Primary Document Source
13. [Milestone 13](./milestone-13.md) - AI Vendor Recommendation Assistant
14. [Milestone 14](./milestone-14.md) - AI Invitation Drafting with SharePoint Templates
15. [Milestone 15](./milestone-15.md) - AI Bid Parsing and Normalization (SharePoint Files)
16. [Milestone 16](./milestone-16.md) - AI Bid Comparison and Award Justification
17. [Milestone 17](./milestone-17.md) - AI RFI Generation from SharePoint Scope Documents
18. [Milestone 18](./milestone-18.md) - Conversational AI Agent Panel with MCP Tools
19. [Milestone 19](./milestone-19.md) - AI Guardrails, Evaluation, and Operational Readiness

## Estimated Effort by Milestone

Estimates assume one engineer familiar with the current codebase and local environment ready.

| Milestone |   Estimate | Notes                                      |
| --------- | ---------: | ------------------------------------------ |
| 1         |  0.5-1 day | Setup and validation                       |
| 2         |    0.5 day | Work items query and null-safe rendering   |
| 3         |    0.5 day | Division-based fetching and empty states   |
| 4         | 1-1.5 days | Mutation flows and constraints             |
| 5         |    0.5 day | Transition APIs and validation UX          |
| 6         |    0.5 day | Awarding aggregation and selection state   |
| 7         |      1 day | Bid model and endpoints                    |
| 8         | 1-1.5 days | Bid details UI and actions                 |
| 9         |      1 day | Automated tests for critical paths         |
| 10        |    0.5 day | Cleanup and docs                           |
| 11        |      1 day | AI backend foundation and observability    |
| 12        |   1-2 days | SharePoint/Graph MCP integration           |
| 13        |      1 day | Recommendation tooling and UX wiring       |
| 14        |      1 day | Drafting flow and template integration     |
| 15        | 1-1.5 days | Parsing, normalization, and traceability   |
| 16        |      1 day | Comparison and export                      |
| 17        |  0.5-1 day | RFI generation with doc context            |
| 18        | 1-1.5 days | Conversational panel and confirmation flow |
| 19        |      1 day | Eval harness and guardrails                |

## Suggested Gates Before Moving to Next Phase

- Phase 1 exit:
  - Core workflow works with mock APIs.
  - No-data states are stable and tested for core screens.
- Phase 2 exit:
  - Bid inspection and assignment actions are stable.
  - Core automated tests are in place and passing.
- Phase 3 exit:
  - SharePoint document operations are reliable.
  - AI actions are gated, observable, and safe by default.

## Notes

- SharePoint is the primary document source for templates, scope/spec files, bid files, and AI-generated outputs.
- Every milestone includes explicit no-data handling and human verification steps.
