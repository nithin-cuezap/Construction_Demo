/**
 * @fileoverview Core type definitions for the Construction Demo application.
 *
 * This module contains all the TypeScript interfaces and types used throughout the application,
 * including data models for subcontractors, tender packages, bids, work items, and various
 * application state structures. These types form the foundation of the type system and ensure
 * type safety across all components and operations.
 *
 * @module types
 */

/**
 * Represents a subcontractor entity in the vendor database.
 * Subcontractors are invited to bid on tender packages and can be assigned to work items.
 *
 * @interface Subcontractor
 * @property {string} id - Unique identifier for the subcontractor
 * @property {string} name - Business name of the subcontractor company
 * @property {string[]} trades - Array of trade specializations (e.g., "Electrical", "Plumbing")
 * @property {number} rating - Performance rating (typically 0-5 scale)
 * @property {number} projects - Total number of completed projects
 * @property {string} responseSpeed - Typical response time descriptor (e.g., "Fast", "Medium", "Slow")
 */
export interface Subcontractor {
  id: string;
  name: string;
  trades: string[];
  rating: number;
  projects: number;
  responseSpeed: string;
}

/**
 * Represents subcontractor assignment categories for a work item.
 * During the selection process, subcontractors are organized into three categories
 * based on their suitability and priority for the work.
 *
 * @interface Assignment
 * @property {Subcontractor[]} carried - Primary/preferred subcontractors for this work item
 * @property {Subcontractor[]} backups - Secondary/backup subcontractors as alternatives
 * @property {Subcontractor[]} review - Subcontractors under review for potential inclusion
 */
export interface Assignment {
  carried: Subcontractor[];
  backups: Subcontractor[];
  review: Subcontractor[];
}

/**
 * Global state structure for the contractor selection workflow stage.
 * Tracks which subcontractors are under review for each work item during the
 * "Work Scoping & Contractor Shortlisting" stage.
 *
 * @interface SelectionDataState
 * @property {Record<string, Subcontractor[]>} reviewByItemId - Map of work item IDs to arrays of subcontractors being reviewed
 */
export interface SelectionDataState {
  reviewByItemId: Record<string, Subcontractor[]>;
}

/**
 * Enumeration of possible bid statuses during the invitation and bidding process.
 * Tracks the progression of a subcontractor's response to a bid invitation.
 *
 * @typedef {"Invitation Pending" | "Invited" | "Bidding" | "Not Bidding" | "Not Sure" | "Bid Submitted"} BidStatus
 */
export type BidStatus =
  | "Invitation Pending"
  | "Invited"
  | "Bidding"
  | "Not Bidding"
  | "Not Sure"
  | "Bid Submitted";

/**
 * Generic uploaded file metadata structure.
 * Used across the application for any file upload functionality.
 *
 * @interface UploadedFile
 * @property {string} id - Unique identifier for the uploaded file
 * @property {string} name - Original filename
 * @property {number} size - File size in bytes
 * @property {string} type - MIME type of the file
 * @property {string} uploadedAt - ISO 8601 timestamp when file was uploaded
 * @property {string} url - URL or path to access the file (S3 URL in production)
 */
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  url: string;
}

/**
 * Represents a file uploaded as part of a bid submission.
 * Extends the base UploadedFile interface with bid-specific comment field.
 *
 * @interface BidSubmissionFile
 * @extends UploadedFile
 * @property {string} comment - Optional comment associated with this file
 */
export interface BidSubmissionFile extends UploadedFile {
  comment: string;
}

/**
 * Represents a bid record linking a subcontractor to a tender package.
 * Tracks the bidding status and timeline for each invitation sent.
 *
 * @interface BidRecord
 * @property {string} id - Unique identifier for this bid record
 * @property {string} tenderPackageId - ID of the tender package this bid relates to
 * @property {string} subcontractorId - ID of the subcontractor invited to bid
 * @property {BidStatus} status - Current status of the bid response
 * @property {string} invitedAt - ISO 8601 timestamp when invitation was sent
 * @property {string} lastUpdatedAt - ISO 8601 timestamp of most recent status update
 * @property {BidSubmissionFile[]} files - Files uploaded as part of the bid submission
 * @property {string} submissionComment - Overall comment for the bid submission
 * @property {string} submittedAt - ISO 8601 timestamp when bid was submitted (empty if not yet submitted)
 */
export interface BidRecord {
  id: string;
  tenderPackageId: string;
  subcontractorId: string;
  status: BidStatus;
  invitedAt: string;
  lastUpdatedAt: string;
  files: BidSubmissionFile[];
  submissionComment: string;
  submittedAt: string;
}

/**
 * Global state structure for the bid invitation workflow stage.
 * Maintains all bid records across all tender packages and subcontractors.
 *
 * @interface BidDataState
 * @property {BidRecord[]} bidRecords - Array of all bid records in the system
 */
export interface BidDataState {
  bidRecords: BidRecord[];
}

/**
 * Global state structure for the awarding workflow stage.
 * Stores final assignment decisions (carried and backup subcontractors) for each work item
 * after bids have been reviewed and awards are ready to be made.
 *
 * @interface AwardingDataState
 * @property {Record<string, Pick<Assignment, "carried" | "backups">>} decisionsByItemId - Map of work item IDs to their final subcontractor assignments
 */
export interface AwardingDataState {
  decisionsByItemId: Record<string, Pick<Assignment, "carried" | "backups">>;
}

/**
 * Represents a single work item (scope element) within a tender package.
 * Work items define the specific tasks or sections that need to be completed,
 * and subcontractors are assigned to individual work items.
 *
 * @interface WorkItem
 * @property {string} id - Unique identifier for this work item
 * @property {string} tenderPackageId - ID of the parent tender package
 * @property {string} sectionCode - Section/trade code (e.g., "03 - Concrete", "16 - Electrical")
 * @property {string} sectionName - Human-readable section/trade name
 * @property {string} description - Detailed description of the work to be performed
 * @property {string} status - Current workflow status of this work item
 */
export interface WorkItem {
  id: string;
  tenderPackageId: string;
  sectionCode: string;
  sectionName: string;
  description: string;
  status:
    | "Draft"
    | "Not Shortlisted"
    | "Shortlisting In-Progress"
    | "Shortlisting Completed"
    | "Invited"
    | "Invited - Partial";
}

/**
 * Represents a physical address with geolocation data.
 * Used for construction site locations and contact addresses.
 *
 * @interface Address
 * @property {string} street - Street address including number and street name
 * @property {string} city - City name
 * @property {string} state - State or province code/name
 * @property {string} zipCode - Postal/ZIP code
 * @property {number} latitude - Geographic latitude coordinate
 * @property {number} longitude - Geographic longitude coordinate
 * @property {string} country - Country name or code
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  country: string;
}

/**
 * Represents contact information for a person or organization.
 * Used for customer contacts and other stakeholder information.
 *
 * @interface ContactDetails
 * @property {string} name - Full name of the contact person
 * @property {string} email - Email address
 * @property {string} phone - Primary phone number
 * @property {string} [mobile] - Optional mobile phone number
 * @property {string} [title] - Optional job title or role
 */
export interface ContactDetails {
  name: string;
  email: string;
  phone: string;
  mobile?: string;
  title?: string;
}

/**
 * Represents a document attached to a tender package.
 * Documents can be either confidential (requires NDA) or reference materials.
 *
 * @interface Document
 * @property {string} id - Unique identifier for the document
 * @property {string} name - Display name/filename of the document
 * @property {"confidential" | "reference"} type - Classification of document access level
 * @property {string} uploadedAt - ISO 8601 timestamp when document was uploaded
 * @property {number} size - File size in bytes
 * @property {string} url - URL or path to access the document
 */
export interface Document {
  id: string;
  name: string;
  type: "confidential" | "reference";
  uploadedAt: string;
  size: number;
  url: string;
}

/**
 * Represents a complete tender package with all associated metadata.
 * A tender package is the primary entity that moves through the procurement workflow,
 * containing project details, deadlines, work items, and tracking the overall status.
 *
 * @interface TenderPackage
 * @property {string} id - Unique identifier for the tender package
 * @property {string} packageName - Descriptive name of the tender package
 * @property {string} packageControlNumber - Business control number for tracking (e.g., "PKG-2024-001")
 * @property {string} [projectDescription] - Optional detailed description of the project
 * @property {string} tenderSubmissionDueDate - ISO 8601 date when main tender must be submitted
 * @property {string} rfqDueDate - ISO 8601 date for RFQ (Request for Quotation) deadline
 * @property {string} subContractorBidSubmissionDueDate - ISO 8601 date when subcontractor bids are due
 * @property {string} subContractorRfqDueDate - ISO 8601 date for subcontractor RFQ deadline
 * @property {1 | 2 | 3 | 4 | 5 | 6 | 7} workflowStage - Current stage in the 7-stage workflow process
 * @property {Address} siteAddress - Physical location of the construction site
 * @property {string} customerName - Name of the client/customer organization
 * @property {ContactDetails} customerContactDetails - Primary contact information for the customer
 * @property {Document[]} documents - Array of attached documents (plans, specs, etc.)
 * @property {string} createdAt - ISO 8601 timestamp when package was created
 * @property {string} updatedAt - ISO 8601 timestamp of last modification
 * @property {"Draft" | "Work Scoping & Contractor Shortlisting" | "Bid Invitation" | "Bid Review" | "Finalized" | "Closed"} status - Current processing status
 */
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
