import { useEffect } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
  handler: (e: KeyboardEvent) => void;
  description?: string;
  allowInInputs?: boolean;
}

/**
 * Hook to manage global and contextual keyboard shortcuts with safety checks
 * ensuring standard text editing is never disrupted unless intentional (e.g. Ctrl+K, Ctrl+N).
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Determine if active element is an editable input
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      );

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlOrCmd ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey || shortcut.ctrlOrCmd;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        // If shortcut requires Ctrl/Cmd, allow it even inside inputs (e.g. Ctrl+K, Ctrl+D)
        const canExecuteInInput = shortcut.allowInInputs || shortcut.ctrlOrCmd;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (isInput && !canExecuteInInput) {
            continue;
          }

          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }

          shortcut.handler(e);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}
