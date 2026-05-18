/**
 * @fileoverview Preview component for unsupported file types.
 *
 * Displays a message and download option for files that cannot be previewed
 * in the browser (e.g., ZIP archives).
 *
 * @module components/DocumentViewer/UnsupportedFilePreview
 */

import { Archive, Download, File } from 'lucide-react';
import Button from '../Button';

interface UnsupportedFilePreviewProps {
  fileName: string;
  fileType: string;
  fileSize: string;
  onDownload: () => void;
}

/**
 * Unsupported file preview component.
 * Shows file metadata and download option.
 */
export default function UnsupportedFilePreview({
  fileName,
  fileType,
  fileSize,
  onDownload,
}: UnsupportedFilePreviewProps) {
  // Determine icon based on file type
  const getIcon = () => {
    if (fileType.includes('ZIP')) return <Archive className="w-16 h-16 text-purple-500" />;
    return <File className="w-16 h-16 text-slate-500" />;
  };

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>

        {/* File Info */}
        <h3 className="text-lg font-semibold text-slate-900 mb-2 break-words">
          {fileName}
        </h3>
        <p className="text-sm text-slate-600 mb-1">{fileType}</p>
        <p className="text-xs text-slate-500 mb-6">{fileSize}</p>

        {/* Info Message */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-700 mb-2">
            This file type cannot be previewed in the browser.
          </p>
          <p className="text-xs text-slate-600">
            Download the file to view its contents.
          </p>
        </div>

        {/* Download Button */}
        <Button
          onClick={onDownload}
          variant="primary"
          className="w-full"
        >
          <span className="flex items-center justify-center">
            <Download className="w-4 h-4 mr-2" />
            Download File
          </span>
        </Button>
      </div>
    </div>
  );
}
