import { mockDb } from "./mockDb";
import type { BidRecord, BidStatus } from "./types";

export function getBidRecords(tenderPackageId: string): BidRecord[] {
  return mockDb.getBidRecords(tenderPackageId);
}

export function createBidRecords(
  tenderPackageId: string,
  subcontractorIds: string[],
): BidRecord[] {
  return mockDb.createBidRecords(tenderPackageId, subcontractorIds);
}

export function updateBidStatus(
  bidId: string,
  status: BidStatus,
): BidRecord | null {
  return mockDb.updateBidStatus(bidId, status);
}

export function createBidsForShortlistedVendors(
  tenderPackageId: string,
  shortlistedVendorIds: string[],
): { newRecords: BidRecord[]; alreadyInvitedCount: number } {
  const existingRecords = getBidRecords(tenderPackageId);
  const existingVendorIds = new Set(
    existingRecords.map((record) => record.subcontractorId),
  );

  const newVendorIds = shortlistedVendorIds.filter(
    (id) => !existingVendorIds.has(id),
  );
  const alreadyInvitedCount = shortlistedVendorIds.length - newVendorIds.length;

  const newRecords =
    newVendorIds.length > 0
      ? createBidRecords(tenderPackageId, newVendorIds)
      : [];

  return { newRecords, alreadyInvitedCount };
}
