/**
 * Form component for bid submission.
 * 
 * Displays project details, file upload interface, and submission controls.
 * This is a presentational component that receives all data and handlers via props,
 * keeping it focused on UI rendering while business logic remains in the hook.
 * 
 * @module components/BidSubmissionForm
 */

import { Building2, Calendar, MapPin, Send } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BidRecord, BidSubmissionFile, Subcontractor, TenderPackage } from '../types';
import Button from './Button';
import FileUpload from './FileUpload';
import TintedSection from './TintedSection';

/**
 * Props for the BidSubmissionForm component.
 */
export interface BidSubmissionFormProps {
  bid: BidRecord;
  tenderPackage: TenderPackage;
  subcontractor: Subcontractor;
  files: BidSubmissionFile[];
  submissionComment: string;
  submitting: boolean;
  error: string | null;
  
  onSubmissionCommentChange: (comment: string) => void;
  onFilesUploaded: (files: BidSubmissionFile[]) => void;
  onFileRemove: (fileId: string) => void;
  onFileCommentChange: (fileId: string, comment: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  uploadBidFile: (file: File) => Promise<BidSubmissionFile>;
}

/**
 * Renders the header section with project details and bid status.
 */
function BidHeader({ 
  tenderPackage, 
  bid, 
  subcontractor 
}: { 
  tenderPackage: TenderPackage; 
  bid: BidRecord; 
  subcontractor: Subcontractor;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500 mb-1">Bid Submission</p>
          <h1 className="text-3xl font-bold text-slate-900">{tenderPackage.packageName}</h1>
        </div>
        <div className="ml-3 shrink-0 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
          {bid.status}
        </div>
      </div>

      {/* Subcontractor Identity */}
      <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-purple-600" />
            <div>
              <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Submitting as</p>
              <p className="text-lg font-semibold text-purple-900">{subcontractor.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Submission Date</p>
            <p className="text-sm font-semibold text-purple-900">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tenderPackage.projectDescription && (
          <div className="md:col-span-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Project Description</p>
            <p className="text-slate-700">{tenderPackage.projectDescription}</p>
          </div>
        )}

        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
            <MapPin size={12} /> Site Address
          </p>
          <p className="text-slate-700">
            {tenderPackage.siteAddress.street}<br />
            {tenderPackage.siteAddress.city}, {tenderPackage.siteAddress.state} {tenderPackage.siteAddress.zipCode}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
            <Calendar size={12} /> Bid Submission Due Date
          </p>
          <p className="text-slate-900 font-semibold">
            {new Date(tenderPackage.subContractorBidSubmissionDueDate).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders file upload section with per-file comment fields.
 */
function FileUploadSection({
  files,
  uploadBidFile,
  onFilesUploaded,
  onFileRemove,
  onFileCommentChange,
  submitting,
}: {
  files: BidSubmissionFile[];
  uploadBidFile: (file: File) => Promise<BidSubmissionFile>;
  onFilesUploaded: (files: BidSubmissionFile[]) => void;
  onFileRemove: (fileId: string) => void;
  onFileCommentChange: (fileId: string, comment: string) => void;
  submitting: boolean;
}) {
  // Per-file comment renderer passed to FileUpload component
  const renderFileMetadata = (file: BidSubmissionFile, disabled: boolean): ReactNode => (
    <div>
      <label htmlFor={`comment-${file.id}`} className="block text-xs font-medium text-slate-600 mb-1">
        Comment for this file (optional)
      </label>
      <textarea
        id={`comment-${file.id}`}
        value={file.comment}
        onChange={(e) => onFileCommentChange(file.id, e.target.value)}
        disabled={disabled}
        placeholder="Add notes or description for this file..."
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
        rows={2}
      />
    </div>
  );

  return (
    <TintedSection
      accent="blue"
      title="Upload Bid Documents"
      description="Upload your bid documents, quotes, and supporting materials. Add comments to provide context for each file."
      bodyClassName="mb-6"
    >
      <FileUpload
        files={files}
        uploadFunction={uploadBidFile}
        onFilesUploaded={onFilesUploaded}
        onFileRemove={onFileRemove}
        disabled={submitting}
        renderFileMetadata={renderFileMetadata}
      />
    </TintedSection>
  );
}

/**
 * Renders overall bid comments section.
 */
function BidCommentsSection({
  submissionComment,
  onChange,
  submitting,
}: {
  submissionComment: string;
  onChange: (comment: string) => void;
  submitting: boolean;
}) {
  return (
    <TintedSection
      accent="green"
      title="Bid Submission Notes"
      description="Add any overall comments, clarifications, or special considerations for your bid."
    >
      <textarea
        value={submissionComment}
        onChange={(e) => onChange(e.target.value)}
        disabled={submitting}
        placeholder="Enter your bid summary — price breakdown, alternates, scope exclusions, project timeline, commercial conditions, warranty terms, etc."
        className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
        rows={6}
      />
    </TintedSection>
  );
}

/**
 * Renders form action buttons (Cancel and Submit).
 */
function FormActions({
  onCancel,
  onSubmit,
  submitting,
  filesCount,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  filesCount: number;
}) {
  return (
    <div className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={submitting}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={onSubmit}
        disabled={submitting || filesCount === 0}
        className="flex items-center gap-2"
      >
        <Send size={16} />
        {submitting ? 'Submitting...' : 'Submit Bid'}
      </Button>
    </div>
  );
}

/**
 * Main form component for bid submission.
 * Composes header, file upload, comments, and action sections.
 * 
 * @param {BidSubmissionFormProps} props - Form configuration and handlers
 * @returns {JSX.Element} Rendered bid submission form
 */
export default function BidSubmissionForm({
  bid,
  tenderPackage,
  subcontractor,
  files,
  submissionComment,
  submitting,
  error,
  onSubmissionCommentChange,
  onFilesUploaded,
  onFileRemove,
  onFileCommentChange,
  onSubmit,
  onCancel,
  uploadBidFile,
}: BidSubmissionFormProps) {
  return (
    <>
      <BidHeader 
        tenderPackage={tenderPackage} 
        bid={bid} 
        subcontractor={subcontractor}
      />

      <FileUploadSection
        files={files}
        uploadBidFile={uploadBidFile}
        onFilesUploaded={onFilesUploaded}
        onFileRemove={onFileRemove}
        onFileCommentChange={onFileCommentChange}
        submitting={submitting}
      />

      <BidCommentsSection
        submissionComment={submissionComment}
        onChange={onSubmissionCommentChange}
        submitting={submitting}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      <FormActions
        onCancel={onCancel}
        onSubmit={onSubmit}
        submitting={submitting}
        filesCount={files.length}
      />
    </>
  );
}
