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
import { MessageCircle, Users, Search, UserPlus, Settings as SettingsIcon, Archive, ChevronRight } from 'lucide-react';

export function ConversationList() {
  const conversations = useChatStore((s) => s.conversations);
  const archivedConversations = useChatStore((s) => s.archivedConversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const showArchived = useChatStore((s) => s.showArchived);
  const toggleShowArchived = useChatStore((s) => s.toggleShowArchived);
  const isLoadingArchived = useChatStore((s) => s.isLoadingArchived);
  const user = useAuthStore((s) => s.user);
  const incomingRequests = useContactStore((s) => s.incomingRequests);
  const fetchIncomingRequests = useContactStore((s) => s.fetchIncomingRequests);

  const [showSearch, setShowSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ convId: string; isGroup: boolean; isArchived: boolean; x: number; y: number } | null>(null);

  useEffect(() => {
    fetchConversations();
    fetchIncomingRequests();
  }, [fetchConversations, fetchIncomingRequests]);

  const closeAll = useCallback(() => {
    setShowSearch(false);
    setShowCreateGroup(false);
    setShowRequests(false);
    setShowSettings(false);
  }, []);

  const shortcuts = useMemo(() => ({
    onSearch: () => { closeAll(); setShowSearch(true); },
    onCreateGroup: () => { closeAll(); setShowCreateGroup(true); },
    onSettings: () => { closeAll(); setShowSettings(true); },
    onEscape: () => {
      if (showSearch || showCreateGroup || showRequests || showSettings) {
        closeAll();
      }
    },
  }), [closeAll, showSearch, showCreateGroup, showRequests, showSettings]);

  useKeyboardShortcuts(shortcuts);

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
            onClick={() => { closeAll(); setShowSearch(!showSearch); }}
            className="p-2 rounded-full hover:bg-cb-surface-active transition-colors"
            title="Search users (Ctrl+N)"
          >
            <Search className="w-5 h-5 text-cb-text-secondary" />
          </button>
        </div>
      </div>

      {showRequests && <ContactRequests onClose={() => setShowRequests(false)} />}
      {showSearch && <SearchUsers onClose={() => setShowSearch(false)} />}
      {showCreateGroup && <CreateGroup onClose={() => setShowCreateGroup(false)} />}

      <div className="flex-1 overflow-y-auto">
        <button
          onClick={toggleShowArchived}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cb-surface-hover border-b border-cb-border-light transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-cb-surface-active flex items-center justify-center flex-shrink-0">
            <Archive className="w-5 h-5 text-cb-text-secondary" />
          </div>
          <span className="flex-1 text-sm font-medium text-cb-text-primary text-left">Archived</span>
          <ChevronRight
            className={`w-4 h-4 text-cb-text-muted transition-transform ${showArchived ? 'rotate-90' : ''}`}
          />
        </button>

        {showArchived && (
          <div className="bg-cb-surface-active/30">
            {isLoadingArchived ? (
              <div className="px-4 py-3 text-sm text-cb-text-muted text-center">Loading...</div>
            ) : archivedConversations.length === 0 ? (
              <div className="px-4 py-3 text-sm text-cb-text-muted text-center">No archived chats</div>
            ) : (
              archivedConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  currentUserId={user?.id || ''}
                  onClick={() => setActiveConversation(conv.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ convId: conv.id, isGroup: conv.isGroup, isArchived: true, x: e.clientX, y: e.clientY });
                  }}
                />
              ))
            )}
          </div>
        )}

        {conversations.length === 0 && !showArchived ? (
          <div className="flex flex-col items-center justify-center h-full text-cb-text-muted p-4">
            <MessageCircle className="w-16 h-16 mb-2" />
            <p className="text-center">No conversations yet. Search for users to start chatting!</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              currentUserId={user?.id || ''}
              onClick={() => setActiveConversation(conv.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ convId: conv.id, isGroup: conv.isGroup, isArchived: false, x: e.clientX, y: e.clientY });
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
    </div>
  );
}
