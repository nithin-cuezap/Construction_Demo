import { mockDb } from "./mockDb";
import type { InvitationRecord, InvitationStatus } from "./types";

export function getInvitationRecords(
  tenderPackageId: string,
): InvitationRecord[] {
  return mockDb.getInvitationRecords(tenderPackageId);
}

export function createInvitationRecords(
  tenderPackageId: string,
  subcontractorIds: string[],
): InvitationRecord[] {
  return mockDb.createInvitationRecords(tenderPackageId, subcontractorIds);
}

export function updateInvitationStatus(
  invitationId: string,
  status: InvitationStatus,
): InvitationRecord | null {
  return mockDb.updateInvitationStatus(invitationId, status);
}

export function createInvitationsForShortlistedVendors(
  tenderPackageId: string,
  shortlistedVendorIds: string[],
): { newRecords: InvitationRecord[]; alreadyInvitedCount: number } {
  const existingRecords = getInvitationRecords(tenderPackageId);
  const existingVendorIds = new Set(
    existingRecords.map((record) => record.subcontractorId),
  );

  const newVendorIds = shortlistedVendorIds.filter(
    (id) => !existingVendorIds.has(id),
  );
  const alreadyInvitedCount = shortlistedVendorIds.length - newVendorIds.length;

  const newRecords =
    newVendorIds.length > 0
      ? createInvitationRecords(tenderPackageId, newVendorIds)
      : [];

  return { newRecords, alreadyInvitedCount };
}
