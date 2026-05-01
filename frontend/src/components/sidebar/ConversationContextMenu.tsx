import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { Archive, Trash2 } from 'lucide-react';

interface Props {
  conversationId: string;
  isGroup: boolean;
  x: number;
  y: number;
  onClose: () => void;
}

export function ConversationContextMenu({ conversationId, isGroup, x, y, onClose }: Props) {
  const archiveConversation = useChatStore((s) => s.archiveConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 100,
  };

  const handleArchive = async () => {
    await archiveConversation(conversationId);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteConversation(conversationId);
    onClose();
  };

  return (
    <div ref={ref} style={menuStyle} className="bg-cb-surface border border-cb-border rounded-lg shadow-xl overflow-hidden min-w-[180px]">
      <button
        onClick={handleArchive}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cb-text-primary hover:bg-cb-surface-hover transition-colors"
      >
        <Archive className="w-4 h-4 text-cb-text-secondary" />
        Archive chat
      </button>
      <button
        onClick={handleDelete}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
          confirmDelete ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-red-500 hover:bg-cb-surface-hover'
        }`}
      >
        <Trash2 className="w-4 h-4" />
        {confirmDelete ? (isGroup ? 'Leave & delete?' : 'Confirm delete?') : (isGroup ? 'Leave group' : 'Delete chat')}
      </button>
    </div>
  );
}
