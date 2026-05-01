import { useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useContactStore } from '../../store/contactStore';
import { useThemeStore } from '../../store/themeStore';
import { ConversationItem } from './ConversationItem';
import { SearchUsers } from './SearchUsers';
import { CreateGroup } from './CreateGroup';
import { ContactRequests } from './ContactRequests';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { LogOut, Users, Search, MessageCircle, UserPlus, Sun, Moon } from 'lucide-react';

export function ConversationList() {
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const incomingRequests = useContactStore((s) => s.incomingRequests);
  const fetchIncomingRequests = useContactStore((s) => s.fetchIncomingRequests);
  const { theme, toggleTheme } = useThemeStore();

  const [showSearch, setShowSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchIncomingRequests();
  }, [fetchConversations, fetchIncomingRequests]);

  return (
    <div className="flex flex-col h-full bg-cb-surface">
      <div className="bg-cb-panel px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <div className="w-10 h-10 rounded-full bg-cb-teal flex items-center justify-center text-white font-bold flex-shrink-0">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-cb-text-secondary truncate">{user?.username}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-cb-surface-active transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-cb-text-secondary" />
            ) : (
              <Moon className="w-5 h-5 text-cb-text-secondary" />
            )}
          </button>
          <button
            onClick={() => { setShowRequests(!showRequests); setShowSearch(false); setShowCreateGroup(false); }}
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
            onClick={() => { setShowCreateGroup(true); setShowSearch(false); setShowRequests(false); }}
            className="p-2 rounded-full hover:bg-cb-surface-active transition-colors"
            title="Create group"
          >
            <Users className="w-5 h-5 text-cb-text-secondary" />
          </button>
          <button
            onClick={() => { setShowSearch(!showSearch); setShowCreateGroup(false); setShowRequests(false); }}
            className="p-2 rounded-full hover:bg-cb-surface-active transition-colors"
            title="Search users"
          >
            <Search className="w-5 h-5 text-cb-text-secondary" />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-full hover:bg-cb-surface-active transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-cb-text-secondary" />
          </button>
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
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              currentUserId={user?.id || ''}
              onClick={() => setActiveConversation(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
