import { useDroppable } from '@dnd-kit/core';
import { Award } from 'lucide-react';
import type { Assignment } from '../types';
import AssignedCard from './AssignedCard';
import EmptyDropZone from './EmptyDropZone';

export default function CarriedDropZone({ activeAssignments, removeSub }: { activeAssignments: Assignment, removeSub: (zone: 'carried' | 'backup' | 'review', subId: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'carried' });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 border-2 border-dashed rounded-xl p-4 min-h-35 transition-all flex flex-col ${
        isOver ? 'border-emerald-400 bg-emerald-50 scale-[1.02]' :
        activeAssignments.carried.length > 0 ? 'border-emerald-300 bg-emerald-50/50' :
        'border-slate-300 bg-slate-100 hover:border-slate-400'
      }`}
    >
      {activeAssignments.carried.map((sub) => (
        <AssignedCard key={sub.id} sub={sub} onRemove={() => removeSub('carried', sub.id)} type="carried" />
      ))}
      {activeAssignments.carried.length < 1 && (
        <EmptyDropZone text="Drag your primary choice here" icon={<Award size={24} className="text-slate-400 mb-2" />} />
      )}
    </div>
  );
}
