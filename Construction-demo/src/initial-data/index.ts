/**
 * @fileoverview Central export point for initial/seed data used in the application.
 *
 * This module aggregates all initial data exports from individual data modules,
 * providing a single import point for the mock database initialization.
 * The initial data includes demo tender packages, subcontractors, work items,
 * and empty state structures for selection, bidding, and awarding stages.
 *
 * @module initial-data
 */

export {
  INITIAL_AWARDING_DATA,
  INITIAL_BID_DATA,
  INITIAL_SELECTION_DATA,
  INITIAL_WORKFLOW_STAGE,
} from "./state";
export { INITIAL_SUBCONTRACTORS } from "./subcontractors";
export { INITIAL_PACKAGE_ID, INITIAL_TENDER_PACKAGES } from "./tender-packages";
export {
  createInitialWorkItemsForPackage,
  INITIAL_WORK_ITEM_TEMPLATES,
} from "./work-items";
