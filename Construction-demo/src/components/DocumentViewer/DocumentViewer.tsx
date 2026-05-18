/**
 * @fileoverview Main document viewer component with header and viewer rendering.
 *
 * Displays documents in a preview panel with controls for closing, fullscreen,
 * and downloading. Dynamically renders appropriate viewer based on file type.
 *
 * @module components/DocumentViewer
 */

import { Download, Maximize2, Minimize2, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import {
    createPreviewUrl,
    getDocumentViewerType,
    getFileTypeLabel,
    revokePreviewUrl,
} from '../../utils/documentViewerUtils';
import { formatFileSize } from '../../utils/fileUpload';
import type { UploadedDocument } from '../../views/form-steps/TenderPackageForm.types';
import Button from '../Button';
import OfficeDocPreview from './OfficeDocPreview';
import PDFViewer from './PDFViewer';
import UnsupportedFilePreview from './UnsupportedFilePreview';

export type ViewMode = 'split' | 'fullscreen';

interface DocumentViewerProps {
  document: UploadedDocument;
  viewMode: ViewMode;
  onClose: () => void;
  onToggleFullscreen: () => void;
}

/**
 * Main document viewer component.
 * Renders appropriate viewer based on file type and manages preview URLs.
 */
export default function DocumentViewer({
  document,
  viewMode,
  onClose,
  onToggleFullscreen,
}: DocumentViewerProps) {
  // Create preview URL from File object using useMemo
  const previewUrl = useMemo(() => {
    return document.file ? createPreviewUrl(document.file) : '';
  }, [document.file]);

  // Cleanup: revoke URL when component unmounts or document changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  // Determine which viewer to use
  const viewerType = useMemo(() => {
    return getDocumentViewerType(document.file?.type || '');
  }, [document.file?.type]);

  // Handle download
  const handleDownload = () => {
    if (previewUrl) {
      const link = window.document.createElement('a');
      link.href = previewUrl;
      link.download = document.name;
      link.click();
    }
  };

  const fileTypeLabel = getFileTypeLabel(document.file?.type || '');
  const isFullscreen = viewMode === 'fullscreen';

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-sm font-semibold text-slate-900 truncate">
            {document.name}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {fileTypeLabel} • {formatFileSize(document.size)} • {document.type === 'confidential' ? 'Confidential' : 'Reference'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            title="Download document"
          >
            <Download className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Restore view' : 'Fullscreen view'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="Close viewer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="flex-1 overflow-auto bg-slate-100">
        {viewerType === 'pdf' && previewUrl && (
          <PDFViewer fileUrl={previewUrl} />
        )}

        {viewerType === 'office' && (
          <OfficeDocPreview
            fileName={document.name}
            fileType={fileTypeLabel}
            fileSize={formatFileSize(document.size)}
            onDownload={handleDownload}
          />
        )}

        {viewerType === 'unsupported' && (
          <UnsupportedFilePreview
            fileName={document.name}
            fileType={fileTypeLabel}
            fileSize={formatFileSize(document.size)}
            onDownload={handleDownload}
          />
        )}

        {!previewUrl && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-500">Loading preview...</p>
          </div>
        )}
      </div>
    </div>
  );
}
