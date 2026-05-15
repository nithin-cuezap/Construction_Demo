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
import type { BidRecord, BidStatus } from "./types";

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
  return mockDb.createBidRecords(tenderPackageId, subcontractorIds, "Invitation Pending");
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
