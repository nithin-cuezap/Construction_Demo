import { Mail, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Toggle from '../../components/Toggle';
import { createInvitationsForShortlistedVendors, getInvitationRecords, sendInvitationsToVendors } from '../../Invitation.ops';
import { getSelectionViewData, persistWorkItems, setWorkItemStatuses } from '../../Selection.ops';
import type { BidRecord, WorkItem } from '../../types';
import { buildInvitationEmailTemplateHtml } from '../invitationEmailTemplate';
import type { TenderPackageFormData } from './TenderPackageForm.types';

interface InvitationWorkItemSummary {
  id: string;
  sectionCode: string;
  sectionName: string;
}

interface ShortlistedVendorSummary {
  vendorId: string;
  vendorName: string;
  trades: string[];
  rating: number;
  projects: number;
  workItems: InvitationWorkItemSummary[];
}

interface InvitationStepProps {
  tenderPackageId: string;
  formData: TenderPackageFormData;
}

const hasTextValue = (value: string | undefined | null) => (value || '').trim().length > 0;

export default function InvitationStep({
  tenderPackageId,
  formData,
}: InvitationStepProps) {
  const [lastInvitationSentAt, setLastInvitationSentAt] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [bidRecords, setBidRecords] = useState<BidRecord[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set());

  const invitationSnapshot = getSelectionViewData(tenderPackageId);
  const invitationWorkItems = invitationSnapshot.workItems;
  const invitationSelectionData = invitationSnapshot.selectionData;
  
  const shortlistedByItem = invitationWorkItems
    .map((item) => ({
      item,
      shortlisted: invitationSelectionData.reviewByItemId[item.id] ?? [],
    }))
    .filter(({ shortlisted }) => shortlisted.length > 0);
  
  const shortlistedVendorMap = new Map<string, ShortlistedVendorSummary>();

  shortlistedByItem.forEach(({ item, shortlisted }) => {
    shortlisted.forEach((vendor) => {
      const existing = shortlistedVendorMap.get(vendor.id);
      if (existing) {
        existing.workItems.push({
          id: item.id,
          sectionCode: item.sectionCode,
          sectionName: item.sectionName,
        });
        return;
      }

      shortlistedVendorMap.set(vendor.id, {
        vendorId: vendor.id,
        vendorName: vendor.name,
        trades: vendor.trades,
        rating: vendor.rating,
        projects: vendor.projects,
        workItems: [
          {
            id: item.id,
            sectionCode: item.sectionCode,
            sectionName: item.sectionName,
          },
        ],
      });
    });
  });

  const shortlistedVendors = Array.from(shortlistedVendorMap.values()).sort((left, right) =>
    left.vendorName.localeCompare(right.vendorName),
  );
  const shortlistedVendorCount = shortlistedVendors.length;
  const hasShortlistedVendors = shortlistedVendorCount > 0;

  // Create bid records for shortlisted vendors when the component loads
  useEffect(() => {
    if (hasShortlistedVendors) {
      const shortlistedVendorIds = shortlistedVendors.map(vendor => vendor.vendorId);
      createInvitationsForShortlistedVendors(tenderPackageId, shortlistedVendorIds);
    }
    // Fetch bid records to display invitation status
    const records = getInvitationRecords(tenderPackageId);
    setBidRecords(records);
    
    // Auto-select vendors that haven't been invited yet
    const pendingVendorIds = new Set<string>();
    shortlistedVendors.forEach(vendor => {
      const bidRecord = records.find(r => r.subcontractorId === vendor.vendorId);
      if (!bidRecord?.invitedAt) {
        pendingVendorIds.add(vendor.vendorId);
      }
    });
    setSelectedVendorIds(pendingVendorIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenderPackageId]);

  const handleSendInvitations = () => {
    if (selectedVendorIds.size === 0) return;

    const selectedVendorIdsArray = Array.from(selectedVendorIds);
    
    // Update work item statuses for work items associated with selected vendors
    const workItemsToUpdate = new Set<string>();
    selectedVendorIdsArray.forEach(vendorId => {
      const vendor = shortlistedVendors.find(v => v.vendorId === vendorId);
      vendor?.workItems.forEach(wi => workItemsToUpdate.add(wi.id));
    });
    
    const updates: Array<{ id: string; status: WorkItem["status"] }> = shortlistedByItem
      .filter(({ item }) => workItemsToUpdate.has(item.id) && item.status !== 'Invited')
      .map(({ item }) => ({ id: item.id, status: 'Invited' }));

    if (updates.length > 0) {
      const nextWorkItems = setWorkItemStatuses(invitationWorkItems, updates);
      persistWorkItems(tenderPackageId, nextWorkItems);
    }

    // Mark invitations as sent for selected vendors only
    sendInvitationsToVendors(tenderPackageId, selectedVendorIdsArray);

    // Refresh bid records to show updated invitation status
    const updatedRecords = getInvitationRecords(tenderPackageId);
    setBidRecords(updatedRecords);
    
    // Clear selection after sending
    setSelectedVendorIds(new Set());

    setLastInvitationSentAt(new Date().toLocaleString());
  };

  const handleToggleVendor = (vendorId: string, checked: boolean) => {
    setSelectedVendorIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(vendorId);
      } else {
        next.delete(vendorId);
      }
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedVendorIds(new Set(pendingVendorIds));
    } else {
      setSelectedVendorIds(new Set());
    }
  };

  // Create a map of vendorId to bid record for quick lookup
  const bidRecordMap = new Map<string, BidRecord>();
  bidRecords.forEach(record => {
    bidRecordMap.set(record.subcontractorId, record);
  });

  // Get list of vendors that haven't been invited yet
  const pendingVendorIds = shortlistedVendors
    .filter(vendor => {
      const bidRecord = bidRecordMap.get(vendor.vendorId);
      return !bidRecord?.invitedAt;
    })
    .map(v => v.vendorId);

  const selectedVendor = selectedVendorId 
    ? shortlistedVendors.find(v => v.vendorId === selectedVendorId)
    : null;

  // Filter sections and synopsis based on selected vendor
  const relevantWorkItems = selectedVendor
    ? shortlistedByItem.filter(({ item }) => 
        selectedVendor.workItems.some(wi => wi.id === item.id)
      )
    : shortlistedByItem;

  const shortlistedSectionNames = Array.from(
    new Set(relevantWorkItems.map(({ item }) => item.sectionName).filter(Boolean)),
  );
  const synopsis = relevantWorkItems
    .map(({ item }) => item.description)
    .filter((description, index, source) => hasTextValue(description) && source.indexOf(description) === index)
    .slice(0, 3)
    .join(' ');
  const detailsUrl = window.location.href;
  
  // Get bidId for the selected vendor to generate correct URLs in the email
  const selectedVendorBidId = selectedVendor 
    ? bidRecordMap.get(selectedVendor.vendorId)?.id 
    : undefined;
  
  const emailTemplateHtml = buildInvitationEmailTemplateHtml({
    packageName: formData.packageName,
    packageControlNumber: formData.packageControlNumber,
    contractorName: selectedVendor?.vendorName,
    sectionNames: shortlistedSectionNames,
    synopsis,
    siteLocation: formData.siteAddress ? `${formData.siteAddress.street}, ${formData.siteAddress.city}, ${formData.siteAddress.state} ${formData.siteAddress.zipCode}` : undefined,
    detailsUrl,
    submissionDeadline: formData.subContractorBidSubmissionDueDate,
    rfqDate: formData.subContractorRfqDueDate,
    contactName: formData.customerContactDetails.name || 'Procurement Team',
    contactTitle: formData.customerContactDetails.title,
    contactEmail: formData.customerContactDetails.email || 'procurement@organization.com',
    contactPhone: formData.customerContactDetails.phone || 'N/A',
    bidId: selectedVendorBidId,
  });
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Shortlisted Vendors</h3>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {shortlistedVendorCount} shortlisted
          </span>
        </div>
        {pendingVendorIds.length > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <span className="text-xs font-medium text-blue-800">
              Select all pending vendors ({pendingVendorIds.length})
            </span>
            <Toggle
              checked={selectedVendorIds.size === pendingVendorIds.length && pendingVendorIds.length > 0}
              onChange={handleToggleAll}
              size="md"
            />
          </div>
        )}
        <p className="mb-3 text-xs text-slate-600">
          Select vendors to send invitations • Click to preview personalized email
        </p>

        {shortlistedVendors.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
            No shortlisted vendors found. Complete contractor shortlisting in Step 3 to prepare invitations.
          </p>
        ) : (
          <div className="flex flex-1 flex-col max-h-[70vh] space-y-3 overflow-auto pr-1">
            {shortlistedVendors.map((vendor) => {
              const isSelected = vendor.vendorId === selectedVendorId;
              const bidRecord = bidRecordMap.get(vendor.vendorId);
              const invitedDate = bidRecord?.invitedAt 
                ? new Date(bidRecord.invitedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })
                : null;
              const isPending = !invitedDate;
              const isChecked = selectedVendorIds.has(vendor.vendorId);
              
              return (
                <div 
                  key={vendor.vendorId} 
                  onClick={() => setSelectedVendorId(vendor.vendorId)}
                  className={`rounded-lg border p-3 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-100 shadow-md' 
                      : isPending && !isChecked
                        ? 'border-slate-200 bg-slate-50 opacity-50 hover:border-slate-300 hover:opacity-60'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{vendor.vendorName}</p>
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Toggle
                            checked={isChecked}
                            onChange={(checked) => handleToggleVendor(vendor.vendorId, checked)}
                            size="md"
                          />
                        </div>
                      )}
                    {invitedDate ? (
                      <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        Invited
                      </span>
                    ) : (
                      <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Pending
                      </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Trades {vendor.trades.join(', ')} | Rating {vendor.rating.toFixed(1)} | {vendor.projects} projects
                  </p>
                  {invitedDate && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Invited on: {invitedDate}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {vendor.workItems.map((item) => (
                      <span
                        key={`${vendor.vendorId}-${item.id}`}
                        className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                        title={item.sectionName}
                      >
                        {item.sectionCode}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Mail size={18} className="text-emerald-700" />
          <h3 className="text-base font-semibold text-slate-900">
            {selectedVendor 
              ? `Email Template for ${selectedVendor.vendorName}` 
              : 'Bid Invitation Email Template'}
          </h3>
        </div>
        {selectedVendor && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <p className="text-xs text-blue-800">
              <strong>Viewing personalized template</strong> - Only showing trades this vendor was shortlisted for.{' '}
              <button 
                onClick={() => setSelectedVendorId(null)}
                className="text-blue-600 underline hover:text-blue-800"
              >
                View general template
              </button>
            </p>
          </div>
        )}
        <div className="flex flex-1 max-h-[70vh] overflow-auto rounded-lg border border-slate-300 bg-white p-2">
          <div dangerouslySetInnerHTML={{ __html: emailTemplateHtml }} />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">
              {selectedVendorIds.size > 0 
                ? `Ready to invite ${selectedVendorIds.size} selected contractor${selectedVendorIds.size !== 1 ? 's' : ''}.`
                : 'Select vendors to send invitations.'}
            </p>
            <p className="text-xs text-slate-600">
              {lastInvitationSentAt
                ? `Invitations last sent on ${lastInvitationSentAt}.`
                : 'Review the email template before sending.'}
            </p>
          </div>
          <Button
            onClick={handleSendInvitations}
            disabled={selectedVendorIds.size === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Send size={14} /> Send to {selectedVendorIds.size > 0 ? selectedVendorIds.size : '...'}
          </Button>
        </div>
      </section>
    </div>
  );
}
