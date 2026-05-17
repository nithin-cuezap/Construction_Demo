/**
 * @fileoverview Bid submission view for vendors/subcontractors.
 * 
 * This view is accessed by vendors to submit their bids for a specific tender package.
 * Uses component composition to separate concerns: presentation logic in child components,
 * business logic in custom hook, and routing/orchestration in this main view.
 * 
 * ## Architecture
 * 
 * - **useBidSubmission hook**: Manages all state and business logic
 * - **BidSubmissionForm**: Renders the form UI for active bids
 * - **BidSubmissionSuccess**: Shows confirmation after submission
 * - **ContractorSignupFooter**: Marketing CTA for platform signup
 * - **PageSurface**: Layout wrapper with consistent styling
 * 
 * ## Workflow
 * 
 * 1. Vendor accesses `/tenderpackages/:bidId/submission`
 * 2. Hook loads bid, tender package, and subcontractor data
 * 3. View renders appropriate state (loading, form, or success)
 * 4. User submits bid via form component
 * 5. Success component displays confirmation
 * 
 * @module views/BidSubmissionView
 */

import { useNavigate, useParams } from 'react-router-dom';
import BidSubmissionForm from '../components/BidSubmissionForm';
import BidSubmissionSuccess from '../components/BidSubmissionSuccess';
import Button from '../components/Button';
import ContractorSignupFooter from '../components/ContractorSignupFooter';
import PageSurface from '../components/PageSurface';
import { useBidSubmission } from '../hooks/useBidSubmission';

/**
 * Bid submission view component for vendors.
 * 
 * Orchestrates the bid submission flow by delegating to specialized components:
 * - Loading state for data fetching
 * - Success view for completed submissions
 * - Form view for active bid submissions
 * 
 * Business logic is encapsulated in useBidSubmission hook for testability.
 * 
 * @returns {JSX.Element} Rendered bid submission view
 */
export default function BidSubmissionView() {
  const { bidId } = useParams<{ bidId: string }>();
  const navigate = useNavigate();

  const {
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
  } = useBidSubmission(bidId);

  // Navigate back to tender list
  const handleCancel = () => navigate('/tenderpackages');

  /**
   * Wait for all data to load before rendering form to prevent UI flicker
   * and runtime errors from accessing undefined properties.
   */
  if (loading || !bid || !tenderPackage || !subcontractor) {
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
              onClick={handleCancel}
            >
              Return to Tender Packages
            </Button>
          )}
        </div>
      </PageSurface>
    );
  }

  /**
   * Render read-only success view to prevent resubmission and confirm receipt.
   * Submitted bids are immutable to maintain audit trail and prevent gaming.
   */
  if (submitted && bid.status === 'Bid Submitted') {
    return (
      <PageSurface>
        <BidSubmissionSuccess
          bid={bid}
          tenderPackage={tenderPackage}
          onNavigateBack={handleCancel}
        />
        <ContractorSignupFooter />
      </PageSurface>
    );
  }

  // Render active bid submission form
  return (
    <PageSurface>
      <BidSubmissionForm
        bid={bid}
        tenderPackage={tenderPackage}
        subcontractor={subcontractor}
        files={files}
        submissionComment={submissionComment}
        submitting={submitting}
        error={error}
        onSubmissionCommentChange={setSubmissionComment}
        onFilesUploaded={handleFilesUploaded}
        onFileRemove={handleFileRemove}
        onFileCommentChange={handleFileCommentChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        uploadBidFile={uploadBidFile}
      />
      <ContractorSignupFooter />
    </PageSurface>
  );
}
