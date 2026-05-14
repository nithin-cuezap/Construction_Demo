import type { TenderPackage } from "../types";

export const INITIAL_PACKAGE_ID = "tp-1";

const INITIAL_TIMESTAMP = new Date().toISOString();

export const INITIAL_TENDER_PACKAGES: TenderPackage[] = [
  {
    id: INITIAL_PACKAGE_ID,
    packageName: "Downtown Office Complex - Phase 1",
    packageControlNumber: "TP-001-05132026",
    projectDescription: "Construction of a modern office complex with retail space on the ground floor",
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
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
    status: "Draft",
  },
];
