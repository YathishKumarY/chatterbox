import { useEffect, useState, useCallback, useMemo } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useContactStore } from '../../store/contactStore';
import { useAuthStore } from '../../store/authStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { UserAvatar } from '../common/UserAvatar';
import { ConversationItem } from './ConversationItem';
import { ConversationContextMenu } from './ConversationContextMenu';
import { SearchUsers } from './SearchUsers';
import { CreateGroup } from './CreateGroup';
import { ContactRequests } from './ContactRequests';
import { Settings } from './Settings';
import { MessageCircle, Users, Search, UserPlus, Settings as SettingsIcon, Archive, ArrowLeft } from 'lucide-react';

export function ConversationList() {
  const conversations = useChatStore((s) => s.conversations);
  const archivedConversations = useChatStore((s) => s.archivedConversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const fetchArchivedConversations = useChatStore((s) => s.fetchArchivedConversations);
  const isLoadingArchived = useChatStore((s) => s.isLoadingArchived);
  const user = useAuthStore((s) => s.user);
  const incomingRequests = useContactStore((s) => s.incomingRequests);
  const fetchIncomingRequests = useContactStore((s) => s.fetchIncomingRequests);

  const [showSearch, setShowSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ convId: string; isGroup: boolean; isArchived: boolean; isPinned: boolean; isFavourite: boolean; x: number; y: number } | null>(null);

  useEffect(() => {
    fetchConversations();
    fetchIncomingRequests();
  }, [fetchConversations, fetchIncomingRequests]);

  const closeAll = useCallback(() => {
    setShowSearch(false);
    setShowCreateGroup(false);
    setShowRequests(false);
    setShowSettings(false);
    setShowArchived(false);
  }, []);

  const shortcuts = useMemo(() => ({
    onSearch: () => { closeAll(); setShowSearch(true); },
    onCreateGroup: () => { closeAll(); setShowCreateGroup(true); },
    onSettings: () => { closeAll(); setShowSettings(true); },
    onEscape: () => {
      if (showSearch || showCreateGroup || showRequests || showSettings || showArchived) {
        closeAll();
      }
    },
  }), [closeAll, showSearch, showCreateGroup, showRequests, showSettings, showArchived]);

  useKeyboardShortcuts(shortcuts);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aTime = a.lastMessage?.createdAt || a.updatedAt || '';
      const bTime = b.lastMessage?.createdAt || b.updatedAt || '';
      return bTime.localeCompare(aTime);
    });
  }, [conversations]);

  return (
    <div className="flex flex-col h-full bg-cb-surface relative">
      <div className="bg-cb-panel px-4 py-3 flex items-center justify-between border-b border-cb-border">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="ChatterBox" className="w-7 h-7" />
          <span className="font-bold text-cb-teal text-lg">ChatterBox</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => { closeAll(); setShowRequests(!showRequests); }}
            className="p-2 rounded-full hover:bg-cb-surface-active transition-colors relative"
            title="Contact requests"
          >
            <UserPlus className="w-5 h-5 text-cb-text-secondary" />
            {incomingRequests.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { closeAll(); setShowCreateGroup(true); }}
            className="p-2 rounded-full hover:bg-cb-surface-active transition-colors"
            title="Create group (Ctrl+Shift+N)"
          >
            <Users className="w-5 h-5 text-cb-text-secondary" />
          </button>
          <button
            onClick={() => { closeAll(); setShowArchived(true); fetchArchivedConversations(); }}
            className="p-2 rounded-full hover:bg-cb-surface-active transition-colors"
            title="Archived chats"
          >
            <Archive className="w-5 h-5 text-cb-text-secondary" />
          </button>
        </div>
      </div>

      <div
        className="px-3 py-2 border-b border-cb-border bg-cb-panel cursor-text"
        onClick={() => { closeAll(); setShowSearch(true); }}
      >
        <div className="flex items-center gap-2 bg-cb-input-bg rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-cb-text-muted flex-shrink-0" />
          <span className="text-sm text-cb-text-muted">Search users</span>
        </div>
      </div>

      {showRequests && <ContactRequests onClose={() => setShowRequests(false)} />}
      {showSearch && <SearchUsers onClose={() => setShowSearch(false)} />}
      {showCreateGroup && <CreateGroup onClose={() => setShowCreateGroup(false)} />}

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-cb-text-muted p-4">
            <MessageCircle className="w-16 h-16 mb-2" />
            <p className="text-center">No conversations yet. Search for users to start chatting!</p>
          </div>
        ) : (
          sortedConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              currentUserId={user?.id || ''}
              onClick={() => setActiveConversation(conv.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ convId: conv.id, isGroup: conv.isGroup, isArchived: false, isPinned: conv.isPinned || false, isFavourite: conv.isFavourite || false, x: e.clientX, y: e.clientY });
              }}
            />
          ))
        )}
      </div>

      {contextMenu && (
        <ConversationContextMenu
          conversationId={contextMenu.convId}
          isGroup={contextMenu.isGroup}
          isArchived={contextMenu.isArchived}
          isPinned={contextMenu.isPinned}
          isFavourite={contextMenu.isFavourite}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      <div className="bg-cb-panel px-4 py-2 flex items-center gap-3 border-t border-cb-border">
        {user && <UserAvatar user={user} size="sm" />}
        <span className="flex-1 text-sm font-medium text-cb-text-primary truncate">{user?.username}</span>
        <button
          onClick={() => { closeAll(); setShowSettings(!showSettings); }}
          className="p-2 rounded-full hover:bg-cb-surface-active transition-colors"
          title="Settings (Ctrl+,)"
        >
          <SettingsIcon className="w-5 h-5 text-cb-text-secondary" />
        </button>
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      {showArchived && (
        <div className="absolute inset-0 z-40 flex flex-col bg-cb-surface">
          <div className="bg-cb-panel px-4 py-3 flex items-center gap-3 border-b border-cb-border">
            <button
              onClick={() => setShowArchived(false)}
              className="p-1 rounded-full hover:bg-cb-surface-active transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-cb-text-secondary" />
            </button>
            <h3 className="font-medium text-cb-text-primary">Archived Chats</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingArchived ? (
              <div className="flex items-center justify-center h-32 text-sm text-cb-text-muted">Loading...</div>
            ) : archivedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-cb-text-muted p-4">
                <Archive className="w-16 h-16 mb-2" />
                <p className="text-center">No archived chats</p>
              </div>
            ) : (
              archivedConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  currentUserId={user?.id || ''}
                  onClick={() => { setActiveConversation(conv.id); setShowArchived(false); }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ convId: conv.id, isGroup: conv.isGroup, isArchived: true, isPinned: conv.isPinned || false, isFavourite: conv.isFavourite || false, x: e.clientX, y: e.clientY });
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
