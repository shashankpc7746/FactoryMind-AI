/**
 * Global Keyboard Shortcuts
 *
 * - Ctrl+K / Cmd+K → focus the header search bar
 * - Escape → close the mobile sidebar overlay
 *
 * Usage: call useKeyboardShortcuts() once in the root AppContent component.
 */

import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K → focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'header input[type="search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
