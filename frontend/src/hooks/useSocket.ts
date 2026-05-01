import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket } from '../socket/client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { usePresenceStore } from '../store/presenceStore';
import { useContactStore } from '../store/contactStore';

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const { setUserOnline, setUserOffline, setTyping, clearTyping } = usePresenceStore();
  const socketRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        disconnectSocket();
        socketRef.current = false;
      }
      return;
    }

    if (socketRef.current) return;
    socketRef.current = true;

    const socket = connectSocket();

    socket.on('message:new', (message) => {
      const state = useChatStore.getState();
      const known = state.conversations.some((c) => c.id === message.conversationId);
      addMessage(message);
      socket.emit('message:delivered', { messageId: message.id });
      if (!known) {
        fetchConversations();
      }
    });

    socket.on('message:status', (data: { messageId: string; userId: string; status: string; conversationId: string }) => {
      updateMessageStatus(data.messageId, data.userId, data.status, data.conversationId);
    });

    socket.on('message:read', (data: { conversationId: string; userId: string }) => {
      const messages = useChatStore.getState().messages[data.conversationId] || [];
      for (const msg of messages) {
        if (msg.statuses.some((s) => s.userId === data.userId && s.status !== 'read')) {
          updateMessageStatus(msg.id, data.userId, 'read', data.conversationId);
        }
      }
    });

    socket.on('user:online', (data: { userId: string }) => {
      setUserOnline(data.userId);
    });

    socket.on('user:offline', (data: { userId: string }) => {
      setUserOffline(data.userId);
    });

    socket.on('typing:start', (data: { userId: string; conversationId: string }) => {
      setTyping(data.conversationId, data.userId);
    });

    socket.on('typing:stop', (data: { userId: string; conversationId: string }) => {
      clearTyping(data.conversationId, data.userId);
    });

    socket.on('sync:read', (data: { conversationId: string }) => {
      useChatStore.getState().markConversationRead(data.conversationId);
    });

    socket.on('conversation:created', () => {
      fetchConversations();
    });

    socket.on('contact:request', (data: any) => {
      useContactStore.getState().addIncomingRequest(data);
    });

    socket.on('contact:accepted', (data: any) => {
      useContactStore.getState().addContact(data.user);
    });

    const lastSyncAt = localStorage.getItem('whatsapp_last_sync') || new Date(0).toISOString();
    const deviceId = localStorage.getItem('whatsapp_device_id') || '';

    socket.emit('device:sync', { deviceId, lastSyncAt }, (response: { success: boolean; messages?: any[] }) => {
      if (response.success && response.messages) {
        for (const msg of response.messages) {
          addMessage(msg);
          socket.emit('message:delivered', { messageId: msg.id });
        }
      }
    });

    socket.emit('messages:fetch-undelivered', null, (response: { success: boolean; messages?: any[] }) => {
      if (response.success && response.messages) {
        for (const msg of response.messages) {
          addMessage(msg);
          socket.emit('message:delivered', { messageId: msg.id });
        }
      }
    });

    return () => {
      localStorage.setItem('whatsapp_last_sync', new Date().toISOString());
      socketRef.current = false;
      disconnectSocket();
    };
  }, [isAuthenticated, accessToken, addMessage, updateMessageStatus, fetchConversations, setUserOnline, setUserOffline, setTyping, clearTyping]);
}
