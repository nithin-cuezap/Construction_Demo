import { HardHat, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Assignment, WorkItem, WorkItem as WorkItemType } from '../types';
import Button from './Button';
import type { CommitEditResult, DataEntryColumn } from './DataEntryTable';
import DataEntryTable from './DataEntryTable';

interface DraftWorkItemRow {
  id: string;
  sectionCode: string;
  sectionName: string;
  description: string;
}

type UnifiedRow = WorkItemType | DraftWorkItemRow;

const isWorkItem = (row: UnifiedRow): row is WorkItemType => 'status' in row;
const isDraftRow = (row: UnifiedRow): row is DraftWorkItemRow => !isWorkItem(row);

interface WorkItemsPaneProps {
  workItems: WorkItemType[];
  activeItem: WorkItemType;
  setActiveItem: (item: WorkItemType) => void;
  getStatusColor: (status: WorkItem["status"]) => string;
  setWorkItemStatuses: (updates: Array<{ id: string; status: WorkItem["status"] }>) => void;
  assignments?: Record<string, Assignment>;
  onAddWorkItem: (sectionCode: string, sectionName: string, description: string) => void;
  onUpdateWorkItem: (itemId: string, sectionCode: string, sectionName: string, description: string) => void;
  onDeleteWorkItem: (itemId: string) => void;
}

export default function WorkItemsPane({
  workItems,
  activeItem,
  setActiveItem,
  getStatusColor,
  setWorkItemStatuses,
  assignments = {},
  onAddWorkItem,
  onUpdateWorkItem,
  onDeleteWorkItem,
}: WorkItemsPaneProps) {
  const [draftRows, setDraftRows] = useState<DraftWorkItemRow[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState('');
  const [editingSectionName, setEditingSectionName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const canFinalizeWorkItem = (status: WorkItem['status']) =>
    status !== 'Draft' && status !== 'Shortlisting Completed' && status !== 'Invited' && status !== 'Invited - Partial';

  const finalizeAll = () => {
    const updates: Array<{ id: string; status: WorkItem["status"] }> = workItems
      .filter((wi) => canFinalizeWorkItem(wi.status))
      .map((wi) => ({ id: wi.id, status: 'Shortlisting Completed' }));

    if (updates.length > 0) {
      setWorkItemStatuses(updates);
    }
  };

  const startAddRow = (): string => {
    const newId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setDraftRows((prev) => [
      ...prev,
      {
        id: newId,
        sectionCode: '',
        sectionName: '',
        description: '',
      },
    ]);
    return newId;
  };

  const updateDraftRow = (draftId: string, field: 'sectionCode' | 'sectionName' | 'description', value: string) => {
    setDraftRows((prev) =>
      prev.map((row) =>
        row.id === draftId
          ? { ...row, [field]: value }
          : row,
      ),
    );
  };

  const cancelAddRow = (draftId: string) => {
    setDraftRows((prev) => prev.filter((row) => row.id !== draftId));
  };

  const startEditRow = (row: UnifiedRow) => {
    console.log('[WorkItemsPane] startEditRow called for:', row.id);
    setEditingItemId(row.id);
    setEditingSection(row.sectionCode);
    setEditingSectionName(row.sectionName);
    setEditingDescription(row.description);
  };

  const cancelEditRow = () => {
    console.log('[WorkItemsPane] cancelEditRow called');
    setEditingItemId(null);
    setEditingSection('');
    setEditingSectionName('');
    setEditingDescription('');
  };

  const saveEditRow = (row: UnifiedRow): boolean => {
    console.log('[WorkItemsPane] saveEditRow called for:', row.id);
    const sectionCode = editingSection.trim();
    const sectionName = editingSectionName.trim();
    const description = editingDescription.trim();
    if (!sectionCode || !sectionName || !description) {
      console.log('[WorkItemsPane] saveEditRow - validation failed');
      return false;
    }

    if (isWorkItem(row)) {
      onUpdateWorkItem(row.id, sectionCode, sectionName, description);
    } else {
      const sectionCodeValid = sectionCode.length > 0;
      const sectionNameValid = sectionName.length > 0;
      const descriptionValid = description.length > 0;
      if (sectionCodeValid && sectionNameValid && descriptionValid) {
        onAddWorkItem(sectionCode, sectionName, description);
      } else {
        return false;
      }
      setDraftRows((prev) => prev.filter((draft) => draft.id !== row.id));
    }

    cancelEditRow();
    return true;
  };

  const hasEligible = workItems.some((wi) => canFinalizeWorkItem(wi.status));

  const getRowClassName = (row: UnifiedRow, isActive: boolean) => {
    if (isActive) {
      return 'bg-blue-50 ring-1 ring-inset ring-blue-300';
    }
    if (isDraftRow(row)) {
      return 'bg-white';
    }
    return 'bg-white hover:bg-slate-50';
  };

  const allRows: UnifiedRow[] = [...workItems, ...draftRows];

  const columns: DataEntryColumn<UnifiedRow>[] = [
    {
      id: 'sectionCode',
      header: 'Section Code',
      colSpan: 1,
      renderCell: (row) => (
        <span className="font-medium text-slate-700 truncate block">{row.sectionCode}</span>
      ),
      edit: {
        getValue: (row) => row.sectionCode,
        setValue: (row, value) => {
          if (isWorkItem(row)) {
            setEditingSection(value);
          } else {
            updateDraftRow(row.id, 'sectionCode', value);
          }
        },
        placeholder: 'Section Code',
      },
    },
    {
      id: 'sectionName',
      header: 'Section Name',
      colSpan: 2,
      renderCell: (row) => (
        <span className="text-slate-700 truncate block">{row.sectionName}</span>
      ),
      edit: {
        getValue: (row) => row.sectionName,
        setValue: (row, value) => {
          if (isWorkItem(row)) {
            setEditingSectionName(value);
          } else {
            updateDraftRow(row.id, 'sectionName', value);
          }
        },
        placeholder: 'Section Name',
      },
    },
    {
      id: 'description',
      header: 'Description',
      colSpan: 4,
      renderCell: (row) => (
        <span className="text-slate-900 truncate block">{row.description}</span>
      ),
      edit: {
        getValue: (row) => row.description,
        setValue: (row, value) => {
          if (isWorkItem(row)) {
            setEditingDescription(value);
          } else {
            updateDraftRow(row.id, 'description', value);
          }
        },
        placeholder: 'Description',
      },
    },
    {
      id: 'status',
      header: 'Status',
      colSpan: 2,
      renderCell: (row) => {
        const status = isWorkItem(row) ? row.status : 'Draft';
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-md border text-[11px] xl:text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: 'vendors',
      header: 'Vendors',
      colSpan: 2,
      cellClassName: 'text-right',
      renderCell: (row) => {
        if (!isWorkItem(row)) return <span className="font-semibold text-blue-700">0</span>;
        const a = assignments[row.id] || { carried: null, backups: [], review: [] };
        const carriedCount = Array.isArray(a.carried) ? a.carried.length : (a.carried ? 1 : 0);
        const vendorCount = carriedCount + a.backups.length + a.review.length;
        return <span className="font-semibold text-blue-700">{vendorCount}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      colSpan: 1,
      cellClassName: 'text-center',
      renderCell: (row) => {
        const isEditing = editingItemId === row.id;
        if (isEditing) {
          return (
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="outline"
                size="xs"
                onClick={(event) => {
                  event.stopPropagation();
                  saveEditRow(row);
                }}
              >
                Save
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={(event) => {
                  event.stopPropagation();
                  cancelEditRow();
                }}
              >
                Cancel
              </Button>
            </div>
          );
        }

        if (isDraftRow(row)) {
          return (
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="outline"
                size="xs"
                onClick={(event) => {
                  event.stopPropagation();
                  cancelAddRow(row.id);
                }}
              >
                Cancel
              </Button>
            </div>
          );
        }

        if (!isWorkItem(row)) return null;
        const workItemRow: WorkItemType = row;

        return (
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            aria-label={`Delete ${workItemRow.sectionCode}`}
            disabled={workItems.length <= 1}
            onClick={(event) => {
              event.stopPropagation();
              onDeleteWorkItem(workItemRow.id);
            }}
          >
            <Trash2 size={14} />
          </button>
        );
      },
    },
  ];

  const handleActiveRowChange = (row: UnifiedRow) => {
    console.log('[WorkItemsPane] Active row changed to:', row.id);
    if (isWorkItem(row)) {
      setActiveItem(row);
    }
    setActiveRowId(row.id);
  };

  const handleEnterRowEdit = (row: UnifiedRow) => {
    console.log('[WorkItemsPane] Enter row edit for:', row.id);
    startEditRow(row);
  };

  const handleCancelRowEdit = (row: UnifiedRow) => {
    console.log('[WorkItemsPane] handleCancelRowEdit called for:', row.id);
    // If it's a draft row, remove it from the list
    if (isDraftRow(row)) {
      cancelAddRow(row.id);
    }
    cancelEditRow();
  };

  const handleCommitRowEdit = (row: UnifiedRow, context: { isLastRow: boolean }): CommitEditResult => {
    console.log('[WorkItemsPane] Commit row edit for:', row.id, 'isLastRow:', context.isLastRow);
    const didSave = saveEditRow(row);
    if (!didSave) return { saved: false };

    if (context.isLastRow) {
      // Add a new draft row and enter edit mode for it
      const newRowId = startAddRow();
      setEditingItemId(newRowId);
      setEditingSection('');
      setEditingSectionName('');
      setEditingDescription('');
      return { saved: true, nextRowId: newRowId, nextRowEdit: true };
    }

    return { saved: true };
  };

  return (
    <aside className="w-full lg:w-1/2 bg-slate-50 border-r border-slate-200 flex flex-col min-w-0 text-xs xl:text-sm">
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <HardHat size={18} className="text-slate-400" />
          Work Items
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] xl:text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-md">{workItems.length}</span>
          <Button variant="outline" size="xs" className="inline-flex items-center gap-1" onClick={startAddRow}>
            <Plus size={12} />
            Add
          </Button>
        </div>
      </div>

      <DataEntryTable
        rows={allRows}
        rowId={(row) => row.id}
        columns={columns}
        activeRowId={activeRowId ?? activeItem.id}
        onActiveRowChange={handleActiveRowChange}
        isRowEditing={(row) => editingItemId === row.id}
        onEnterRowEdit={handleEnterRowEdit}
        onCancelRowEdit={handleCancelRowEdit}
        onCommitRowEdit={handleCommitRowEdit}
        isNewRow={isDraftRow}
        getRowClassName={getRowClassName}
        tableBodyClassName="overflow-y-auto flex-1 bg-slate-100/40"
        rowClassName=""
      />

      <div className="p-4 border-t border-slate-200 bg-white">
        <Button variant="primary" onClick={finalizeAll} disabled={!hasEligible} className="w-full">
          Finalize All
        </Button>
      </div>
    </aside>
  );
}