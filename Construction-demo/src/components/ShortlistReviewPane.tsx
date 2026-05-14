import { ChevronRight, FileText } from 'lucide-react';
import type { Assignment, WorkItem } from '../types';
import Button from './Button';
import ReviewDropZone from './ReviewDropZone';

interface ShortlistReviewPaneProps {
  activeItem: WorkItem;
  activeAssignments: Assignment;
  removeSub: (zone: 'carried' | 'backup' | 'review', subId: string) => void;
  setWorkItemStatus: (itemId: string, status: string) => void;
}

export default function ShortlistReviewPane({ activeItem, activeAssignments, removeSub, setWorkItemStatus }: ShortlistReviewPaneProps) {
  return (
    <main className="w-full lg:w-1/4 min-w-0 flex flex-col bg-white border-l border-slate-200 text-xs xl:text-sm">
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-xs xl:text-sm font-medium text-slate-500 mb-2">
          <span>{activeItem.section}</span>
          <ChevronRight size={14} />
          <span className="text-slate-900">{activeItem.division}</span>
        </div>
        <p className="text-slate-500 text-xs xl:text-sm">Drag vendors from the database into the review list.</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3 border-slate-200">
            <h3 className="text-xs xl:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              Shortlist / Under Review
            </h3>
            <span className="text-[11px] xl:text-xs text-slate-500 font-medium">{activeAssignments.review.length} Added</span>
          </div>
          <ReviewDropZone activeAssignments={activeAssignments} removeSub={removeSub} />
          <div className="flex items-center justify-end mt-4">
            <Button variant="primary" className="flex items-center gap-2" disabled={activeItem.status === 'Shortlisting Completed' || activeItem.status === 'Draft'} onClick={() => setWorkItemStatus(activeItem.id, 'Shortlisting Completed')}>
              Complete Shortlisting
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
