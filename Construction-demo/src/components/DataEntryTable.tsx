import type { HTMLInputTypeAttribute, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

interface CommitEditResult {
  saved: boolean;
  nextRowId?: string;
  nextRowEdit?: boolean;
}

type FocusTarget = {
  rowId: string;
  mode: 'row' | 'first-editor' | 'editor';
  columnId?: string;
};

interface EditRenderContext<Row> {
  row: Row;
  rowIndex: number;
  editorId: string;
  value: string;
  onChange: (nextValue: string) => void;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

interface DataEntryColumnEditConfig<Row> {
  getValue: (row: Row) => string;
  setValue: (row: Row, value: string) => void;
  isEditable?: (row: Row, rowIndex: number) => boolean;
  placeholder?: string;
  inputType?: HTMLInputTypeAttribute;
  className?: string;
  render?: (context: EditRenderContext<Row>) => ReactNode;
}

export interface DataEntryColumn<Row> {
  id: string;
  header: ReactNode;
  colSpan?: number;
  headerClassName?: string;
  cellClassName?: string;
  renderCell: (row: Row, rowIndex: number) => ReactNode;
  edit?: DataEntryColumnEditConfig<Row>;
}

interface DataEntryTableProps<Row> {
  rows: Row[];
  rowId: (row: Row) => string;
  columns: DataEntryColumn<Row>[];
  activeRowId?: string;
  onActiveRowChange?: (row: Row) => void;
  isRowEditing: (row: Row) => boolean;
  onEnterRowEdit?: (row: Row) => void;
  onCommitRowEdit?: (row: Row, context: { isLastRow: boolean }) => CommitEditResult;
  onCancelRowEdit?: (row: Row) => void;
  getRowClassName?: (row: Row, isActive: boolean) => string;
  tableBodyClassName?: string;
  rowClassName?: string;
}

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
  getRowClassName,
  tableBodyClassName,
  rowClassName,
}: DataEntryTableProps<Row>) {
  const tableId = useId();
  const [pendingFocus, setPendingFocus] = useState<FocusTarget | null>(null);

  const gridTemplateColumns = useMemo(
    () => columns.map((column) => `${column.colSpan ?? 1}fr`).join(' '),
    [columns],
  );

  const tryFocusTarget = useCallback((target: FocusTarget): boolean => {
    const getRowElement = (id: string) =>
      document.querySelector<HTMLElement>(
        `[data-entry-table="${tableId}"] [data-entry-row="${id}"]`,
      );

    if (target.mode === 'row') {
      const rowElement = getRowElement(target.rowId);
      if (!rowElement) return false;
      rowElement.focus();
      return true;
    }

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
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'Enter') return;
    if (isRowEditing(row) || !onEnterRowEdit) return;

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
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onCancelRowEdit?.(row);
      queueFocus({ rowId: rowId(row), mode: 'row' });
      return;
    }

    if (event.key !== 'Enter') return;

    event.preventDefault();
    event.stopPropagation();

    const editableColumns = getEditableColumnIndexes(row, rowIndex);
    const currentEditableIndex = editableColumns.findIndex((index) => index === columnIndex);
    const nextColumnIndex =
      currentEditableIndex >= 0 ? editableColumns[currentEditableIndex + 1] : undefined;

    if (nextColumnIndex !== undefined) {
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

    const result = onCommitRowEdit?.(row, { isLastRow: rowIndex === rows.length - 1 });
    if (!result?.saved) return;

    if (result.nextRowId) {
      queueFocus({ rowId: result.nextRowId, mode: result.nextRowEdit ? 'first-editor' : 'row' });
      return;
    }

    const nextRow = rows[rowIndex + 1];
    if (nextRow) {
      queueFocus({ rowId: rowId(nextRow), mode: 'row' });
    }
  };

  return (
    <div className={tableBodyClassName} data-entry-table={tableId}>
      <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-[10px] xl:text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        <div className="grid gap-2" style={{ gridTemplateColumns }}>
          {columns.map((column) => (
            <span key={column.id} className={column.headerClassName}>
              {column.header}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 bg-slate-100/40">
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
              onClick={() => onActiveRowChange?.(row)}
              onDoubleClick={() => {
                if (!isEditing && onEnterRowEdit) {
                  onEnterRowEdit(row);
                  queueFocus({ rowId: id, mode: 'first-editor' });
                }
              }}
              onKeyDown={(event) => {
                handleRowArrowNavigation(row, event);
                handleRowEnter(row, event);
              }}
              className={`w-full text-left px-3 py-2 border-b border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${rowClassName ?? ''} ${computedRowClassName}`}
            >
              <div className="grid gap-2 items-center text-xs xl:text-sm" style={{ gridTemplateColumns }}>
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
                          const onKeyDown = (event: KeyboardEvent<HTMLElement>) =>
                            handleEditorKeyDown(row, rowIndex, columnIndex, event);

                          if (editorConfig.render) {
                            return editorConfig.render({
                              row,
                              rowIndex,
                              editorId: column.id,
                              value,
                              onChange,
                              onClick,
                              onKeyDown,
                            });
                          }

                          return (
                            <input
                              data-entry-editor={column.id}
                              type={editorConfig.inputType ?? 'text'}
                              value={value}
                              onChange={(event) => onChange(event.target.value)}
                              onClick={onClick}
                              onKeyDown={(event) => onKeyDown(event)}
                              placeholder={editorConfig.placeholder}
                              className={
                                editorConfig.className ??
                                'w-full px-2 py-1 border border-slate-300 rounded-md text-xs xl:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                              }
                            />
                          );
                        })()
                      : column.renderCell(row, rowIndex);

                  return (
                    <span key={column.id} className={column.cellClassName}>
                      {cellContent}
                    </span>
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

