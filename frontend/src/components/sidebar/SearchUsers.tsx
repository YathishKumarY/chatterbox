import { useState } from 'react';
import client from '../../api/client';
import { useChatStore } from '../../store/chatStore';
import { useContactStore } from '../../store/contactStore';
import { X, Search, UserPlus, Check, Clock } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface SearchResult {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  isOnline: boolean;
  contactStatus: 'contact' | 'pending_outgoing' | 'pending_incoming' | null;
}

export function SearchUsers({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<Set<string>>(new Set());
  const createConversation = useChatStore((s) => s.createConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const sendRequest = useContactStore((s) => s.sendRequest);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await client.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch {
      setResults([]);
    }
    setIsSearching(false);
  };

  const startChat = async (userId: string) => {
    const conversation = await createConversation([userId]);
    setActiveConversation(conversation.id);
    onClose();
  };

  const handleSendRequest = async (userId: string) => {
    setSendingTo(prev => new Set(prev).add(userId));
    try {
      await sendRequest(userId);
      setResults(prev => prev.map(u =>
        u.id === userId ? { ...u, contactStatus: 'pending_outgoing' as const } : u
      ));
    } catch {
      // ignore
    }
    setSendingTo(prev => { const next = new Set(prev); next.delete(userId); return next; });
  };

  return (
    <div className="border-b border-cb-border bg-cb-surface">
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 flex items-center gap-2 bg-cb-input-bg rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-cb-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-cb-text-primary placeholder:text-cb-text-muted"
            placeholder="Search users by name or email..."
            autoFocus
          />
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-cb-surface-active">
          <X className="w-5 h-5 text-cb-text-secondary" />
        </button>
      </div>

      {isSearching && <div className="px-4 py-2 text-sm text-cb-text-secondary">Searching...</div>}

      {results.length > 0 && (
        <div className="max-h-60 overflow-y-auto">
          {results.map((user) => (
            <div
              key={user.id}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-cb-surface-hover transition-colors"
            >
              <UserAvatar user={user} size="sm" />
              <div className="text-left flex-1 min-w-0">
                <div className="font-medium text-cb-text-primary text-sm">{user.username}</div>
                <div className="text-xs text-cb-text-secondary truncate">{user.email}</div>
              </div>
              <div className="shrink-0 flex items-center gap-1">
                {user.contactStatus === 'contact' && (
                  <button
                    onClick={() => startChat(user.id)}
                    className="text-xs bg-cb-teal text-white px-3 py-1 rounded-full hover:bg-cb-dark transition-colors"
                  >
                    Message
                  </button>
                )}
                {user.contactStatus === 'pending_outgoing' && (
                  <span className="text-xs text-cb-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Sent
                  </span>
                )}
                {user.contactStatus === 'pending_incoming' && (
                  <span className="text-xs text-blue-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Wants to connect
                  </span>
                )}
                {user.contactStatus === null && (
                  <button
                    onClick={() => handleSendRequest(user.id)}
                    disabled={sendingTo.has(user.id)}
                    className="text-xs bg-cb-teal text-white px-3 py-1 rounded-full hover:bg-cb-dark transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !isSearching && results.length === 0 && (
        <div className="px-4 py-3 text-sm text-cb-text-secondary">No users found</div>
      )}
    </div>
  );
}
