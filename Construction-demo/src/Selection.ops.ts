/**
 * @fileoverview Operations for managing the contractor selection workflow stage.
 *
 * This module provides comprehensive business logic for the "Work Scoping & Contractor Shortlisting"
 * stage. It handles work item management (CRUD operations), subcontractor review list management
 * (drag-and-drop, reordering), and combines data from multiple sources to provide a complete
 * view of the selection state.
 *
 * @module Selection.ops
 */

import { getDecisionAssignment } from "./Awarding.ops";
import { mockDb } from "./mockDb";
import type {
  Assignment,
  AwardingDataState,
  SelectionDataState,
  Subcontractor,
  WorkItem,
} from "./types";

/**
 * Combined snapshot of all data needed for the selection view.
 * Aggregates work items, selection state, awarding state, and vendor database.
 *
 * @interface SelectionViewDataSnapshot
 */
interface SelectionViewDataSnapshot {
  /** All work items for the tender package */
  workItems: WorkItem[];
  /** Current selection stage state (review lists) */
  selectionData: SelectionDataState;
  /** Current awarding stage state (final decisions) */
  awardingData: AwardingDataState;
  /** Complete vendor database */
  subcontractors: Subcontractor[];
}

/**
 * Retrieves all data needed for the selection view in a single operation.
 * Ensures work items exist for the package before returning data.
 *
 * @param {string} tenderPackageId - The ID of the tender package
 * @returns {SelectionViewDataSnapshot} Complete snapshot of selection view data
 */
export function getSelectionViewData(
  tenderPackageId: string,
): SelectionViewDataSnapshot {
  // Ensure work items are initialized for this package
  mockDb.ensureWorkItemsForPackage(tenderPackageId);
  return {
    workItems: mockDb.getWorkItems(tenderPackageId),
    selectionData: mockDb.getSelectionData(),
    awardingData: mockDb.getAwardingData(),
    subcontractors: mockDb.getSubcontractors(),
  };
}

/**
 * Persists work items for a tender package to the database.
 *
 * @param {string} tenderPackageId - The ID of the tender package
 * @param {WorkItem[]} workItems - The work items array to persist
 */
export function persistWorkItems(
  tenderPackageId: string,
  workItems: WorkItem[],
) {
  mockDb.setWorkItems(tenderPackageId, workItems);
}

/**
 * Persists selection data to the database.
 *
 * @param {SelectionDataState} selectionData - The selection data to persist
 */
export function persistSelectionData(selectionData: SelectionDataState) {
  mockDb.setSelectionData(selectionData);
}

/**
 * Updates the status of a single work item.
 * Returns a new array with the updated work item (immutable update).
 *
 * @param {WorkItem[]} workItems - Current array of work items
 * @param {string} itemId - The ID of the work item to update
 * @param {string} status - The new status value
 * @returns {WorkItem[]} New array with the updated work item
 */
export function setWorkItemStatus(
  workItems: WorkItem[],
  itemId: string,
  status: WorkItem["status"],
): WorkItem[] {
  return workItems.map((item) =>
    item.id === itemId && item.status !== status ? { ...item, status } : item,
  );
}

/**
 * Updates the status of multiple work items in a single operation.
 * More efficient than calling setWorkItemStatus multiple times.
 *
 * @param {WorkItem[]} workItems - Current array of work items
 * @param {Array<{id: string, status: WorkItem["status"]}>} updates - Array of status updates to apply
 * @returns {WorkItem[]} New array with all specified updates applied
 */
export function setWorkItemStatuses(
  workItems: WorkItem[],
  updates: Array<{ id: string; status: WorkItem["status"] }>,
): WorkItem[] {
  return workItems.map((item) => {
    const update = updates.find((u) => u.id === item.id);
    return update && item.status !== update.status
      ? { ...item, status: update.status }
      : item;
  });
}

/**
 * Checks if all work items have completed the shortlisting process.
 * Used to determine if the package can advance to the next workflow stage.
 *
 * @param {WorkItem[]} workItems - Array of work items to check
 * @returns {boolean} True if all items have status "Shortlisting Completed"
 */
export function areAllWorkItemsShortlistingCompleted(
  workItems: WorkItem[],
): boolean {
  return workItems.every((item) => item.status === "Shortlisting Completed");
}

/**
 * Checks if atleast one work item has invitations sent.
 * Used to determine if the package can advance to the next workflow stage.
 *
 * @param {WorkItem[]} workItems - Array of work items to check
 * @returns {boolean} True if at least one item has status "Invitations Sent"
 */
export function isAnyWorkItemInvitationSent(workItems: WorkItem[]): boolean {
  return workItems.some((item) => item.status === "Invited");
}

/**
 * Creates and adds a new work item to the package.
 * Validates that all required fields are non-empty after trimming whitespace.
 *
 * @param {WorkItem[]} workItems - Current array of work items
 * @param {string} tenderPackageId - The ID of the parent tender package
 * @param {string} sectionCode - Section/trade code (e.g., "03 - Concrete")
 * @param {string} sectionName - Human-readable section name
 * @param {string} description - Detailed description of the work
 * @returns {{workItems: WorkItem[], createdItemId: string} | null} Object with updated array and new item ID, or null if validation fails
 */
export function addWorkItem(
  workItems: WorkItem[],
  tenderPackageId: string,
  sectionCode: string,
  sectionName: string,
  description: string,
): { workItems: WorkItem[]; createdItemId: string } | null {
  // Normalize and validate inputs
  const normalizedSectionCode = sectionCode.trim();
  const normalizedSectionName = sectionName.trim();
  const normalizedDescription = description.trim();

  if (
    !normalizedSectionCode ||
    !normalizedSectionName ||
    !normalizedDescription
  )
    return null;

  // Create the new work item with generated ID
  const nextWorkItem: WorkItem = {
    id: `wi-${Date.now()}`,
    tenderPackageId,
    sectionCode: normalizedSectionCode,
    sectionName: normalizedSectionName,
    description: normalizedDescription,
    status: "Draft",
  };

  return {
    workItems: [...workItems, nextWorkItem],
    createdItemId: nextWorkItem.id,
  };
}

/**
 * Adds a subcontractor to the review list for a work item.
 * Prevents duplicate additions (no-op if subcontractor already in review).
 *
 * @param {SelectionDataState} selectionData - Current selection state
 * @param {string} itemId - The work item ID
 * @param {Subcontractor} sub - The subcontractor to add
 * @returns {SelectionDataState | null} New selection state with subcontractor added, or null if already present
 */
export function addSelectionReviewSub(
  selectionData: SelectionDataState,
  itemId: string,
  sub: Subcontractor,
): SelectionDataState | null {
  const currentReview = selectionData.reviewByItemId[itemId] ?? [];

  // Prevent duplicate additions
  if (currentReview.some((reviewSub) => reviewSub.id === sub.id)) return null;

  return {
    ...selectionData,
    reviewByItemId: {
      ...selectionData.reviewByItemId,
      [itemId]: [...currentReview, sub],
    },
  };
}

/**
 * Adds a subcontractor to the review list at a specific position.
 * Prevents duplicate additions and normalizes the index to valid bounds.
 *
 * @param {SelectionDataState} selectionData - Current selection state
 * @param {string} itemId - The work item ID
 * @param {Subcontractor} sub - The subcontractor to add
 * @param {number} index - The position to insert at (0-based)
 * @returns {SelectionDataState | null} New selection state with subcontractor inserted, or null if already present
 */
export function addSelectionReviewSubAt(
  selectionData: SelectionDataState,
  itemId: string,
  sub: Subcontractor,
  index: number,
): SelectionDataState | null {
  const currentReview = selectionData.reviewByItemId[itemId] ?? [];

  // Prevent duplicate additions
  if (currentReview.some((reviewSub) => reviewSub.id === sub.id)) return null;

  const nextReview = [...currentReview];
  // Clamp index to valid range [0, length]
  const normalizedIndex = Math.max(0, Math.min(index, nextReview.length));
  nextReview.splice(normalizedIndex, 0, sub);

  return {
    ...selectionData,
    reviewByItemId: {
      ...selectionData.reviewByItemId,
      [itemId]: nextReview,
    },
  };
}

/**
 * Removes a subcontractor from the review list for a work item.
 * Safe to call even if subcontractor is not in the list (no-op).
 *
 * @param {SelectionDataState} selectionData - Current selection state
 * @param {string} itemId - The work item ID
 * @param {string} subId - The ID of the subcontractor to remove
 * @returns {SelectionDataState} New selection state with subcontractor removed
 */
export function removeSelectionReviewSub(
  selectionData: SelectionDataState,
  itemId: string,
  subId: string,
): SelectionDataState {
  const currentReview = selectionData.reviewByItemId[itemId] ?? [];
  return {
    ...selectionData,
    reviewByItemId: {
      ...selectionData.reviewByItemId,
      [itemId]: currentReview.filter((sub) => sub.id !== subId),
    },
  };
}

/**
 * Reorders a subcontractor in the review list by moving it to another position.
 * Used for drag-and-drop reordering operations.
 *
 * @param {SelectionDataState} selectionData - Current selection state
 * @param {string} itemId - The work item ID
 * @param {string} subId - The ID of the subcontractor being moved
 * @param {string} overSubId - The ID of the subcontractor at the target position
 * @returns {SelectionDataState | null} New selection state with reordered list, or null if operation is invalid
 */
export function reorderSelectionReviewSub(
  selectionData: SelectionDataState,
  itemId: string,
  subId: string,
  overSubId: string,
): SelectionDataState | null {
  const currentReview = selectionData.reviewByItemId[itemId] ?? [];
  const fromIndex = currentReview.findIndex((sub) => sub.id === subId);
  const overIndex = currentReview.findIndex((sub) => sub.id === overSubId);

  // Validate that both subcontractors exist and are different
  if (fromIndex === -1 || overIndex === -1 || fromIndex === overIndex)
    return null;

  const nextReview = [...currentReview];
  // Remove from old position
  const [movedSub] = nextReview.splice(fromIndex, 1);
  // Insert at new position
  nextReview.splice(overIndex, 0, movedSub);

  return {
    ...selectionData,
    reviewByItemId: {
      ...selectionData.reviewByItemId,
      [itemId]: nextReview,
    },
  };
}

/**
 * Moves a subcontractor to the end of the review list.
 * Used for deprioritizing a subcontractor in the shortlist.
 *
 * @param {SelectionDataState} selectionData - Current selection state
 * @param {string} itemId - The work item ID
 * @param {string} subId - The ID of the subcontractor to move
 * @returns {SelectionDataState | null} New selection state with subcontractor moved to end, or null if already at end or not found
 */
export function moveSelectionReviewSubToEnd(
  selectionData: SelectionDataState,
  itemId: string,
  subId: string,
): SelectionDataState | null {
  const currentReview = selectionData.reviewByItemId[itemId] ?? [];
  const fromIndex = currentReview.findIndex((sub) => sub.id === subId);

  // Return null if not found or already at the end
  if (fromIndex === -1 || fromIndex === currentReview.length - 1) return null;

  const nextReview = [...currentReview];
  // Remove from current position
  const [movedSub] = nextReview.splice(fromIndex, 1);
  // Add to end
  nextReview.push(movedSub);

  return {
    ...selectionData,
    reviewByItemId: {
      ...selectionData.reviewByItemId,
      [itemId]: nextReview,
    },
  };
}

/**
 * Retrieves the complete assignment for a work item, combining review and final decision data.
 * Merges the review list from selection stage with the carried/backup lists from awarding stage.
 *
 * @param {SelectionDataState} selectionData - Current selection state
 * @param {AwardingDataState} awardingData - Current awarding state
 * @param {string} itemId - The work item ID
 * @returns {Assignment} Complete assignment with review, carried, and backup subcontractors
 */
export function getAssignmentForItem(
  selectionData: SelectionDataState,
  awardingData: AwardingDataState,
  itemId: string,
): Assignment {
  const review = selectionData.reviewByItemId[itemId] ?? [];
  const decision = getDecisionAssignment(awardingData, itemId);
  return {
    review,
    carried: decision.carried,
    backups: decision.backups,
  };
}

/**
 * Retrieves assignments for all work items in a package.
 * Returns a map of work item IDs to their complete assignments.
 *
 * @param {WorkItem[]} workItems - Array of work items
 * @param {SelectionDataState} selectionData - Current selection state
 * @param {AwardingDataState} awardingData - Current awarding state
 * @returns {Record<string, Assignment>} Map of item IDs to assignments
 */
export function getAssignmentsByItemId(
  workItems: WorkItem[],
  selectionData: SelectionDataState,
  awardingData: AwardingDataState,
): Record<string, Assignment> {
  const result: Record<string, Assignment> = {};
  workItems.forEach((item) => {
    result[item.id] = getAssignmentForItem(
      selectionData,
      awardingData,
      item.id,
    );
  });
  return result;
}

/**
 * Filters the vendor database to show only relevant, unassigned subcontractors for a work item.
 * Filters by matching trade specialization and excludes already-assigned subcontractors.
 *
 * @param {Subcontractor[]} subcontractors - Complete vendor database
 * @param {WorkItem | undefined} activeItem - The currently active work item (if any)
 * @param {Set<string>} assignedIds - Set of subcontractor IDs that are already assigned
 * @returns {Subcontractor[]} Filtered array of available subcontractors
 */
export function getSelectionFilteredSubs(
  subcontractors: Subcontractor[],
  activeItem: WorkItem | undefined,
  assignedIds: Set<string>,
): Subcontractor[] {
  return subcontractors.filter(
    (sub) =>
      // Must have matching trade
      sub.trades.includes(activeItem?.sectionCode ?? "") &&
      // Must not already be assigned
      !assignedIds.has(sub.id),
  );
}
