import { AlertCircle } from 'lucide-react';
import type { Subcontractor } from '../types';
import DraggableSubcontractorCard from './DraggableSubcontractorCard';

interface AwardingLeftPaneProps {
  filteredSubs: Subcontractor[];
}

export default function AwardingLeftPane({ filteredSubs }: AwardingLeftPaneProps) {
  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-slate-800">Vendors who submitted Bid</h2>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-bold">Auto-filtered</span>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search vendors..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>
      <div className="overflow-y-auto flex-1 p-3 space-y-3 bg-slate-50/50">
        {filteredSubs.map(sub => (
          <DraggableSubcontractorCard key={sub.id} sub={sub} />
        ))}
        {filteredSubs.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <AlertCircle size={32} className="text-slate-300 mb-3" />
            <p className="text-sm font-medium">No vendors found</p>
            <p className="text-xs mt-1">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
