import { createBidsForShortlistedVendors, getBidRecords } from "./Bid.ops";
import type { BidRecord } from "./types";

/**
 * Invitation operations layer - handles the invitation workflow
 * Delegates to Bid.ops for underlying bid data management
 */

export function getInvitationRecords(tenderPackageId: string): BidRecord[] {
  return getBidRecords(tenderPackageId);
}

export function createInvitationsForShortlistedVendors(
  tenderPackageId: string,
  shortlistedVendorIds: string[],
): { newRecords: BidRecord[]; alreadyInvitedCount: number } {
  return createBidsForShortlistedVendors(tenderPackageId, shortlistedVendorIds);
}
