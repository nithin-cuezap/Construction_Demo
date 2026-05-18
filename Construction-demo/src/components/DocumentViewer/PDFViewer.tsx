/**
 * @fileoverview PDF document viewer using react-pdf.
 *
 * Displays PDF documents with page navigation, zoom controls,
 * and responsive rendering.
 *
 * @module components/DocumentViewer/PDFViewer
 */

import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Button from '../Button';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
}

/**
 * PDF viewer component with page navigation and zoom controls.
 */
export default function PDFViewer({ fileUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document');
    setLoading(false);
  };

  const goToPreviousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-slate-200">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousPage}
            disabled={pageNumber <= 1 || loading}
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm text-slate-700 min-w-25 text-center">
            {loading ? (
              'Loading...'
            ) : error ? (
              'Error'
            ) : (
              <>
                Page {pageNumber} of {numPages}
              </>
            )}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages || loading}
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5 || loading}
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <button
            onClick={resetZoom}
            className="text-sm text-slate-700 min-w-15 hover:text-slate-900"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 2.0 || loading}
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        {error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <p className="text-xs text-slate-500">
              The PDF file may be corrupted or in an unsupported format.
            </p>
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="text-center py-12">
                <p className="text-sm text-slate-600">Loading PDF...</p>
              </div>
            }
            error={
              <div className="text-center py-12">
                <p className="text-sm text-red-600">Failed to load PDF</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={
                <div className="w-full h-96 flex items-center justify-center bg-slate-100 rounded">
                  <p className="text-sm text-slate-500">Loading page...</p>
                </div>
              }
              className="shadow-lg"
            />
          </Document>
        )}
      </div>
    </div>
  );
}
