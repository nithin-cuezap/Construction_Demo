import AwardingCenterPane from '../components/AwardingCenterPane';
import AwardingLeftPane from '../components/AwardingLeftPane';
import type { Assignment, WorkItem } from '../types';

interface AwardingViewProps {
  activeItem: WorkItem;
  activeAssignments: Assignment;
  filteredSubs: Assignment['review'];
  onRemoveSub: (zone: 'carried' | 'backup' | 'review', subId: string) => void;
  onBack: () => void;
}

export default function AwardingView({
  activeItem,
  activeAssignments,
  filteredSubs,
  onRemoveSub,
  onBack,
}: AwardingViewProps) {
  return (
    <>
      <AwardingLeftPane filteredSubs={filteredSubs} />
      <AwardingCenterPane
        activeItem={activeItem}
        activeAssignments={activeAssignments}
        removeSub={onRemoveSub}
        advanceWorkflow={() => undefined}
        regressWorkflow={onBack}
      />
    </>
  );
}
