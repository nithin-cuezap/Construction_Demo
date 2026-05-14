export interface Subcontractor {
  id: string;
  name: string;
  trades: string[];
  rating: number;
  projects: number;
  responseSpeed: string;
}

export interface Assignment {
  carried: Subcontractor[];
  backups: Subcontractor[];
  review: Subcontractor[];
}

export interface SelectionDataState {
  reviewByItemId: Record<string, Subcontractor[]>;
}

export interface InvitationDataState {
  notesByItemId: Record<string, string>;
  sentItemIds: string[];
}

export interface AwardingDataState {
  decisionsByItemId: Record<string, Pick<Assignment, "carried" | "backups">>;
}

export interface WorkItem {
  id: string;
  tenderPackageId: string;
  sectionCode: string;
  sectionName: string;
  description: string;
  status: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  country: string;
}

export interface ContactDetails {
  name: string;
  email: string;
  phone: string;
  mobile?: string;
  title?: string;
}

export interface Document {
  id: string;
  name: string;
  type: "confidential" | "reference";
  uploadedAt: string;
  size: number;
  url: string;
}

export interface TenderPackage {
  id: string;
  packageName: string;
  packageControlNumber: string;
  projectDescription?: string;
  tenderSubmissionDueDate: string;
  rfqDueDate: string;
  subContractorBidSubmissionDueDate: string;
  subContractorRfqDueDate: string;
  workflowStage: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  siteAddress: Address;
  customerName: string;
  customerContactDetails: ContactDetails;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
  status:
    | "Draft"
    | "Work Scoping & Contractor Shortlisting"
    | "Bid Invitation"
    | "Bid Review"
    | "Finalized"
    | "Closed";
}
