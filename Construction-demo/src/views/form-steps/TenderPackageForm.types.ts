import type { Address, ContactDetails, TenderPackage } from "../../types";

export type TenderPackageStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type TenderPackageStatus = TenderPackage["status"];

export interface TenderPackageFormData {
  packageName: string;
  packageControlNumber: string;
  projectDescription: string;
  tenderSubmissionDueDate: string;
  rfqDueDate: string;
  subContractorBidSubmissionDueDate: string;
  subContractorRfqDueDate: string;
  workflowStage: TenderPackageStep;
  siteAddress: Address;
  customerName: string;
  customerContactDetails: ContactDetails;
  documents: TenderPackage["documents"];
  status: TenderPackageStatus;
}

export type UploadedDocument = TenderPackage["documents"][number] & {
  file: File | null;
};

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}
