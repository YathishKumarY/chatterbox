import { usePresenceStore } from '../../store/presenceStore';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { UserAvatar } from '../common/UserAvatar';

interface Participant {
  userId: string;
  user: { id: string; username: string; isOnline: boolean; lastSeen: string };
}

interface Props {
  name: string;
  isGroup: boolean;
  participants: Participant[];
  onBack?: () => void;
}

export function ChatHeader({ name, isGroup, participants, onBack }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const activeConversationId = useChatStore((s) => s.activeConversationId);

  const otherParticipant = participants.find((p) => p.userId !== currentUserId);
  const presenceOnline = usePresenceStore((s) => !isGroup && otherParticipant ? s.onlineUsers.has(otherParticipant.userId) : false);
  const online = presenceOnline || (!isGroup && (otherParticipant?.user.isOnline ?? false));

  const typingUsersSet = usePresenceStore((s) => activeConversationId ? s.typingUsers[activeConversationId] : undefined);
  const typing = typingUsersSet ? Array.from(typingUsersSet) : [];
  const typingNames = typing
    .map((uid) => participants.find((p) => p.userId === uid)?.user.username)
    .filter(Boolean);

  let subtitle = '';
  if (typingNames.length > 0) {
    subtitle = `${typingNames.join(', ')} typing...`;
  } else if (isGroup) {
    subtitle = `${participants.length} members`;
  } else if (online) {
    subtitle = 'online';
  } else if (otherParticipant) {
    const lastSeen = new Date(otherParticipant.user.lastSeen);
    subtitle = `last seen ${lastSeen.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  }

  return (
    <div className="bg-cb-panel px-4 py-3 flex items-center gap-3 border-b border-cb-border">
      {onBack && (
        <button onClick={onBack} className="p-1 rounded-full hover:bg-cb-surface-active md:hidden">
          <ArrowLeft className="w-5 h-5 text-cb-text-secondary" />
        </button>
      )}

      <UserAvatar user={isGroup ? { username: name } : (participants.find((p) => p.userId !== currentUserId)?.user || { username: name })} size="sm" />

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-cb-text-primary truncate">{name}</h3>
        <p className={`text-xs truncate ${typingNames.length > 0 ? 'text-cb-teal' : 'text-cb-text-secondary'}`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
