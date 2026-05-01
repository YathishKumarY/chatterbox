import { formatTime } from '../../utils/formatTime';
import { usePresenceStore } from '../../store/presenceStore';

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  avatarUrl: string | null;
  participants: {
    userId: string;
    user: { id: string; username: string; avatarUrl: string | null; isOnline: boolean };
  }[];
  lastMessage: { content: string; createdAt: string; senderId: string | null } | null;
  unreadCount: number;
}

interface Props {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, currentUserId, onClick }: Props) {
  const otherParticipant = conversation.participants.find((p) => p.userId !== currentUserId);
  const displayName = conversation.isGroup
    ? conversation.name || 'Group'
    : otherParticipant?.user.username || 'Unknown';
  const lastMessage = conversation.lastMessage;
  const presenceOnline = usePresenceStore((s) => !conversation.isGroup && otherParticipant ? s.onlineUsers.has(otherParticipant.userId) : false);
  const online = presenceOnline || (!conversation.isGroup && (otherParticipant?.user.isOnline ?? false));

  const senderName = lastMessage?.senderId
    ? conversation.participants.find((p) => p.userId === lastMessage.senderId)?.user.username
    : undefined;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${
        isActive ? 'bg-whatsapp-panel' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-lg">
          {displayName.charAt(0).toUpperCase()}
        </div>
        {online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-whatsapp-green rounded-full border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900 truncate">{displayName}</span>
          {lastMessage && (
            <span className="text-xs text-gray-500 flex-shrink-0">{formatTime(lastMessage.createdAt)}</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-sm text-gray-500 truncate">
            {lastMessage
              ? `${conversation.isGroup && senderName ? `${senderName}: ` : ''}${lastMessage.content}`
              : 'No messages yet'}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="bg-whatsapp-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
