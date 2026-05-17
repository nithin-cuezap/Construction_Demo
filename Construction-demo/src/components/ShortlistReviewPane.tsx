import { FileText } from 'lucide-react';
import type { Assignment, WorkItem } from '../types';
import Button from './Button';
import ReviewDropZone from './ReviewDropZone';

interface ShortlistReviewPaneProps {
  activeItem: WorkItem;
  activeAssignments: Assignment;
  activeDragSource: 'database' | 'review' | null;
  removeSub: (zone: 'carried' | 'backup' | 'review', subId: string) => void;
  setWorkItemStatus: (itemId: string, status: WorkItem["status"]) => void;
  disabled?: boolean;
}

export default function ShortlistReviewPane({ activeItem, activeAssignments, activeDragSource, removeSub, setWorkItemStatus, disabled = false }: ShortlistReviewPaneProps) {
  return (
    <main className={`flex w-full min-w-0 flex-col border-l border-slate-200 bg-white text-xs xl:text-sm lg:basis-0 lg:flex-1 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3 border-slate-200">
            <h3 className="text-xs xl:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              Shortlist / Under Review
            </h3>
            <span className="text-[11px] xl:text-xs text-slate-500 font-medium">{activeAssignments.review.length} Added</span>
          </div>
          <div className={disabled ? 'pointer-events-none' : ''}>
            <ReviewDropZone activeAssignments={activeAssignments} removeSub={removeSub} activeDragSource={activeDragSource} />
          </div>
          <div className={`flex items-center justify-end mt-4 ${disabled ? 'pointer-events-none' : ''}`}>
            <Button variant="primary" className="flex items-center gap-2" disabled={activeItem.status === 'Shortlisting Completed' || activeItem.status === 'Draft'} onClick={() => setWorkItemStatus(activeItem.id, 'Shortlisting Completed')}>
              Complete Shortlisting
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
