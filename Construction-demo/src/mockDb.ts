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
  workItems: WorkItem[];
  subcontractors: Subcontractor[];
  selectionData: SelectionDataState;
  invitationData: InvitationDataState;
  awardingData: AwardingDataState;
  tenderPackages: TenderPackage[];
}

const INITIAL_WORK_ITEMS: WorkItem[] = [
  {
    id: "wi-1",
    division: "03 Concrete",
    section: "03 30 00 Cast-in-Place",
    status: "Draft",
  },
  {
    id: "wi-2",
    division: "09 Finishes",
    section: "09 22 00 Metal Supports",
    status: "Draft",
  },
  {
    id: "wi-3",
    division: "09 Finishes",
    section: "09 90 00 Painting",
    status: "Draft",
  },
  {
    id: "wi-4",
    division: "26 Electrical",
    section: "26 05 00 Common Work Results",
    status: "Draft",
  },
];

const INITIAL_SUBCONTRACTORS: Subcontractor[] = [
  {
    id: "sub-1",
    name: "Apex Concrete Works",
    trade: "03 Concrete",
    rating: 4.8,
    projects: 24,
    responseSpeed: "Fast",
  },
  {
    id: "sub-2",
    name: "Solid Foundations Ltd.",
    trade: "03 Concrete",
    rating: 4.2,
    projects: 12,
    responseSpeed: "Average",
  },
  {
    id: "sub-3",
    name: "City Pours",
    trade: "03 Concrete",
    rating: 3.9,
    projects: 8,
    responseSpeed: "Slow",
  },
  {
    id: "sub-4",
    name: "Prime Painters",
    trade: "09 Finishes",
    rating: 5.0,
    projects: 41,
    responseSpeed: "Fast",
  },
  {
    id: "sub-5",
    name: "Elite Drywall & Framing",
    trade: "09 Finishes",
    rating: 4.5,
    projects: 19,
    responseSpeed: "Fast",
  },
  {
    id: "sub-6",
    name: "ProCoat Finishes",
    trade: "09 Finishes",
    rating: 4.1,
    projects: 15,
    responseSpeed: "Average",
  },
  {
    id: "sub-7",
    name: "Volt Masters",
    trade: "26 Electrical",
    rating: 4.9,
    projects: 33,
    responseSpeed: "Fast",
  },
];

const INITIAL_TENDER_PACKAGES: TenderPackage[] = [
  {
    id: "tp-1",
    packageName: "Downtown Office Complex - Phase 1",
    packageControlNumber: "TP-001-05132026",
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
  workItems: INITIAL_WORK_ITEMS,
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

  getWorkItems(): WorkItem[] {
    return clone(db.workItems);
  },
  setWorkItems(nextWorkItems: WorkItem[]) {
    db.workItems = clone(nextWorkItems);
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
