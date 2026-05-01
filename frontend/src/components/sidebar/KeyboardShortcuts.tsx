import { Keyboard, X } from 'lucide-react';

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);
const mod = isMac ? '⌘' : 'Ctrl';

const shortcuts = [
  { keys: `${mod} + N`, action: 'Search users / New chat' },
  { keys: `${mod} + Shift + N`, action: 'Create new group' },
  { keys: `${mod} + Shift + D`, action: 'Toggle dark / light mode' },
  { keys: `${mod} + ,`, action: 'Open settings' },
  { keys: 'Escape', action: 'Close panel / Go back' },
  { keys: 'Enter', action: 'Send message' },
  { keys: 'Shift + Enter', action: 'New line in message' },
];

export function KeyboardShortcuts({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 bg-cb-surface z-50 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-cb-panel border-b border-cb-border">
        <button onClick={onClose} className="p-1 rounded-full hover:bg-cb-surface-active">
          <X className="w-5 h-5 text-cb-text-secondary" />
        </button>
        <div className="flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-cb-teal" />
          <h3 className="font-medium text-cb-text-primary">Keyboard Shortcuts</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-cb-surface-hover">
              <span className="text-sm text-cb-text-primary">{s.action}</span>
              <kbd className="text-xs font-mono bg-cb-panel text-cb-text-secondary px-2 py-1 rounded border border-cb-border">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
