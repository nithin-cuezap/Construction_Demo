/**
 * Custom hook for managing tender package document uploads.
 *
 * Encapsulates document upload logic including file validation, upload handling,
 * and document management for both confidential and reference documents. This
 * separation allows the DocumentsStep component to focus on presentation while
 * business logic remains testable.
 *
 * Follows the same pattern as useBidSubmission.ts for consistency across the codebase.
 *
 * @module hooks/useDocumentUpload
 */

import { useState } from "react";
import {
  isFileSizeAllowed,
  isFileTypeAllowed,
  mockUploadFile,
  type UploadedFile,
} from "../utils/fileUpload";
import type { UploadedDocument } from "../views/form-steps/TenderPackageForm.types";

/**
 * Result type for operations that can fail.
 * Follows the Result pattern from coding standards for explicit error handling.
 */
type Result<T, E> = { success: true; data: T } | { success: false; error: E };

/**
 * Domain-specific error types for document upload operations.
 * Used to provide clear, actionable error messages to users.
 */
export type DocumentUploadError =
  | { type: "validation"; message: string }
  | { type: "file_type"; message: string }
  | { type: "file_size"; message: string }
  | { type: "upload_failed"; message: string }
  | { type: "unknown"; message: string };

/**
 * Configuration for allowed document types and sizes.
 */
export const DOCUMENT_UPLOAD_CONFIG = {
  acceptedTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
  ],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  fileTypesDescription: "PDF, DOC, XLS, PPT, ZIP up to 50MB",
};

/**
 * Hook return type containing all document upload state and handlers.
 */
export interface UseDocumentUploadReturn {
  // State
  documents: UploadedDocument[];
  error: string | null;
  uploading: boolean;

  // Handlers
  stageConfidentialDocument: (
    file: File,
  ) => Promise<Result<UploadedDocument, DocumentUploadError>>;
  stageReferenceDocument: (
    file: File,
  ) => Promise<Result<UploadedDocument, DocumentUploadError>>;
  uploadAllDocuments: () => Promise<void>;
  uploadConfidentialDocuments: () => Promise<void>;
  uploadReferenceDocuments: () => Promise<void>;
  handleDocumentsUploaded: (newDocs: UploadedDocument[]) => void;
  handleDocumentRemove: (docId: string) => void;
  clearError: () => void;
  setDocuments: (docs: UploadedDocument[]) => void;
}

/**
 * Custom hook for document upload functionality.
 * Manages document state, validates files, and handles uploads using the
 * established mockUploadFile pattern from fileUpload.ts.
 *
 * @param {UploadedDocument[]} initialDocuments - Initial documents to populate state
 * @returns {UseDocumentUploadReturn} State and handlers for document uploads
 *
 * @example
 * ```tsx
 * function DocumentsStep() {
 *   const {
 *     documents,
 *     uploadConfidentialDocument,
 *     handleDocumentRemove,
 *     error
 *   } = useDocumentUpload([]);
 *
 *   return (
 *     <FileUpload
 *       uploadFunction={uploadConfidentialDocument}
 *       onFileRemove={handleDocumentRemove}
 *     />
 *   );
 * }
 * ```
 */
export function useDocumentUpload(
  initialDocuments: UploadedDocument[] = [],
): UseDocumentUploadReturn {
  const [documents, setDocuments] =
    useState<UploadedDocument[]>(initialDocuments);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  /**
   * Validates file before upload to provide early feedback.
   * Checks both file type and size constraints.
   */
  const validateFile = (file: File): Result<void, DocumentUploadError> => {
    if (!isFileTypeAllowed(file, DOCUMENT_UPLOAD_CONFIG.acceptedTypes)) {
      return {
        success: false,
        error: {
          type: "file_type",
          message: `Invalid file type. ${DOCUMENT_UPLOAD_CONFIG.fileTypesDescription}`,
        },
      };
    }

    if (!isFileSizeAllowed(file, DOCUMENT_UPLOAD_CONFIG.maxFileSize)) {
      return {
        success: false,
        error: {
          type: "file_size",
          message: `File size exceeds ${DOCUMENT_UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB limit`,
        },
      };
    }

    return { success: true, data: undefined };
  };

  /**
   * Stages a document for upload without actually uploading yet.
   * FileUpload component needs to remain reusable, so we adapt it here
   * rather than coupling it to document-specific logic.
   *
   * Creates document with "staged" status and stores File object and mimeType.
   * Follows the same pattern as uploadBidFile in useBidSubmission.ts.
   */
  const stageDocumentWithType = async (
    file: File,
    type: "confidential" | "reference",
  ): Promise<Result<UploadedDocument, DocumentUploadError>> => {
    // Validate file before staging
    const validationResult = validateFile(file);
    if (!validationResult.success) {
      return validationResult;
    }

    try {
      // Create staged document without actual upload
      // Generate unique file ID
      const fileId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const stagedDocument: UploadedDocument = {
        id: fileId,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        url: "", // Will be populated during actual upload
        mimeType: file.type, // Store MIME type for preview detection
        type, // Document category: 'confidential' or 'reference'
        file, // Keep File object for preview and upload
        status: "staged", // Mark as staged, not uploaded yet
      };

      return { success: true, data: stagedDocument };
    } catch (err) {
      console.error("Error staging document:", err);
      return {
        success: false,
        error: {
          type: "upload_failed",
          message: "Failed to stage file. Please try again.",
        },
      };
    }
  };

  /**
   * Stages a confidential document (visible only to organization users).
   * Returns Result type for explicit error handling in UI.
   */
  const stageConfidentialDocument = async (
    file: File,
  ): Promise<Result<UploadedDocument, DocumentUploadError>> => {
    return stageDocumentWithType(file, "confidential");
  };

  /**
   * Stages a reference document (shared with subcontractors).
   * Returns Result type for explicit error handling in UI.
   */
  const stageReferenceDocument = async (
    file: File,
  ): Promise<Result<UploadedDocument, DocumentUploadError>> => {
    return stageDocumentWithType(file, "reference");
  };

  /**
   * Uploads all staged documents to storage.
   * Updates status from "staged" to "uploaded" for each document.
   */
  const uploadAllDocuments = async (): Promise<void> => {
    setUploading(true);
    setError(null);

    try {
      const updatedDocuments = await Promise.all(
        documents.map(async (doc) => {
          // Skip already uploaded documents
          if (doc.status === "uploaded" || !doc.file) {
            return doc;
          }

          try {
            // Perform actual upload using mockUploadFile
            const uploadedFile: UploadedFile = await mockUploadFile(doc.file);

            // Update document with uploaded URL and status
            return {
              ...doc,
              url: uploadedFile.url,
              status: "uploaded" as const,
            };
          } catch (err) {
            console.error(`Failed to upload ${doc.name}:`, err);
            // Keep document as staged if upload fails
            return doc;
          }
        }),
      );

      setDocuments(updatedDocuments);
    } catch (err) {
      console.error("Error uploading documents:", err);
      setError("Some documents failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Uploads only staged confidential documents to storage.
   * Updates status from "staged" to "uploaded" for confidential documents only.
   */
  const uploadConfidentialDocuments = async (): Promise<void> => {
    setUploading(true);
    setError(null);

    try {
      const updatedDocuments = await Promise.all(
        documents.map(async (doc) => {
          // Skip non-confidential, already uploaded, or documents without files
          if (doc.type !== "confidential" || doc.status === "uploaded" || !doc.file) {
            return doc;
          }

          try {
            // Perform actual upload using mockUploadFile
            const uploadedFile: UploadedFile = await mockUploadFile(doc.file);

            // Update document with uploaded URL and status
            return {
              ...doc,
              url: uploadedFile.url,
              status: "uploaded" as const,
            };
          } catch (err) {
            console.error(`Failed to upload ${doc.name}:`, err);
            // Keep document as staged if upload fails
            return doc;
          }
        }),
      );

      setDocuments(updatedDocuments);
    } catch (err) {
      console.error("Error uploading confidential documents:", err);
      setError("Some confidential documents failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Uploads only staged reference documents to storage.
   * Updates status from "staged" to "uploaded" for reference documents only.
   */
  const uploadReferenceDocuments = async (): Promise<void> => {
    setUploading(true);
    setError(null);

    try {
      const updatedDocuments = await Promise.all(
        documents.map(async (doc) => {
          // Skip non-reference, already uploaded, or documents without files
          if (doc.type !== "reference" || doc.status === "uploaded" || !doc.file) {
            return doc;
          }

          try {
            // Perform actual upload using mockUploadFile
            const uploadedFile: UploadedFile = await mockUploadFile(doc.file);

            // Update document with uploaded URL and status
            return {
              ...doc,
              url: uploadedFile.url,
              status: "uploaded" as const,
            };
          } catch (err) {
            console.error(`Failed to upload ${doc.name}:`, err);
            // Keep document as staged if upload fails
            return doc;
          }
        }),
      );

      setDocuments(updatedDocuments);
    } catch (err) {
      console.error("Error uploading reference documents:", err);
      setError("Some reference documents failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Appends uploaded documents to maintain cumulative list for multi-file uploads.
   * Documents accumulate rather than replace because users often upload in batches.
   */
  const handleDocumentsUploaded = (newDocs: UploadedDocument[]) => {
    setDocuments((prev) => [...prev, ...newDocs]);
    // Clear any previous errors on successful upload
    setError(null);
  };

  /**
   * Allows document removal before submission to support error correction.
   * Users may accidentally upload wrong files or need to replace outdated versions.
   */
  const handleDocumentRemove = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
  };

  /**
   * Clears error state to allow retry after user acknowledges error.
   */
  const clearError = () => {
    setError(null);
  };

  return {
    documents,
    error,
    uploading,
    stageConfidentialDocument,
    stageReferenceDocument,
    uploadAllDocuments,
    uploadConfidentialDocuments,
    uploadReferenceDocuments,
    handleDocumentsUploaded,
    handleDocumentRemove,
    clearError,
    setDocuments,
  };
}
