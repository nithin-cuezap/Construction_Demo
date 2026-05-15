/**
 * @fileoverview Advanced data entry table component with inline editing and keyboard navigation.
 * 
 * A feature-rich table component that supports:
 * - Inline editing of cells with Enter/Escape key handling
 * - Keyboard navigation (Tab, Shift+Tab, Arrow keys)
 * - Row selection and activation
 * - Custom cell renderers and edit controls
 * - Auto-focus management after row operations
 * 
 * This component is designed for efficient data entry workflows where users need to
 * quickly add, edit, and navigate through tabular data using keyboard shortcuts.
 * 
 * @module components/DataEntryTable
 */

import type { HTMLInputTypeAttribute, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

/**
 * Result object returned when committing a row edit.
 * Indicates whether the save was successful and where to focus next.
 * 
 * @interface CommitEditResult
 */
interface CommitEditResult {
  /** Whether the row edit was successfully saved */
  saved: boolean;
  /** ID of the row to focus next (if applicable) */
  nextRowId?: string;
  /** Whether to enter edit mode on the next row (if applicable) */
  nextRowEdit?: boolean;
}

/**
 * Internal focus target specification for managing focus after operations.
 * @typedef {Object} FocusTarget
 * @private
 */
type FocusTarget = {
  /** ID of the row to focus */
  rowId: string;
  /** Focus mode: row-level, first editor, or specific editor */
  mode: 'row' | 'first-editor' | 'editor';
  /** Column ID for editor-specific focus */
  columnId?: string;
};

/**
 * Context object provided to custom cell edit renderers.
 * Contains row data, editor state, and event handlers.
 * 
 * @interface EditRenderContext
 * @template Row - The type of row data
 */
interface EditRenderContext<Row> {
  /** The row data being edited */
  row: Row;
  /** Index of the row in the table */
  rowIndex: number;
  /** Unique ID for the editor element */
  editorId: string;
  /** Current value of the editor */
  value: string;
  /** Callback to update the editor value */
  onChange: (nextValue: string) => void;
  /** Click handler for the editor */
  onClick: (event: MouseEvent<HTMLElement>) => void;
  /** Keydown handler for the editor (handles Tab, Enter, Escape) */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Configuration for inline editing of a column.
 * Defines how values are read/written and how the edit UI is rendered.
 * 
 * @interface DataEntryColumnEditConfig
 * @template Row - The type of row data
 */
interface DataEntryColumnEditConfig<Row> {
  /** Function to extract the value from a row */
  getValue: (row: Row) => string;
  /** Function to update the value in a row */
  setValue: (row: Row, value: string) => void;
  /** Optional function to determine if the cell is editable */
  isEditable?: (row: Row, rowIndex: number) => boolean;
  /** Placeholder text for the edit control */
  placeholder?: string;
  /** HTML input type for default text input rendering */
  inputType?: HTMLInputTypeAttribute;
  /** Additional CSS classes for the edit control */
  className?: string;
  /** Optional custom render function for the edit control */
  render?: (context: EditRenderContext<Row>) => ReactNode;
}

/**
 * Column definition for the data entry table.
 * Specifies how to render cells and optionally enable inline editing.
 * 
 * @interface DataEntryColumn
 * @template Row - The type of row data
 */
export interface DataEntryColumn<Row> {
  /** Unique identifier for the column */
  id: string;
  /** Header content (text or JSX) */
  header: ReactNode;
  /** Number of grid columns to span (default: 1) */
  colSpan?: number;
  /** CSS classes for the header cell */
  headerClassName?: string;
  /** CSS classes for data cells */
  cellClassName?: string;
  /** Function to render the cell content */
  renderCell: (row: Row, rowIndex: number) => ReactNode;
  /** Optional edit configuration to enable inline editing */
  edit?: DataEntryColumnEditConfig<Row>;
}

/**
 * Props for the DataEntryTable component.
 * @interface DataEntryTableProps
 * @template Row - The type of row data
 */
interface DataEntryTableProps<Row> {
  /** Array of row data */
  rows: Row[];
  /** Function to extract unique ID from a row */
  rowId: (row: Row) => string;
  /** Column definitions */
  columns: DataEntryColumn<Row>[];
  /** ID of the currently active/selected row */
  activeRowId?: string;
  /** Callback when active row changes */
  onActiveRowChange?: (row: Row) => void;
  /** Function to determine if a row is in edit mode */
  isRowEditing: (row: Row) => boolean;
  /** Callback to enter edit mode for a row */
  onEnterRowEdit?: (row: Row) => void;
  /** Callback to commit/save row edits */
  onCommitRowEdit?: (row: Row, context: { isLastRow: boolean }) => CommitEditResult;
  /** Callback to cancel row edits */
  onCancelRowEdit?: (row: Row) => void;
  /** Function to determine if a row is newly created (not yet saved) */
  isNewRow?: (row: Row) => boolean;
  /** Function to generate custom row CSS classes */
  getRowClassName?: (row: Row, isActive: boolean) => string;
  /** CSS classes for the table body container */
  tableBodyClassName?: string;
  /** CSS classes for all rows */
  rowClassName?: string;
}

/**
 * A keyboard-navigable data entry table with inline editing capabilities.
 * Supports Tab/Shift+Tab for column navigation, Enter for committing edits,
 * Escape for canceling, and Arrow keys for row navigation.
 * 
 * @template Row - The type of row data
 * @param {DataEntryTableProps<Row>} props - Component props
 * @returns {JSX.Element} Rendered data entry table
 */
export default function DataEntryTable<Row>({
  rows,
  rowId,
  columns,
  activeRowId,
  onActiveRowChange,
  isRowEditing,
  onEnterRowEdit,
  onCommitRowEdit,
  onCancelRowEdit,
  isNewRow,
  getRowClassName,
  tableBodyClassName,
  rowClassName,
}: DataEntryTableProps<Row>) {
  // Generate unique table ID for DOM queries
  const tableId = useId();
  const [pendingFocus, setPendingFocus] = useState<FocusTarget | null>(null);

  // Calculate CSS grid template from column spans
  const gridTemplateColumns = useMemo(
    () => columns.map((column) => `${column.colSpan ?? 1}fr`).join(' '),
    [columns],
  );

  /**
   * Attempts to focus a specific target element in the table.
   * Returns true if successful, false if the target doesn't exist.
   * 
   * @param {FocusTarget} target - The focus target specification
   * @returns {boolean} Whether focus was successfully set
   */
  const tryFocusTarget = useCallback((target: FocusTarget): boolean => {
    const getRowElement = (id: string) =>
      document.querySelector<HTMLElement>(
        `[data-entry-table="${tableId}"] [data-entry-row="${id}"]`,
      );

    // Focus the row element itself
    if (target.mode === 'row') {
      const rowElement = getRowElement(target.rowId);
      if (!rowElement) return false;
      rowElement.focus();
      return true;
    }

    // For editor focus, the row must be in edit mode
    const targetRow = rows.find((row) => rowId(row) === target.rowId);
    if (!targetRow || !isRowEditing(targetRow)) return false;

    const rowElement = getRowElement(target.rowId);
    if (!rowElement) return false;

    if (target.mode === 'editor' && target.columnId) {
      const editorElement = rowElement.querySelector<HTMLElement>(
        `[data-entry-editor="${target.columnId}"]`,
      );
      if (!editorElement) return false;
      editorElement.focus();
      return true;
    }

    const firstEditableColumn = columns.find((column, columnIndex) => {
      if (!column.edit) return false;
      return column.edit.isEditable ? column.edit.isEditable(targetRow, columnIndex) : true;
    });

    if (!firstEditableColumn) {
      const focusRowElement = getRowElement(target.rowId);
      if (!focusRowElement) return false;
      focusRowElement.focus();
      return true;
    }

    const editorElement = rowElement.querySelector<HTMLElement>(
      `[data-entry-editor="${firstEditableColumn.id}"]`,
    );
    if (!editorElement) return false;
    editorElement.focus();
    return true;
  }, [columns, isRowEditing, rowId, rows, tableId]);

  const queueFocus = (target: FocusTarget) => {
    setPendingFocus({ ...target });
  };

  useEffect(() => {
    if (!pendingFocus) return;
    if (!tryFocusTarget(pendingFocus)) return;
    queueMicrotask(() => {
      setPendingFocus((current) => (current === pendingFocus ? null : current));
    });
  }, [pendingFocus, tryFocusTarget]);

  const getEditableColumnIndexes = (row: Row, rowIndex: number): number[] =>
    columns.reduce<number[]>((acc, column, columnIndex) => {
      if (!column.edit) return acc;
      const editable = column.edit.isEditable ? column.edit.isEditable(row, rowIndex) : true;
      if (editable) acc.push(columnIndex);
      return acc;
    }, []);

  const handleRowArrowNavigation = (row: Row, event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

    event.preventDefault();
    const currentIndex = rows.findIndex((entry) => rowId(entry) === rowId(row));
    if (currentIndex < 0) return;

    const targetIndex = event.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= rows.length) return;

    const targetRow = rows[targetIndex];
    onActiveRowChange?.(targetRow);
    queueFocus({ rowId: rowId(targetRow), mode: 'row' });
  };

  const handleRowEnter = (row: Row, event: KeyboardEvent<HTMLDivElement>) => {
    console.log('[DataEntryTable] handleRowEnter - key:', event.key, 'target===currentTarget:', event.target === event.currentTarget, 'isEditing:', isRowEditing(row));
    if (event.target !== event.currentTarget) {
      console.log('[DataEntryTable] handleRowEnter - SKIPPED: target !== currentTarget');
      return;
    }
    if (event.key !== 'Enter') {
      console.log('[DataEntryTable] handleRowEnter - SKIPPED: key is not Enter');
      return;
    }
    if (isRowEditing(row) || !onEnterRowEdit) {
      console.log('[DataEntryTable] handleRowEnter - SKIPPED: already editing or no callback');
      return;
    }

    console.log('[DataEntryTable] handleRowEnter - TRIGGERED - calling onEnterRowEdit');
    event.preventDefault();
    onEnterRowEdit(row);
    queueFocus({ rowId: rowId(row), mode: 'first-editor' });
  };

  const handleEditorKeyDown = (
    row: Row,
    rowIndex: number,
    columnIndex: number,
    event: KeyboardEvent<HTMLElement>,
  ) => {
    console.log('[DataEntryTable] handleEditorKeyDown - key:', event.key, 'rowIndex:', rowIndex, 'columnIndex:', columnIndex);
    
    if (event.key === 'Escape') {
      console.log('[DataEntryTable] handleEditorKeyDown - Escape detected - calling onCancelRowEdit');
      event.preventDefault();
      event.stopPropagation();
      onCancelRowEdit?.(row);
      
      // If this is a new row being deleted, focus on the previous row
      if (isNewRow?.(row)) {
        if (rowIndex > 0) {
          const previousRow = rows[rowIndex - 1];
          queueFocus({ rowId: rowId(previousRow), mode: 'row' });
        }
      } else {
        queueFocus({ rowId: rowId(row), mode: 'row' });
      }
      return;
    }

    if (event.key !== 'Enter') {
      console.log('[DataEntryTable] handleEditorKeyDown - SKIPPED: key is not Enter or Escape');
      return;
    }

    console.log('[DataEntryTable] handleEditorKeyDown - Enter detected');
    event.preventDefault();
    event.stopPropagation();

    const editableColumns = getEditableColumnIndexes(row, rowIndex);
    const currentEditableIndex = editableColumns.findIndex((index) => index === columnIndex);
    const nextColumnIndex =
      currentEditableIndex >= 0 ? editableColumns[currentEditableIndex + 1] : undefined;

    if (nextColumnIndex !== undefined) {
      console.log('[DataEntryTable] handleEditorKeyDown - Moving to next column:', nextColumnIndex);
      const nextColumn = columns[nextColumnIndex];
      const rowElement = document.querySelector<HTMLElement>(
        `[data-entry-table="${tableId}"] [data-entry-row="${rowId(row)}"]`,
      );
      const nextEditorElement = rowElement?.querySelector<HTMLElement>(
        `[data-entry-editor="${nextColumn.id}"]`,
      );
      if (nextEditorElement) {
        nextEditorElement.focus();
      } else {
        queueFocus({ rowId: rowId(row), mode: 'editor', columnId: nextColumn.id });
      }
      return;
    }

    console.log('[DataEntryTable] handleEditorKeyDown - Committing row edit');
    const result = onCommitRowEdit?.(row, { isLastRow: rowIndex === rows.length - 1 });
    if (!result?.saved) {
      console.log('[DataEntryTable] handleEditorKeyDown - Commit not saved');
      return;
    }

    if (result.nextRowId) {
      console.log('[DataEntryTable] handleEditorKeyDown - Moving to next row:', result.nextRowId);
      queueFocus({ rowId: result.nextRowId, mode: result.nextRowEdit ? 'first-editor' : 'row' });
      return;
    }

    const nextRow = rows[rowIndex + 1];
    if (nextRow) {
      console.log('[DataEntryTable] handleEditorKeyDown - Focusing next row');
      queueFocus({ rowId: rowId(nextRow), mode: 'row' });
    }
  };

  return (
    <div className={tableBodyClassName} data-entry-table={tableId} style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="sticky top-0 z-10 border-b border-slate-300 bg-slate-100 px-4 py-3 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-slate-700">
        <div className="grid gap-3" style={{ gridTemplateColumns }}>
          {columns.map((column) => (
            <div
              key={column.id}
              className={`truncate ${column.headerClassName || ''}`}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 bg-slate-50">
        {rows.map((row, rowIndex) => {
          const id = rowId(row);
          const isEditing = isRowEditing(row);
          const isActive = activeRowId === id;
          const computedRowClassName = getRowClassName?.(row, isActive) ?? '';

          return (
            <div
              key={id}
              tabIndex={0}
              data-entry-row={id}
              onClick={(event) => {
                console.log('[DataEntryTable] Row clicked:', id);
                (event.currentTarget as HTMLElement).focus();
                console.log('[DataEntryTable] Row focused after click');
                onActiveRowChange?.(row);
              }}
              onDoubleClick={() => {
                console.log('[DataEntryTable] Row double-clicked:', id);
                if (!isEditing && onEnterRowEdit) {
                  onEnterRowEdit(row);
                  queueFocus({ rowId: id, mode: 'first-editor' });
                }
              }}
              onKeyDown={(event) => {
                console.log('[DataEntryTable] Row onKeyDown fired:', event.key, 'rowId:', id);
                handleRowArrowNavigation(row, event);
                handleRowEnter(row, event);
              }}
              className={`group w-full px-4 py-3 border-b border-slate-200 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-blue-500 ${rowClassName ?? ''} ${computedRowClassName}`}
            >
              <div
                className="grid gap-3 items-center text-xs xl:text-sm"
                style={{ gridTemplateColumns }}
              >
                {columns.map((column, columnIndex) => {
                  const editorConfig = column.edit;
                  const editable =
                    !!editorConfig &&
                    (editorConfig.isEditable
                      ? editorConfig.isEditable(row, rowIndex)
                      : true);

                  const cellContent =
                    isEditing && editorConfig && editable
                      ? (() => {
                          const value = editorConfig.getValue(row);
                          const onChange = (nextValue: string) => editorConfig.setValue(row, nextValue);
                          const onClick = (event: MouseEvent<HTMLElement>) => event.stopPropagation();
                          const onKeyDownInput = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                            handleEditorKeyDown(row, rowIndex, columnIndex, event as unknown as KeyboardEvent<HTMLElement>);
                          };

                          if (editorConfig.render) {
                            return editorConfig.render({
                              row,
                              rowIndex,
                              editorId: column.id,
                              value,
                              onChange,
                              onClick,
                              onKeyDown: (event: KeyboardEvent<HTMLElement>) =>
                                onKeyDownInput(event as unknown as KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>),
                            });
                          }

                  return (
                    <input
                      data-entry-editor={column.id}
                      type={editorConfig.inputType ?? 'text'}
                      value={value}
                      onChange={(event) => onChange(event.target.value)}
                      onClick={onClick}
                      onKeyDown={onKeyDownInput}
                      autoFocus
                      placeholder={editorConfig.placeholder}
                      className={
                        editorConfig.className ??
                        'w-full px-3 py-2 border border-slate-300 rounded-md text-xs xl:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                      }
                    />
                  );
                })()
              : column.renderCell(row, rowIndex);

            return (
              <div
                key={column.id}
                className={`min-w-0 ${column.cellClassName || ''}`}
              >
                {cellContent}
              </div>
            );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { CommitEditResult };

