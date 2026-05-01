import { create } from 'zustand';

interface PresenceState {
  onlineUsers: Set<string>;
  typingUsers: Record<string, Set<string>>;

  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setTyping: (conversationId: string, userId: string) => void;
  clearTyping: (conversationId: string, userId: string) => void;
  isOnline: (userId: string) => boolean;
  getTypingUsers: (conversationId: string) => string[];
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: new Set<string>(),
  typingUsers: {},

  setUserOnline: (userId) => {
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.add(userId);
      return { onlineUsers: newSet };
    });
  },

  setUserOffline: (userId) => {
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.delete(userId);
      return { onlineUsers: newSet };
    });
  },

  setTyping: (conversationId, userId) => {
    set((state) => {
      const convTyping = new Set(state.typingUsers[conversationId] || []);
      convTyping.add(userId);
      return { typingUsers: { ...state.typingUsers, [conversationId]: convTyping } };
    });
  },

  clearTyping: (conversationId, userId) => {
    set((state) => {
      const convTyping = new Set(state.typingUsers[conversationId] || []);
      convTyping.delete(userId);
      return { typingUsers: { ...state.typingUsers, [conversationId]: convTyping } };
    });
  },

  isOnline: (userId) => get().onlineUsers.has(userId),

  getTypingUsers: (conversationId) => Array.from(get().typingUsers[conversationId] || []),
}));
