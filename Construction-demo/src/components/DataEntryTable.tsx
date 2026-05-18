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
import {
  createCellDoubleClickHandler,
  createEditorKeyDownHandler,
  createRowArrowNavigationHandler,
  createRowClickHandler,
  createRowDoubleClickHandler,
  createRowEnterHandler,
  type FocusTarget,
  type InteractionHandlerContext,
} from './DataTableInteractionHandler';
import EditableRow from './EditableRow';

/**
 * Result object returned when committing a row edit.
 * Indicates whether the save was successful and where to focus next.
 * 
 * @interface CommitEditResult
 */
export interface CommitEditResult {
  /** Whether the row edit was successfully saved */
  saved: boolean;
  /** ID of the row to focus next (if applicable) */
  nextRowId?: string;
  /** Whether to enter edit mode on the next row (if applicable) */
  nextRowEdit?: boolean;
  /** Validation error message (if save failed) */
  error?: string;
  /** Column ID where the error occurred (to maintain focus) */
  errorColumnId?: string;
}



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
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());

  // Calculate CSS grid template from column spans
  const gridTemplateColumns = useMemo(
    () => columns.map((column) => `${column.colSpan ?? 1}fr`).join(' '),
    [columns],
  );

  const clearValidationError = useCallback((rowIdValue: string) => {
    setValidationErrors((prev) => {
      const next = new Map(prev);
      next.delete(rowIdValue);
      return next;
    });
  }, []);

  const setValidationError = useCallback((rowIdValue: string, error: string) => {
    setValidationErrors((prev) => {
      const next = new Map(prev);
      next.set(rowIdValue, error);
      return next;
    });
  }, []);

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

  const queueFocus = useCallback((target: FocusTarget) => {
    setPendingFocus({ ...target });
  }, []);

  useEffect(() => {
    if (!pendingFocus) return;
    if (!tryFocusTarget(pendingFocus)) return;
    queueMicrotask(() => {
      setPendingFocus((current) => (current === pendingFocus ? null : current));
    });
  }, [pendingFocus, tryFocusTarget]);

  // Create interaction handler context
  const handlerContext: InteractionHandlerContext<Row> = useMemo(
    () => ({
      rows,
      rowId,
      columns,
      isRowEditing,
      tableId,
      queueFocus,
      onActiveRowChange,
      onEnterRowEdit,
      onCancelRowEdit,
      onCommitRowEdit,
      isNewRow,
      clearValidationError,
      setValidationError,
    }),
    [
      rows,
      rowId,
      columns,
      isRowEditing,
      tableId,
      queueFocus,
      onActiveRowChange,
      onEnterRowEdit,
      onCancelRowEdit,
      onCommitRowEdit,
      isNewRow,
      clearValidationError,
      setValidationError,
    ],
  );

  // Create interaction handlers
  const handleRowArrowNavigation = useMemo(
    () => createRowArrowNavigationHandler(handlerContext),
    [handlerContext],
  );
  const handleRowEnter = useMemo(
    () => createRowEnterHandler(handlerContext),
    [handlerContext],
  );
  const handleEditorKeyDown = useMemo(
    () => createEditorKeyDownHandler(handlerContext),
    [handlerContext],
  );
  const handleRowClick = useMemo(
    () => createRowClickHandler(handlerContext),
    [handlerContext],
  );
  const handleRowDoubleClick = useMemo(
    () => createRowDoubleClickHandler(handlerContext),
    [handlerContext],
  );
  const handleCellDoubleClick = useMemo(
    () => createCellDoubleClickHandler(handlerContext),
    [handlerContext],
  );

  const handleRowKeyDown = useCallback(
    (row: Row, event: KeyboardEvent<HTMLDivElement>) => {
      handleRowArrowNavigation(row, event);
      handleRowEnter(row, event);
    },
    [handleRowArrowNavigation, handleRowEnter],
  );

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
          const validationError = validationErrors.get(id);

          return (
            <EditableRow
              key={id}
              row={row}
              rowIndex={rowIndex}
              id={id}
              isEditing={isEditing}
              isActive={isActive}
              columns={columns}
              gridTemplateColumns={gridTemplateColumns}
              computedRowClassName={computedRowClassName}
              rowClassName={rowClassName}
              validationError={validationError}
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
              onRowKeyDown={handleRowKeyDown}
              createCellDoubleClickHandler={handleCellDoubleClick}
              onEditorKeyDown={handleEditorKeyDown}
            />
          );
        })}
      </div>
    </div>
  );
}

