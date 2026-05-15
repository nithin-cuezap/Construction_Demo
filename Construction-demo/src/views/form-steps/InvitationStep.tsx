import { Mail, Send } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/Button';
import { getSelectionViewData, persistWorkItems, setWorkItemStatuses } from '../../Selection.ops';
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

  const handleSendInvitations = () => {
    if (!hasShortlistedVendors) return;

    const updates = shortlistedByItem
      .filter(({ item }) => item.status !== 'Invited')
      .map(({ item }) => ({ id: item.id, status: 'Invited' }));

    if (updates.length > 0) {
      const nextWorkItems = setWorkItemStatuses(invitationWorkItems, updates);
      persistWorkItems(tenderPackageId, nextWorkItems);
    }

    setLastInvitationSentAt(new Date().toLocaleString());
  };

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
  const emailTemplateHtml = buildInvitationEmailTemplateHtml({
    packageName: formData.packageName,
    packageControlNumber: formData.packageControlNumber,
    contractorName: selectedVendor?.vendorName,
    sectionNames: shortlistedSectionNames,
    synopsis,
    detailsUrl,
    contactName: formData.customerContactDetails.name || 'Procurement Team',
    contactTitle: formData.customerContactDetails.title,
    contactEmail: formData.customerContactDetails.email || 'procurement@organization.com',
    contactPhone: formData.customerContactDetails.phone || 'N/A',
  });
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Shortlisted Vendors</h3>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {shortlistedVendorCount} selected
          </span>
        </div>
        <p className="mb-3 text-xs text-slate-600">
          Click on a vendor to preview their personalized invitation email
        </p>

        {shortlistedVendors.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
            No shortlisted vendors found. Complete contractor shortlisting in Step 3 to prepare invitations.
          </p>
        ) : (
          <div className="h-300 space-y-3 overflow-auto pr-1">
            {shortlistedVendors.map((vendor) => {
              const isSelected = vendor.vendorId === selectedVendorId;
              return (
                <div 
                  key={vendor.vendorId} 
                  onClick={() => setSelectedVendorId(vendor.vendorId)}
                  className={`rounded-lg border p-3 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-100 shadow-md' 
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{vendor.vendorName}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Trades {vendor.trades.join(', ')} | Rating {vendor.rating.toFixed(1)} | {vendor.projects} projects
                  </p>

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
        <div className="h-300 overflow-auto rounded-lg border border-slate-300 bg-white p-2">
          <div dangerouslySetInnerHTML={{ __html: emailTemplateHtml }} />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Ready to invite shortlisted contractors.</p>
            <p className="text-xs text-slate-600">
              {lastInvitationSentAt
                ? `Invitations last sent on ${lastInvitationSentAt}.`
                : 'Send invitations after reviewing the email template.'}
            </p>
          </div>
          <Button
            onClick={handleSendInvitations}
            disabled={!hasShortlistedVendors}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send size={14} /> Send Invitations
          </Button>
        </div>
      </section>
    </div>
  );
}
