/**
 * @fileoverview Mock database implementation for client-side data persistence.
 *
 * This module provides an in-memory database layer that simulates a backend data store.
 * It manages all application state including tender packages, work items, subcontractors,
 * bids, and workflow stages. The database uses deep cloning to ensure immutability and
 * prevent unintended mutations.
 *
 * In a production environment, this would be replaced with actual API calls to a backend service.
 *
 * @module mockDb
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
import type {
  AwardingDataState,
  BidDataState,
  BidRecord,
  BidStatus,
  SelectionDataState,
  Subcontractor,
  TenderPackage,
  WorkItem,
} from "./types";

/**
 * Available top-level workflow stages in the application navigation.
 * These correspond to the main sections of the procurement workflow.
 *
 * @constant {readonly string[]} WORKFLOW_STAGES
 */
export const WORKFLOW_STAGES = [
  "TenderPackages",
  "Invitation",
  "Awarding",
] as const;

/**
 * Type representing a valid workflow stage identifier.
 *
 * @typedef {"TenderPackages" | "Invitation" | "Awarding"} WorkflowStage
 */
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

/**
 * Internal structure of the mock database state.
 * Contains all application data organized by entity type.
 *
 * @interface MockDbState
 * @private
 */
interface MockDbState {
  /** Current active workflow stage in the navigation */
  workflowStage: WorkflowStage;
  /** Map of tender package IDs to their associated work items */
  workItemsByPackageId: Record<string, WorkItem[]>;
  /** Complete vendor database of available subcontractors */
  subcontractors: Subcontractor[];
  /** State data for the contractor selection stage */
  selectionData: SelectionDataState;
  /** State data for the bid invitation and tracking stage */
  bidData: BidDataState;
  /** State data for the contract awarding stage */
  awardingData: AwardingDataState;
  /** All tender packages in the system */
  tenderPackages: TenderPackage[];
}

/**
 * The in-memory database state.
 * Initialized with demo/seed data from initial-data module.
 *
 * @constant {MockDbState} db
 * @private
 */
const db: MockDbState = {
  workflowStage: INITIAL_WORKFLOW_STAGE,
  workItemsByPackageId: {
    [INITIAL_PACKAGE_ID]: createInitialWorkItemsForPackage(INITIAL_PACKAGE_ID),
  },
  subcontractors: INITIAL_SUBCONTRACTORS,
  selectionData: INITIAL_SELECTION_DATA,
  bidData: INITIAL_BID_DATA,
  awardingData: INITIAL_AWARDING_DATA,
  tenderPackages: INITIAL_TENDER_PACKAGES,
};

/**
 * Creates a deep clone of any value to ensure immutability.
 * Uses native structuredClone if available (modern browsers/Node.js),
 * falls back to JSON serialization for older environments.
 *
 * @template T - The type of value being cloned
 * @param {T} value - The value to clone
 * @returns {T} A deep clone of the input value
 * @private
 */
const clone = <T>(value: T): T => {
  // Use native structuredClone for better performance and handling of complex types
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  // Fallback to JSON serialization (loses functions, dates, etc.)
  return JSON.parse(JSON.stringify(value)) as T;
};

/**
 * Mock database API object providing CRUD operations for all data entities.
 * All getter methods return deep clones to prevent accidental mutations.
 * All setter methods accept and store deep clones of the provided data.
 *
 * @namespace mockDb
 */
export const mockDb = {
  /**
   * Gets the current active workflow stage.
   *
   * @returns {WorkflowStage} The current workflow stage identifier
   */
  getWorkflowStage(): WorkflowStage {
    return db.workflowStage;
  },

  /**
   * Sets the active workflow stage (changes the main navigation view).
   *
   * @param {WorkflowStage} stage - The workflow stage to activate
   */
  setWorkflowStage(stage: WorkflowStage) {
    db.workflowStage = stage;
  },

  /**
   * Retrieves all work items for a specific tender package.
   *
   * @param {string} tenderPackageId - The ID of the tender package
   * @returns {WorkItem[]} Array of work items (empty array if package has none)
   */
  getWorkItems(tenderPackageId: string): WorkItem[] {
    return clone(db.workItemsByPackageId[tenderPackageId] ?? []);
  },

  /**
   * Replaces all work items for a specific tender package.
   *
   * @param {string} tenderPackageId - The ID of the tender package
   * @param {WorkItem[]} nextWorkItems - The new array of work items
   */
  setWorkItems(tenderPackageId: string, nextWorkItems: WorkItem[]) {
    db.workItemsByPackageId[tenderPackageId] = clone(nextWorkItems);
  },

  /**
   * Ensures a tender package has work items, creating initial items if none exist.
   * Safe to call multiple times - will not overwrite existing work items.
   *
   * @param {string} tenderPackageId - The ID of the tender package
   */
  ensureWorkItemsForPackage(tenderPackageId: string) {
    if (!db.workItemsByPackageId[tenderPackageId]) {
      db.workItemsByPackageId[tenderPackageId] =
        createInitialWorkItemsForPackage(tenderPackageId);
    }
  },

  /**
   * Deletes all work items for a tender package and cleans up related data.
   * This cascades to remove selection data, invitation data, and awarding data
   * for all the deleted work items to maintain data consistency.
   *
   * @param {string} tenderPackageId - The ID of the tender package whose work items should be deleted
   */
  deleteWorkItemsForPackage(tenderPackageId: string) {
    // Collect IDs of work items being removed for cleanup
    const removedItemIds = new Set(
      (db.workItemsByPackageId[tenderPackageId] ?? []).map((item) => item.id),
    );

    // If no items exist, nothing to clean up
    if (removedItemIds.size === 0) {
      return;
    }

    // Remove the work items collection
    const { [tenderPackageId]: _removedWorkItems, ...remainingWorkItems } =
      db.workItemsByPackageId;
    void _removedWorkItems; // Explicitly void the unused variable
    db.workItemsByPackageId = remainingWorkItems;

    // Clean up selection data (review lists) for removed work items
    db.selectionData = {
      ...db.selectionData,
      reviewByItemId: Object.fromEntries(
        Object.entries(db.selectionData.reviewByItemId).filter(
          ([itemId]) => !removedItemIds.has(itemId),
        ),
      ),
    };

    // Clean up invitation records for removed work items (no workItem-specific data currently)

    // Clean up awarding decisions for removed work items
    db.awardingData = {
      ...db.awardingData,
      decisionsByItemId: Object.fromEntries(
        Object.entries(db.awardingData.decisionsByItemId).filter(
          ([itemId]) => !removedItemIds.has(itemId),
        ),
      ),
    };
  },

  /**
   * Retrieves the complete vendor database of all subcontractors.
   *
   * @returns {Subcontractor[]} Array of all subcontractors
   */
  getSubcontractors(): Subcontractor[] {
    return clone(db.subcontractors);
  },

  /**
   * Retrieves the current state data for the contractor selection stage.
   *
   * @returns {SelectionDataState} Current selection data
   */
  getSelectionData(): SelectionDataState {
    return clone(db.selectionData);
  },

  /**
   * Updates the state data for the contractor selection stage.
   *
   * @param {SelectionDataState} nextSelectionData - The new selection data state
   */
  setSelectionData(nextSelectionData: SelectionDataState) {
    db.selectionData = clone(nextSelectionData);
  },

  /**
   * Retrieves the current state data for the bid invitation stage.
   *
   * @returns {BidDataState} Current bid data including all bid records
   */
  getBidData(): BidDataState {
    return clone(db.bidData);
  },

  /**
   * Updates the state data for the bid invitation stage.
   *
   * @param {BidDataState} nextBidData - The new bid data state
   */
  setBidData(nextBidData: BidDataState) {
    db.bidData = clone(nextBidData);
  },

  /**
   * Retrieves the current state data for the contract awarding stage.
   *
   * @returns {AwardingDataState} Current awarding data including all decisions
   */
  getAwardingData(): AwardingDataState {
    return clone(db.awardingData);
  },

  /**
   * Updates the state data for the contract awarding stage.
   *
   * @param {AwardingDataState} nextAwardingData - The new awarding data state
   */
  setAwardingData(nextAwardingData: AwardingDataState) {
    db.awardingData = clone(nextAwardingData);
  },

  /**
   * Retrieves all tender packages in the system.
   *
   * @returns {TenderPackage[]} Array of all tender packages
   */
  getTenderPackages(): TenderPackage[] {
    return clone(db.tenderPackages);
  },

  /**
   * Replaces all tender packages in the system.
   *
   * @param {TenderPackage[]} nextTenderPackages - The new array of tender packages
   */
  setTenderPackages(nextTenderPackages: TenderPackage[]) {
    db.tenderPackages = clone(nextTenderPackages);
  },

  /**
   * Generates a unique package control number for a new tender package.
   * Format: TP-{sequence}-{datestring}
   * Example: TP-001-20240515
   *
   * @returns {string} A formatted package control number
   */
  generatePackageControlNumber(): string {
    // Sequence is based on current count + 1, padded to 3 digits
    const seq = (db.tenderPackages.length + 1).toString().padStart(3, "0");
    // Date string in YYYYMMDD format
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    return `TP-${seq}-${date}`;
  },

  /**
   * Retrieves all bid records for a specific tender package.
   *
   * @param {string} tenderPackageId - The ID of the tender package
   * @returns {BidRecord[]} Array of bid records for the package
   */
  getBidRecords(tenderPackageId: string): BidRecord[] {
    return clone(
      db.bidData.bidRecords.filter(
        (record) => record.tenderPackageId === tenderPackageId,
      ),
    );
  },

  /**
   * Creates new bid records for multiple subcontractors on a tender package.
   * All new records start with "Invited" status and are timestamped with the current time.
   *
   * @param {string} tenderPackageId - The ID of the tender package
   * @param {string[]} subcontractorIds - Array of subcontractor IDs to invite
   * @returns {BidRecord[]} The newly created bid records
   */
  createBidRecords(
    tenderPackageId: string,
    subcontractorIds: string[],
  ): BidRecord[] {
    const now = new Date().toISOString();

    // Create a unique bid record for each subcontractor
    const newRecords: BidRecord[] = subcontractorIds.map((subcontractorId) => ({
      id: `bid-${tenderPackageId}-${subcontractorId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      tenderPackageId,
      subcontractorId,
      status: "Invited" as BidStatus,
      invitedAt: now,
      lastUpdatedAt: now,
    }));

    // Append new records to existing bid data
    db.bidData = {
      ...db.bidData,
      bidRecords: [...db.bidData.bidRecords, ...newRecords],
    };

    return clone(newRecords);
  },

  /**
   * Updates the status of a specific bid record.
   * Automatically updates the lastUpdatedAt timestamp to the current time.
   *
   * @param {string} bidId - The ID of the bid record to update
   * @param {BidStatus} status - The new status value
   * @returns {BidRecord | null} The updated bid record, or null if not found
   */
  updateBidStatus(bidId: string, status: BidStatus): BidRecord | null {
    // Find the index of the bid record
    const recordIndex = db.bidData.bidRecords.findIndex(
      (record) => record.id === bidId,
    );

    // Return null if bid record doesn't exist
    if (recordIndex === -1) {
      return null;
    }

    // Create updated record with new status and timestamp
    const updatedRecord: BidRecord = {
      ...db.bidData.bidRecords[recordIndex],
      status,
      lastUpdatedAt: new Date().toISOString(),
    };

    // Replace the record in the array
    const updatedRecords = [...db.bidData.bidRecords];
    updatedRecords[recordIndex] = updatedRecord;

    // Update the database state
    // Update the database state
    db.bidData = {
      ...db.bidData,
      bidRecords: updatedRecords,
    };

    return clone(updatedRecord);
  },
};
