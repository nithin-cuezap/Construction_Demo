import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import DraggableSubcontractorCard from '../components/DraggableSubcontractorCard';
import ShortlistReviewPane from '../components/ShortlistReviewPane';
import VendorDatabasePane from '../components/VendorDatabasePane';
import WorkItemsPane from '../components/WorkItemsPane';
import {
  addSelectionReviewSub,
  addWorkItem,
  getAssignmentsByItemId,
  getSelectionFilteredSubs,
  getSelectionViewData,
  persistSelectionData,
  persistWorkItems,
  removeSelectionReviewSub,
  setWorkItemStatus,
  setWorkItemStatuses,
} from '../Selection.ops';
import type { Assignment, AwardingDataState, SelectionDataState, WorkItem } from '../types';

export default function SelectionView() {
  const [initialSelectionViewData] = useState(() => getSelectionViewData());
  const [workItems, setWorkItems] = useState<WorkItem[]>(initialSelectionViewData.workItems);
  const [selectionData, setSelectionData] = useState<SelectionDataState>(initialSelectionViewData.selectionData);
  const [awardingData] = useState<AwardingDataState>(initialSelectionViewData.awardingData);
  const [activeItemId, setActiveItemId] = useState<string>(initialSelectionViewData.workItems[0]?.id ?? '');
  const subcontractors = useMemo(() => initialSelectionViewData.subcontractors, [initialSelectionViewData]);
  const [draggedSubId, setDraggedSubId] = useState<string | null>(null);

  const updateWorkItems = (next: WorkItem[]) => {
    setWorkItems(next);
    persistWorkItems(next);
  };

  const updateSelectionData = (next: SelectionDataState) => {
    setSelectionData(next);
    persistSelectionData(next);
  };

  const activeItem = workItems.find((item) => item.id === activeItemId) ?? workItems[0];
  const assignmentsByItemId = getAssignmentsByItemId(workItems, selectionData, awardingData);
  const activeAssignments: Assignment =
    assignmentsByItemId[activeItem?.id] ?? { carried: [], backups: [], review: [] };
  const assignedIds = new Set([
    ...activeAssignments.carried.map((s) => s.id),
    ...activeAssignments.backups.map((s) => s.id),
    ...activeAssignments.review.map((s) => s.id),
  ]);
  const filteredSubs = getSelectionFilteredSubs(subcontractors, activeItem, assignedIds);

  const handleSelectItem = (item: WorkItem) => {
    setActiveItemId(item.id);
  };

  const handleAddReviewSub = (sub: Assignment['review'][number]) => {
    const next = addSelectionReviewSub(selectionData, activeItem.id, sub);
    if (!next) return;
    updateSelectionData(next);
  };

  const handleRemoveSub = (zone: 'carried' | 'backup' | 'review', subId: string) => {
    if (zone !== 'review') return;
    const itemId = activeItem.id;
    const next = removeSelectionReviewSub(selectionData, itemId, subId);
    const nextReview = next.reviewByItemId[itemId] ?? [];
    updateSelectionData(next);
    updateWorkItems(
      setWorkItemStatus(workItems, itemId, nextReview.length === 0 ? 'Draft' : 'Shortlisting In-Progress'),
    );
  };

  const handleSetWorkItemStatus = (itemId: string, status: string) => {
    updateWorkItems(setWorkItemStatus(workItems, itemId, status));
  };

  const handleSetWorkItemStatuses = (updates: Array<{ id: string; status: string }>) => {
    updateWorkItems(setWorkItemStatuses(workItems, updates));
  };

  const handleAddWorkItem = (section: string, description: string): string | null => {
    const result = addWorkItem(workItems, section, description);
    if (!result) return null;
    updateWorkItems(result.workItems);
    setActiveItemId(result.createdItemId);
    return result.createdItemId;
  };

  const handleUpdateWorkItem = (itemId: string, section: string, description: string) => {
    const normalizedSection = section.trim();
    const normalizedDescription = description.trim();
    if (!normalizedSection || !normalizedDescription) return;

    updateWorkItems(
      workItems.map((item) =>
        item.id === itemId
          ? { ...item, division: normalizedSection, section: normalizedDescription }
          : item,
      ),
    );
  };

  const handleDeleteWorkItem = (itemId: string) => {
    if (workItems.length <= 1) return;

    const nextWorkItems = workItems.filter((item) => item.id !== itemId);
    updateWorkItems(nextWorkItems);

    if (activeItemId === itemId) {
      setActiveItemId(nextWorkItems[0]?.id ?? '');
    }

    const { [itemId]: _removedReview, ...restReviewByItemId } = selectionData.reviewByItemId;
    void _removedReview;
    updateSelectionData({
      ...selectionData,
      reviewByItemId: restReviewByItemId,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Shortlisting In-Progress':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Shortlisting Completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
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

  const draggedSub = draggedSubId
    ? filteredSubs.find((sub) => sub.id === draggedSubId) ?? null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedSubId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedSubId(null);

    const { over, active } = event;
    if (!over || over.id !== 'review') return;

    const draggedId = String(active.id);
    const draggedSub = filteredSubs.find((sub) => sub.id === draggedId);
    if (!draggedSub) return;

    const alreadyInReview = activeAssignments.review.some((sub) => sub.id === draggedSub.id);
    if (alreadyInReview) return;

    handleAddReviewSub(draggedSub);

    if (activeItem.status === 'Draft') {
      handleSetWorkItemStatus(activeItem.id, 'Shortlisting In-Progress');
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full w-full min-w-0 flex-col lg:flex-row">
        <WorkItemsPane
          workItems={workItems}
          activeItem={activeItem}
          setActiveItem={handleSelectItem}
          getStatusColor={getStatusColor}
          setWorkItemStatuses={handleSetWorkItemStatuses}
          assignments={assignmentsByItemId}
          onAddWorkItem={handleAddWorkItem}
          onUpdateWorkItem={handleUpdateWorkItem}
          onDeleteWorkItem={handleDeleteWorkItem}
        />
        <VendorDatabasePane filteredSubs={filteredSubs} />
        <ShortlistReviewPane
          activeItem={activeItem}
          activeAssignments={activeAssignments}
          removeSub={handleRemoveSub}
          setWorkItemStatus={handleSetWorkItemStatus}
        />
      </div>
      <DragOverlay>
        {draggedSub ? <DraggableSubcontractorCard sub={draggedSub} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
