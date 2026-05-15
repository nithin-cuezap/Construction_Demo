import {
  createInitialWorkItemsForPackage,
  INITIAL_AWARDING_DATA,
  INITIAL_INVITATION_DATA,
  INITIAL_PACKAGE_ID,
  INITIAL_SELECTION_DATA,
  INITIAL_SUBCONTRACTORS,
  INITIAL_TENDER_PACKAGES,
  INITIAL_WORKFLOW_STAGE,
} from "./initial-data";
import type {
  AwardingDataState,
  InvitationDataState,
  InvitationRecord,
  InvitationStatus,
  SelectionDataState,
  Subcontractor,
  TenderPackage,
  WorkItem,
} from "./types";

export const WORKFLOW_STAGES = [
  "TenderPackages",
  "Invitation",
  "Awarding",
] as const;
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

interface MockDbState {
  workflowStage: WorkflowStage;
  workItemsByPackageId: Record<string, WorkItem[]>;
  subcontractors: Subcontractor[];
  selectionData: SelectionDataState;
  invitationData: InvitationDataState;
  awardingData: AwardingDataState;
  tenderPackages: TenderPackage[];
}

const db: MockDbState = {
  workflowStage: INITIAL_WORKFLOW_STAGE,
  workItemsByPackageId: {
    [INITIAL_PACKAGE_ID]: createInitialWorkItemsForPackage(INITIAL_PACKAGE_ID),
  },
  subcontractors: INITIAL_SUBCONTRACTORS,
  selectionData: INITIAL_SELECTION_DATA,
  invitationData: INITIAL_INVITATION_DATA,
  awardingData: INITIAL_AWARDING_DATA,
  tenderPackages: INITIAL_TENDER_PACKAGES,
};

const clone = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

export const mockDb = {
  getWorkflowStage(): WorkflowStage {
    return db.workflowStage;
  },
  setWorkflowStage(stage: WorkflowStage) {
    db.workflowStage = stage;
  },

  getWorkItems(tenderPackageId: string): WorkItem[] {
    return clone(db.workItemsByPackageId[tenderPackageId] ?? []);
  },
  setWorkItems(tenderPackageId: string, nextWorkItems: WorkItem[]) {
    db.workItemsByPackageId[tenderPackageId] = clone(nextWorkItems);
  },
  ensureWorkItemsForPackage(tenderPackageId: string) {
    if (!db.workItemsByPackageId[tenderPackageId]) {
      db.workItemsByPackageId[tenderPackageId] =
        createInitialWorkItemsForPackage(tenderPackageId);
    }
  },
  deleteWorkItemsForPackage(tenderPackageId: string) {
    const removedItemIds = new Set(
      (db.workItemsByPackageId[tenderPackageId] ?? []).map((item) => item.id),
    );

    if (removedItemIds.size === 0) {
      return;
    }

    const { [tenderPackageId]: _removedWorkItems, ...remainingWorkItems } =
      db.workItemsByPackageId;
    void _removedWorkItems;
    db.workItemsByPackageId = remainingWorkItems;

    db.selectionData = {
      ...db.selectionData,
      reviewByItemId: Object.fromEntries(
        Object.entries(db.selectionData.reviewByItemId).filter(
          ([itemId]) => !removedItemIds.has(itemId),
        ),
      ),
    };

    db.invitationData = {
      ...db.invitationData,
      notesByItemId: Object.fromEntries(
        Object.entries(db.invitationData.notesByItemId).filter(
          ([itemId]) => !removedItemIds.has(itemId),
        ),
      ),
      sentItemIds: db.invitationData.sentItemIds.filter(
        (itemId) => !removedItemIds.has(itemId),
      ),
    };

    db.awardingData = {
      ...db.awardingData,
      decisionsByItemId: Object.fromEntries(
        Object.entries(db.awardingData.decisionsByItemId).filter(
          ([itemId]) => !removedItemIds.has(itemId),
        ),
      ),
    };
  },

  getSubcontractors(): Subcontractor[] {
    return clone(db.subcontractors);
  },

  getSelectionData(): SelectionDataState {
    return clone(db.selectionData);
  },
  setSelectionData(nextSelectionData: SelectionDataState) {
    db.selectionData = clone(nextSelectionData);
  },

  getInvitationData(): InvitationDataState {
    return clone(db.invitationData);
  },
  setInvitationData(nextInvitationData: InvitationDataState) {
    db.invitationData = clone(nextInvitationData);
  },

  getAwardingData(): AwardingDataState {
    return clone(db.awardingData);
  },
  setAwardingData(nextAwardingData: AwardingDataState) {
    db.awardingData = clone(nextAwardingData);
  },

  getTenderPackages(): TenderPackage[] {
    return clone(db.tenderPackages);
  },
  setTenderPackages(nextTenderPackages: TenderPackage[]) {
    db.tenderPackages = clone(nextTenderPackages);
  },

  generatePackageControlNumber(): string {
    const seq = (db.tenderPackages.length + 1).toString().padStart(3, "0");
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    return `TP-${seq}-${date}`;
  },

  getInvitationRecords(tenderPackageId: string): InvitationRecord[] {
    return clone(
      db.invitationData.invitationRecords.filter(
        (record) => record.tenderPackageId === tenderPackageId,
      ),
    );
  },

  createInvitationRecords(
    tenderPackageId: string,
    subcontractorIds: string[],
  ): InvitationRecord[] {
    const now = new Date().toISOString();
    const newRecords: InvitationRecord[] = subcontractorIds.map(
      (subcontractorId) => ({
        id: `invitation-${tenderPackageId}-${subcontractorId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        tenderPackageId,
        subcontractorId,
        status: "Invited" as InvitationStatus,
        invitedAt: now,
        lastUpdatedAt: now,
      }),
    );

    db.invitationData = {
      ...db.invitationData,
      invitationRecords: [
        ...db.invitationData.invitationRecords,
        ...newRecords,
      ],
    };

    return clone(newRecords);
  },

  updateInvitationStatus(
    invitationId: string,
    status: InvitationStatus,
  ): InvitationRecord | null {
    const recordIndex = db.invitationData.invitationRecords.findIndex(
      (record) => record.id === invitationId,
    );

    if (recordIndex === -1) {
      return null;
    }

    const updatedRecord: InvitationRecord = {
      ...db.invitationData.invitationRecords[recordIndex],
      status,
      lastUpdatedAt: new Date().toISOString(),
    };

    const updatedRecords = [...db.invitationData.invitationRecords];
    updatedRecords[recordIndex] = updatedRecord;

    db.invitationData = {
      ...db.invitationData,
      invitationRecords: updatedRecords,
    };

    return clone(updatedRecord);
  },
};
