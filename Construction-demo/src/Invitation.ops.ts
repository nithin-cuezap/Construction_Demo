/**
 * @fileoverview Operations for managing the invitation workflow stage.
 *
 * This module provides business logic specific to the bid invitation stage of the workflow.
 * It acts as a semantic wrapper around Bid operations, using invitation-specific terminology
 * while delegating to the underlying bid data management layer.
 *
 * @module Invitation.ops
 */

import { createBidsForShortlistedVendors, getBidRecords } from "./Bid.ops";
import type { BidRecord } from "./types";

/**
 * Retrieves all invitation records (bid records) for a tender package.
 * This is semantically equivalent to getting bid records, but uses invitation terminology.
 *
 * @param {string} tenderPackageId - The ID of the tender package
 * @returns {BidRecord[]} Array of invitation/bid records
 */
export function getInvitationRecords(tenderPackageId: string): BidRecord[] {
  return getBidRecords(tenderPackageId);
}

/**
 * Creates invitation records for shortlisted vendors.
 * Avoids creating duplicate invitations for vendors already invited.
 *
 * @param {string} tenderPackageId - The ID of the tender package
 * @param {string[]} shortlistedVendorIds - Array of shortlisted subcontractor IDs
 * @returns {{newRecords: BidRecord[], alreadyInvitedCount: number}} Object containing newly created invitation records and count of already-invited vendors
 */
export function createInvitationsForShortlistedVendors(
  tenderPackageId: string,
  shortlistedVendorIds: string[],
): { newRecords: BidRecord[]; alreadyInvitedCount: number } {
  return createBidsForShortlistedVendors(tenderPackageId, shortlistedVendorIds);
}
