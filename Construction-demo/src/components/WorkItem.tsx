import { ChevronRight, Users } from "lucide-react";
import type { WorkItem as WorkItemType } from '../types';

interface WorkItemProps {
  item: WorkItemType;
  isActive: boolean;
  itemStatus: string;
  setActiveItem: (item: WorkItemType) => void;
  getStatusColor: (status: string) => string;
  vendorCount?: number;
}
function WorkItem({ item, isActive, itemStatus, setActiveItem, getStatusColor, vendorCount = 0 }: WorkItemProps) {
  const statusColor = getStatusColor(itemStatus);
  return (
    <div
            key={item.id}
            onClick={() => setActiveItem(item)}
            className={`p-3 rounded-xl border transition-all cursor-pointer group ${
              isActive
                ? `${statusColor} border-blue-300 shadow-sm ring-1 ring-blue-300`
                : `${statusColor} border-slate-200 hover:border-slate-300 hover:shadow-sm`
            }`}
          >
            <div className="text-xs text-slate-500 font-medium mb-1">{item.division}</div>
            <div className="font-semibold text-sm text-slate-900 flex justify-between items-start">
              {item.section}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded px-1.5 py-0.5">
                  <Users size={14} className="text-blue-400 mr-1" />
                  <span className="text-xs font-bold text-blue-700">{vendorCount}</span>
                </div>
                <ChevronRight size={16} className={`transition-transform ${isActive ? 'text-blue-500 translate-x-1' : 'text-slate-300 group-hover:text-slate-400'}`} />
              </div>
            </div>
            <div className={`mt-3 text-xs inline-flex px-2 py-1 rounded-md border font-medium ${statusColor} border-slate-200`}>
              {itemStatus}
            </div>
          </div>
  )
}

export default WorkItem