/**
 * @fileoverview Operations for managing bid records and bid status tracking.
 *
 * This module provides business logic for creating, retrieving, and updating bid records
 * that track subcontractor responses to tender invitations. Functions here serve as a
 * convenience layer over the mock database's bid record methods.
 *
 * @module Bid.ops
 */

import { mockDb } from "./mockDb";
import type { BidRecord, BidStatus, BidSubmissionFile } from "./types";

/**
 * Retrieves all bid records for a specific tender package.
 *
 * @param {string} tenderPackageId - The ID of the tender package
 * @returns {BidRecord[]} Array of bid records associated with the package
 */
export function getBidRecords(tenderPackageId: string): BidRecord[] {
  return mockDb.getBidRecords(tenderPackageId);
}

/**
 * Creates new bid records for multiple subcontractors.
 * All records start with "Invitation Pending" status by default.
 *
 * @param {string} tenderPackageId - The ID of the tender package
 * @param {string[]} subcontractorIds - Array of subcontractor IDs to create bids for
 * @returns {BidRecord[]} The newly created bid records
 */
export function createBidRecords(
  tenderPackageId: string,
  subcontractorIds: string[],
): BidRecord[] {
  return mockDb.createBidRecords(
    tenderPackageId,
    subcontractorIds,
    "Invitation Pending",
  );
}

/**
 * Updates the status of a specific bid record.
 * Automatically updates the lastUpdatedAt timestamp.
 *
 * @param {string} bidId - The ID of the bid record to update
 * @param {BidStatus} status - The new bid status
 * @returns {BidRecord | null} The updated bid record, or null if not found
 */
export function updateBidStatus(
  bidId: string,
  status: BidStatus,
): BidRecord | null {
  return mockDb.updateBidStatus(bidId, status);
}

/**
 * Creates bid records for shortlisted vendors, avoiding duplicates.
 * Checks for existing invitations and only creates records for vendors
 * who haven't been invited yet.
 *
 * @param {string} tenderPackageId - The ID of the tender package
 * @param {string[]} shortlistedVendorIds - Array of shortlisted subcontractor IDs
 * @returns {{newRecords: BidRecord[], alreadyInvitedCount: number}} Object containing newly created records and count of already-invited vendors
 */
export function createBidsForShortlistedVendors(
  tenderPackageId: string,
  shortlistedVendorIds: string[],
): { newRecords: BidRecord[]; alreadyInvitedCount: number } {
  // Get existing bid records for this package
  const existingRecords = getBidRecords(tenderPackageId);
  const existingVendorIds = new Set(
    existingRecords.map((record) => record.subcontractorId),
  );

  // Filter out vendors who already have bid records
  const newVendorIds = shortlistedVendorIds.filter(
    (id) => !existingVendorIds.has(id),
  );
  const alreadyInvitedCount = shortlistedVendorIds.length - newVendorIds.length;

  // Create bid records only for new vendors
  const newRecords =
    newVendorIds.length > 0
      ? createBidRecords(tenderPackageId, newVendorIds)
      : [];

  return { newRecords, alreadyInvitedCount };
}

/**
 * Marks bid records as invited (sent) for specific subcontractors.
 * Updates status from "Invitation Pending" to "Invited" and sets the invitedAt timestamp.
 *
 * @param {string} tenderPackageId - The ID of the tender package
 * @param {string[]} subcontractorIds - Array of subcontractor IDs to mark as invited
 * @returns {BidRecord[]} Array of updated bid records
 */
export function markBidsAsInvited(
  tenderPackageId: string,
  subcontractorIds: string[],
): BidRecord[] {
  return mockDb.markBidsAsInvited(tenderPackageId, subcontractorIds);
}

/**
 * Retrieves a single bid record by its unique identifier.
 *
 * This function is commonly used when a vendor accesses their bid
 * submission page via a direct link containing the bid ID.
 * Returns null if the bid doesn't exist, allowing views to handle
 * invalid or expired bid links gracefully.
 *
 * @param {string} bidId - The unique identifier of the bid record
 * @returns {BidRecord | null} The bid record if found, or null if the bid doesn't exist
 */
export function getBidById(bidId: string): BidRecord | null {
  return mockDb.getBidById(bidId);
}

/**
 * Submits a vendor's bid with uploaded files and comments.
 *
 * This is the final operation in the bid submission workflow. Once called:
 * - The bid status changes to "Bid Submitted" (irreversible)
 * - All files and comments are permanently stored
 * - A submission timestamp is recorded
 * - The vendor can no longer modify their submission
 *
 * The function acts as a convenience wrapper over mockDb.submitBid,
 * following the pattern where all database operations go through .ops.ts files.
 *
 * @param {string} bidId - The unique identifier of the bid record to submit
 * @param {BidSubmissionFile[]} files - Array of uploaded file metadata, each with optional comment
 * @param {string} submissionComment - Overall notes or clarifications for the entire bid submission
 * @returns {BidRecord | null} The updated bid record with submission data, or null if bid ID is invalid
 */
export function submitBid(
  bidId: string,
  files: BidSubmissionFile[],
  submissionComment: string,
): BidRecord | null {
  return mockDb.submitBid(bidId, files, submissionComment);
}
