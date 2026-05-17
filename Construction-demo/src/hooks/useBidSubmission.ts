/**
 * Custom hook for managing bid submission state and operations.
 *
 * Encapsulates all bid submission logic including data loading, validation,
 * file management, and submission handling. This separation allows the view
 * component to focus on presentation while business logic remains testable.
 *
 * @module hooks/useBidSubmission
 */

import { useEffect, useState } from "react";
import { getBidById, submitBid } from "../Bid.ops";
import {
  getSubcontractorById,
  getTenderPackageById,
} from "../TenderPackage.ops";
import type {
  BidRecord,
  BidSubmissionFile,
  Subcontractor,
  TenderPackage,
} from "../types";
import { mockUploadFile } from "../utils/fileUpload";

/**
 * Result type for operations that can fail.
 * Follows the Result pattern from coding standards for explicit error handling.
 */
type Result<T, E> = { success: true; data: T } | { success: false; error: E };

/**
 * Domain-specific error types for bid submission operations.
 * Used to provide clear, actionable error messages to users.
 */
export type BidSubmissionError =
  | { type: "not_found"; resource: "bid" | "tender_package" | "subcontractor" }
  | { type: "validation"; message: string }
  | { type: "submission_failed"; message: string }
  | { type: "unknown"; message: string };

/**
 * Hook return type containing all bid submission state and handlers.
 */
export interface UseBidSubmissionReturn {
  // Data state
  bid: BidRecord | null;
  tenderPackage: TenderPackage | null;
  subcontractor: Subcontractor | null;

  // Form state
  files: BidSubmissionFile[];
  submissionComment: string;

  // UI state
  loading: boolean;
  submitting: boolean;
  submitted: boolean;
  error: string | null;

  // Handlers
  setSubmissionComment: (comment: string) => void;
  handleFilesUploaded: (newFiles: BidSubmissionFile[]) => void;
  handleFileRemove: (fileId: string) => void;
  handleFileCommentChange: (fileId: string, comment: string) => void;
  handleSubmit: () => Promise<void>;
  uploadBidFile: (file: File) => Promise<BidSubmissionFile>;
}

/**
 * Custom hook for bid submission functionality.
 * Loads bid data, manages form state, and handles submission.
 *
 * @param {string | undefined} bidId - The unique identifier of the bid
 * @returns {UseBidSubmissionReturn} State and handlers for bid submission
 *
 * @example
 * ```tsx
 * function BidSubmissionView() {
 *   const { bidId } = useParams();
 *   const {
 *     bid,
 *     tenderPackage,
 *     files,
 *     handleSubmit,
 *     loading
 *   } = useBidSubmission(bidId);
 *
 *   if (loading) return <Spinner />;
 *   return <BidForm onSubmit={handleSubmit} files={files} />;
 * }
 * ```
 */
export function useBidSubmission(
  bidId: string | undefined,
): UseBidSubmissionReturn {
  // Data state
  const [bid, setBid] = useState<BidRecord | null>(null);
  const [tenderPackage, setTenderPackage] = useState<TenderPackage | null>(
    null,
  );
  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(
    null,
  );

  // Form state
  const [files, setFiles] = useState<BidSubmissionFile[]>([]);
  const [submissionComment, setSubmissionComment] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads bid submission data and validates all required entities exist.
   *
   * Fetches the bid, tender package, and subcontractor in sequence because
   * each entity depends on IDs from the previous one. Early returns prevent
   * rendering with incomplete data, which would cause runtime errors.
   *
   * Hydrates form state if bid was already submitted to support read-only view.
   */
  useEffect(() => {
    const loadBidData = (): Result<void, BidSubmissionError> => {
      if (!bidId) {
        return {
          success: false,
          error: { type: "validation", message: "Invalid bid ID" },
        };
      }

      // Fetch bid first to get related entity IDs
      const bidData = getBidById(bidId);
      if (!bidData) {
        return {
          success: false,
          error: { type: "not_found", resource: "bid" },
        };
      }

      // Load tender package for project details
      const packageData = getTenderPackageById(bidData.tenderPackageId);
      if (!packageData) {
        return {
          success: false,
          error: { type: "not_found", resource: "tender_package" },
        };
      }

      // Load subcontractor for vendor identification
      const subcontractorData = getSubcontractorById(bidData.subcontractorId);
      if (!subcontractorData) {
        return {
          success: false,
          error: { type: "not_found", resource: "subcontractor" },
        };
      }

      setBid(bidData);
      setTenderPackage(packageData);
      setSubcontractor(subcontractorData);

      // Restore submission data for already-submitted bids (read-only mode)
      if (bidData.status === "Bid Submitted") {
        setFiles(bidData.files);
        setSubmissionComment(bidData.submissionComment);
        setSubmitted(true);
      }

      return { success: true, data: undefined };
    };

    const result = loadBidData();
    if (!result.success) {
      // Map error types to user-friendly messages
      switch (result.error.type) {
        case "not_found":
          setError(
            `${result.error.resource.replace("_", " ")} not found. This link may be invalid or expired.`,
          );
          break;
        case "validation":
          setError(result.error.message);
          break;
        default:
          setError("Failed to load bid information");
      }
    }

    setLoading(false);
  }, [bidId]);

  /**
   * Wraps generic file upload to add bid-specific comment field.
   * FileUpload component needs to remain reusable across different contexts,
   * so we adapt it here rather than coupling it to bid submission logic.
   */
  const uploadBidFile = async (file: File): Promise<BidSubmissionFile> => {
    const uploadedFile = await mockUploadFile(file);
    return {
      ...uploadedFile,
      comment: "",
    };
  };

  /**
   * Appends uploaded files to maintain cumulative list for multi-file submissions.
   * Files must accumulate rather than replace because vendors often upload in batches.
   */
  const handleFilesUploaded = (newFiles: BidSubmissionFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  /**
   * Allows file removal before submission to support error correction.
   * Users may accidentally upload wrong files or need to replace outdated versions.
   */
  const handleFileRemove = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  /**
   * Immutably updates file comment to maintain React state consistency.
   * Direct mutation would bypass React's change detection and cause UI desync.
   */
  const handleFileCommentChange = (fileId: string, comment: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, comment } : f)),
    );
  };

  /**
   * Finalizes bid submission with validation and persistence.
   *
   * File upload requirement enforced here because empty bids lack meaningful
   * content for evaluation. Operation is irreversible - once submitted, bid
   * cannot be modified to prevent gaming the system.
   */
  const handleSubmit = async () => {
    if (!bidId) return;

    // Business rule: at least one file required for valid bid
    if (files.length === 0) {
      setError("Please upload at least one file before submitting");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Wrap submission in Result pattern for explicit error handling
    const executeSubmission = (): Result<BidRecord, BidSubmissionError> => {
      const result = submitBid(bidId, files, submissionComment);

      if (!result) {
        return {
          success: false,
          error: {
            type: "submission_failed",
            message: "Failed to persist bid submission",
          },
        };
      }

      return { success: true, data: result };
    };

    try {
      const result = executeSubmission();

      if (result.success) {
        setSubmitted(true);
        setBid(result.data);
      } else {
        // Map error types to user-friendly messages
        switch (result.error.type) {
          case "submission_failed":
            setError(
              "Unable to submit bid. Please try again or contact support.",
            );
            break;
          default:
            setError("An unexpected error occurred. Please try again.");
        }
      }
    } catch (err) {
      // Catch unexpected runtime errors (e.g., network issues, DB crashes)
      console.error("Unexpected error during bid submission:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    bid,
    tenderPackage,
    subcontractor,
    files,
    submissionComment,
    loading,
    submitting,
    submitted,
    error,
    setSubmissionComment,
    handleFilesUploaded,
    handleFileRemove,
    handleFileCommentChange,
    handleSubmit,
    uploadBidFile,
  };
}
