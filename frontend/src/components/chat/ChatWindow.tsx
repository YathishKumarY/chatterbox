import { useEffect, useRef, useCallback, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { usePresenceStore } from '../../store/presenceStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useChat } from '../../hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { GroupInfo } from './GroupInfo';
import { MessageCircle } from 'lucide-react';

export function ChatWindow() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const messages = useChatStore((s) => s.messages);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const nextCursors = useChatStore((s) => s.nextCursors);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const typingUsersSet = usePresenceStore((s) => activeConversationId ? s.typingUsers[activeConversationId] : undefined);
  const theme = useThemeStore((s) => s.theme);
  const { markAsRead } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const conversation = conversations.find((c) => c.id === activeConversationId);
  const convMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      markAsRead(activeConversationId);
      setShowGroupInfo(false);
    }
  }, [activeConversationId, fetchMessages, markAsRead]);

  useEffect(() => {
    if (convMessages.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = convMessages.length;
  }, [convMessages.length]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !activeConversationId || isLoadingMessages) return;

    if (container.scrollTop < 50 && nextCursors[activeConversationId]) {
      const prevHeight = container.scrollHeight;
      fetchMessages(activeConversationId, true).then(() => {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight - prevHeight;
          }
        });
      });
    }
  }, [activeConversationId, fetchMessages, nextCursors, isLoadingMessages]);

  const patternFill = theme === 'dark' ? '%232B2D31' : '%23E3E5E8';

  if (!activeConversationId || !conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-cb-chatbg">
        <MessageCircle className="w-20 h-20 text-cb-text-muted mb-4" />
        <h2 className="text-xl text-cb-text-secondary">ChatterBox</h2>
        <p className="text-cb-text-muted mt-1">Select a conversation to start messaging</p>
      </div>
    );
  }

  const otherParticipant = conversation.participants.find((p) => p.userId !== currentUserId);
  const displayName = conversation.isGroup
    ? conversation.name || 'Group'
    : otherParticipant?.user.username || 'Unknown';

  const typingUserIds = typingUsersSet ? Array.from(typingUsersSet) : [];
  const typingNames = typingUserIds
    .map((uid) => conversation.participants.find((p) => p.userId === uid)?.user.username)
    .filter(Boolean) as string[];

  if (showGroupInfo && conversation.isGroup) {
    return (
      <GroupInfo
        conversationId={conversation.id}
        name={displayName}
        avatarData={(conversation as any).avatarData}
        avatarUrl={conversation.avatarUrl}
        participants={conversation.participants as any}
        createdBy={conversation.createdBy}
        currentUserId={currentUserId || ''}
        onClose={() => setShowGroupInfo(false)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader
        name={displayName}
        isGroup={conversation.isGroup}
        participants={conversation.participants}
        onBack={() => setActiveConversation(null)}
        onInfoClick={conversation.isGroup ? () => setShowGroupInfo(true) : undefined}
      />

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-cb-chatbg"
        style={{
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${patternFill}' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {isLoadingMessages && convMessages.length === 0 && (
          <div className="text-center text-cb-text-muted py-4">Loading messages...</div>
        )}

        {convMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            content={msg.content}
            createdAt={msg.createdAt}
            isSender={msg.senderId === currentUserId}
            senderName={msg.sender.username}
            isGroup={conversation.isGroup}
            statuses={msg.statuses}
            pending={msg.pending}
            failed={msg.failed}
          />
        ))}

        <TypingIndicator usernames={typingNames} />
        <div ref={messagesEndRef} />
      </div>

      <MessageInput />
    </div>
  );
}
