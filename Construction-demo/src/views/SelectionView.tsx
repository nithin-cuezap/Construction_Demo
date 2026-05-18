/**
 * @fileoverview View component for the contractor shortlisting workflow stage.
 * 
 * This is one of the most complex views in the application. It provides a drag-and-drop
 * interface for managing work items and assigning subcontractors to review lists.
 * The view is divided into three panes:
 * - Left: Work items list
 * - Center: Shortlist review pane with assigned subcontractors
 * - Right: Vendor database with draggable subcontractor cards
 * 
 * Uses @dnd-kit for drag-and-drop functionality and manages local state for real-time
 * updates before persisting to the database.
 * 
 * @module views/SelectionView
 */

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
  isAnyWorkItemInvitationSent,
  moveSelectionReviewSubToEnd,
  persistSelectionData,
  persistWorkItems,
  removeSelectionReviewSub,
  reorderSelectionReviewSub,
  setWorkItemStatus,
  setWorkItemStatuses,
} from '../Selection.ops';
import type { Assignment, AwardingDataState, SelectionDataState, Subcontractor, WorkItem } from '../types';

/**
 * Props for the SelectionView component.
 * @interface SelectionViewProps
 */
interface SelectionViewProps {
  /** ID of the tender package being worked on */
  tenderPackageId: string;
  /** Callback when shortlisting completion status changes */
  onShortlistingCompletionChange?: (isComplete: boolean) => void;
}

/**
 * Contractor shortlisting view with drag-and-drop interface.
 * Manages work items, subcontractor assignments, and review lists for a tender package.
 * 
 * @param {SelectionViewProps} props - Component props
 * @returns {JSX.Element} Rendered selection view with three-pane layout
 */
export default function SelectionView({ tenderPackageId, onShortlistingCompletionChange }: SelectionViewProps) {
  // Load initial data from database on mount
  const [initialSelectionViewData] = useState(() => getSelectionViewData(tenderPackageId));
  
  // Local state for real-time updates
  const [workItems, setWorkItems] = useState<WorkItem[]>(initialSelectionViewData.workItems);
  const [selectionData, setSelectionData] = useState<SelectionDataState>(initialSelectionViewData.selectionData);
  const [awardingData] = useState<AwardingDataState>(initialSelectionViewData.awardingData);
  const [activeItemId, setActiveItemId] = useState<string>(initialSelectionViewData.workItems[0]?.id ?? '');
  const subcontractors = useMemo(() => initialSelectionViewData.subcontractors, [initialSelectionViewData]);
  
  // Drag-and-drop state
  const [draggedSubId, setDraggedSubId] = useState<string | null>(null);
  const [draggedSubSource, setDraggedSubSource] = useState<'database' | 'review' | null>(null);
  const [vendorOrder, setVendorOrder] = useState<string[]>(() => initialSelectionViewData.subcontractors.map((sub) => sub.id));

  /**
   * Updates work items state and persists to database.
   * @param {WorkItem[]} next - The new work items array
   */
  const updateWorkItems = (next: WorkItem[]) => {
    setWorkItems(next);
    persistWorkItems(tenderPackageId, next);
  };

  // Notify parent when all work items complete shortlisting
  useEffect(() => {
    onShortlistingCompletionChange?.((areAllWorkItemsShortlistingCompleted(workItems) || isAnyWorkItemInvitationSent(workItems)));
  }, [onShortlistingCompletionChange, workItems]);

  /**
   * Updates selection data state and persists to database.
   * @param {SelectionDataState} next - The new selection data
   */
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

  const vendorsSelectedElsewhere = useMemo(() => {
    const selectedInOtherItems = new Set<string>();
    Object.entries(assignmentsByItemId).forEach(([itemId, assignments]) => {
      if (itemId !== activeItem?.id) {
        [...assignments.carried, ...assignments.backups, ...assignments.review].forEach((sub) => {
          selectedInOtherItems.add(sub.id);
        });
      }
    });
    return selectedInOtherItems;
  }, [assignmentsByItemId, activeItem?.id]);

  const getVendorById = (subId: string): Subcontractor | undefined =>
    subcontractors.find((sub) => sub.id === subId);

  const reorderIds = (ids: string[], activeId: string, overId: string) => {
    const fromIndex = ids.indexOf(activeId);
    const toIndex = ids.indexOf(overId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return ids;

    const next = [...ids];
    const [movedId] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, movedId);
    return next;
  };

  const isInvitedStatus = (status: WorkItem["status"]) => 
    status === 'Invited' || status === 'Invited - Partial';

  const handleSelectItem = (item: WorkItem) => {
    setActiveItemId(item.id);
  };

  const handleRemoveSub = (zone: 'carried' | 'backup' | 'review', subId: string) => {
    if (zone !== 'review') return;
    if (isInvitedStatus(activeItem.status)) return;
    const itemId = activeItem.id;
    const next = removeSelectionReviewSub(selectionData, itemId, subId);
    const nextReview = next.reviewByItemId[itemId] ?? [];
    updateSelectionData(next);
    handleShortlistChanged(itemId, nextReview.length);
  };

  const handleSetWorkItemStatus = (itemId: string, status: WorkItem["status"]) => {
    const targetItem = workItems.find((item) => item.id === itemId);
    if (!targetItem || isInvitedStatus(targetItem.status)) return;
    updateWorkItems(setWorkItemStatus(workItems, itemId, status));
  };

  const handleSetWorkItemStatuses = (updates: Array<{ id: string; status: WorkItem["status"] }>) => {
    const editableUpdates = updates.filter(({ id }) => {
      const item = workItems.find((workItem) => workItem.id === id);
      return item ? !isInvitedStatus(item.status) : false;
    });
    if (editableUpdates.length === 0) return;
    updateWorkItems(setWorkItemStatuses(workItems, editableUpdates));
  };

  const handleShortlistChanged = (itemId: string, nextReviewCount: number) => {
    const currentStatus = workItems.find((item) => item.id === itemId)?.status;
    if (!currentStatus) return;
    if (isInvitedStatus(currentStatus)) return;

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
    const targetItem = workItems.find((item) => item.id === itemId);
    if (!targetItem || isInvitedStatus(targetItem.status)) return;

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
    const targetItem = workItems.find((item) => item.id === itemId);
    if (!targetItem || isInvitedStatus(targetItem.status)) return;

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
      case 'Invited - Partial':
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

    if (isInvitedStatus(activeItem.status)) return;

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

    if (activeType === 'review' && overType === 'review-zone') {
      const next = moveSelectionReviewSubToEnd(selectionData, activeItem.id, draggedId);
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

  // Handle empty state when there are no work items
  if (!activeItem) {
    return (
      <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 shadow-[0_1px_0_rgba(255,255,255,0.8),0_12px_32px_rgba(180,83,9,0.08)] lg:flex-row">
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
          <div className="flex w-full min-w-0 flex-col items-center justify-center lg:w-1/2 p-8 text-center bg-amber-50/80 border-l border-amber-200/70">
            <svg className="w-16 h-16 text-amber-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-700 mb-2">Add a Work Item</h3>
            <p className="text-sm text-slate-500 max-w-md">Enter the details in the table to create your first work item and begin shortlisting contractors.</p>
          </div>
        </div>
      </DndContext>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 shadow-[0_1px_0_rgba(255,255,255,0.8),0_12px_32px_rgba(180,83,9,0.08)] lg:flex-row">
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
          <div className="border-l border-amber-200/70 bg-amber-50/80 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500 xl:text-sm">
              <span>{activeItem.sectionCode}</span>
              <ChevronRight size={14} />
              <span className="text-slate-900">{activeItem.sectionName}</span>
            </div>
            {isInvitedStatus(activeItem.status) ? (
              <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>This work item has been invited. To shortlist additional vendors, please create a new work item.</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 xl:text-sm">Drag vendors from the database into the review list.</p>
            )}
          </div>
          <div className="flex min-h-0 w-full flex-col lg:flex-1 lg:flex-row">
            <VendorDatabasePane 
              filteredSubs={orderedFilteredSubs} 
              selectedElsewhereIds={vendorsSelectedElsewhere}
              disabled={isInvitedStatus(activeItem.status)}
            />
            <ShortlistReviewPane
              activeItem={activeItem}
              activeAssignments={activeAssignments}
              activeDragSource={draggedSubSource}
              removeSub={handleRemoveSub}
              setWorkItemStatus={handleSetWorkItemStatus}
              disabled={isInvitedStatus(activeItem.status)}
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
