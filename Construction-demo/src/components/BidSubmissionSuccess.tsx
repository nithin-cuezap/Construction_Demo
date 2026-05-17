/**
 * Success confirmation component for submitted bids.
 * 
 * Displays confirmation message, submission timestamp, and navigation options
 * after a vendor successfully submits their bid. This read-only view prevents
 * resubmission and provides clear feedback about successful completion.
 * 
 * @module components/BidSubmissionSuccess
 */

import { CheckCircle } from 'lucide-react';
import type { BidRecord, TenderPackage } from '../types';
import Button from './Button';

/**
 * Props for the BidSubmissionSuccess component.
 */
export interface BidSubmissionSuccessProps {
  bid: BidRecord;
  tenderPackage: TenderPackage;
  onNavigateBack: () => void;
}

/**
 * Renders success confirmation after bid submission.
 * Shows submission timestamp and provides navigation to return to tender list.
 * 
 * @param {BidSubmissionSuccessProps} props - Bid data and navigation handler
 * @returns {JSX.Element} Rendered success confirmation
 * 
 * @example
 * ```tsx
 * <BidSubmissionSuccess
 *   bid={submittedBid}
 *   tenderPackage={tenderPackage}
 *   onNavigateBack={() => navigate('/tenderpackages')}
 * />
 * ```
 */
export default function BidSubmissionSuccess({
  bid,
  tenderPackage,
  onNavigateBack,
}: BidSubmissionSuccessProps) {
  return (
    <div className="bg-white border border-green-200 rounded-2xl p-8 shadow-sm text-center">
      <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
      
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Bid Submitted Successfully!
      </h1>
      
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
        onClick={onNavigateBack}
      >
        Return to Tender Packages
      </Button>
    </div>
  );
}
