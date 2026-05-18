/**
 * @fileoverview Seed data initialization for development and demo environments.
 *
 * This module provides seed/demo data for the application during development.
 * It should be removed or excluded from production builds to ensure the
 * application starts with a clean state in production.
 *
 * The seed data includes:
 * - Initial tender package (tp-1) with sample data
 * - Sample work items for the initial package
 * - Demo subcontractors
 * - Empty state structures for selection, bidding, and awarding
 *
 * @module seed
 * @dev-only
 */

import {
  createInitialWorkItemsForPackage,
  INITIAL_AWARDING_DATA,
  INITIAL_BID_DATA,
  INITIAL_PACKAGE_ID,
  INITIAL_SELECTION_DATA,
  INITIAL_SUBCONTRACTORS,
  INITIAL_TENDER_PACKAGES,
  INITIAL_WORKFLOW_STAGE,
} from "./initial-data";
import type { WorkflowStage } from "./mockDb";
import type {
  AwardingDataState,
  BidDataState,
  SelectionDataState,
  Subcontractor,
  TenderPackage,
  WorkItem,
} from "./types";

/**
 * Interface representing the complete seed data structure.
 * This matches the MockDbState structure in mockDb.ts.
 *
 * @interface SeedData
 */
export interface SeedData {
  /** Initial workflow stage */
  workflowStage: WorkflowStage;
  /** Initial work items mapped by tender package ID */
  workItemsByPackageId: Record<string, WorkItem[]>;
  /** Initial subcontractors/vendors */
  subcontractors: Subcontractor[];
  /** Initial selection data state */
  selectionData: SelectionDataState;
  /** Initial bid data state */
  bidData: BidDataState;
  /** Initial awarding data state */
  awardingData: AwardingDataState;
  /** Initial tender packages */
  tenderPackages: TenderPackage[];
}

/**
 * Generates and returns the complete seed data for the application.
 * This function should only be called in development/demo environments.
 *
 * @returns {SeedData} Complete seed data structure with all initial entities
 */
export function generateSeedData(): SeedData {
  return {
    workflowStage: INITIAL_WORKFLOW_STAGE,
    workItemsByPackageId: {
      [INITIAL_PACKAGE_ID]:
        createInitialWorkItemsForPackage(INITIAL_PACKAGE_ID),
    },
    subcontractors: INITIAL_SUBCONTRACTORS,
    selectionData: INITIAL_SELECTION_DATA,
    bidData: INITIAL_BID_DATA,
    awardingData: INITIAL_AWARDING_DATA,
    tenderPackages: INITIAL_TENDER_PACKAGES,
  };
}

/**
 * Returns an empty data structure for production use.
 * Use this when you want to start with a completely clean state.
 *
 * @returns {SeedData} Empty data structure with no seed data
 */
export function generateEmptyData(): SeedData {
  return {
    workflowStage: "TenderPackages" as WorkflowStage,
    workItemsByPackageId: {},
    subcontractors: [],
    selectionData: {
      reviewByItemId: {},
    },
    bidData: {
      bidRecords: [],
    },
    awardingData: {
      decisionsByItemId: {},
    },
    tenderPackages: [],
  };
}
