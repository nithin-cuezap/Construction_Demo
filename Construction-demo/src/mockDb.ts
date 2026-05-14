import type {
  AwardingDataState,
  InvitationDataState,
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

const INITIAL_PACKAGE_ID = "tp-1";

const INITIAL_WORK_ITEM_TEMPLATES: Array<
  Pick<WorkItem, "sectionCode" | "sectionName" | "description">
> = [
  {
    sectionCode: "03 30 00",
    sectionName: "Cast-in-Place Concrete",
    description: "Concrete structural forming and placement",
  },
  {
    sectionCode: "09 22 00",
    sectionName: "Metal Supports for Plaster",
    description: "Metal support framing for plaster and gypsum board",
  },
  {
    sectionCode: "09 90 00",
    sectionName: "Painting and Coating",
    description: "Interior and exterior painting and coating work",
  },
  {
    sectionCode: "26 05 00",
    sectionName: "Common Work Results for Electrical",
    description: "Electrical conduit, wiring, and common installations",
  },
];

const createInitialWorkItemsForPackage = (
  tenderPackageId: string,
): WorkItem[] =>
  INITIAL_WORK_ITEM_TEMPLATES.map((template, index) => ({
    id: `${tenderPackageId}-wi-${index + 1}`,
    tenderPackageId,
    sectionCode: template.sectionCode,
    sectionName: template.sectionName,
    description: template.description,
    status: "Draft",
  }));

const INITIAL_SUBCONTRACTORS: Subcontractor[] = [
  {
    id: "sub-1",
    name: "Apex Concrete Works",
    trade: "03 30 00",
    rating: 4.8,
    projects: 24,
    responseSpeed: "Fast",
  },
  {
    id: "sub-2",
    name: "Solid Foundations Ltd.",
    trade: "03 30 00",
    rating: 4.2,
    projects: 12,
    responseSpeed: "Average",
  },
  {
    id: "sub-3",
    name: "City Pours",
    trade: "03 30 00",
    rating: 3.9,
    projects: 8,
    responseSpeed: "Slow",
  },
  {
    id: "sub-4",
    name: "Prime Painters",
    trade: "09 90 00",
    rating: 5.0,
    projects: 41,
    responseSpeed: "Fast",
  },
  {
    id: "sub-5",
    name: "Elite Drywall & Framing",
    trade: "09 22 00",
    rating: 4.5,
    projects: 19,
    responseSpeed: "Fast",
  },
  {
    id: "sub-6",
    name: "ProCoat Finishes",
    trade: "09 90 00",
    rating: 4.1,
    projects: 15,
    responseSpeed: "Average",
  },
  {
    id: "sub-7",
    name: "Volt Masters",
    trade: "26 05 00",
    rating: 4.9,
    projects: 33,
    responseSpeed: "Fast",
  },
];

const INITIAL_TENDER_PACKAGES: TenderPackage[] = [
  {
    id: INITIAL_PACKAGE_ID,
    packageName: "Downtown Office Complex - Phase 1",
    packageControlNumber: "TP-001-05132026",
    tenderSubmissionDueDate: "2026-06-30",
    rfqDueDate: "2026-06-20",
    subContractorBidSubmissionDueDate: "2026-06-25",
    subContractorRfqDueDate: "2026-06-18",
    workflowStage: 1,
    siteAddress: {
      street: "123 Main Street",
      city: "Downtown",
      state: "CA",
      zipCode: "90210",
      latitude: 34.0522,
      longitude: -118.2437,
      country: "USA",
    },
    customerName: "ABC Development Corp",
    customerContactDetails: {
      name: "John Smith",
      email: "john.smith@abcdev.com",
      phone: "(555) 123-4567",
      mobile: "(555) 987-6543",
      title: "Project Manager",
    },
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "Draft",
  },
];

const db: MockDbState = {
  workflowStage: "TenderPackages",
  workItemsByPackageId: {
    [INITIAL_PACKAGE_ID]: createInitialWorkItemsForPackage(INITIAL_PACKAGE_ID),
  },
  subcontractors: INITIAL_SUBCONTRACTORS,
  selectionData: {
    reviewByItemId: {},
  },
  invitationData: {
    notesByItemId: {},
    sentItemIds: [],
  },
  awardingData: {
    decisionsByItemId: {},
  },
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
};
