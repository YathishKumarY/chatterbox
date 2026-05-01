import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { Archive, ArchiveRestore, Trash2, Pin, PinOff, Star, StarOff, Eye } from 'lucide-react';

interface Props {
  conversationId: string;
  isGroup: boolean;
  isArchived: boolean;
  isPinned: boolean;
  isFavourite: boolean;
  x: number;
  y: number;
  onClose: () => void;
}

export function ConversationContextMenu({ conversationId, isGroup, isArchived, isPinned, isFavourite, x, y, onClose }: Props) {
  const archiveConversation = useChatStore((s) => s.archiveConversation);
  const unarchiveConversation = useChatStore((s) => s.unarchiveConversation);
  const pinConversation = useChatStore((s) => s.pinConversation);
  const unpinConversation = useChatStore((s) => s.unpinConversation);
  const favouriteConversation = useChatStore((s) => s.favouriteConversation);
  const unfavouriteConversation = useChatStore((s) => s.unfavouriteConversation);
  const markAsUnread = useChatStore((s) => s.markAsUnread);
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

  const handleArchiveToggle = async () => {
    if (isArchived) {
      await unarchiveConversation(conversationId);
    } else {
      await archiveConversation(conversationId);
    }
    onClose();
  };

  const handlePinToggle = async () => {
    if (isPinned) {
      await unpinConversation(conversationId);
    } else {
      await pinConversation(conversationId);
    }
    onClose();
  };

  const handleFavouriteToggle = async () => {
    if (isFavourite) {
      await unfavouriteConversation(conversationId);
    } else {
      await favouriteConversation(conversationId);
    }
    onClose();
  };

  const handleMarkUnread = async () => {
    await markAsUnread(conversationId);
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
        onClick={handlePinToggle}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cb-text-primary hover:bg-cb-surface-hover transition-colors"
      >
        {isPinned
          ? <PinOff className="w-4 h-4 text-cb-text-secondary" />
          : <Pin className="w-4 h-4 text-cb-text-secondary" />
        }
        {isPinned ? 'Unpin chat' : 'Pin chat'}
      </button>
      <button
        onClick={handleMarkUnread}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cb-text-primary hover:bg-cb-surface-hover transition-colors"
      >
        <Eye className="w-4 h-4 text-cb-text-secondary" />
        Mark as unread
      </button>
      <button
        onClick={handleFavouriteToggle}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cb-text-primary hover:bg-cb-surface-hover transition-colors"
      >
        {isFavourite
          ? <StarOff className="w-4 h-4 text-cb-text-secondary" />
          : <Star className="w-4 h-4 text-cb-text-secondary" />
        }
        {isFavourite ? 'Remove from favourites' : 'Add to favourites'}
      </button>
      <button
        onClick={handleArchiveToggle}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cb-text-primary hover:bg-cb-surface-hover transition-colors"
      >
        {isArchived
          ? <ArchiveRestore className="w-4 h-4 text-cb-text-secondary" />
          : <Archive className="w-4 h-4 text-cb-text-secondary" />
        }
        {isArchived ? 'Unarchive chat' : 'Archive chat'}
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
