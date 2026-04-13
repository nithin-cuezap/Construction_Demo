import { ChevronRight, FileText, Mail } from 'lucide-react';
import type { Assignment, WorkItem } from '../types';
import Button from './Button';
import ReviewDropZone from './ReviewDropZone';

interface ShortlistCenterPaneProps {
  activeItem: WorkItem;
  activeAssignments: Assignment;
  removeSub: (zone: 'carried' | 'backup' | 'review', subId: string) => void;
  setWorkItemStatus: (itemId: string, status: string) => void;
  advanceWorkflow: () => void;
  regressWorkflow: () => void;
}

export default function ShortlistCenterPane({ activeItem, activeAssignments, removeSub, setWorkItemStatus, advanceWorkflow }: ShortlistCenterPaneProps) {
  return (
    <main className="flex-1 flex flex-col bg-white min-w-125">
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
          <span>{activeItem.division}</span>
          <ChevronRight size={14} />
          <span className="text-slate-900">{activeItem.section}</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Subcontractor Selection</h2>
        <p className="text-slate-500 mt-1 text-sm">Drag and drop vendors from the database to build your shortlist.</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-6">
          
            <div className="flex items-center justify-between mb-3 border-slate-200 pt-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                Shortlist / Under Review
              </h3>
              <span className="text-xs text-slate-500 font-medium">{activeAssignments.review.length} Added</span>
            </div>
            <ReviewDropZone activeAssignments={activeAssignments} removeSub={removeSub} />
            <div className="flex items-center justify-end mt-4">
          <Button variant="primary" className="flex items-center gap-2" disabled={activeItem.status === 'Shortlisting Completed' || activeItem.status === 'Draft'} onClick={() => setWorkItemStatus(activeItem.id, 'Shortlisting Completed')}>
            Complete Shortlisting
          </Button>
          </div>
        </div>
      </div>
      <div className="bg-white border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail size={16} className="text-slate-400" />
            Invites ready for <strong>{activeAssignments.review.length + activeAssignments.backups.length + (activeAssignments.carried ? 1 : 0)}</strong> vendors
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            Generate RFQ Summary
          </Button>
          <Button variant="secondary" className="flex items-center gap-2" onClick={advanceWorkflow}>
            Draft Invitations <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </main>
  );
}
