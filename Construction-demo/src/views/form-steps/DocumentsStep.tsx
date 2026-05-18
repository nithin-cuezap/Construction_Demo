import { useState } from 'react';
import { DocumentViewer } from '../../components/DocumentViewer';
import FileUpload from '../../components/FileUpload';
import type { UploadedDocument } from './TenderPackageForm.types';

interface DocumentsStepProps {
  uploadedDocuments: UploadedDocument[];
  setUploadedDocuments: React.Dispatch<React.SetStateAction<UploadedDocument[]>>;
}

export default function DocumentsStep({
  uploadedDocuments,
  setUploadedDocuments,
}: DocumentsStepProps) {
  // Document viewer state
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);
  const [viewerMode, setViewerMode] = useState<'upload-only' | 'split' | 'fullscreen'>('upload-only');
  
  // Panel dropzone states
  const [isConfidentialDragging, setIsConfidentialDragging] = useState(false);
  const [isReferenceDragging, setIsReferenceDragging] = useState(false);
  // Stage confidential documents (no actual upload yet, just metadata creation)
  const stageConfidentialDocument = async (file: File): Promise<UploadedDocument> => {
    // Just create a staging record - no upload delay since we're not uploading yet
    return {
      id: `doc-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: 'confidential',
      uploadedAt: new Date().toISOString(),
      size: file.size,
      url: '', // Empty URL - will be created during actual save
      file,
    };
  };

  // Stage reference documents (no actual upload yet, just metadata creation)
  const stageReferenceDocument = async (file: File): Promise<UploadedDocument> => {
    // Just create a staging record - no upload delay since we're not uploading yet
    return {
      id: `doc-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: 'reference',
      uploadedAt: new Date().toISOString(),
      size: file.size,
      url: '', // Empty URL - will be created during actual save
      file,
    };
  };

  // Handle files staged for confidential documents
  const handleConfidentialFilesStaged = (newFiles: UploadedDocument[]) => {
    setUploadedDocuments([...uploadedDocuments, ...newFiles]);
  };

  // Handle files staged for reference documents
  const handleReferenceFilesStaged = (newFiles: UploadedDocument[]) => {
    setUploadedDocuments([...uploadedDocuments, ...newFiles]);
  };

  // Handle file removal
  const handleFileRemove = (fileId: string) => {
    setUploadedDocuments(uploadedDocuments.filter((doc) => doc.id !== fileId));
    // Close viewer if the removed file was being viewed
    if (selectedDocument?.id === fileId) {
      setSelectedDocument(null);
      setViewerMode('upload-only');
    }
  };

  // Handle preview button click
  const handleFilePreview = (document: UploadedDocument) => {
    setSelectedDocument(document);
    setViewerMode('split');
  };

  // Handle viewer close
  const handleViewerClose = () => {
    setSelectedDocument(null);
    setViewerMode('upload-only');
  };

  // Handle fullscreen toggle
  const handleToggleFullscreen = () => {
    setViewerMode((prev) => (prev === 'fullscreen' ? 'split' : 'fullscreen'));
  };

  // Panel drag and drop handlers for confidential documents
  const handleConfidentialPanelDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfidentialDragging(true);
  };

  const handleConfidentialPanelDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if we're leaving the panel entirely (not entering a child)
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
        const uploadedFiles = await Promise.all(
          files.map((file) => stageConfidentialDocument(file))
        );
        handleConfidentialFilesStaged(uploadedFiles);
      } catch (error) {
        console.error('Error uploading files:', error);
      }
    }
  };

  // Panel drag and drop handlers for reference documents
  const handleReferencePanelDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsReferenceDragging(true);
  };

  const handleReferencePanelDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if we're leaving the panel entirely (not entering a child)
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
        const uploadedFiles = await Promise.all(
          files.map((file) => stageReferenceDocument(file))
        );
        handleReferenceFilesStaged(uploadedFiles);
      } catch (error) {
        console.error('Error uploading files:', error);
      }
    }
  };

  // Filter documents by type
  const confidentialDocs = uploadedDocuments.filter((doc) => doc.type === 'confidential');
  const referenceDocs = uploadedDocuments.filter((doc) => doc.type === 'reference');

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
                  uploadFunction={stageConfidentialDocument}
                  onFilesUploaded={handleConfidentialFilesStaged}
                  onFileRemove={handleFileRemove}
                  onFilePreview={handleFilePreview}
                  acceptedTypes={[
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'application/zip',
                    'application/x-zip-compressed',
                  ]}
                  maxFileSize={50 * 1024 * 1024}
                  fileTypesDescription="PDF, DOC, XLS, PPT, ZIP up to 50MB"
                />
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
                  uploadFunction={stageReferenceDocument}
                  onFilesUploaded={handleReferenceFilesStaged}
                  onFileRemove={handleFileRemove}
                  onFilePreview={handleFilePreview}
                  acceptedTypes={[
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'application/zip',
                    'application/x-zip-compressed',
                  ]}
                  maxFileSize={50 * 1024 * 1024}
                  fileTypesDescription="PDF, DOC, XLS, PPT, ZIP up to 50MB"
                />
              </div>

              <p className="text-sm text-slate-600 mt-6">
                Total documents staged: <span className="font-semibold">{uploadedDocuments.length}</span>
                <span className="text-xs text-slate-500 ml-2">
                  (Files will be uploaded when you click Next or Save & Exit)
                </span>
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
