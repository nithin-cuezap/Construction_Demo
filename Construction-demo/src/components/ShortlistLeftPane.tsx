
import { HardHat } from 'lucide-react';
import type { Assignment, WorkItem as WorkItemType } from '../types';
import Button from './Button';
import WorkItem from './WorkItem';

interface ShortlistLeftPaneProps {
  workItems: WorkItemType[];
  activeItem: WorkItemType;
  setActiveItem: (item: WorkItemType) => void;
  getStatusColor: (status: string) => string;
  setWorkItemStatus: (itemId: string, status: string) => void;
  assignments?: Record<string, Assignment>;
}

export default function ShortlistLeftPane({ workItems, activeItem, setActiveItem, getStatusColor, setWorkItemStatus, assignments = {} }: ShortlistLeftPaneProps) {
  const finalizeAll = () => {
    workItems.forEach(wi => {
      if (wi.status !== 'Draft' && wi.status !== 'Shortlisting Completed') {
        setWorkItemStatus(wi.id, 'Shortlisting Completed');
      }
    });
  };

  const hasEligible = workItems.some(wi => wi.status !== 'Draft' && wi.status !== 'Shortlisting Completed');

  return (
    <aside className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <HardHat size={18} className="text-slate-400" />
          Work Items
        </h2>
        <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-md">{workItems.length}</span>
      </div>
      <div className="overflow-y-auto flex-1 p-3 space-y-2">
        {workItems.map(item => {
          const a = assignments[item.id] || { carried: null, backups: [], review: [] };
          const vendorCount = (a.carried ? 1 : 0) + a.backups.length + a.review.length;
          return (
            <WorkItem
              key={item.id}
              item={item}
              isActive={activeItem.id === item.id}
              itemStatus={item.status}
              setActiveItem={setActiveItem}
              getStatusColor={getStatusColor}
              vendorCount={vendorCount}
            />
          );
        })}
      </div>
      <div className='p-4 border-t border-slate-200 bg-white'>
        <Button variant="primary" onClick={finalizeAll} disabled={!hasEligible} className="w-full">
          Finalize All
        </Button>
      </div>
    </aside>
  );
}

