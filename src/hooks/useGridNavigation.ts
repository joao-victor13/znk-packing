import { useRef, useCallback } from 'react';

export interface GridNavigationOptions {
  rowCount: number;
  colCount: number;
  onAddRow?: () => void;
  onDuplicateRow?: (rowIndex: number) => void;
  onDeleteRow?: (rowIndex: number) => void;
}

/**
 * Hook to provide Excel / Spreadsheet-like keyboard navigation inside data tables:
 * - Arrow keys (↑, ↓, ←, →) to move between cells
 * - Enter to move to next row (or append a new row if on the last row)
 * - Ctrl+D / Cmd+D to duplicate the current row
 * - F2 to select text and edit cell
 */
export function useGridNavigation({
  rowCount,
  colCount,
  onAddRow,
  onDuplicateRow,
  onDeleteRow,
}: GridNavigationOptions) {
  // Store refs to inputs in a 2D matrix [rowIndex][colIndex]
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());

  const getCellKey = (rowIndex: number, colIndex: number) => `${rowIndex}-${colIndex}`;

  const registerCell = useCallback((rowIndex: number, colIndex: number, element: HTMLElement | null) => {
    const key = getCellKey(rowIndex, colIndex);
    if (element) {
      cellRefs.current.set(key, element);
    } else {
      cellRefs.current.delete(key);
    }
  }, []);

  const focusCell = useCallback((rowIndex: number, colIndex: number) => {
    // Constrain row index
    const clampedRow = Math.max(0, Math.min(rowIndex, rowCount - 1));
    const clampedCol = Math.max(0, Math.min(colIndex, colCount - 1));
    const key = getCellKey(clampedRow, clampedCol);
    const targetElement = cellRefs.current.get(key);

    if (targetElement) {
      targetElement.focus();
      if (targetElement instanceof HTMLInputElement) {
        // Select input content for quick typing
        targetElement.select();
      }
    }
  }, [rowCount, colCount]);

  const handleCellKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    // 1. DUPLICATE ROW SHORTCUT (Ctrl + D / Cmd + D)
    if (isCtrlOrCmd && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      if (onDuplicateRow) {
        onDuplicateRow(rowIndex);
        // Focus the same column in the newly inserted row
        setTimeout(() => focusCell(rowIndex + 1, colIndex), 50);
      }
      return;
    }

    // 2. DELETE ROW SHORTCUT (Ctrl + Backspace / Ctrl + Delete)
    if (isCtrlOrCmd && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      if (onDeleteRow && rowCount > 1) {
        onDeleteRow(rowIndex);
        setTimeout(() => focusCell(Math.max(0, rowIndex - 1), colIndex), 50);
      }
      return;
    }

    // 3. F2: Select current cell text
    if (e.key === 'F2') {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      if (target && typeof target.select === 'function') {
        target.select();
      }
      return;
    }

    // 4. ENTER KEY: Advance to next row or append new row on last row
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIndex < rowCount - 1) {
        focusCell(rowIndex + 1, colIndex);
      } else {
        if (onAddRow) {
          onAddRow();
          setTimeout(() => focusCell(rowCount, colIndex), 50);
        }
      }
      return;
    }

    // 5. ARROW UP / DOWN NAVIGATION
    if (e.key === 'ArrowDown') {
      if (rowIndex < rowCount - 1) {
        e.preventDefault();
        focusCell(rowIndex + 1, colIndex);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (rowIndex > 0) {
        e.preventDefault();
        focusCell(rowIndex - 1, colIndex);
      }
      return;
    }

    // 6. ARROW LEFT / RIGHT (when cursor is at text boundary or dropdown/button)
    const target = e.target as HTMLInputElement;
    if (target && target.tagName === 'INPUT') {
      const isAtStart = target.selectionStart === 0 && target.selectionEnd === 0;
      const isAtEnd = target.selectionStart === target.value.length && target.selectionEnd === target.value.length;

      if (e.key === 'ArrowLeft' && isAtStart && colIndex > 0) {
        e.preventDefault();
        focusCell(rowIndex, colIndex - 1);
      } else if (e.key === 'ArrowRight' && isAtEnd && colIndex < colCount - 1) {
        e.preventDefault();
        focusCell(rowIndex, colIndex + 1);
      }
    }
  }, [rowCount, colCount, onAddRow, onDuplicateRow, onDeleteRow, focusCell]);

  return {
    registerCell,
    focusCell,
    handleCellKeyDown,
  };
}
