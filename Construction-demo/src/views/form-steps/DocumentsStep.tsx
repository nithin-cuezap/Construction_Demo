/**
 * @fileoverview Documents upload step for tender package creation workflow.
 *
 * Manages upload of confidential and reference documents with preview functionality.
 * Confidential documents are visible only to organization users, while reference
 * documents are shared with subcontractors during bid invitations.
 *
 * Uses the established file upload pattern from fileUpload.ts and follows the
 * custom hook pattern from useBidSubmission.ts for consistency.
 *
 * @module views/form-steps/DocumentsStep
 */

import { useEffect, useState } from 'react';
import { DocumentViewer } from '../../components/DocumentViewer';
import FileUpload from '../../components/FileUpload';
import {
  DOCUMENT_UPLOAD_CONFIG,
  useDocumentUpload,
} from '../../hooks/useDocumentUpload';
import type { UploadedDocument } from './TenderPackageForm.types';

/**
 * Props for the DocumentsStep component.
 *
 * @interface DocumentsStepProps
 * @property {UploadedDocument[]} uploadedDocuments - Current list of uploaded documents
 * @property {React.Dispatch<React.SetStateAction<UploadedDocument[]>>} setUploadedDocuments - Function to update document list
 */
interface DocumentsStepProps {
  uploadedDocuments: UploadedDocument[];
  setUploadedDocuments: React.Dispatch<React.SetStateAction<UploadedDocument[]>>;
}

/**
 * Step component for uploading tender package documents.
 *
 * Provides separate upload zones for confidential and reference documents with
 * drag-and-drop support. Includes document preview functionality with split-screen
 * and fullscreen viewing modes.
 *
 * Follows coding standards by extracting business logic to useDocumentUpload hook
 * and keeping this component focused on presentation.
 *
 * @param {DocumentsStepProps} props - Component props
 * @returns {JSX.Element} Rendered documents upload step
 *
 * @example
 * ```tsx
 * <DocumentsStep
 *   uploadedDocuments={documents}
 *   setUploadedDocuments={setDocuments}
 * />
 * ```
 */
export default function DocumentsStep({
  uploadedDocuments,
  setUploadedDocuments,
}: DocumentsStepProps) {
  // Use custom hook for upload logic following useBidSubmission pattern
  const {
    documents,
    stageConfidentialDocument,
    stageReferenceDocument,
    uploadConfidentialDocuments,
    uploadReferenceDocuments,
    uploading,
    setDocuments,
  } = useDocumentUpload(uploadedDocuments);

  // Sync hook's internal state with parent component
  useEffect(() => {
    setUploadedDocuments(documents);
  }, [documents, setUploadedDocuments]);

  // Document viewer state
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);
  const [viewerMode, setViewerMode] = useState<'upload-only' | 'split' | 'fullscreen'>('upload-only');
  
  // Panel dropzone states for visual feedback during drag
  const [isConfidentialDragging, setIsConfidentialDragging] = useState(false);
  const [isReferenceDragging, setIsReferenceDragging] = useState(false);

  /**
   * Wrapper functions for FileUpload component compatibility.
   * FileUpload expects Promise<UploadedDocument>, but our hook returns Result types.
   * These wrappers unwrap the Result and throw on error for FileUpload's error handling.
   */
  const stageConfidentialWrapper = async (file: File): Promise<UploadedDocument> => {
    const result = await stageConfidentialDocument(file);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  };

  const stageReferenceWrapper = async (file: File): Promise<UploadedDocument> => {
    const result = await stageReferenceDocument(file);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  };

  /**
   * Handles successful document uploads by updating hook state.
   * Maintains cumulative list for multi-file batches.
   */
  const handleFilesUploaded = (newFiles: UploadedDocument[]) => {
    setDocuments([...documents, ...newFiles]);
  };

  /**
   * Handles document removal from the list.
   * Closes viewer if the removed document was currently being viewed.
   */
  const handleFileRemove = (fileId: string) => {
    setDocuments(documents.filter((doc) => doc.id !== fileId));
    
    // Close viewer if the removed file was being viewed to prevent viewing deleted file
    if (selectedDocument?.id === fileId) {
      setSelectedDocument(null);
      setViewerMode('upload-only');
    }
  };

  /**
   * Opens document preview in split-screen mode.
   * Allows users to review uploaded documents before finalizing.
   */
  const handleFilePreview = (document: UploadedDocument) => {
    setSelectedDocument(document);
    setViewerMode('split');
  };

  /**
   * Closes document viewer and returns to upload-only view.
   */
  const handleViewerClose = () => {
    setSelectedDocument(null);
    setViewerMode('upload-only');
  };

  /**
   * Toggles between split-screen and fullscreen viewing modes.
   * Fullscreen provides better readability for detailed document review.
   */
  const handleToggleFullscreen = () => {
    setViewerMode((prev) => (prev === 'fullscreen' ? 'split' : 'fullscreen'));
  };

  /**
   * Drag-and-drop handlers for confidential documents panel.
   * Provides visual feedback (highlight) and handles file drops on the entire panel area.
   */
  const handleConfidentialPanelDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfidentialDragging(true);
  };

  const handleConfidentialPanelDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if leaving panel entirely, not when entering child elements
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsConfidentialDragging(false);
    }
  };

  const handleConfidentialPanelDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfidentialDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      try {
        // Stage files using hook's stage function
        const stageResults = await Promise.all(
          files.map((file) => stageConfidentialDocument(file))
        );

        // Filter successful stages and extract data
        const stagedFiles = stageResults
          .filter((result): result is { success: true; data: UploadedDocument } => result.success)
          .map((result) => result.data);

        // Handle any failures by logging (UI feedback could be added)
        const failures = stageResults.filter((result) => !result.success);
        if (failures.length > 0) {
          console.error('Some files failed to stage:', failures);
        }

        handleFilesUploaded(stagedFiles);
      } catch (error) {
        console.error('Error staging files:', error);
      }
    }
  };

  /**
   * Drag-and-drop handlers for reference documents panel.
   * Provides visual feedback (highlight) and handles file drops on the entire panel area.
   */
  const handleReferencePanelDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsReferenceDragging(true);
  };

  const handleReferencePanelDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if leaving panel entirely, not when entering child elements
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsReferenceDragging(false);
    }
  };

  const handleReferencePanelDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsReferenceDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      try {
        // Stage files using hook's stage function
        const stageResults = await Promise.all(
          files.map((file) => stageReferenceDocument(file))
        );

        // Filter successful stages and extract data
        const stagedFiles = stageResults
          .filter((result): result is { success: true; data: UploadedDocument } => result.success)
          .map((result) => result.data);

        // Handle any failures by logging (UI feedback could be added)
        const failures = stageResults.filter((result) => !result.success);
        if (failures.length > 0) {
          console.error('Some files failed to stage:', failures);
        }

        handleFilesUploaded(stagedFiles);
      } catch (error) {
        console.error('Error staging files:', error);
      }
    }
  };

  /**
   * Handles Upload All Confidential button click.
   * Uploads only staged confidential documents.
   */
  const handleUploadConfidential = async () => {
    await uploadConfidentialDocuments();
  };

  /**
   * Handles Upload All Reference button click.
   * Uploads only staged reference documents.
   */
  const handleUploadReference = async () => {
    await uploadReferenceDocuments();
  };

  // Filter documents by type for separate display
  const confidentialDocs = documents.filter((doc) => doc.type === 'confidential');
  const referenceDocs = documents.filter((doc) => doc.type === 'reference');

  // Count staged documents by type
  const stagedConfidentialCount = confidentialDocs.filter(doc => doc.status === 'staged').length;
  const stagedReferenceCount = referenceDocs.filter(doc => doc.status === 'staged').length;
  const hasStagedConfidential = stagedConfidentialCount > 0;
  const hasStagedReference = stagedReferenceCount > 0;

  // Determine layout classes based on view mode
  const isViewerVisible = selectedDocument && (viewerMode === 'split' || viewerMode === 'fullscreen');
  const isUploadVisible = viewerMode !== 'fullscreen';

  return (
    <div className="mb-6">
      <div className="flex gap-4">
        {/* Upload Area - Hide in fullscreen mode */}
        {isUploadVisible && (
          <div className={`${viewerMode === 'split' ? 'w-[40%]' : 'w-full'} transition-all duration-300`}>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                Confidential & Reference Documents
              </h2>

              {/* Confidential Documents Section */}
              <div 
                className={`mb-6 rounded-lg border border-blue-200 border-l-4 border-l-blue-500 bg-blue-50/50 p-4 transition-all ${
                  isConfidentialDragging ? 'ring-2 ring-blue-500 bg-blue-100/70 scale-[1.01]' : ''
                }`}
                onDragOver={handleConfidentialPanelDragOver}
                onDragLeave={handleConfidentialPanelDragLeave}
                onDrop={handleConfidentialPanelDrop}
              >
                <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-900 mb-1">
                  Confidential Documents
                </h3>
                <p className="text-xs text-blue-800 mb-4">Visible only to Organization users</p>

                <FileUpload
                  files={confidentialDocs}
                  uploadFunction={stageConfidentialWrapper}
                  onFilesUploaded={handleFilesUploaded}
                  onFileRemove={handleFileRemove}
                  onFilePreview={handleFilePreview}
                  acceptedTypes={DOCUMENT_UPLOAD_CONFIG.acceptedTypes}
                  maxFileSize={DOCUMENT_UPLOAD_CONFIG.maxFileSize}
                  fileTypesDescription={DOCUMENT_UPLOAD_CONFIG.fileTypesDescription}
                />

                {/* Upload All Button for Confidential */}
                <button
                  onClick={handleUploadConfidential}
                  disabled={!hasStagedConfidential || uploading}
                  className={`mt-3 w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    !hasStagedConfidential || uploading
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {uploading ? 'Uploading...' : `Upload All Confidential (${stagedConfidentialCount})`}
                </button>
              </div>

              {/* Reference Documents Section */}
              <div 
                className={`rounded-lg border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/50 p-4 transition-all ${
                  isReferenceDragging ? 'ring-2 ring-amber-500 bg-amber-100/70 scale-[1.01]' : ''
                }`}
                onDragOver={handleReferencePanelDragOver}
                onDragLeave={handleReferencePanelDragLeave}
                onDrop={handleReferencePanelDrop}
              >
                <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-900 mb-1">
                  Reference Documents
                </h3>
                <p className="text-xs text-amber-800 mb-4">Will be shared to sub-contractors</p>

                <FileUpload
                  files={referenceDocs}
                  uploadFunction={stageReferenceWrapper}
                  onFilesUploaded={handleFilesUploaded}
                  onFileRemove={handleFileRemove}
                  onFilePreview={handleFilePreview}
                  acceptedTypes={DOCUMENT_UPLOAD_CONFIG.acceptedTypes}
                  maxFileSize={DOCUMENT_UPLOAD_CONFIG.maxFileSize}
                  fileTypesDescription={DOCUMENT_UPLOAD_CONFIG.fileTypesDescription}
                />

                {/* Upload All Button for Reference */}
                <button
                  onClick={handleUploadReference}
                  disabled={!hasStagedReference || uploading}
                  className={`mt-3 w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    !hasStagedReference || uploading
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  {uploading ? 'Uploading...' : `Upload All Reference (${stagedReferenceCount})`}
                </button>
              </div>

              <p className="text-sm text-slate-600 mt-6">
                Total documents uploaded: <span className="font-semibold">{documents.length}</span>
              </p>
            </div>
          </div>
        )}

        {/* Document Viewer - Show when document is selected */}
        {isViewerVisible && selectedDocument && (
          <div className={`${viewerMode === 'fullscreen' ? 'w-full' : 'w-[60%]'} transition-all duration-300`}>
            <div className="h-200 rounded-lg overflow-hidden border border-slate-200">
              <DocumentViewer
                document={selectedDocument}
                viewMode={viewerMode === 'fullscreen' ? 'fullscreen' : 'split'}
                onClose={handleViewerClose}
                onToggleFullscreen={handleToggleFullscreen}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
