import { Award, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import type { Assignment } from '../types';
import BackupDropZone from './BackupDropZone';
import Button from './Button';
import CarriedDropZone from './CarriedDropZone';

interface AwardingCenterPaneProps {
  activeItem: { division: string; section: string };
  activeAssignments: Assignment;
  removeSub: (zone: 'carried' | 'backup' | 'review', subId: string) => void;
  advanceWorkflow: () => void;
  regressWorkflow: () => void;
}

export default function AwardingCenterPane({ activeItem, activeAssignments, removeSub, advanceWorkflow, regressWorkflow }: AwardingCenterPaneProps) {
  return (
    <main className="flex-1 flex flex-col bg-white min-w-125">
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
          <span>{activeItem.division}</span>
          <ChevronRight size={14} />
          <span className="text-slate-900">{activeItem.section}</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Subcontractor Selection</h2>
        <p className="text-slate-500 mt-1 text-sm">Drag and drop vendors from the database to build your shortlist.</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Award size={16} className="text-emerald-500" />
                  Carried Vendor
                </h3>
                <span className="text-xs text-slate-500 font-medium">1 Required</span>
              </div>
              <CarriedDropZone activeAssignments={activeAssignments} removeSub={removeSub} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Shield size={16} className="text-amber-500" />
                  Backups
                </h3>
                <span className="text-xs text-slate-500 font-medium">{activeAssignments.backups.length} / 2 Allowed</span>
              </div>
              <BackupDropZone activeAssignments={activeAssignments} removeSub={removeSub} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)]">
        
         <div className="flex gap-3 justify-between w-full">
          <Button variant="outline" className='flex items-center gap-2' onClick={regressWorkflow}>
            <ChevronLeft size={16} /> Back to Invitations 
          </Button>
          <Button variant="secondary" className="flex items-center gap-2" onClick={advanceWorkflow}>
            Generate Work Package
          </Button>
        </div>
      </div>
    </main>
  );
}
