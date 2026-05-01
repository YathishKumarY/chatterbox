import { formatTime } from '../../utils/formatTime';
import { usePresenceStore } from '../../store/presenceStore';
import { UserAvatar } from '../common/UserAvatar';

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
  onContextMenu: (e: React.MouseEvent) => void;
}

export function ConversationItem({ conversation, isActive, currentUserId, onClick, onContextMenu }: Props) {
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

  const avatarUser = conversation.isGroup
    ? { username: displayName }
    : otherParticipant?.user || { username: displayName };

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-cb-surface-hover border-b border-cb-border-light transition-colors ${
        isActive ? 'bg-cb-panel' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <UserAvatar user={avatarUser} size="md" />
        {online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-cb-green rounded-full border-2 border-cb-surface" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-cb-text-primary truncate">{displayName}</span>
          {lastMessage && (
            <span className="text-xs text-cb-text-secondary flex-shrink-0">{formatTime(lastMessage.createdAt)}</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-sm text-cb-text-secondary truncate">
            {lastMessage
              ? `${conversation.isGroup && senderName ? `${senderName}: ` : ''}${lastMessage.content}`
              : 'No messages yet'}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="bg-cb-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
