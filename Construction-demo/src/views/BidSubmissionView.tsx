/**
 * @fileoverview Bid submission view for vendors/subcontractors.
 * 
 * This view is accessed by vendors to submit their bids for a specific tender package.
 * Displays project details, allows file uploads with comments, and handles bid submission.
 * 
 * ## Workflow Overview
 * 
 * 1. Vendor receives a unique link containing their bid ID
 * 2. View loads bid, tender package, and subcontractor data
 * 3. Vendor reviews project details (name, description, address, due date)
 * 4. Vendor uploads bid documents (PDF, Word, ZIP files)
 * 5. Vendor adds optional comments to individual files
 * 6. Vendor adds overall bid submission notes
 * 7. Vendor clicks "Submit Bid" to finalize submission
 * 8. Bid status updates to "Bid Submitted" (irreversible)
 * 9. Success confirmation page is displayed with submission timestamp
 * 
 * ## URL Structure
 * 
 * Route: `/tenderpackages/:bidId/submission`
 * 
 * The bidId parameter uniquely identifies the bid record, which contains
 * references to both the tender package and the subcontractor. This allows
 * the view to load all necessary data from a single parameter.
 * 
 * ## State Management
 * 
 * The component maintains several pieces of state:
 * - `bid`: The bid record being submitted
 * - `tenderPackage`: Project details for display
 * - `subcontractor`: Vendor company information
 * - `files`: Array of uploaded files with comments
 * - `submissionComment`: Overall bid notes
 * - `submitting`: Loading state during submission
 * - `submitted`: Success state after submission
 * - `error`: Error messages for validation or failures
 * 
 * ## Conditional Rendering
 * 
 * The view has three distinct render states:
 * 1. Loading: Displayed while fetching data or if data fails to load
 * 2. Success: Displayed after successful bid submission (read-only)
 * 3. Form: The main submission form for active bids
 * 
 * ## Data Operations
 * 
 * All database operations go through .ops.ts files following the
 * mockdb.instructions.md pattern:
 * - getBidById() - Loads bid record
 * - getTenderPackageById() - Loads project details
 * - getSubcontractorById() - Loads vendor information
 * - submitBid() - Persists final submission
 * 
 * @module views/BidSubmissionView
 */

import { ArrowRight, Building2, Calendar, CheckCircle, MapPin, Send } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBidById, submitBid } from '../Bid.ops';
import branding from '../branding.config';
import Button from '../components/Button';
import FileUpload from '../components/FileUpload';
import { getSubcontractorById, getTenderPackageById } from '../TenderPackage.ops';
import type { BidRecord, BidSubmissionFile, Subcontractor, TenderPackage } from '../types';
import { mockUploadFile } from '../utils/fileUpload';

const pageContainerBaseClass = 'mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8';

type TintedSectionAccent = 'blue' | 'green';

const tintedSectionStyles: Record<TintedSectionAccent, {
  container: string;
  title: string;
  description: string;
}> = {
  blue: {
    container: 'bg-blue-50 border-l-4 border-blue-500',
    title: 'text-blue-900',
    description: 'text-blue-700',
  },
  green: {
    container: 'bg-green-50 border-l-4 border-green-500',
    title: 'text-green-900',
    description: 'text-green-700',
  },
};

interface PageSurfaceProps {
  children: ReactNode;
  centerContent?: boolean;
}

function PageSurface({ children, centerContent = false }: PageSurfaceProps) {
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50">
      <div className={`${pageContainerBaseClass} ${centerContent ? 'flex min-h-full items-center justify-center' : ''}`}>
        {children}
      </div>
    </div>
  );
}

interface TintedSectionProps {
  accent: TintedSectionAccent;
  title: string;
  description: string;
  children: ReactNode;
  bodyClassName?: string;
}

function TintedSection({ accent, title, description, children, bodyClassName = 'mb-4' }: TintedSectionProps) {
  const style = tintedSectionStyles[accent];

  return (
    <div className={`${style.container} rounded-lg p-6 mb-6`}>
      <div className={bodyClassName}>
        <h2 className={`text-xl font-bold ${style.title} mb-1`}>{title}</h2>
        <p className={`text-sm ${style.description}`}>
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

/**
 * Bid submission view component for vendors.
 * Accessed via /tenderpackages/:bidId/submission
 * 
 * @returns {JSX.Element} Rendered bid submission view
 */
export default function BidSubmissionView() {
  const { bidId } = useParams<{ bidId: string }>();
  const navigate = useNavigate();

  const [bid, setBid] = useState<BidRecord | null>(null);
  const [tenderPackage, setTenderPackage] = useState<TenderPackage | null>(null);
  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
  const [files, setFiles] = useState<BidSubmissionFile[]>([]);
  const [submissionComment, setSubmissionComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderSignupFooter = () => (
    <div className="bg-amber-50 border-l-4 border-amber-500 rounded-2xl p-6 md:p-7 mt-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Contractor Network
          </div>
          <h2 className="mt-3 text-2xl font-bold text-amber-950">Join the Contractor Network</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900/80 md:text-base">
            You&apos;re submitting to just one project. Imagine accessing hundreds of tender opportunities from top general contractors, all in one place. Build relationships that grow your business with {branding.orgName}.
          </p>
          <p className="mt-3 text-sm font-medium text-amber-800">
            Signup opens soon. This CTA is a placeholder for the upcoming contractor onboarding flow.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <Button
            type="button"
            variant="secondary"
            disabled
            className="flex items-center gap-2 border-amber-700 bg-amber-600 text-white hover:bg-amber-600 active:bg-amber-600 disabled:border-amber-300 disabled:bg-amber-300"
          >
            Sign Up & Get Invited
            <ArrowRight size={16} />
          </Button>
          <p className="text-xs text-amber-700">External contractor signup route coming soon.</p>
        </div>
      </div>
    </div>
  );

  /**
   * Loads and validates bid submission data on component mount.
   * 
   * This effect fetches three related entities:
   * 1. Bid record - contains submission status and data
   * 2. Tender package - provides project details for display
   * 3. Subcontractor - identifies who is submitting the bid
   * 
   * If the bid has already been submitted, it loads the existing
   * files and comments to display in read-only/success mode.
   * 
   * Error handling ensures all required data exists before rendering
   * the submission form to prevent incomplete data scenarios.
   */
  useEffect(() => {
    if (!bidId) {
      setError('Invalid bid ID');
      return;
    }

    // Fetch bid record to get submission status and related IDs
    const bidData = getBidById(bidId);
    if (!bidData) {
      setError('Bid not found');
      return;
    }

    // Fetch tender package for project details display
    const packageData = getTenderPackageById(bidData.tenderPackageId);
    if (!packageData) {
      setError('Tender package not found');
      return;
    }

    // Fetch subcontractor identity for display
    const subcontractorData = getSubcontractorById(bidData.subcontractorId);
    if (!subcontractorData) {
      setError('Subcontractor not found');
      return;
    }

    setBid(bidData);
    setTenderPackage(packageData);
    setSubcontractor(subcontractorData);

    // Hydrate form with existing data if bid was already submitted
    // This allows vendors to view their submitted bid
    if (bidData.status === 'Bid Submitted') {
      setFiles(bidData.files);
      setSubmissionComment(bidData.submissionComment);
      setSubmitted(true);
    }
  }, [bidId]);

  /**
   * Uploads a file for bid submission with comment field initialized.
   * 
   * Wraps the generic mockUploadFile function to add the bid-specific
   * comment field. This allows the FileUpload component to remain generic
   * while supporting bid-specific metadata.
   * 
   * @param {File} file - The browser File object to upload
   * @returns {Promise<BidSubmissionFile>} Uploaded file with comment field
   */
  const uploadBidFile = async (file: File): Promise<BidSubmissionFile> => {
    const uploadedFile = await mockUploadFile(file);
    return {
      ...uploadedFile,
      comment: '', // Initialize empty comment for bid submissions
    };
  };

  /**
   * Handles adding newly uploaded files to the submission.
   * Appends new files to existing file list, maintaining all previously
   * uploaded files. Called by FileUpload component after successful upload.
   * 
   * @param {BidSubmissionFile[]} newFiles - Array of newly uploaded file metadata
   */
  const handleFilesUploaded = (newFiles: BidSubmissionFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  /**
   * Handles removing a file from the submission.
   * Filters out the file with matching ID from the files array.
   * File can be removed before final bid submission to allow corrections.
   * 
   * @param {string} fileId - Unique identifier of the file to remove
   */
  const handleFileRemove = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  /**
   * Handles updating a file's comment.
   * Updates the comment property of a specific file while preserving
   * all other file properties and maintaining array order.
   * 
   * @param {string} fileId - Unique identifier of the file to update
   * @param {string} comment - New comment text for the file
   */
  const handleFileCommentChange = (fileId: string, comment: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, comment } : f))
    );
  };

  /**
   * Handles the final bid submission process.
   * 
   * Validates that at least one file is uploaded before allowing submission.
   * Calls the submitBid operation which updates the bid status to "Bid Submitted",
   * persists all files and comments, and records the submission timestamp.
   * 
   * On success, transitions to the success confirmation view.
   * On failure, displays error message while preserving form state for retry.
   * 
   * @returns {Promise<void>} Resolves when submission completes or fails
   */
  const handleSubmit = async () => {
    if (!bidId) return;

    // Validate that at least one file is uploaded
    // This is a business requirement for bid submissions
    if (files.length === 0) {
      setError('Please upload at least one file');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Persist bid submission with all files and comments
      // This updates the bid status and cannot be undone
      const result = submitBid(bidId, files, submissionComment);
      if (result) {
        setSubmitted(true);
        setBid(result); // Update local state with submitted bid
      } else {
        throw new Error('Failed to submit bid');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Loading state: Displays while fetching bid, package, and subcontractor data.
   * Shows error message if data fetch fails, with navigation option to return.
   */
  if (!bid || !tenderPackage || !subcontractor) {
    return (
      <PageSurface centerContent>
        <div className="text-center">
          <p className="text-slate-600">
            {error || 'Loading bid details...'}
          </p>
          {error && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/tenderpackages')}
            >
              Return to Tender Packages
            </Button>
          )}
        </div>
      </PageSurface>
    );
  }

  /**
   * Success state: Displays confirmation when bid has been successfully submitted.
   * Shows submission timestamp and prevents re-submission by rendering read-only view.
   * Vendors can only view their submitted bid, not modify it.
   */
  if (submitted && bid.status === 'Bid Submitted') {
    return (
      <PageSurface>
        <div className="bg-white border border-green-200 rounded-2xl p-8 shadow-sm text-center">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bid Submitted Successfully!</h1>
          <p className="text-slate-600 mb-6">
            Your bid for <strong>{tenderPackage.packageName}</strong> has been submitted.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-600">Submitted on</p>
            <p className="text-lg font-semibold text-slate-900">
              {new Date(bid.submittedAt).toLocaleString()}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/tenderpackages')}
          >
            Return to Tender Packages
          </Button>
        </div>
        {renderSignupFooter()}
      </PageSurface>
    );
  }

  return (
    <PageSurface>
        {/* Header */}
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

          {/* Subcontractor Name */}
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

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Description */}
            {tenderPackage.projectDescription && (
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Project Description</p>
                <p className="text-slate-700">{tenderPackage.projectDescription}</p>
              </div>
            )}

            {/* Site Address */}
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
                <MapPin size={12} /> Site Address
              </p>
              <p className="text-slate-700">
                {tenderPackage.siteAddress.street}<br />
                {tenderPackage.siteAddress.city}, {tenderPackage.siteAddress.state} {tenderPackage.siteAddress.zipCode}
              </p>
            </div>

            {/* Due Date */}
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

        {/* File Upload Section */}
        <TintedSection
          accent="blue"
          title="Upload Bid Documents"
          description="Upload your bid documents, quotes, and supporting materials. Add comments to provide context for each file."
          bodyClassName="mb-6"
        >
          <FileUpload
            files={files}
            uploadFunction={uploadBidFile}
            onFilesUploaded={handleFilesUploaded}
            onFileRemove={handleFileRemove}
            disabled={submitting}
            renderFileMetadata={(file, disabled) => (
              <div>
                <label htmlFor={`comment-${file.id}`} className="block text-xs font-medium text-slate-600 mb-1">
                  Comment for this file (optional)
                </label>
                <textarea
                  id={`comment-${file.id}`}
                  value={file.comment}
                  onChange={(e) => handleFileCommentChange(file.id, e.target.value)}
                  disabled={disabled}
                  placeholder="Add notes or description for this file..."
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  rows={2}
                />
              </div>
            )}
          />
        </TintedSection>

        {/* Overall Bid Comment Section */}
        <TintedSection
          accent="green"
          title="Bid Submission Notes"
          description="Add any overall comments, clarifications, or special considerations for your bid."
        >
          <textarea
            value={submissionComment}
            onChange={(e) => setSubmissionComment(e.target.value)}
            disabled={submitting}
            placeholder="Enter your bid summary — price breakdown, alternates, scope exclusions, project timeline, commercial conditions, warranty terms, etc."
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            rows={6}
          />
        </TintedSection>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/tenderpackages')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || files.length === 0}
            className="flex items-center gap-2"
          >
            <Send size={16} />
            {submitting ? 'Submitting...' : 'Submit Bid'}
          </Button>
        </div>

        {renderSignupFooter()}
    </PageSurface>
  );
}
