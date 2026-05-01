import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

interface ShortcutActions {
  onSearch?: () => void;
  onCreateGroup?: () => void;
  onSettings?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        useThemeStore.getState().toggleTheme();
        return;
      }
      if (mod && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        actions.onCreateGroup?.();
        return;
      }
      if (mod && (e.key === 'n' || e.key === 'N') && !e.shiftKey) {
        e.preventDefault();
        actions.onSearch?.();
        return;
      }
      if (mod && e.key === ',') {
        e.preventDefault();
        actions.onSettings?.();
        return;
      }
      if (e.key === 'Escape') {
        actions.onEscape?.();
        return;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actions]);
}
