import { useState, useRef } from 'react';
import { usePresenceStore } from '../../store/presenceStore';
import { useChatStore } from '../../store/chatStore';
import { UserAvatar } from '../common/UserAvatar';
import { ImageCropModal } from '../common/ImageCropModal';
import { X, Users, Shield, Crown, Camera, ChevronDown } from 'lucide-react';
import client from '../../api/client';

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
  conversationId: string;
  name: string;
  avatarData?: string | null;
  avatarUrl?: string | null;
  participants: Participant[];
  createdBy: string | null;
  currentUserId: string;
  onClose: () => void;
}

export function GroupInfo({ conversationId, name, avatarData, avatarUrl, participants, createdBy, currentUserId, onClose }: Props) {
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [roleMenuFor, setRoleMenuFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserParticipant = participants.find((p) => p.userId === currentUserId);
  const isAdmin = currentUserParticipant?.role === 'admin';

  const sorted = [...participants].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return a.user.username.localeCompare(b.user.username);
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropSave = async (croppedBase64: string) => {
    await client.patch(`/conversations/${conversationId}`, { avatarData: croppedBase64 });
    await fetchConversations();
    setCropImage(null);
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      await client.patch(`/conversations/${conversationId}/participants/${targetUserId}/role`, { role: newRole });
      await fetchConversations();
    } catch {
      // silently fail
    }
    setRoleMenuFor(null);
  };

  const groupAvatar = avatarData || avatarUrl;

  const renderMember = (p: Participant) => {
    const online = onlineUsers.has(p.userId) || p.user.isOnline;
    const isCreator = p.userId === createdBy;
    const isMe = p.userId === currentUserId;

    return (
      <div key={p.id} className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-cb-surface-hover px-2 -mx-2 relative">
        <div className="relative flex-shrink-0">
          <UserAvatar user={p.user} size="sm" />
          {online && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cb-green rounded-full border-2 border-cb-surface" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-cb-text-primary truncate block">
            {p.user.username}
            {isMe && <span className="text-cb-text-muted"> (You)</span>}
          </span>
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
          {isAdmin && !isMe && !isCreator ? (
            <div className="relative">
              <button
                onClick={() => setRoleMenuFor(roleMenuFor === p.userId ? null : p.userId)}
                className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors ${
                  p.role === 'admin'
                    ? 'text-cb-teal bg-cb-teal/10 hover:bg-cb-teal/20'
                    : 'text-cb-text-muted bg-cb-surface-active hover:bg-cb-border'
                }`}
              >
                {p.role === 'admin' ? <Shield className="w-3 h-3" /> : null}
                {p.role === 'admin' ? 'Admin' : 'Member'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {roleMenuFor === p.userId && (
                <div className="absolute right-0 top-full mt-1 bg-cb-surface border border-cb-border rounded-lg shadow-xl z-50 overflow-hidden min-w-[120px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRoleChange(p.userId, 'admin'); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-cb-surface-hover transition-colors flex items-center gap-2 ${p.role === 'admin' ? 'text-cb-teal font-medium' : 'text-cb-text-primary'}`}
                  >
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRoleChange(p.userId, 'member'); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-cb-surface-hover transition-colors flex items-center gap-2 ${p.role === 'member' ? 'text-cb-teal font-medium' : 'text-cb-text-primary'}`}
                  >
                    <Users className="w-3.5 h-3.5" /> Member
                  </button>
                </div>
              )}
            </div>
          ) : !isAdmin || isMe ? (
            <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${
              p.role === 'admin'
                ? 'text-cb-teal bg-cb-teal/10'
                : 'text-cb-text-muted bg-cb-surface-active'
            }`}>
              {p.role === 'admin' && <Shield className="w-3 h-3" />}
              {p.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-cb-surface overflow-hidden">
      <div className="bg-cb-panel px-4 py-3 flex items-center gap-3 border-b border-cb-border">
        <button onClick={onClose} className="p-1 rounded-full hover:bg-cb-surface-active">
          <X className="w-5 h-5 text-cb-text-secondary" />
        </button>
        <h3 className="font-medium text-cb-text-primary">Group Info</h3>
      </div>

      <div className="flex-1 overflow-y-auto" onClick={() => setRoleMenuFor(null)}>
        <div className="flex flex-col items-center py-6 px-4 border-b border-cb-border">
          <div
            className={`relative ${isAdmin ? 'group cursor-pointer' : ''}`}
            onClick={(e) => { e.stopPropagation(); if (isAdmin) fileInputRef.current?.click(); }}
          >
            {groupAvatar ? (
              <img src={groupAvatar} alt={name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-cb-avatar-bg flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
            )}
            {isAdmin && (
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          <h2 className="mt-3 text-lg font-bold text-cb-text-primary">{name}</h2>
          <span className="text-sm text-cb-text-secondary">Group · {participants.length} members</span>
        </div>

        <div className="px-4 py-3">
          <h4 className="text-xs font-semibold text-cb-text-muted uppercase tracking-wide mb-2">
            {participants.length} Members
          </h4>
          {sorted.map(renderMember)}
        </div>
      </div>

      {cropImage && (
        <ImageCropModal
          imageSrc={cropImage}
          onCropComplete={handleCropSave}
          onClose={() => setCropImage(null)}
        />
      )}
    </div>
  );
}
