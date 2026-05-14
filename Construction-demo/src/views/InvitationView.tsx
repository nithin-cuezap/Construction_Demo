import { ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import Button from '../components/Button';
import type { InvitationDataState, WorkItem } from '../types';

interface InvitationViewProps {
  workItems: WorkItem[];
  activeItem: WorkItem;
  invitationState: InvitationDataState;
  onUpdateNote: (itemId: string, note: string) => void;
  onSendInvites: () => void;
  onBack: () => void;
  onNext: () => void;
}

export default function InvitationView({
  workItems,
  activeItem,
  invitationState,
  onUpdateNote,
  onSendInvites,
  onBack,
  onNext,
}: InvitationViewProps) {
  const completedItemIds = workItems
    .filter((item) => item.status === 'Shortlisting Completed' || item.status === 'Invited')
    .map((item) => item.id);

  const sentCount = invitationState.sentItemIds.length;
  const note = invitationState.notesByItemId[activeItem.id] ?? '';

  return (
    <main className="flex-1 flex items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Mail size={16} className="text-blue-500" />
          Invitation Draft
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Bid Invitation Workspace</h2>
        <p className="text-sm text-slate-600 mb-6">
          Maintain invitation draft data independently from Selection and Awarding state.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Ready To Invite</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{completedItemIds.length}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Invitations Sent</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{sentCount}</p>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="invite-note">
          Internal note for {activeItem.sectionCode} {activeItem.sectionName}
        </label>
        <textarea
          id="invite-note"
          value={note}
          onChange={(event) => onUpdateNote(activeItem.id, event.target.value)}
          className="w-full h-28 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add instructions for the invitation package..."
        />

        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" className="flex items-center gap-2" onClick={onBack}>
            <ChevronLeft size={16} /> Back to Shortlisting
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onSendInvites} disabled={completedItemIds.length === 0}>
              Send Bid Invitations
            </Button>
            <Button variant="primary" className="flex items-center gap-2" onClick={onNext}>
              Move to Awarding <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
