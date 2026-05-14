import { HardHat, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Assignment, WorkItem as WorkItemType } from '../types';
import Button from './Button';
import DataEntryTable, { type CommitEditResult, type DataEntryColumn } from './DataEntryTable';

interface DraftWorkItemRow {
  id: string;
  section: string;
  description: string;
}

interface WorkItemsPaneProps {
  workItems: WorkItemType[];
  activeItem: WorkItemType;
  setActiveItem: (item: WorkItemType) => void;
  getStatusColor: (status: string) => string;
  setWorkItemStatuses: (updates: Array<{ id: string; status: string }>) => void;
  assignments?: Record<string, Assignment>;
  onAddWorkItem: (section: string, description: string) => string | null;
  onUpdateWorkItem: (itemId: string, section: string, description: string) => void;
  onDeleteWorkItem: (itemId: string) => void;
}

interface WorkItemsTableRow {
  id: string;
  kind: 'saved' | 'draft';
  item?: WorkItemType;
  draft?: DraftWorkItemRow;
  vendorCount: number;
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
  const [editingDescription, setEditingDescription] = useState('');

  const finalizeAll = () => {
    const updates = workItems
      .filter((wi) => wi.status !== 'Shortlisting Completed')
      .map((wi) => ({ id: wi.id, status: 'Shortlisting Completed' }));

    if (updates.length > 0) {
      setWorkItemStatuses(updates);
    }
  };

  const startAddRow = (): string => {
    const id = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setDraftRows((prev) => [
      ...prev,
      {
        id,
        section: '',
        description: '',
      },
    ]);
    return id;
  };

  const updateDraftRow = (draftId: string, field: 'section' | 'description', value: string) => {
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

  const saveDraftRow = (draftId: string): string | null => {
    const row = draftRows.find((draft) => draft.id === draftId);
    if (!row) return null;

    const section = row.section.trim();
    const description = row.description.trim();
    if (!section || !description) return null;

    const createdItemId = onAddWorkItem(section, description);
    if (!createdItemId) return null;
    setDraftRows((prev) => prev.filter((draft) => draft.id !== draftId));
    return createdItemId;
  };

  const startEditRow = (item: WorkItemType) => {
    setEditingItemId(item.id);
    setEditingSection(item.division);
    setEditingDescription(item.section);
  };

  const cancelEditRow = () => {
    setEditingItemId(null);
    setEditingSection('');
    setEditingDescription('');
  };

  const saveEditRow = (): boolean => {
    if (!editingItemId) return false;
    const section = editingSection.trim();
    const description = editingDescription.trim();
    if (!section || !description) return false;
    onUpdateWorkItem(editingItemId, section, description);
    cancelEditRow();
    return true;
  };

  const hasEligible = workItems.some((wi) => wi.status !== 'Draft' && wi.status !== 'Shortlisting Completed');
  const canSaveDraftRow = (draftRow: DraftWorkItemRow) =>
    draftRow.section.trim().length > 0 && draftRow.description.trim().length > 0;

  const getSavedRowClassName = (isActive: boolean) => {
    if (isActive) {
      return 'bg-blue-50 ring-1 ring-inset ring-blue-300';
    }
    return 'bg-white hover:bg-slate-50';
  };

  const tableRows = useMemo<WorkItemsTableRow[]>(() => {
    const savedRows = workItems.map((item) => {
      const assignment = assignments[item.id] || { carried: null, backups: [], review: [] };
      const carriedCount = Array.isArray(assignment.carried)
        ? assignment.carried.length
        : assignment.carried
          ? 1
          : 0;
      const vendorCount = carriedCount + assignment.backups.length + assignment.review.length;

      return {
        id: item.id,
        kind: 'saved' as const,
        item,
        vendorCount,
      };
    });

    const unsavedRows = draftRows.map((draft) => ({
      id: draft.id,
      kind: 'draft' as const,
      draft,
      vendorCount: 0,
    }));

    return [...savedRows, ...unsavedRows];
  }, [assignments, draftRows, workItems]);

  const saveTableRow = (row: WorkItemsTableRow): boolean => {
    if (row.kind === 'saved') {
      return saveEditRow();
    }

    return !!saveDraftRow(row.id);
  };

  const handleCommitRowEdit = (
    row: WorkItemsTableRow,
    context: { isLastRow: boolean },
  ): CommitEditResult => {
    const didSave = saveTableRow(row);
    if (!didSave) return { saved: false };

    if (context.isLastRow) {
      const nextDraftId = startAddRow();
      return { saved: true, nextRowId: nextDraftId, nextRowEdit: true };
    }

    return { saved: true };
  };

  const columns: Array<DataEntryColumn<WorkItemsTableRow>> = [
      {
        id: 'section',
        header: 'Section',
        colSpan: 2,
        cellClassName: 'font-medium text-slate-700 truncate block',
        renderCell: (row) => {
          if (row.kind === 'saved' && row.item) {
            return row.item.division;
          }
          return row.draft?.section ?? '';
        },
        edit: {
          isEditable: (row) => row.kind === 'draft' || editingItemId === row.id,
          getValue: (row) => {
            if (row.kind === 'saved') {
              return editingItemId === row.id ? editingSection : row.item?.division ?? '';
            }
            return row.draft?.section ?? '';
          },
          setValue: (row, value) => {
            if (row.kind === 'saved') {
              setEditingSection(value);
              return;
            }
            updateDraftRow(row.id, 'section', value);
          },
          placeholder: 'Section',
        },
      },
      {
        id: 'description',
        header: 'Description',
        colSpan: 4,
        renderCell: (row) => {
          if (row.kind === 'saved' && row.item) {
            return (
              <span className="text-slate-900 truncate block" title={row.item.section}>
                {row.item.section}
              </span>
            );
          }
          return row.draft?.description ?? '';
        },
        edit: {
          isEditable: (row) => row.kind === 'draft' || editingItemId === row.id,
          getValue: (row) => {
            if (row.kind === 'saved') {
              return editingItemId === row.id ? editingDescription : row.item?.section ?? '';
            }
            return row.draft?.description ?? '';
          },
          setValue: (row, value) => {
            if (row.kind === 'saved') {
              setEditingDescription(value);
              return;
            }
            updateDraftRow(row.id, 'description', value);
          },
          placeholder: 'Description',
        },
      },
      {
        id: 'status',
        header: 'Status',
        colSpan: 2,
        renderCell: (row) => {
          const status = row.kind === 'saved' && row.item ? row.item.status : 'Draft';
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
        headerClassName: 'text-right',
        cellClassName: 'text-right font-semibold text-blue-700',
        renderCell: (row) => row.vendorCount,
      },
      {
        id: 'actions',
        header: 'Actions',
        colSpan: 2,
        headerClassName: 'text-center',
        cellClassName: 'flex items-center justify-center gap-1',
        renderCell: (row) => {
          const isEditing = row.kind === 'draft' || editingItemId === row.id;
          if (isEditing) {
            return (
              <>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={(event) => {
                    event.stopPropagation();
                    saveTableRow(row);
                  }}
                  disabled={row.kind === 'draft' ? !canSaveDraftRow(row.draft as DraftWorkItemRow) : false}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (row.kind === 'draft') {
                      cancelAddRow(row.id);
                    } else {
                      cancelEditRow();
                    }
                  }}
                >
                  Cancel
                </Button>
              </>
            );
          }

          if (!row.item) return null;

          return (
            <button
              type="button"
              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              aria-label={`Delete ${row.item.section}`}
              disabled={workItems.length <= 1}
              onClick={(event) => {
                event.stopPropagation();
                onDeleteWorkItem(row.item!.id);
              }}
            >
              <Trash2 size={14} />
            </button>
          );
        },
      },
    ];

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
        rows={tableRows}
        rowId={(row) => row.id}
        columns={columns}
        activeRowId={activeItem.id}
        onActiveRowChange={(row) => {
          if (row.kind === 'saved' && row.item) {
            setActiveItem(row.item);
          }
        }}
        isRowEditing={(row) => row.kind === 'draft' || editingItemId === row.id}
        onEnterRowEdit={(row) => {
          if (row.kind === 'saved' && row.item) {
            startEditRow(row.item);
          }
        }}
        onCommitRowEdit={handleCommitRowEdit}
        onCancelRowEdit={(row) => {
          if (row.kind === 'draft') {
            cancelAddRow(row.id);
            return;
          }
          cancelEditRow();
        }}
        getRowClassName={(row, isActive) =>
          row.kind === 'saved' ? getSavedRowClassName(isActive) : 'bg-white'
        }
      />

      <div className="p-4 border-t border-slate-200 bg-white">
        <Button variant="primary" onClick={finalizeAll} disabled={!hasEligible} className="w-full">
          Finalize All
        </Button>
      </div>
    </aside>
  );
}