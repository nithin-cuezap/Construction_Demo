/**
 * @fileoverview Draggable card component for subcontractors in the vendor database.
 * 
 * Displays subcontractor information with drag-and-drop functionality using @dnd-kit.
 * Can be dragged from the vendor database to review lists. Shows visual feedback
 * when selected elsewhere and during drag operations.
 * 
 * @module components/DraggableSubcontractorCard
 */

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { GripVertical, Star } from 'lucide-react';
import type { Subcontractor } from '../types';

/**
 * Props for the DraggableSubcontractorCard component.
 * @interface DraggableSubcontractorCardProps
 */
interface DraggableSubcontractorCardProps {
  /** The subcontractor data to display */
  sub: Subcontractor;
  /** Whether this subcontractor is already selected in another work item */
  isSelectedElsewhere?: boolean;
}

/**
 * A draggable card displaying subcontractor information from the vendor database.
 * Supports drag-and-drop for adding subcontractors to work item review lists.
 * Shows amber accent when the subcontractor is already selected elsewhere.
 * 
 * @param {DraggableSubcontractorCardProps} props - Component props
 * @returns {JSX.Element} Rendered draggable subcontractor card
 */
export default function DraggableSubcontractorCard({ sub, isSelectedElsewhere = false }: DraggableSubcontractorCardProps) {
  // Setup draggable functionality
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({
    id: sub.id,
    data: { listType: 'database', itemId: sub.id },
  });
  
  // Setup droppable functionality for reordering
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: sub.id,
    data: { listType: 'database', itemId: sub.id },
  });

  // Combine both refs into one to support both drag and drop on the same element
  const setNodeRef = (node: HTMLDivElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  // Visual indicator: amber if selected elsewhere, default slate/blue otherwise
  const leftBorderColor = isSelectedElsewhere 
    ? 'bg-amber-400 group-hover:bg-amber-500' 
    : 'bg-slate-200 group-hover:bg-blue-400';

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      {...listeners}
      {...attributes}
      className={`bg-white border rounded-xl p-4 cursor-grab hover:shadow-md hover:-translate-y-0.5 transition-all active:cursor-grabbing group relative overflow-hidden ${isOver ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-400'}`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${leftBorderColor} transition-colors`}></div>
      <div className="flex justify-between items-start pl-2">
        <div className="font-semibold text-sm text-slate-900 leading-tight pr-4">{sub.name}</div>
        <GripVertical size={16} className="text-slate-300 group-hover:text-slate-500 shrink-0 cursor-grab" />
      </div>
      <div className="flex gap-4 items-center mt-3 pl-2">
        <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
          <Star size={12} fill="currentColor" /> {sub.rating}
        </div>
        <div className="text-xs text-slate-500 font-medium">{sub.projects} Past Projects</div>
      </div>
    </div>
  );
}
