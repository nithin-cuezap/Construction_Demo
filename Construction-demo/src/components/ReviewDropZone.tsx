import { useDroppable } from '@dnd-kit/core';
import { FileText } from 'lucide-react';
import type { Assignment } from '../types';
import AssignedCard from './AssignedCard';
import EmptyDropZone from './EmptyDropZone';

export default function ReviewDropZone({ activeAssignments, removeSub, activeDragSource }: { activeAssignments: Assignment, removeSub: (zone: 'carried' | 'backup' | 'review', subId: string) => void, activeDragSource: 'database' | 'review' | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'review', data: { listType: 'review-zone' } });
  const { setNodeRef: setAppendNodeRef, isOver: isAppendOver } = useDroppable({ id: 'review-end', data: { listType: 'review-zone' } });

  const isExternalDropActive = activeDragSource === 'database';
  const isZoneActive = isExternalDropActive && (isOver || isAppendOver);

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-xl p-4 min-h-40 transition-all flex flex-col ${
        isZoneActive ? 'border-blue-400 bg-blue-50 scale-[1.01]' :
        'border-slate-300 bg-slate-100 hover:border-slate-400'
      }`}
    >
      {activeAssignments.review.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {activeAssignments.review.map((sub: import('../types').Subcontractor) => (
              <AssignedCard key={sub.id} sub={sub} onRemove={() => removeSub('review', sub.id)} type="review" sortable hideRemove={false} />
            ))}
          </div>
          <div
            ref={setAppendNodeRef}
            className={`mt-3 min-h-16 rounded-lg border border-dashed transition-all ${
              isExternalDropActive && isAppendOver
                ? 'border-blue-400 bg-blue-100/70'
                : 'border-transparent bg-transparent'
            }`}
          />
        </>
      ) : (
        <EmptyDropZone text="Drag vendors here to send them a Bid Invitation" icon={<FileText size={24} className="text-slate-400 mb-2" />} />
      )}
    </div>
  );
}
