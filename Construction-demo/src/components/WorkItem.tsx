/**
 * @fileoverview Work item card component for displaying individual scope items.
 * 
 * Renders a clickable card showing work item details including section code,
 * name, status, and assigned vendor count. Visual styling indicates active state.
 * 
 * @module components/WorkItem
 */

import { ChevronRight, Users } from "lucide-react";
import type { WorkItem as WorkItemType } from '../types';

/**
 * Props for the WorkItem component.
 * @interface WorkItemProps
 */
interface WorkItemProps {
  /** The work item data to display */
  item: WorkItemType;
  /** Whether this work item is currently selected/active */
  isActive: boolean;
  /** Current status string for display */
  itemStatus: string;
  /** Callback to set this item as active */
  setActiveItem: (item: WorkItemType) => void;
  /** Function to map status strings to Tailwind color classes */
  getStatusColor: (status: string) => string;
  /** Number of vendors assigned to this work item (default: 0) */
  vendorCount?: number;
}

/**
 * A clickable card component representing a single work item.
 * Shows section code, name, vendor count, and status badge.
 * Highlights when active and provides hover feedback.
 * 
 * @param {WorkItemProps} props - Component props
 * @returns {JSX.Element} Rendered work item card
 */
function WorkItem({ item, isActive, itemStatus, setActiveItem, getStatusColor, vendorCount = 0 }: WorkItemProps) {
  // Get Tailwind color classes based on status
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
            <div className="text-xs text-slate-500 font-medium mb-1">{item.sectionCode}</div>
            <div className="font-semibold text-sm text-slate-900 flex justify-between items-start">
              {item.sectionName}
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