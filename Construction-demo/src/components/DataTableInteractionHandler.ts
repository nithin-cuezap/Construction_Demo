/**
 * @fileoverview Interaction handlers for DataEntryTable keyboard and mouse events.
 *
 * Provides centralized handling for:
 * - Keyboard navigation (Arrow keys, Enter, Escape, Tab)
 * - Mouse interactions (click, double-click)
 * - Focus management after row operations
 *
 * @module components/DataTableInteractionHandler
 */

import type { KeyboardEvent, MouseEvent } from "react";
import type { DataEntryColumn } from "./DataEntryTable";

/**
 * Internal focus target specification for managing focus after operations.
 */
export type FocusTarget = {
  /** ID of the row to focus */
  rowId: string;
  /** Focus mode: row-level, first editor, or specific editor */
  mode: "row" | "first-editor" | "editor";
  /** Column ID for editor-specific focus */
  columnId?: string;
};

/**
 * Context required for interaction handlers.
 */
export interface InteractionHandlerContext<Row> {
  /** Array of all rows */
  rows: Row[];
  /** Function to extract row ID */
  rowId: (row: Row) => string;
  /** Array of column definitions */
  columns: DataEntryColumn<Row>[];
  /** Function to check if row is in edit mode */
  isRowEditing: (row: Row) => boolean;
  /** Unique table ID for DOM queries */
  tableId: string;
  /** Function to queue focus operations */
  queueFocus: (target: FocusTarget) => void;
  /** Callback when active row changes */
  onActiveRowChange?: (row: Row) => void;
  /** Callback to enter edit mode */
  onEnterRowEdit?: (row: Row) => void;
  /** Callback to cancel row edits */
  onCancelRowEdit?: (row: Row) => void;
  /** Callback to commit row edits */
  onCommitRowEdit?: (
    row: Row,
    context: { isLastRow: boolean },
  ) => {
    saved: boolean;
    nextRowId?: string;
    nextRowEdit?: boolean;
    error?: string;
    errorColumnId?: string;
  };
  /** Function to check if row is newly created */
  isNewRow?: (row: Row) => boolean;
  /** Function to clear validation error for a row */
  clearValidationError: (rowId: string) => void;
  /** Function to set validation error for a row */
  setValidationError: (rowId: string, error: string) => void;
}

/**
 * Get indexes of editable columns for a row.
 */
export function getEditableColumnIndexes<Row>(
  row: Row,
  rowIndex: number,
  columns: DataEntryColumn<Row>[],
): number[] {
  return columns.reduce<number[]>((acc, column, columnIndex) => {
    if (!column.edit) return acc;
    const editable = column.edit.isEditable
      ? column.edit.isEditable(row, rowIndex)
      : true;
    if (editable) acc.push(columnIndex);
    return acc;
  }, []);
}

/**
 * Creates a handler for arrow key navigation between rows.
 */
export function createRowArrowNavigationHandler<Row>(
  context: InteractionHandlerContext<Row>,
) {
  return (row: Row, event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    const currentIndex = context.rows.findIndex(
      (entry) => context.rowId(entry) === context.rowId(row),
    );
    if (currentIndex < 0) return;

    const targetIndex =
      event.key === "ArrowUp" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= context.rows.length) return;

    const targetRow = context.rows[targetIndex];
    context.onActiveRowChange?.(targetRow);
    context.queueFocus({ rowId: context.rowId(targetRow), mode: "row" });
  };
}

/**
 * Creates a handler for Enter key on row to enter edit mode.
 */
export function createRowEnterHandler<Row>(
  context: InteractionHandlerContext<Row>,
) {
  return (row: Row, event: KeyboardEvent<HTMLDivElement>) => {
    console.log(
      "[DataEntryTable] handleRowEnter - key:",
      event.key,
      "target===currentTarget:",
      event.target === event.currentTarget,
      "isEditing:",
      context.isRowEditing(row),
    );
    if (event.target !== event.currentTarget) {
      console.log(
        "[DataEntryTable] handleRowEnter - SKIPPED: target !== currentTarget",
      );
      return;
    }
    if (event.key !== "Enter") {
      console.log(
        "[DataEntryTable] handleRowEnter - SKIPPED: key is not Enter",
      );
      return;
    }
    if (context.isRowEditing(row) || !context.onEnterRowEdit) {
      console.log(
        "[DataEntryTable] handleRowEnter - SKIPPED: already editing or no callback",
      );
      return;
    }

    console.log(
      "[DataEntryTable] handleRowEnter - TRIGGERED - calling onEnterRowEdit",
    );
    event.preventDefault();
    context.onEnterRowEdit(row);
    context.queueFocus({ rowId: context.rowId(row), mode: "first-editor" });
  };
}

/**
 * Creates a handler for keyboard events within editor cells.
 * Handles Enter (save and move to next row), Tab (move to next field), and Escape (cancel).
 */
export function createEditorKeyDownHandler<Row>(
  context: InteractionHandlerContext<Row>,
) {
  return (
    row: Row,
    rowIndex: number,
    columnIndex: number,
    event: KeyboardEvent<HTMLElement>,
  ) => {
    console.log(
      "[DataEntryTable] handleEditorKeyDown - key:",
      event.key,
      "rowIndex:",
      rowIndex,
      "columnIndex:",
      columnIndex,
    );

    // Handle Escape - cancel edit
    if (event.key === "Escape") {
      console.log(
        "[DataEntryTable] handleEditorKeyDown - Escape detected - calling onCancelRowEdit",
      );
      event.preventDefault();
      event.stopPropagation();

      // Clear any validation error for this row
      context.clearValidationError(context.rowId(row));

      context.onCancelRowEdit?.(row);

      // If this is a new row being deleted, focus on the previous row
      if (context.isNewRow?.(row)) {
        if (rowIndex > 0) {
          const previousRow = context.rows[rowIndex - 1];
          context.queueFocus({
            rowId: context.rowId(previousRow),
            mode: "row",
          });
        }
      } else {
        context.queueFocus({ rowId: context.rowId(row), mode: "row" });
      }
      return;
    }

    // Handle Tab - move to next editable field
    if (event.key === "Tab") {
      console.log("[DataEntryTable] handleEditorKeyDown - Tab detected");
      event.preventDefault();
      event.stopPropagation();

      // Clear any validation error when user moves to another field
      context.clearValidationError(context.rowId(row));

      const editableColumns = getEditableColumnIndexes(
        row,
        rowIndex,
        context.columns,
      );
      const currentEditableIndex = editableColumns.findIndex(
        (index) => index === columnIndex,
      );

      if (event.shiftKey) {
        // Shift+Tab - move to previous field
        const prevColumnIndex =
          currentEditableIndex > 0
            ? editableColumns[currentEditableIndex - 1]
            : undefined;

        if (prevColumnIndex !== undefined) {
          const prevColumn = context.columns[prevColumnIndex];
          context.queueFocus({
            rowId: context.rowId(row),
            mode: "editor",
            columnId: prevColumn.id,
          });
        }
      } else {
        // Tab - move to next field
        const nextColumnIndex =
          currentEditableIndex >= 0
            ? editableColumns[currentEditableIndex + 1]
            : undefined;

        if (nextColumnIndex !== undefined) {
          const nextColumn = context.columns[nextColumnIndex];
          context.queueFocus({
            rowId: context.rowId(row),
            mode: "editor",
            columnId: nextColumn.id,
          });
        } else {
          // If at last field, Tab wraps to first field
          const firstColumn = context.columns[editableColumns[0]];
          context.queueFocus({
            rowId: context.rowId(row),
            mode: "editor",
            columnId: firstColumn.id,
          });
        }
      }
      return;
    }

    // Handle Enter - save row and move to next row
    if (event.key === "Enter") {
      console.log("[DataEntryTable] handleEditorKeyDown - Enter detected");
      event.preventDefault();
      event.stopPropagation();

      console.log("[DataEntryTable] handleEditorKeyDown - Committing row edit");
      const result = context.onCommitRowEdit?.(row, {
        isLastRow: rowIndex === context.rows.length - 1,
      });

      if (!result) {
        console.log(
          "[DataEntryTable] handleEditorKeyDown - No result from commit",
        );
        return;
      }

      if (!result.saved) {
        console.log(
          "[DataEntryTable] handleEditorKeyDown - Commit failed with error:",
          result.error,
        );

        // Show validation error
        if (result.error) {
          context.setValidationError(context.rowId(row), result.error);
        }

        // Keep focus on the same field if error column is specified
        if (result.errorColumnId) {
          context.queueFocus({
            rowId: context.rowId(row),
            mode: "editor",
            columnId: result.errorColumnId,
          });
        }
        return;
      }

      // Clear validation error on successful save
      context.clearValidationError(context.rowId(row));

      // Move to next row or specified row
      if (result.nextRowId) {
        console.log(
          "[DataEntryTable] handleEditorKeyDown - Moving to next row:",
          result.nextRowId,
        );
        context.queueFocus({
          rowId: result.nextRowId,
          mode: result.nextRowEdit ? "first-editor" : "row",
        });
        return;
      }

      const nextRow = context.rows[rowIndex + 1];
      if (nextRow) {
        console.log("[DataEntryTable] handleEditorKeyDown - Focusing next row");
        context.queueFocus({ rowId: context.rowId(nextRow), mode: "row" });
      }
      return;
    }
  };
}

/**
 * Creates a handler for row click events.
 */
export function createRowClickHandler<Row>(
  context: InteractionHandlerContext<Row>,
) {
  return (row: Row, event: MouseEvent<HTMLDivElement>) => {
    console.log("[DataEntryTable] Row clicked:", context.rowId(row));
    (event.currentTarget as HTMLElement).focus();
    console.log("[DataEntryTable] Row focused after click");
    context.onActiveRowChange?.(row);
  };
}

/**
 * Creates a handler for row double-click events.
 */
export function createRowDoubleClickHandler<Row>(
  context: InteractionHandlerContext<Row>,
) {
  return (row: Row) => {
    const id = context.rowId(row);
    const isEditing = context.isRowEditing(row);
    console.log("[DataEntryTable] Row double-clicked:", id);
    if (!isEditing && context.onEnterRowEdit) {
      context.onEnterRowEdit(row);
      context.queueFocus({ rowId: id, mode: "first-editor" });
    }
  };
}

/**
 * Creates a handler for cell double-click events.
 */
export function createCellDoubleClickHandler<Row>(
  context: InteractionHandlerContext<Row>,
) {
  return (
    row: Row,
    columnId: string,
    isEditing: boolean,
    editable: boolean,
  ) => {
    return (event: MouseEvent<HTMLDivElement>) => {
      if (!isEditing && editable && context.onEnterRowEdit) {
        event.stopPropagation();
        console.log("[DataEntryTable] Cell double-clicked:", columnId);
        context.onEnterRowEdit(row);
        context.queueFocus({
          rowId: context.rowId(row),
          mode: "editor",
          columnId,
        });
      }
    };
  };
}
