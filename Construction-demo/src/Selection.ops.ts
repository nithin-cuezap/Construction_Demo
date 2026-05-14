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

export function getSelectionViewData(): SelectionViewDataSnapshot {
  return {
    workItems: mockDb.getWorkItems(),
    selectionData: mockDb.getSelectionData(),
    awardingData: mockDb.getAwardingData(),
    subcontractors: mockDb.getSubcontractors(),
  };
}

export function persistWorkItems(workItems: WorkItem[]) {
  mockDb.setWorkItems(workItems);
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

export function addWorkItem(
  workItems: WorkItem[],
  division: string,
  section: string,
): { workItems: WorkItem[]; createdItemId: string } | null {
  const normalizedDivision = division.trim();
  const normalizedSection = section.trim();
  if (!normalizedDivision || !normalizedSection) return null;

  const nextWorkItem: WorkItem = {
    id: `wi-${Date.now()}`,
    division: normalizedDivision,
    section: normalizedSection,
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
    (sub) => sub.trade === activeItem?.division && !assignedIds.has(sub.id),
  );
}
