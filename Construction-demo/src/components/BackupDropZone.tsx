import { useDroppable } from '@dnd-kit/core';
import { Shield } from 'lucide-react';
import type { Assignment } from '../types';
import AssignedCard from './AssignedCard';
import EmptyDropZone from './EmptyDropZone';

export default function BackupDropZone({ activeAssignments, removeSub }: { activeAssignments: Assignment, removeSub: (zone: 'carried' | 'backup' | 'review', subId: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'backup' });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 border-2 border-dashed rounded-xl p-4 min-h-35 transition-all flex flex-col gap-3 ${
        isOver ? 'border-amber-400 bg-amber-50 scale-[1.02]' :
        'border-slate-300 bg-slate-100 hover:border-slate-400'
      }`}
    >
      {activeAssignments.backups.map((sub: import('../types').Subcontractor) => (
        <AssignedCard key={sub.id} sub={sub} onRemove={() => removeSub('backup', sub.id)} type="backup" />
      ))}
      {activeAssignments.backups.length < 2 && (
        <EmptyDropZone text={`Drag backup choice${activeAssignments.backups.length === 1 ? ' 2' : 's'} here`} icon={<Shield size={24} className="text-slate-400 mb-2" />} small />
      )}
    </div>
  );
}
