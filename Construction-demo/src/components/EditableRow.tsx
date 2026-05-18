/**
 * @fileoverview EditableRow component for DataEntryTable.
 * 
 * Renders a single table row with support for:
 * - View and edit modes
 * - Inline cell editors
 * - Keyboard and mouse event handling
 * - Custom cell renderers
 * 
 * @module components/EditableRow
 */

import type { KeyboardEvent, MouseEvent } from 'react';
import type { DataEntryColumn } from './DataEntryTable';

/**
 * Props for the EditableRow component.
 */
export interface EditableRowProps<Row> {
  /** The row data */
  row: Row;
  /** Index of the row in the table */
  rowIndex: number;
  /** Unique identifier for the row */
  id: string;
  /** Whether the row is in edit mode */
  isEditing: boolean;
  /** Whether the row is the active/selected row */
  isActive: boolean;
  /** Column definitions */
  columns: DataEntryColumn<Row>[];
  /** CSS grid template for columns */
  gridTemplateColumns: string;
  /** Custom row CSS classes */
  computedRowClassName: string;
  /** Base row CSS classes */
  rowClassName?: string;
  /** Validation error message to display */
  validationError?: string;
  /** Click handler for the row */
  onRowClick: (row: Row, event: MouseEvent<HTMLDivElement>) => void;
  /** Double-click handler for the row */
  onRowDoubleClick: (row: Row) => void;
  /** Keyboard handler for the row */
  onRowKeyDown: (row: Row, event: KeyboardEvent<HTMLDivElement>) => void;
  /** Double-click handler factory for cells */
  createCellDoubleClickHandler: (
    row: Row,
    columnId: string,
    isEditing: boolean,
    editable: boolean,
  ) => (event: MouseEvent<HTMLDivElement>) => void;
  /** Keyboard handler for editor cells */
  onEditorKeyDown: (
    row: Row,
    rowIndex: number,
    columnIndex: number,
    event: KeyboardEvent<HTMLElement>,
  ) => void;
}

/**
 * EditableRow component renders a single row in the DataEntryTable.
 * Handles both view mode and edit mode with inline editors.
 */
export default function EditableRow<Row>({
  row,
  rowIndex,
  id,
  isEditing,
  columns,
  gridTemplateColumns,
  computedRowClassName,
  rowClassName,
  validationError,
  onRowClick,
  onRowDoubleClick,
  onRowKeyDown,
  createCellDoubleClickHandler,
  onEditorKeyDown,
}: EditableRowProps<Row>) {
  return (
    <div
      tabIndex={0}
      data-entry-row={id}
      onClick={(event) => onRowClick(row, event)}
      onDoubleClick={() => onRowDoubleClick(row)}
      onKeyDown={(event) => onRowKeyDown(row, event)}
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
            (editorConfig.isEditable ? editorConfig.isEditable(row, rowIndex) : true);

          const cellContent =
            isEditing && editorConfig && editable
              ? (() => {
                  const value = editorConfig.getValue(row);
                  const onChange = (nextValue: string) => editorConfig.setValue(row, nextValue);
                  const onClick = (event: MouseEvent<HTMLElement>) => event.stopPropagation();
                  const onKeyDownInput = (
                    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
                  ) => {
                    onEditorKeyDown(
                      row,
                      rowIndex,
                      columnIndex,
                      event as unknown as KeyboardEvent<HTMLElement>,
                    );
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
                        onKeyDownInput(
                          event as unknown as KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
                        ),
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
              onDoubleClick={createCellDoubleClickHandler(row, column.id, isEditing, editable)}
            >
              {cellContent}
            </div>
          );
        })}
      </div>
      {validationError && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
          {validationError}
        </div>
      )}
    </div>
  );
}
