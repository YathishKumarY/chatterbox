import { create } from 'zustand';
import client from '../api/client';
import { getSocket } from '../socket/client';

interface MessageStatus {
  id: string;
  messageId: string;
  userId: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  clientMessageId?: string;
  createdAt: string;
  sender: { id: string; username: string; avatarUrl: string | null };
  statuses: MessageStatus[];
  pending?: boolean;
  failed?: boolean;
}

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

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  avatarUrl: string | null;
  createdBy: string | null;
  updatedAt?: string;
  participants: Participant[];
  lastMessage: { content: string; createdAt: string; senderId: string | null } | null;
  unreadCount: number;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  nextCursors: Record<string, string | null>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, loadMore?: boolean) => Promise<void>;
  addMessage: (message: Message) => void;
  addOptimisticMessage: (conversationId: string, content: string, sender: Message['sender'], clientMessageId: string) => string;
  confirmMessage: (tempId: string, message: Message) => void;
  failMessage: (tempId: string, conversationId: string) => void;
  updateMessageStatus: (messageId: string, userId: string, status: string, conversationId: string) => void;
  markConversationRead: (conversationId: string) => void;
  createConversation: (participantIds: string[], name?: string, isGroup?: boolean) => Promise<Conversation>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  nextCursors: {},
  isLoadingConversations: false,
  isLoadingMessages: false,

  setActiveConversation: (id) => set({ activeConversationId: id }),

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const { data } = await client.get('/conversations');
      set({ conversations: data, isLoadingConversations: false });
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  fetchMessages: async (conversationId, loadMore = false) => {
    set({ isLoadingMessages: true });
    try {
      const cursor = loadMore ? get().nextCursors[conversationId] : undefined;
      const { data } = await client.get(`/conversations/${conversationId}/messages`, {
        params: { cursor, limit: 50 },
      });

      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: loadMore
            ? [...data.messages, ...(state.messages[conversationId] || [])]
            : data.messages,
        },
        nextCursors: { ...state.nextCursors, [conversationId]: data.nextCursor },
        isLoadingMessages: false,
      }));
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  addMessage: (message) => {
    set((state) => {
      const convMessages = state.messages[message.conversationId] || [];
      const exists = convMessages.some(
        (m) => m.id === message.id || (message.clientMessageId && m.clientMessageId === message.clientMessageId),
      );
      if (exists) return state;

      const conversations = state.conversations.map((c) =>
        c.id === message.conversationId
          ? {
              ...c,
              lastMessage: { content: message.content, createdAt: message.createdAt, senderId: message.senderId },
              unreadCount: state.activeConversationId === c.id ? 0 : c.unreadCount + 1,
            }
          : c,
      );

      conversations.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.updatedAt || '';
        const bTime = b.lastMessage?.createdAt || b.updatedAt || '';
        return bTime.localeCompare(aTime);
      });

      return {
        messages: {
          ...state.messages,
          [message.conversationId]: [...convMessages, message],
        },
        conversations,
      };
    });
  },

  addOptimisticMessage: (conversationId, content, sender, clientMessageId) => {
    const message: Message = {
      id: clientMessageId,
      conversationId,
      senderId: sender.id,
      content,
      clientMessageId,
      createdAt: new Date().toISOString(),
      sender,
      statuses: [],
      pending: true,
    };
    get().addMessage(message);
    return clientMessageId;
  },

  confirmMessage: (tempId, message) => {
    set((state) => {
      const convMessages = state.messages[message.conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [message.conversationId]: convMessages.map((m) =>
            m.id === tempId || (message.clientMessageId && m.clientMessageId === message.clientMessageId)
              ? { ...message, pending: false, failed: false }
              : m,
          ),
        },
      };
    });
  },

  failMessage: (tempId, conversationId) => {
    set((state) => {
      const convMessages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: convMessages.map((m) =>
            m.id === tempId ? { ...m, pending: false, failed: true } : m,
          ),
        },
      };
    });
  },

  updateMessageStatus: (messageId, userId, status, conversationId) => {
    set((state) => {
      const convMessages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: convMessages.map((m) => {
            if (m.id !== messageId) return m;
            const statuses = m.statuses.map((s) =>
              s.userId === userId ? { ...s, status: status as MessageStatus['status'] } : s,
            );
            return { ...m, statuses };
          }),
        },
      };
    });
  },

  markConversationRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    }));
  },

  createConversation: async (participantIds, name, isGroup) => {
    const { data } = await client.post('/conversations', { participantIds, name, isGroup });
    const socket = getSocket();
    if (socket) {
      socket.emit('conversation:join', { conversationId: data.id });
    }
    set((state) => ({
      conversations: [{ ...data, lastMessage: null, unreadCount: 0 }, ...state.conversations],
    }));
    return data;
  },
}));
