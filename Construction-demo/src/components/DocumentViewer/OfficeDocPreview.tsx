/**
 * @fileoverview Preview component for Office documents (Word, Excel, PowerPoint).
 *
 * Displays a rich preview card with file information and download action.
 * Office documents cannot be previewed natively in browsers without external services.
 *
 * @module components/DocumentViewer/OfficeDocPreview
 */

import { Download, FileSpreadsheet, FileText, Presentation } from 'lucide-react';
import Button from '../Button';

interface OfficeDocPreviewProps {
  fileName: string;
  fileType: string;
  fileSize: string;
  onDownload: () => void;
}

/**
 * Office document preview component.
 * Shows file metadata and download option.
 */
export default function OfficeDocPreview({
  fileName,
  fileType,
  fileSize,
  onDownload,
}: OfficeDocPreviewProps) {
  // Determine icon based on file type
  const getIcon = () => {
    if (fileType.includes('Word')) return <FileText className="w-16 h-16 text-blue-500" />;
    if (fileType.includes('Excel')) return <FileSpreadsheet className="w-16 h-16 text-green-600" />;
    if (fileType.includes('PowerPoint')) return <Presentation className="w-16 h-16 text-orange-500" />;
    return <FileText className="w-16 h-16 text-slate-500" />;
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 mb-2">
            Office documents cannot be previewed directly in the browser.
          </p>
          <p className="text-xs text-blue-700">
            Download the file to view it in Microsoft Office, Google Docs, or another compatible application.
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
            Download to View
          </span>
        </Button>
      </div>
    </div>
  );
}
