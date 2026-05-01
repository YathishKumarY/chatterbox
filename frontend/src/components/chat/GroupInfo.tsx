import { usePresenceStore } from '../../store/presenceStore';
import { UserAvatar } from '../common/UserAvatar';
import { X, Users, Shield, Crown } from 'lucide-react';

interface Participant {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    isOnline: boolean;
    lastSeen: string;
  };
}

interface Props {
  name: string;
  participants: Participant[];
  createdBy: string | null;
  currentUserId: string;
  onClose: () => void;
}

export function GroupInfo({ name, participants, createdBy, currentUserId, onClose }: Props) {
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);

  const sorted = [...participants].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return a.user.username.localeCompare(b.user.username);
  });

  const admins = sorted.filter((p) => p.role === 'admin');
  const members = sorted.filter((p) => p.role !== 'admin');

  return (
    <div className="flex-1 flex flex-col h-full bg-cb-surface overflow-hidden">
      <div className="bg-cb-panel px-4 py-3 flex items-center gap-3 border-b border-cb-border">
        <button onClick={onClose} className="p-1 rounded-full hover:bg-cb-surface-active">
          <X className="w-5 h-5 text-cb-text-secondary" />
        </button>
        <h3 className="font-medium text-cb-text-primary">Group Info</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center py-6 px-4 border-b border-cb-border">
          <div className="w-20 h-20 rounded-full bg-cb-avatar-bg flex items-center justify-center">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-cb-text-primary">{name}</h2>
          <span className="text-sm text-cb-text-secondary">Group · {participants.length} members</span>
        </div>

        <div className="px-4 py-3 border-b border-cb-border">
          <h4 className="text-xs font-semibold text-cb-text-muted uppercase tracking-wide mb-2">
            {participants.length} Members
          </h4>

          {admins.length > 0 && (
            <>
              {admins.map((p) => {
                const online = onlineUsers.has(p.userId) || p.user.isOnline;
                const isCreator = p.userId === createdBy;
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-cb-surface-hover px-2 -mx-2">
                    <div className="relative flex-shrink-0">
                      <UserAvatar user={p.user} size="sm" />
                      {online && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cb-green rounded-full border-2 border-cb-surface" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-cb-text-primary truncate">
                          {p.user.username}
                          {p.userId === currentUserId && <span className="text-cb-text-muted"> (You)</span>}
                        </span>
                      </div>
                      <span className="text-xs text-cb-text-muted">
                        {online ? 'online' : `last seen ${new Date(p.user.lastSeen).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isCreator && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          <Crown className="w-3 h-3" /> Creator
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-cb-teal bg-cb-teal/10 px-1.5 py-0.5 rounded">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {members.map((p) => {
            const online = onlineUsers.has(p.userId) || p.user.isOnline;
            return (
              <div key={p.id} className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-cb-surface-hover px-2 -mx-2">
                <div className="relative flex-shrink-0">
                  <UserAvatar user={p.user} size="sm" />
                  {online && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cb-green rounded-full border-2 border-cb-surface" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-cb-text-primary truncate block">
                    {p.user.username}
                    {p.userId === currentUserId && <span className="text-cb-text-muted"> (You)</span>}
                  </span>
                  <span className="text-xs text-cb-text-muted">
                    {online ? 'online' : `last seen ${new Date(p.user.lastSeen).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </div>
                <span className="text-[10px] text-cb-text-muted px-1.5 py-0.5 rounded bg-cb-surface-active">
                  Member
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
