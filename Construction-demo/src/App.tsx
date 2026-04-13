import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import AwardingCenterPane from './components/AwardingCenterPane';
import AwardingLeftPane from './components/AwardingLeftPane';
import Button from './components/Button';
import DraggableSubcontractorCard from './components/DraggableSubcontractorCard';
import Header from './components/Header';
import ShortlistCenterPane from './components/ShortlistCenterPane';
import ShortlistLeftPane from './components/ShortlistLeftPane';
import ShortlistRightPane from './components/ShortlistRightPane';
import type { Assignment, Subcontractor, WorkItem } from './types';

// --- MOCK DATA ---
const MOCK_WORK_ITEMS: WorkItem[] = [
  { id: 'wi-1', division: '03 Concrete', section: '03 30 00 Cast-in-Place', status: 'Draft' },
  { id: 'wi-2', division: '09 Finishes', section: '09 22 00 Metal Supports', status: 'Draft' },
  { id: 'wi-3', division: '09 Finishes', section: '09 90 00 Painting', status: 'Draft' },
  { id: 'wi-4', division: '26 Electrical', section: '26 05 00 Common Work Results', status: 'Draft' },
];

const MOCK_SUBCONTRACTORS: Subcontractor[] = [
  { id: 'sub-1', name: 'Apex Concrete Works', trade: '03 Concrete', rating: 4.8, projects: 24, responseSpeed: 'Fast' },
  { id: 'sub-2', name: 'Solid Foundations Ltd.', trade: '03 Concrete', rating: 4.2, projects: 12, responseSpeed: 'Average' },
  { id: 'sub-3', name: 'City Pours', trade: '03 Concrete', rating: 3.9, projects: 8, responseSpeed: 'Slow' },
  { id: 'sub-4', name: 'Prime Painters', trade: '09 Finishes', rating: 5.0, projects: 41, responseSpeed: 'Fast' },
  { id: 'sub-5', name: 'Elite Drywall & Framing', trade: '09 Finishes', rating: 4.5, projects: 19, responseSpeed: 'Fast' },
  { id: 'sub-6', name: 'ProCoat Finishes', trade: '09 Finishes', rating: 4.1, projects: 15, responseSpeed: 'Average' },
  { id: 'sub-7', name: 'Volt Masters', trade: '26 Electrical', rating: 4.9, projects: 33, responseSpeed: 'Fast' },
];


const WORKFLOW_STAGES = ['Selection', 'Invitation', 'Awarding'] as const;

type Assignments = {
  [key: string]: Assignment;
};

export default function App() {
  const [workItems, setWorkItems] = useState<typeof MOCK_WORK_ITEMS>([]);
  const [activeItem, setActiveItem] = useState(MOCK_WORK_ITEMS[0]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [draggedSub, setDraggedSub] = useState<Subcontractor | null>(null);
  const [workflowStage, setWorkflowStage] = useState<typeof WORKFLOW_STAGES[number]>(WORKFLOW_STAGES[0]);

  // --- DND-KIT HANDLERS ---
  const handleDragStart = (event: DragStartEvent) => {
    const sub = MOCK_SUBCONTRACTORS.find(s => s.id === event.active.id);
    if (sub) setDraggedSub(sub);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    setDraggedSub(null);
    if (!over || !draggedSub) return;

    // over.id will be like 'carried', 'backup', or 'review'
    const zone = over.id as 'carried' | 'backup' | 'review';
    setAssignments(prev => {
      const currentItemAssignments: Assignment = prev[activeItem.id] || { carried: [], backups: [], review: [] };
      // Prevent duplicates in the same view
      const isAlreadyAssigned =
        currentItemAssignments.carried.some((c: Subcontractor) => c.id === draggedSub.id) ||
        currentItemAssignments.backups.some((b: Subcontractor) => b.id === draggedSub.id) ||
        currentItemAssignments.review.some((r: Subcontractor) => r.id === draggedSub.id);

      if (isAlreadyAssigned) return prev;

      const newAssignments: Assignment = { ...currentItemAssignments };

      if (zone === 'carried') {
        if (newAssignments.carried.length < 1) {
          newAssignments.carried = [...newAssignments.carried, draggedSub];
        } else {
          return prev;
        }
      } else if (zone === 'backup') {
        if (newAssignments.backups.length < 2) {
          newAssignments.backups = [...newAssignments.backups, draggedSub];
        } else {
          return prev;
        }
      } else if (zone === 'review') {
        newAssignments.review = [...newAssignments.review, draggedSub];
        if(activeItem.status !== 'Shortlisting In-Progress') {
          setWorkItemStatus(activeItem.id, 'Shortlisting In-Progress');
        }
      }

      return { ...prev, [activeItem.id]: newAssignments };
    });
  };


  const removeSub = (zone: 'carried' | 'backup' | 'review', subId: string) => {
    setAssignments(prev => {
      const current: Assignment = prev[activeItem.id];
      if (!current) return prev;

      const updated: Assignment = { ...current };
      if (zone === 'carried') updated.carried = updated.carried.filter((c: Subcontractor) => c.id !== subId);
      if (zone === 'backup') updated.backups = updated.backups.filter((b: Subcontractor) => b.id !== subId);
      if (zone === 'review') {
        updated.review = updated.review.filter((r: Subcontractor) => r.id !== subId);
        if (updated.review.length === 0) {
          setWorkItemStatus(activeItem.id, 'Draft');
        }
        else {
          setWorkItemStatus(activeItem.id, 'Shortlisting In-Progress');
        }
      }

      return { ...prev, [activeItem.id]: updated };
    });
  };


  useEffect(() => {
    // Simulate fetching work items from an API
    setTimeout(() => setWorkItems(MOCK_WORK_ITEMS), 500);
  }, []);


  const setWorkItemStatus = (itemId: string, status: string) => {
    setWorkItems(prev =>
      prev.map(item => (item.id === itemId && item.status !== status) ? { ...item, status } : item)
    );
    setActiveItem(prev => (prev.id === itemId && prev.status !== status) ? { ...prev, status } : prev);
  }

  const advanceWorkflow = () => {
    const currentWorkFlowIndex = WORKFLOW_STAGES.indexOf(workflowStage);
    // validate that we can only advance if the current stage's requirements are met
    // Use API or internal logic to check if requirements are met before allowing advancement
    if(currentWorkFlowIndex < WORKFLOW_STAGES.length - 1) {
      setWorkflowStage(WORKFLOW_STAGES[currentWorkFlowIndex + 1]);
    }
  }

  const regressWorkflow = () => {
    const currentWorkFlowIndex = WORKFLOW_STAGES.indexOf(workflowStage);
    if(currentWorkFlowIndex > 0) {
      setWorkflowStage(WORKFLOW_STAGES[currentWorkFlowIndex - 1]);
    }
  }

  // --- RENDER HELPERS ---
  const activeAssignments: Assignment = assignments[activeItem.id] || { carried: [], backups: [], review: [] };
  // Get all assigned subcontractor IDs for the active item
  const assignedIds = new Set([
    ...activeAssignments.carried.map(c => c.id),
    ...activeAssignments.backups.map(b => b.id),
    ...activeAssignments.review.map(r => r.id)
  ]);

  // Only show unassigned vendors in the right pane
  const filteredSubs = MOCK_SUBCONTRACTORS.filter(
    (sub) => {
      if (sub.trade === activeItem.division && !assignedIds.has(sub.id)) {
        return true;
      }
      return false;
    }
  );

  // For Awarding stage: show ALL shortlisted/in-review subs across ALL work items
  // Exclude any subs already assigned as carried or backups in ANY work item
  const awardingLeftSubs = (() => {
    const all = Object.values(assignments);
    const reviewIds = new Set<string>();
    const assignedEverywhere = new Set<string>();

    all.forEach((a) => {
      a.review.forEach((s) => reviewIds.add(s.id));
      a.carried.forEach((c) => assignedEverywhere.add(c.id));
      a.backups.forEach((b) => assignedEverywhere.add(b.id));
    });

    return Array.from(reviewIds)
      .filter((id) => !assignedEverywhere.has(id))
      .map((id) => MOCK_SUBCONTRACTORS.find((s) => s.id === id))
      .filter((s): s is Subcontractor => Boolean(s));
  })();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200'; // gray
      case 'Shortlisting In-Progress':
        return 'bg-orange-100 text-orange-700 border-orange-200'; // orange
      case 'Shortlisting Completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'; // green
      case 'Invited':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Bids Received':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Awarded':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {workflowStage === 'Selection' && (<>
          <ShortlistLeftPane
            workItems={workItems}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
            getStatusColor={getStatusColor}
            setWorkItemStatus={setWorkItemStatus}
            assignments={assignments}
          />
          <ShortlistCenterPane
            activeItem={activeItem}
            activeAssignments={activeAssignments}
            removeSub={removeSub}
            setWorkItemStatus={setWorkItemStatus}
            advanceWorkflow={advanceWorkflow}
            regressWorkflow={regressWorkflow}
          />
          <ShortlistRightPane
            filteredSubs={filteredSubs}
          />
          </>)}
          {workflowStage === 'Awarding' && (<>
            <AwardingLeftPane
              filteredSubs={awardingLeftSubs}
            />
          <AwardingCenterPane
            activeItem={activeItem}
            activeAssignments={activeAssignments}
            removeSub={removeSub}
            advanceWorkflow={advanceWorkflow}
            regressWorkflow={regressWorkflow}
          />
          </>)}
          {workflowStage === 'Invitation' && (
            <div className="flex-1 flex flex-col gap-5 items-center justify-center">
              <p>Invitation screen Mock up</p>
              <div className="flex gap-3">
                        <Button variant="outline"  className='flex items-center gap-2' onClick={regressWorkflow}>
                          <ChevronLeft size={16} />Back to Shortlisting
                        </Button>
                        
              <Button variant="secondary" className="flex items-center gap-2" onClick={advanceWorkflow}>
                Send Bid Invitations <ChevronRight size={16} />
              </Button>
                      </div>
          </div>
          )}
        </div>
        <DragOverlay>
          {draggedSub ? (
            <DraggableSubcontractorCard sub={draggedSub} />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}