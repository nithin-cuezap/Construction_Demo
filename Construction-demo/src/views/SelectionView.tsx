import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AssignedCard from '../components/AssignedCard';
import DraggableSubcontractorCard from '../components/DraggableSubcontractorCard';
import ShortlistReviewPane from '../components/ShortlistReviewPane';
import VendorDatabasePane from '../components/VendorDatabasePane';
import WorkItemsPane from '../components/WorkItemsPane';
import {
  addSelectionReviewSub,
  addSelectionReviewSubAt,
  addWorkItem,
  areAllWorkItemsShortlistingCompleted,
  getAssignmentsByItemId,
  getSelectionFilteredSubs,
  getSelectionViewData,
  persistSelectionData,
  persistWorkItems,
  removeSelectionReviewSub,
  reorderSelectionReviewSub,
  setWorkItemStatus,
  setWorkItemStatuses,
} from '../Selection.ops';
import type { Assignment, AwardingDataState, SelectionDataState, Subcontractor, WorkItem } from '../types';

interface SelectionViewProps {
  tenderPackageId: string;
  onShortlistingCompletionChange?: (isComplete: boolean) => void;
}

export default function SelectionView({ tenderPackageId, onShortlistingCompletionChange }: SelectionViewProps) {
  const [initialSelectionViewData] = useState(() => getSelectionViewData(tenderPackageId));
  const [workItems, setWorkItems] = useState<WorkItem[]>(initialSelectionViewData.workItems);
  const [selectionData, setSelectionData] = useState<SelectionDataState>(initialSelectionViewData.selectionData);
  const [awardingData] = useState<AwardingDataState>(initialSelectionViewData.awardingData);
  const [activeItemId, setActiveItemId] = useState<string>(initialSelectionViewData.workItems[0]?.id ?? '');
  const subcontractors = useMemo(() => initialSelectionViewData.subcontractors, [initialSelectionViewData]);
  const [draggedSubId, setDraggedSubId] = useState<string | null>(null);
  const [draggedSubSource, setDraggedSubSource] = useState<'database' | 'review' | null>(null);
  const [vendorOrder, setVendorOrder] = useState<string[]>(() => initialSelectionViewData.subcontractors.map((sub) => sub.id));

  const updateWorkItems = (next: WorkItem[]) => {
    setWorkItems(next);
    persistWorkItems(tenderPackageId, next);
  };

  useEffect(() => {
    onShortlistingCompletionChange?.(areAllWorkItemsShortlistingCompleted(workItems));
  }, [onShortlistingCompletionChange, workItems]);

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
  const orderedFilteredSubs = useMemo(() => {
    const orderIndex = new Map(vendorOrder.map((id, index) => [id, index]));
    return [...filteredSubs].sort((left, right) => (orderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (orderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER));
  }, [filteredSubs, vendorOrder]);

  const getVendorById = (subId: string): Subcontractor | undefined =>
    subcontractors.find((sub) => sub.id === subId);

  const reorderIds = (ids: string[], activeId: string, overId: string) => {
    const fromIndex = ids.indexOf(activeId);
    const toIndex = ids.indexOf(overId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return ids;

    const next = [...ids];
    const [movedId] = next.splice(fromIndex, 1);
    const targetIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    next.splice(targetIndex, 0, movedId);
    return next;
  };

  const handleSelectItem = (item: WorkItem) => {
    setActiveItemId(item.id);
  };

  const handleRemoveSub = (zone: 'carried' | 'backup' | 'review', subId: string) => {
    if (zone !== 'review') return;
    const itemId = activeItem.id;
    const next = removeSelectionReviewSub(selectionData, itemId, subId);
    const nextReview = next.reviewByItemId[itemId] ?? [];
    updateSelectionData(next);
    handleShortlistChanged(itemId, nextReview.length);
  };

  const handleSetWorkItemStatus = (itemId: string, status: string) => {
    updateWorkItems(setWorkItemStatus(workItems, itemId, status));
  };

  const handleSetWorkItemStatuses = (updates: Array<{ id: string; status: string }>) => {
    updateWorkItems(setWorkItemStatuses(workItems, updates));
  };

  const handleShortlistChanged = (itemId: string, nextReviewCount: number) => {
    const currentStatus = workItems.find((item) => item.id === itemId)?.status;
    if (!currentStatus) return;

    if (currentStatus === 'Shortlisting Completed') {
      handleSetWorkItemStatus(itemId, 'Shortlisting In-Progress');
      return;
    }

    if (nextReviewCount === 0) {
      handleSetWorkItemStatus(itemId, 'Draft');
      return;
    }

    if (currentStatus === 'Draft') {
      handleSetWorkItemStatus(itemId, 'Shortlisting In-Progress');
    }
  };

  const handleAddWorkItem = (sectionCode: string, sectionName: string, description: string): string | null => {
    const result = addWorkItem(
      workItems,
      tenderPackageId,
      sectionCode,
      sectionName,
      description,
    );
    if (!result) return null;
    updateWorkItems(result.workItems);
    setActiveItemId(result.createdItemId);
    return result.createdItemId;
  };

  const handleUpdateWorkItem = (itemId: string, sectionCode: string, sectionName: string, description: string) => {
    const normalizedSectionCode = sectionCode.trim();
    const normalizedSectionName = sectionName.trim();
    const normalizedDescription = description.trim();
    if (!normalizedSectionCode || !normalizedSectionName || !normalizedDescription) return;

    updateWorkItems(
      workItems.map((item) =>
        item.id === itemId
          ? { ...item, sectionCode: normalizedSectionCode, sectionName: normalizedSectionName, description: normalizedDescription }
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
    ? [...orderedFilteredSubs, ...activeAssignments.review].find((sub) => sub.id === draggedSubId) ?? getVendorById(draggedSubId) ?? null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedSubId(String(event.active.id));
    setDraggedSubSource((event.active.data.current?.listType as 'database' | 'review' | undefined) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedSubId(null);
    setDraggedSubSource(null);

    const { over, active } = event;
    if (!over) return;

    const activeType = active.data.current?.listType as 'database' | 'review' | undefined;
    const overType = over.data.current?.listType as 'database' | 'review' | 'review-zone' | undefined;
    const draggedId = String(active.id);
    const overId = String(over.id);

    if (activeType === 'review' && overType === 'review') {
      const next = reorderSelectionReviewSub(selectionData, activeItem.id, draggedId, overId);
      if (!next) return;
      updateSelectionData(next);
      const nextReview = next.reviewByItemId[activeItem.id] ?? [];
      handleShortlistChanged(activeItem.id, nextReview.length);
      return;
    }

    if (activeType === 'database' && overType === 'database') {
      setVendorOrder((current) => reorderIds(current, draggedId, overId));
      return;
    }

    if (activeType !== 'database') return;

    const draggedSub = getVendorById(draggedId);
    if (!draggedSub) return;

    const alreadyInReview = activeAssignments.review.some((sub) => sub.id === draggedSub.id);
    if (alreadyInReview) return;

    const nextReviewIndex = activeAssignments.review.findIndex((sub) => sub.id === overId);
    const nextSelectionData =
      overType === 'review' && nextReviewIndex !== -1
        ? addSelectionReviewSubAt(selectionData, activeItem.id, draggedSub, nextReviewIndex)
        : addSelectionReviewSub(selectionData, activeItem.id, draggedSub);

    if (!nextSelectionData) return;

    updateSelectionData(nextSelectionData);
    const nextReview = nextSelectionData.reviewByItemId[activeItem.id] ?? [];
    handleShortlistChanged(activeItem.id, nextReview.length);
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
        <div className="flex w-full min-w-0 flex-col lg:w-1/2">
          <div className="border-l border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500 xl:text-sm">
              <span>{activeItem.sectionCode}</span>
              <ChevronRight size={14} />
              <span className="text-slate-900">{activeItem.sectionName}</span>
            </div>
            <p className="text-xs text-slate-500 xl:text-sm">Drag vendors from the database into the review list.</p>
          </div>
          <div className="flex min-h-0 w-full flex-col lg:flex-1 lg:flex-row">
            <VendorDatabasePane filteredSubs={orderedFilteredSubs} />
            <ShortlistReviewPane
              activeItem={activeItem}
              activeAssignments={activeAssignments}
              removeSub={handleRemoveSub}
              setWorkItemStatus={handleSetWorkItemStatus}
            />
          </div>
        </div>
      </div>
      <DragOverlay>
        {draggedSub ? (
          draggedSubSource === 'review' ? (
            <AssignedCard sub={draggedSub} onRemove={() => undefined} type="review" hideRemove />
          ) : (
            <DraggableSubcontractorCard sub={draggedSub} />
          )
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
