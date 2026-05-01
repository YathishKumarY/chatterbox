import { usePresenceStore } from '../../store/presenceStore';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Users } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';

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
    <div className="bg-whatsapp-panel px-4 py-3 flex items-center gap-3 border-b border-gray-200">
      {onBack && (
        <button onClick={onBack} className="p-1 rounded-full hover:bg-gray-200 md:hidden">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}

      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
        {isGroup ? <Users className="w-5 h-5" /> : name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{name}</h3>
        <p className={`text-xs truncate ${typingNames.length > 0 ? 'text-whatsapp-teal' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
