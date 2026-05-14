import { getDecisionAssignment } from "./Awarding.ops";
import { mockDb } from "./mockDb";
import type {
  Assignment,
  AwardingDataState,
  SelectionDataState,
  Subcontractor,
  WorkItem,
} from "./types";

interface SelectionViewDataSnapshot {
  workItems: WorkItem[];
  selectionData: SelectionDataState;
  awardingData: AwardingDataState;
  subcontractors: Subcontractor[];
}

export function getSelectionViewData(
  tenderPackageId: string,
): SelectionViewDataSnapshot {
  mockDb.ensureWorkItemsForPackage(tenderPackageId);
  return {
    workItems: mockDb.getWorkItems(tenderPackageId),
    selectionData: mockDb.getSelectionData(),
    awardingData: mockDb.getAwardingData(),
    subcontractors: mockDb.getSubcontractors(),
  };
}

export function persistWorkItems(
  tenderPackageId: string,
  workItems: WorkItem[],
) {
  mockDb.setWorkItems(tenderPackageId, workItems);
}

export function persistSelectionData(selectionData: SelectionDataState) {
  mockDb.setSelectionData(selectionData);
}

export function setWorkItemStatus(
  workItems: WorkItem[],
  itemId: string,
  status: string,
): WorkItem[] {
  return workItems.map((item) =>
    item.id === itemId && item.status !== status ? { ...item, status } : item,
  );
}

export function setWorkItemStatuses(
  workItems: WorkItem[],
  updates: Array<{ id: string; status: string }>,
): WorkItem[] {
  return workItems.map((item) => {
    const update = updates.find((u) => u.id === item.id);
    return update && item.status !== update.status
      ? { ...item, status: update.status }
      : item;
  });
}

export function areAllWorkItemsShortlistingCompleted(
  workItems: WorkItem[],
): boolean {
  return workItems.every((item) => item.status === "Shortlisting Completed");
}

export function addWorkItem(
  workItems: WorkItem[],
  tenderPackageId: string,
  sectionCode: string,
  sectionName: string,
  description: string,
): { workItems: WorkItem[]; createdItemId: string } | null {
  const normalizedSectionCode = sectionCode.trim();
  const normalizedSectionName = sectionName.trim();
  const normalizedDescription = description.trim();
  if (
    !normalizedSectionCode ||
    !normalizedSectionName ||
    !normalizedDescription
  )
    return null;

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

export function addSelectionReviewSub(
  selectionData: SelectionDataState,
  itemId: string,
  sub: Subcontractor,
): SelectionDataState | null {
  const currentReview = selectionData.reviewByItemId[itemId] ?? [];
  if (currentReview.some((reviewSub) => reviewSub.id === sub.id)) return null;

  return {
    ...selectionData,
    reviewByItemId: {
      ...selectionData.reviewByItemId,
      [itemId]: [...currentReview, sub],
    },
  };
}

export function addSelectionReviewSubAt(
  selectionData: SelectionDataState,
  itemId: string,
  sub: Subcontractor,
  index: number,
): SelectionDataState | null {
  const currentReview = selectionData.reviewByItemId[itemId] ?? [];
  if (currentReview.some((reviewSub) => reviewSub.id === sub.id)) return null;

  const nextReview = [...currentReview];
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

export function reorderSelectionReviewSub(
  selectionData: SelectionDataState,
  itemId: string,
  subId: string,
  overSubId: string,
): SelectionDataState | null {
  const currentReview = selectionData.reviewByItemId[itemId] ?? [];
  const fromIndex = currentReview.findIndex((sub) => sub.id === subId);
  const overIndex = currentReview.findIndex((sub) => sub.id === overSubId);
  if (fromIndex === -1 || overIndex === -1 || fromIndex === overIndex)
    return null;

  const nextReview = [...currentReview];
  const [movedSub] = nextReview.splice(fromIndex, 1);
  nextReview.splice(overIndex, 0, movedSub);

  return {
    ...selectionData,
    reviewByItemId: {
      ...selectionData.reviewByItemId,
      [itemId]: nextReview,
    },
  };
}

export function moveSelectionReviewSubToEnd(
  selectionData: SelectionDataState,
  itemId: string,
  subId: string,
): SelectionDataState | null {
  const currentReview = selectionData.reviewByItemId[itemId] ?? [];
  const fromIndex = currentReview.findIndex((sub) => sub.id === subId);
  if (fromIndex === -1 || fromIndex === currentReview.length - 1) return null;

  const nextReview = [...currentReview];
  const [movedSub] = nextReview.splice(fromIndex, 1);
  nextReview.push(movedSub);

  return {
    ...selectionData,
    reviewByItemId: {
      ...selectionData.reviewByItemId,
      [itemId]: nextReview,
    },
  };
}

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

export function getSelectionFilteredSubs(
  subcontractors: Subcontractor[],
  activeItem: WorkItem | undefined,
  assignedIds: Set<string>,
): Subcontractor[] {
  return subcontractors.filter(
    (sub) =>
      sub.trades.includes(activeItem?.sectionCode ?? "") &&
      !assignedIds.has(sub.id),
  );
}
