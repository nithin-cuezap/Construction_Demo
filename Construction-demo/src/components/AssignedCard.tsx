import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Building2, CheckCircle2, GripVertical, Star, Trash2 } from 'lucide-react';
import type { Subcontractor } from '../types';

interface AssignedCardProps {
  sub: Subcontractor;
  onRemove: () => void;
  type: 'carried' | 'backup' | 'review';
  sortable?: boolean;
  hideRemove?: boolean;
}

export default function AssignedCard({ sub, onRemove, type, sortable = false, hideRemove = false }: AssignedCardProps) {
  const isCarried = type === 'carried';
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({
    id: sub.id,
    data: { listType: 'review', itemId: sub.id },
    disabled: !sortable,
  });
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: sub.id,
    data: { listType: 'review', itemId: sub.id },
    disabled: !sortable,
  });

  const setNodeRef = (node: HTMLDivElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  return (
    <div className={`bg-white border rounded-xl p-3 flex justify-between items-center shadow-sm relative group transition-all ${
      isCarried ? 'border-emerald-200 ring-1 ring-emerald-50' : 'border-slate-200 hover:border-blue-300'
    } ${sortable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-60' : ''} ${isOver ? 'ring-2 ring-blue-200 border-blue-300' : ''}`}
      ref={setNodeRef}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isCarried ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
        }`}>
          {isCarried ? <CheckCircle2 size={18} /> : <Building2 size={16} className="opacity-70" />}
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">{sub.name}</div>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="text-xs font-semibold text-amber-500 flex items-center gap-0.5">
              <Star size={10} fill="currentColor" /> {sub.rating}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {sub.responseSpeed} Responder
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {sortable && (
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
            {...listeners}
            {...attributes}
          >
            <GripVertical size={16} className="shrink-0" />
          </button>
        )}
        {!hideRemove && (
          <button
            type="button"
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all outline-none"
            title="Remove vendor"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
